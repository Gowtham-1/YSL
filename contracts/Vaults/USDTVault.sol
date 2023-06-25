// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "../Interfaces/IBlacklist.sol";
import "../Interfaces/IWhitelist.sol";
import "../Interfaces/IReceipt.sol";
import "../Interfaces/IAdmin.sol";
import "../Interfaces/IPhoenixNFT.sol";


/**
@dev This contract is for USDT vault.
 */
contract USDTVault is Initializable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE"); //byte for admin role
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR"); //byte for operator role

    IAdmin public Admin;// Address for Admin contract   
    uint public rewardRate;
    uint256 public currentReward;
    uint256 public slippage;
    address public USDTs; //Reciept token address
    address public USDT; // Address of USDT token
    address public router;// router address
    bool public completePause;
    uint256 public epoch;

    mapping (address=>uint256) public ss;
    mapping(address => uint) public UserDeposit;
    mapping (address => uint) public restrictTransfer; // last block number when interacted
    mapping(address => uint) public lastTimeStamp; // timestamp for each user when user called the withdrawl or deposit function
    mapping(uint256 => uint256) public epochReward;


    function initialize(address _admin, address _USDT) external initializer {
        rewardRate = 10; // cofficient by 100
        slippage = 100; // cofficient by 100
        Admin = IAdmin(_admin);
        router = Admin.ApeswapRouter();
        USDT = _USDT;
        USDTs = Clones.clone(Admin.masterNTT());
        IReceipt(USDTs).initialize(_admin, address(this), "USDTs", "USDTs");
        epoch = 8 hours;

    }

    /**
        @dev modifier for operator role
    **/

    modifier _isOperator(){
        require(Admin.hasRole(OPERATOR_ROLE, msg.sender));
        _;
    }

    /**
        @dev modifier for admin
    */

    modifier _isAdmin(){
        require(Admin.hasRole(ADMIN_ROLE, msg.sender));
        _;
    }
    modifier _completePause(){
        require(completePause == false,"completely Paused");
        _;
    }

    modifier _securityCheck(address user, address sendto){
        require(!(IBlacklist(Admin.Blacklist()).getAddresses(msg.sender)), "xYSLBUSDVault:Blacklisted");
        require(IWhitelist(Admin.whitelist()).getAddresses(msg.sender) || user == msg.sender);
        if(_isContract(msg.sender)){
            require(IWhitelist(Admin.whitelist()).getAddresses(msg.sender),"xYSLBUSDVault:ExternalInteraction");
        }
        if(!IWhitelist(Admin.whitelist()).getAddresses(user)) {
            require(restrictTransfer[user] != block.number, "xYSLBUSDVault:SameBlock");
        }
        _;
    }

    function deposit(address user, uint256 amount, bool isBUSD) external nonReentrant _completePause whenNotPaused() _securityCheck(user,user){
        require(amount > 0, "USDTVault: Amount must be greater than zero");
        if(rewards(user)[0] > 0){
            _claimRebaseReward(user);
        }else{
            ss[user] = currentReward;
        }
        IERC20(USDT).safeTransferFrom(user, address(this), amount);
        address[] memory path = new address[](2);
        path[0] = USDT;
        path[1] = Admin.BUSD();
        IERC20(USDT).safeApprove(router, amount);
        uint256 BUSDAmount = _swap(amount, path, address(this));
        uint reserveUSDy = IERC20(Admin.USDy()).balanceOf(Admin.USDyBUSD());
        uint reservesBUSD = IERC20(Admin.BUSD()).balanceOf(Admin.USDyBUSD());
        IReceipt(Admin.USDy()).mint(address(this), (BUSDAmount * reserveUSDy)/reservesBUSD);
        if(IERC20(Admin.USDy()).allowance(address(this),address(router)) > 0){
        IReceipt(Admin.USDy()).decreaseAllowance(address(router),IERC20(Admin.USDy()).allowance(address(this),address(router)));
        }
        if(IERC20(Admin.BUSD()).allowance(address(this),address(router)) > 0){
        IReceipt(Admin.BUSD()).decreaseAllowance(address(router),IERC20(Admin.BUSD()).allowance(address(this),address(router)));
        }
        _convertBUSDToLP(
            (BUSDAmount * reserveUSDy)/reservesBUSD,
            BUSDAmount,
            Admin.USDy(),
            Admin.BUSD());
        IReceipt(USDTs).mint(address(this), amount);
        UserDeposit[user] += amount;
        restrictTransfer[msg.sender] = block.number;
        lastTimeStamp[user] = block.timestamp; 

    }
    function withdraw(address user, uint256 amount, address sendTo) external whenNotPaused {
        require(user != address(0), "USDTvault: User address can not be empty");
        require(amount > 0, "USDTVault: Amount must be greater than zero");
        _withdraw(user, amount, sendTo);
    }

    function distribute(uint256 _rebaseReward) external nonReentrant{
        require(msg.sender == Admin.USDyVault(),"You cannot interact");
        if(IERC20(USDTs).totalSupply() != 0){
            currentReward = currentReward + ((_rebaseReward * 10 ** 18)/(IERC20(USDTs).totalSupply()));
        }
        epochReward[block.timestamp] = currentReward;

    }

    function emergencyWithdraw() external{
        require(UserDeposit[msg.sender] != 0,"USDTVault: Nothing to withdraw");
        _withdraw(msg.sender, UserDeposit[msg.sender], msg.sender);
    }

    function claimReward(address user) public nonReentrant _completePause whenNotPaused _securityCheck(user,user){
        _claimRebaseReward(user);
    }

    function _claimRebaseReward(address user) internal  {
        if(rewards(user)[1] > 0){
            IReceipt(Admin.USDy()).mint(address(this),rewards(user)[1]);
        }
        IERC20(Admin.USDy()).safeTransfer(user, rewards(user)[0]);
        ss[user] = currentReward;
    }

      /**
    @dev The user will get his rewards through this function 
    @param user, address of user 
    */
    function rewards(address user) public view returns (uint[] memory reward){
        uint rewardShare = ss[user];
        uint epoch;
        uint epochDuration = Admin.epochDuration();
        reward = new uint[](2);
        IPhoenixNFT PhoenixNFT = IPhoenixNFT(Admin.PhoenixNFT());
        if(address(PhoenixNFT) != address(0) && IReceipt(address(PhoenixNFT)).balanceOf(user) >= 1){
            if(block.timestamp > (PhoenixNFT.MintTimestamp(PhoenixNFT.Won(msg.sender)) + (PhoenixNFT.expiryTime() * epochDuration))){
                uint m = (Admin.lastEpoch() - (PhoenixNFT.MintTimestamp(PhoenixNFT.Won(msg.sender))) + (PhoenixNFT.expiryTime() * epochDuration)) % epochDuration;
                uint y = epochDuration - m;
                epoch = (PhoenixNFT.MintTimestamp(PhoenixNFT.Won(msg.sender)) + (PhoenixNFT.expiryTime() * epochDuration)) - y;
                reward[0] = (UserDeposit[user] * (epochReward[epoch] - rewardShare)) / 10 **18;
                reward[1] = (reward[0] / 4);
                reward[0] = (reward[0] + (reward[0] / 4));
                rewardShare = epochReward[epoch];
                reward[0] += (UserDeposit[user] * (currentReward - rewardShare)) / 10 **18;
            }
            else{
                epoch = Admin.lastEpoch();
                reward[0] = (UserDeposit[user] * (epochReward[epoch] - ss[user])) / 10 **18;
                reward[1] = (reward[0] / 4);
                reward[0] = (reward[0] + (reward[0] / 4));
            }
        }
        else{
            reward[0] = (UserDeposit[user] * (currentReward - rewardShare)) / 10 **18;
        }

    }

    function _withdraw(address user, uint256 _amount, address sendTo) nonReentrant _completePause internal _securityCheck(user,sendTo){
        require(block.timestamp - lastTimeStamp[user]  >= 4 * epoch, "DAIVault: You can withdraw after 4 epochs"); // 4 * epoch 
        require(_amount <= UserDeposit[user], "USDTvault: Invalid amount");
        if(rewards(user)[0] > 0){
            _claimRebaseReward(user);
        }else{
            ss[user] = currentReward;
        }
        IReceipt(USDTs).burn(address(this), _amount);
        UserDeposit[user] -= _amount;
        address[] memory path = new address[](3);
        path[0] = Admin.USDy();
        path[1] = Admin.BUSD();
        path[2] = USDT;
        uint result=  IUniswapV2Router02(router).getAmountsIn(_amount, path)[0];
        IReceipt(Admin.USDy()).mint(address(this), result);
        IERC20(Admin.USDy()).approve(Admin.ApeswapRouter(),result);

        _swap(result, path, sendTo);
        restrictTransfer[msg.sender] = block.number;
    }

    function _swap(
        uint256 amount,
        address[] memory path,
        address sendTo
    ) internal returns (uint256) {
        uint256 amountOut = IUniswapV2Router02(router).swapExactTokensForTokens(
            amount,
            0,
            path,
            sendTo,
            block.timestamp + 1000
        )[path.length - 1];
        return amountOut;
    }

    function _convertBUSDToLP(
        uint256 amountUSDy,
        uint256 amountBUSD,
        address path0,
        address path1
    ) internal {
        IERC20(path0).safeApprove(router, amountUSDy);
        IERC20(path1).safeApprove(router, amountBUSD);
        IUniswapV2Router02(router).addLiquidity(
            path0,
            path1,
           amountUSDy,
            amountBUSD,
            1,
            1,
            Admin.Treasury(),
            block.timestamp + 1678948210
        );
    }

    function setRouter(address _router) external _isOperator {
        require(_router != address(0), "USDTVault: invalid data");
        router = _router;
    }

    function setSlippage(uint256 slippage_) external _isOperator {
        require(slippage_ > 0, "USDTVault: slippage can't be 0");
        slippage = slippage_;
    }

    function setCompletePause(bool _CompletePause) external nonReentrant _isOperator{
        completePause = _CompletePause;
    }
    
    function _isContract(address _addr) internal view returns (bool) {
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }

    function setEpoch(uint256 _epoch) external _isOperator {
        require(_epoch != 0, "BUSDVault: invalid data");
        epoch = _epoch;
    }
}