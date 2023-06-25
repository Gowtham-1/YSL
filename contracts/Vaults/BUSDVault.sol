// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "../Interfaces/ILiquidityProvider.sol";
import "../Interfaces/IReceipt.sol";
import "../Interfaces/IEvents.sol";
import "../Interfaces/IAdmin.sol";
import "../Interfaces/IWhitelist.sol";
import "../Interfaces/IBlacklist.sol";
import "../Interfaces/IPhoenixNFT.sol";
import "../Interfaces/IUSDyRebalancer.sol";
import "../Interfaces/ITreasury.sol";

/**
@dev BUSD Vault 
Note This contract is for BUSD vault which receives USDy at a reward rate of 0.2% per epoch
 */
 
contract BUSDVault is Initializable,ReentrancyGuard, Pausable, IEvents, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR"); // Byte for operator role 

    IAdmin public Admin;// Address for Admin contract  
    IUniswapV2Router02 public router; 
    address public BUSDs; // reciept 
    uint256 public epoch; // epoch time
    uint256 public currentReward;
    bool public completePause;

    
    mapping(address => uint) public lastTimeStamp; // timestamp for each user when user called the withdrawl or deposit function
    mapping (address => uint) public UserDeposit; // lp share of each user 
    mapping (address => uint) public restrictTransfer; // last block number when interacted
    mapping (address=>uint256) public ss;
    mapping(uint256 => uint256) public epochReward;
    
    function initialize(address _admin) external initializer {
        Admin = IAdmin(_admin);
        BUSDs = Clones.clone(Admin.masterNTT());
        IReceipt(BUSDs).initialize(_admin, address(this), "BUSDs", "BUSDs");
        router = IUniswapV2Router02(Admin.ApeswapRouter());
        epoch = 8 hours;
    }

    /**
    @dev modifier for operator role
    **/
    
    modifier _isOperator(){
        require(Admin.hasRole(OPERATOR_ROLE, msg.sender));
        _;
    }

    modifier _isAdmin() {
        require(Admin.hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        _;
    }

    modifier _completePause(){
        require(completePause == false,"BUSDVault:completely Paused");
        _;
    }

    /**
    @dev used to deposit BUSD in the vault
    @param user address of the user who wants to deposit BUSD in the vault
    @param amount amount of BUSD the user wants to deposit
    @param isBUSD bool value to check user deposits only BUSD
    */

    function deposit(address user, uint amount, bool isBUSD) external nonReentrant _completePause whenNotPaused() {
        require(user != address(0), "BUSDVault: User address can not be empty");
        require(amount > 0, 'BUSDVault: Amount must be greater than zero');
        require(isBUSD, "BUSDVault: Can deposit BUSD only");
        require(!(IBlacklist(Admin.Blacklist()).getAddresses(msg.sender)), "BUSDVault: address is Blacklisted");
        if(rewards(user)[0] > 0){
            _claimRebaseReward(user);
        }else{
            ss[user] = currentReward;
        }
        if(_isContract(msg.sender)){
            require(IWhitelist(Admin.whitelist()).getAddresses(msg.sender),"BUSDVault: No external contract interaction");
        }
        if(!IWhitelist(Admin.whitelist()).getAddresses(user)) {
            require(restrictTransfer[user] != block.number, "BUSDVault: you can't interact in same block");
        }

        IUniswapV2Pair pair = IUniswapV2Pair(IUniswapV2Factory(IUniswapV2Router02(router).factory()).getPair(Admin.USDy(), Admin.BUSD()));
        uint r1 = IERC20(Admin.USDy()).balanceOf(address(pair));
        uint r2 = IERC20(Admin.BUSD()).balanceOf(address(pair));
        
        if(r1 != r2) { // price of USDy-BUSD pool should be $1.00 else rebalance
            bool success = IUSDyRebalancer(Admin.USDyBUSDRebalancer()).rebalance(); // to rebalance price before adding liquidity
            require(success, "BUSDVault: Rebalancing failed");
        }
        
        address[] memory path = new address[](2);
        path[0] = Admin.USDy();
        path[1] = Admin.BUSD();
        
        IReceipt(Admin.USDy()).mint(address(this), amount); // mint USDy equal to BUSD user wants to deposit 
        IERC20(Admin.BUSD()).safeTransferFrom(user, address(this), amount); // transfer BUSD to contract for adding liquidity
        if(IERC20(Admin.USDy()).allowance(address(this),address(router)) > 0){
        IReceipt(Admin.USDy()).decreaseAllowance(address(router),IERC20(Admin.USDy()).allowance(address(this),address(router)));
        }
        if(IERC20(Admin.BUSD()).allowance(address(this),address(router)) > 0){
        IReceipt(Admin.BUSD()).decreaseAllowance(address(router),IERC20(Admin.BUSD()).allowance(address(this),address(router)));
        }
        uint lpAmount = _convertBUSDToLP(Admin.USDy(), Admin.BUSD(), amount, amount, address(this)); // add liquidity
        UserDeposit[user] += lpAmount; // update user's lp share after user adds liquidity
        IReceipt(BUSDs).mint(address(this), lpAmount);  // minting reciept token equivalent to LP token amount returned from add liquidity (_convertBUSDToLP) 
        lastTimeStamp[user] = block.timestamp; 
    }

    function setPause(bool _isPaused) external nonReentrant _isAdmin{
        _isPaused == true? _pause() : _unpause();
    }

    function setCompletePause(bool _completePause) external nonReentrant _isAdmin{
        completePause = _completePause;
    }

    function withdraw(address user, uint256 amount, address sendTo) external whenNotPaused(){
        IUniswapV2Pair pair = IUniswapV2Pair(IUniswapV2Factory(IUniswapV2Router02(router).factory()).getPair(Admin.USDy(), Admin.BUSD()));
        uint r1 = IERC20(Admin.USDy()).balanceOf(address(pair));
        uint r2 = IERC20(Admin.BUSD()).balanceOf(address(pair));
        if(r1 != r2) {
            bool success = IUSDyRebalancer(Admin.USDyBUSDRebalancer()).rebalance(); // to rebalance price before removing liquidity
            require(success, "BUSDVault: Rebalancing failed");
        }
        _withdraw(user, amount, sendTo);
    }

    function distribute(uint256 _rebaseReward) external nonReentrant{
        require(msg.sender == Admin.USDyVault(),"BUSDVault:You cannot interact");
        if(IERC20(BUSDs).totalSupply() != 0){
            currentReward = currentReward + ((_rebaseReward * 10 ** 18)/(IERC20(BUSDs).totalSupply()));
        }
    }

    function emergencyWithdraw() external{
        require(!Admin.buyBackActivation(),"BUSDVault: Can't withdraw");
        require(UserDeposit[msg.sender] != 0,"BUSDVault: Nothing to withdraw");
        _withdraw(msg.sender, UserDeposit[msg.sender], msg.sender);
    }
    /**
    @dev used to withdraw BUSD in the vault
    @param user address of the user who wants to deposit BUSD in the vault
    @param amount amount of BUSD the user wants to withdraw
    @param sendTo address where withdrawn BUSD should be sent
    */

    function _withdraw(address user, uint256 amount, address sendTo) internal nonReentrant _completePause{
        require(user != address(0), "BUSDVault: User address can not be empty");
        require(amount > 0, 'BUSDVault: Amount must be greater than zero');  
        require(UserDeposit[user] >= amount, "BUSDVault: Insufficient receipt tokens");
        require(block.timestamp - lastTimeStamp[user]  >= 4 * epoch, "BUSDVault: You can withdraw after 4 epochs"); // 4 * epoch 
        lastTimeStamp[user] = block.timestamp;
        address lp = address(IUniswapV2Factory(IUniswapV2Router02(router).factory()).getPair(Admin.USDy(), Admin.BUSD()));
        if(rewards(user)[0] > 0){
            _claimRebaseReward(user);
        }
        if(_isContract(msg.sender)){
            require(IWhitelist(Admin.whitelist()).getAddresses(msg.sender),"BUSDVault: No external contract interaction");
        }
        if(!IWhitelist(Admin.whitelist()).getAddresses(user)) {
            require(restrictTransfer[user] != block.number, "BUSDVault: you can't interact in same block");
        }
        
        IERC20(lp).safeApprove(Admin.liquidityProvider(), amount);
        ILiquidityProvider(Admin.liquidityProvider()).removeLiquidity(lp, amount); // remove liquidity to get USDy and BUSD
        uint amountUSDy = IERC20(Admin.USDy()).balanceOf(address(this));
        uint amountBUSD = IERC20(Admin.BUSD()).balanceOf(address(this));
        UserDeposit[user] -= amount; // reduce user's lp share 
        IReceipt(Admin.USDy()).burn(address(this), amountUSDy); // burn USDy received after removing liquidity
        IERC20(Admin.BUSD()).safeTransfer(sendTo, amountBUSD); // transfer BUSD to the user
        IReceipt(BUSDs).burn(address(this), amount); // burn receipt tokens
    }

    /**
    @dev Function for Pause by an Operator
    **/
     function pause() external nonReentrant _isOperator{
        _pause();
    }

    /**
    @dev Function for UnPause by an Operator
    **/
    function unpause() external nonReentrant _isOperator{
        _unpause();
    }

    /**
    @dev add liquidity to pool
    @param tokenA address of token A
    @param tokenB address of token B
    @param amountA amount of token A to be added as liquidity
    @param amountB amount of token B to be added as liquidity
    @param sendTo address of user who will receive lp tokens
    */

    function _convertBUSDToLP(address tokenA, address tokenB, uint amountA, uint amountB, address sendTo) internal returns(uint lpAmount) {
        IERC20(tokenA).safeApprove(Admin.ApeswapRouter(), amountA);
        IERC20(tokenB).safeApprove(Admin.ApeswapRouter(), amountB);
        (,,lpAmount) = IUniswapV2Router02(router).addLiquidity(
            tokenA,
            tokenB,
            amountA,
            amountB,
            1,
            1,
            sendTo,
            block.timestamp + 1678948210);
        return lpAmount;
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

    /**
    @dev Function that returns the address of BUSD
    **/

    function receiptToken() public view returns(address) {
        return BUSDs;
    }


    function claimReward(address user) public nonReentrant whenNotPaused {
        if(_isContract(msg.sender)){
            require(IWhitelist(Admin.whitelist()).getAddresses(msg.sender),"BUSDVault: No external contract interaction");
        }
        if(!IWhitelist(Admin.whitelist()).getAddresses(user)) {
            require(restrictTransfer[user] != block.number, "BUSDVault: you can't interact in same block");
        }
        _claimRebaseReward(user);
    }

    function _claimRebaseReward(address user) internal  {
        if(rewards(user)[1] > 0){
            IReceipt(Admin.USDy()).mint(address(this),rewards(user)[1]);
        }
        IERC20(Admin.USDy()).safeTransfer(user, rewards(user)[0]);
        ss[user] = currentReward;
    }

    function _isContract(address _addr) internal view returns (bool) {
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }

    function setRouter(address _router) external _isAdmin {
        require(_router != address(0), "BUSDVault: invalid data");
        router = IUniswapV2Router02(_router);
    }

    function setEpoch(uint256 _epoch) external _isAdmin {
        require(_epoch != 0, "BUSDVault: invalid data");
        epoch = _epoch;
    }

}
