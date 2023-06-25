// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "../Interfaces/IWhitelist.sol";
import "../Interfaces/IReceipt.sol";
import "../Interfaces/IReferral.sol";
import "../Interfaces/IAdmin.sol";
import "../Interfaces/IEvents.sol";
import "../Interfaces/IBlacklist.sol";
import "../Interfaces/IPhoenixNFT.sol";

/**
@dev This contract is for YSL-BUSD vault.
 */
contract USDyBUSDVault is Initializable, ReentrancyGuard, Pausable, IEvents {
    using SafeERC20 for IERC20;

    uint256 public depositTax;//setting deposit tax as uint
    uint256 public withdrawTax; // uint of withdraw tax
    uint256 public exchangeRatio; //setting exchange ratio as uint
    uint256 public currentReward;
    address public router;// router address
    address public USDs_lp;//Reciept address
    address public BUSD;
    bool public completePause;
    uint public totalDeposit;

    mapping(address => uint256) public ss;
    mapping(address => uint256) public UserDeposit;
    mapping(address => uint) public restrictTransfer; // last block number when interacted
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;
    IAdmin public Admin;
    mapping(uint256 => uint256) public epochReward;

     modifier _isAdmin(){
        require(Admin.hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        _;
    }

    modifier _lastExchangeRatio(){
        uint256 lastExchangeRatio = exchangeRatio;
        _;
        if(lastExchangeRatio > exchangeRatio){
            _pause();
        }
    }

    modifier _completePause(){
        require(completePause == false,"completely Paused");
        _;
    }

    modifier _securityCheck(address user, address sendto){
        require(!(IBlacklist(Admin.Blacklist()).getAddresses(msg.sender)), "USDyBUSDVault:Blacklisted");
        require(IWhitelist(Admin.whitelist()).getAddresses(msg.sender) || user == msg.sender);
        if(_isContract(msg.sender)){
            require(IWhitelist(Admin.whitelist()).getAddresses(msg.sender),"USDyBUSDVault:ExternalInteraction");
        }
        if(!IWhitelist(Admin.whitelist()).getAddresses(user)) {
            require(restrictTransfer[user] != block.number, "USDyBUSDVault:SameBlock");
        }
        _;
    }
    
    /**
    @dev one time call while deploying
    */

    function initialize(
        address _admin
    ) external initializer {
        Admin = IAdmin(_admin); 
        router = Admin.ApeswapRouter();
        USDs_lp = Clones.clone(Admin.masterNTT());
        IReceipt(USDs_lp).initialize(_admin,address(this), "USDy-LP", "USDy-LP");
        depositTax = 5;
        exchangeRatio = 10**18;
        BUSD = Admin.BUSD();
    }

    /**
    @dev Deposit Function used for depositing LP token.
    @param user , User address as parameter.
    @param amount , amount of LP as parameter.
     */

    function deposit(address user, uint amount,bool isBUSD) nonReentrant external _lastExchangeRatio _completePause whenNotPaused _securityCheck(user,user){
        require(amount > 0,"USDyBUSD:0");
        require(isBUSD,"USDyBUSD:BUSD");
        if(rewards(user)[0] > 0){
            _claimRebaseReward(user);
        } else {
            ss[user] = currentReward;
        }
        IERC20(BUSD).safeTransferFrom(user,address(this),amount);
        uint USDyLiquidity = (IERC20(Admin.USDy()).balanceOf(Admin.USDyBUSD()) * (amount * 4/5)/ IERC20(BUSD).balanceOf(Admin.USDyBUSD()));
        uint USDyPrice  = IReceipt(Admin.USDy()).mintByPrice();
        uint USDyAmount = (( (amount) * (10 ** 18))/USDyPrice);
        IReceipt(Admin.USDy()).mint(address(this), USDyLiquidity + USDyAmount);
        _convertBUSDToLP((amount * 4/5), USDyLiquidity ,BUSD, Admin.USDy(), Admin.USDyBUSD());
        _tax(amount);
        exchangeRatio = exchangeRatio == 0 ? 10**18 : exchangeRatio;
        restrictTransfer[user] = block.number;
        IReceipt(USDs_lp).mint(
            address(this),
            (USDyAmount * (100 - depositTax) * (10**18)) / (exchangeRatio * 100)
        );
        UserDeposit[user] +=
            (USDyAmount * (100 - depositTax) * (10**18)) /
            (exchangeRatio * 100);
        totalDeposit += USDyAmount;
        exchangeRatio = (totalDeposit * (10**18)) / (IERC20(USDs_lp).totalSupply());
        emit Deposit(
            "USDyBUSD Vault",
            address(this),
            user,
            amount,
            block.number,
            block.timestamp
        );
    }

    function withdraw(address user,uint _amount,address sendTo) external whenNotPaused{
        require(!Admin.buyBackActivation(),"Cannot withdraw while buyBack");
        _withdraw(user, _amount, sendTo);
    }

     function distribute(uint256 _rebaseReward) external nonReentrant{
        require(msg.sender == Admin.USDyVault());
        if(IERC20(USDs_lp).totalSupply() != 0){
            currentReward = currentReward + ((_rebaseReward * 10 ** 18)/(IERC20(USDs_lp).totalSupply()));
        }
        epochReward[block.timestamp] = currentReward;

    }

    /**
    @dev Setter Function for depositTax
    @param _depositTax , depositTax amount as parameter.
    */

    function setDepositTax(uint _depositTax) external _isAdmin {
        require(_depositTax != 0, "TaxZero");
        emit SetterForUint(
            "USDyBUSD",
            address(this),
            depositTax,
            _depositTax,
            block.number,
            block.timestamp
        );
        depositTax = _depositTax;
    }

    function setWithdrawTax(uint _withdrawTax) external _isAdmin {
        require(_withdrawTax != 0, "Taxzero");
        withdrawTax = _withdrawTax;
    }
    

    function setRouter(address _router) external _isAdmin{
        require(_router != address(0),"YSL: InvalidData");
        router = _router;
    }

    function emergencyWithdraw() external{
        require(!Admin.buyBackActivation(),"xYSL-BUSD: Can't withdraw");
        require(UserDeposit[msg.sender] != 0,"xYSL-BUSD: Nothing to withdraw");
        _withdraw(msg.sender, UserDeposit[msg.sender], msg.sender);
    }

    function setPause(bool _isPaused) external nonReentrant _isAdmin{
        _isPaused == true? _pause() : _unpause();
    }

    function setCompletePause(bool _completePause) external nonReentrant _isAdmin{
        completePause = _completePause;
    }

    /**
    @dev The user can get Bshare Receipt token  by calling this function
    */

    function receiptToken() external view returns (address) {
        return USDs_lp;
    }


    /**
        @dev Function is used to claim Rebase Reward
    */
    function claimReward(address user) public nonReentrant whenNotPaused _completePause  _securityCheck(user,user){
        _claimRebaseReward(user);
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
    @dev Withdraw Function used for Withdrawal of Reciept.
    @param user , user address as parameter.
    @param _amount ,withdraw amount as parameter.
    */

    function _withdraw(address user,uint _amount,address sendTo) nonReentrant internal _completePause _lastExchangeRatio _securityCheck(user,sendTo){
        require(_amount <= UserDeposit[user],"USDyBUSD: InvalidData");
        if(rewards(user)[0] > 0){
            _claimRebaseReward(user);
        }
        uint balance = (_amount * exchangeRatio)/10 ** 18;
        IERC20(Admin.USDy()).safeTransfer(sendTo,balance * (100- withdrawTax)/100); 
        totalDeposit -= balance * (100- withdrawTax)/100;
        IReceipt(USDs_lp).burn(address(this),_amount);
        UserDeposit[user] -= _amount;
        restrictTransfer[msg.sender]= block.number; 
        exchangeRatio = (totalDeposit * (10**18)) / (IERC20(USDs_lp).totalSupply());
        emit Withdraw("USDyBUSD Vault",address(this),user, _amount,block.number,block.timestamp);     

    }

    function _convertBUSDToLP(uint amountBUSD,uint amountToken2,address path0,address path1,address lp) internal{
        IERC20(path0).approve(router, amountBUSD);
        IERC20(path1).approve(router, amountToken2);
        IUniswapV2Router02(router).addLiquidity(
            path0,
            path1,
            amountBUSD,
            amountToken2,
            1,
            1,
            Admin.Treasury(),
            block.timestamp + 1678948210
        );
    }

    function _claimRebaseReward(address user) internal  {
        if(rewards(user)[1] > 0){
            IReceipt(Admin.USDy()).mint(address(this),rewards(user)[1]);
        }
        IERC20(Admin.USDy()).safeTransfer(user, rewards(user)[0]);
        ss[user] = currentReward;
    }

    function _tax(uint amount) internal {
        address[] memory path = new address[](2);
        path[0] = Admin.USDy();
        path[1] = BUSD;
        if (Admin.buyBackActivation()) {
            if (
                Admin.buyBackActivationEpoch() + (3 * Admin.epochDuration()) <
                block.timestamp
            ) {
                98 * 10**16 <=
                    IUniswapV2Router02(router).getAmountsOut(10**18, path)[1]
                    ? Admin.setBuyBackActivation(false)
                    : Admin.setBuyBackActivationEpoch();
            }
            IERC20(BUSD).safeTransfer(
                Admin.TeamAddress(),
                (amount * 20 * 25) / 10000
            );
            path[0] = BUSD;
            path[1] = Admin.USDy();
            IERC20(BUSD).safeApprove(router, (amount * 20 * 75) / 10000);
            uint amountOut = IUniswapV2Router02(router)
                .swapExactTokensForTokens(
                    (amount * 20 * 75) / 10000,
                    0,
                    path,
                    address(this),
                    block.timestamp + 1000
                )[path.length - 1];
            IReceipt(Admin.USDy()).burn(address(this), amountOut);
        } else {
            if (
                !Admin.buyBackOwnerActivation() &&
                Admin.buyBackActivationEpoch() + (3 * Admin.epochDuration()) <
                block.timestamp &&
                98 * 10**16 >
                IUniswapV2Router02(router).getAmountsOut(10**18, path)[1]
            ) {
                Admin.setBuyBackActivation(true);
            }
            IERC20(BUSD).safeTransfer(Admin.Treasury(), amount / 10);
            IReceipt(Admin.bYSL()).calculateProtocolPrice();
            (uint256 BUSDAmount, uint256 leftAmount) = IReferral(
                Admin.Refferal()
            ).rewardDistribution(msg.sender, (amount * 9) / 100, amount);
            if (BUSDAmount != 0) {
                IERC20(BUSD).safeTransfer(msg.sender, (amount * 1) / 100);
                IERC20(BUSD).safeTransfer(Admin.Refferal(), BUSDAmount);
            } else {
                IERC20(BUSD).safeTransfer(
                    Admin.TeamAddress(),
                    (amount * 1) / 100
                );
            }
            if (leftAmount != 0) {
                IERC20(BUSD).safeTransfer(Admin.TeamAddress(), leftAmount);
            }
        }
    }

    function _isContract(address _addr) internal view returns (bool){
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }

}
