// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "../Interfaces/ITemporaryHolding.sol";
import "../Interfaces/IWhitelist.sol";
import "../Interfaces/IReceipt.sol";
import "../Interfaces/IEvents.sol";
import "../Interfaces/IAdmin.sol";
import "../Interfaces/IBYSL.sol";

/**
@dev This contract is for BShare vault 
 */
contract BshareVault is Initializable,ReentrancyGuard, Pausable,IEvents {
    using SafeERC20 for IERC20;

    struct winningPrice{
        uint YSLRewards;
        uint xYSLRewards;
        uint bYSLRewards;
        uint BshareRewards;
    }

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE"); //byte for admin role
    uint256 public exchangeRatio;
    uint256 public depositTax;
    uint256 public tradeTax;
    uint256 public winningCount;
    uint256 public lastReward;
    address public BshareS; //BShare receipt tokens address
    address public router;  //router address
    IAdmin public Admin;

    mapping(address => uint) public UserDeposit;
    mapping(address => uint) public restrictTransfer; // last block number when interacted
    mapping(address => winningPrice) public winningDetails;
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    /**
    @dev one time call while deploying
    @param _admin admin address
     */

    function initialize(
        address _admin
    ) external initializer {
        Admin = IAdmin(_admin); 
        router = Admin.ApeswapRouter();
        BshareS = Clones.clone(Admin.masterNTT());
        IReceipt(BshareS).initialize(_admin,address(this), "BshareS", "BshareS");
        tradeTax = 5;
        exchangeRatio = 10 ** 18;
        depositTax = 10;
    }

    modifier _isAdmin(){
        require(Admin.hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        _;
    }

    modifier _lastExchangeRatio(){
        uint256 lastExchangeRatio = exchangeRatio;
        _;
        if(lastExchangeRatio > exchangeRatio){
            require(lastExchangeRatio > exchangeRatio, "BshareVault: exchangeRatio decreased.");
        }
    }

    /**
    @dev To deposit BShare,it characterise the functionalities of "_deposit function"
    @param user address of user
    @param _amount amount to deposit 
    @param isBYSL a bool for bysl
    note there will be 10% deposit fees on all vault. The protocol will then mint Bshare-S equivilent to 90%
        of Bshare deposited divided in the new ratio
    */

    function deposit(address user, uint256 _amount, bool isBYSL) nonReentrant external {
        if(isBYSL){
            address[] memory path = new address[](2);
            path[0] = Admin.BUSD();
            path[1] = Admin.BShare();
            uint BShareAmount  = IUniswapV2Router02(Admin.ApeswapRouter()).getAmountsOut(_amount * IBYSL(Admin.bYSL()).protocolPrice(), path)[1];
            IReceipt(Admin.BShare()).mint(address(this), BShareAmount);

            IERC20(Admin.bYSL()).safeTransferFrom(user, address(this), _amount);
            _deposit(user, BShareAmount);
            emit LottoDeposit("BshareVault", user, _amount,block.number,block.timestamp);
        }else{
            IERC20(Admin.BShare()).safeTransferFrom(user, address(this), _amount);
            _deposit(user, _amount);
        }

    }
    /**
    @dev To deposit BShare, It has main functionalities for deposit
    @param user address of user
    @param _amount amount to deposit 
    */
    function _deposit(address user,uint256 _amount) internal {
        require(_amount > 0, "BshareVault: Deposit amount can't be zero");
        if(!IWhitelist(Admin.whitelist()).getAddresses(user)) {
            require(restrictTransfer[user] != block.number, "BshareVault: you can't interact in same block");
        }
        exchangeRatio = exchangeRatio == 0 ? 10 ** 18 : exchangeRatio;
        IReceipt(BshareS).mint(address(this),(_amount * (100 - depositTax) * (10 ** 18))/ (exchangeRatio * 100));
        UserDeposit[user] += (_amount * (100 - depositTax) * (10 ** 18))/ (exchangeRatio * 100);
        exchangeRatio = (IERC20(Admin.BShare()).balanceOf(address(this)) * (10 ** 18)) / IERC20(BshareS).totalSupply();
        restrictTransfer[msg.sender]= block.number;
        emit Deposit("Bshare Vault",address(this),msg.sender, _amount ,block.number,block.timestamp);
    }
    /**
    @dev Withdraw BShare
    @param user address user
    @param amount amount
    */

    function withdraw(address user,bool isReciept,uint256 amount, address sendTo) nonReentrant external _lastExchangeRatio() whenNotPaused(){
        require(amount <= UserDeposit[user],"BshareVault : Your withdraw amount exceeds deposit");
        if(!IWhitelist(Admin.whitelist()).getAddresses(user)) {
            require(restrictTransfer[user] != block.number, "BshareVault: you can't interact in same block");
        }
        if(isReciept){
            IERC20(BshareS).safeTransfer(user,amount);
        }
        else{
            uint balance = (amount * exchangeRatio)/10 ** 18;
            IERC20(Admin.BShare()).safeTransfer(user, balance);
            IReceipt(BshareS).burn(address(this), amount);
        }
        UserDeposit[user] -= amount;
        restrictTransfer[user]= block.number;
        emit Withdraw("Bshare Vault",address(this),user, amount,block.number,block.timestamp);
    }

  /**
    @dev Setter Function for depositTax
    @param _depositTax , depositTax amount as parameter.
    */

    function setDepositTax(uint _depositTax) external _isAdmin{
        require(_depositTax != 0,"BshareVault: Tax can't be Zero");
        emit SetterForUint("BshareVault",address(this),depositTax,_depositTax,block.number,block.timestamp);
        depositTax = _depositTax;
    }

    /**
    @dev purchase BShare receipt tokens
    @param user address of user
    @param amount purchase amount
    @param minAmount minAmount
    */

    function purchase(address user, uint amount, uint minAmount) external nonReentrant _lastExchangeRatio() whenNotPaused() returns(uint){
        if(!IWhitelist(Admin.whitelist()).getAddresses(msg.sender)) {
            require(restrictTransfer[msg.sender] != block.number, "BshareVault: you can't interact in same block");
        }
        IERC20(Admin.BShare()).safeTransferFrom(user, address(this),amount);
        uint balance = purchaseOf(amount);
        require(balance > minAmount, "BshareVault: Amount is less than the minAmount");
        IReceipt(BshareS).mint(user, balance);//minting BShare receipt tokens for user
        exchangeRatio = (IERC20(Admin.BShare()).balanceOf(address(this)) * (10 ** 18))/(IERC20(BshareS).totalSupply());
        restrictTransfer[msg.sender]= block.number;
        return(balance);
        emit PurchaseORSell("BshareVault",user,amount,block.number,block.timestamp);

    }

    /**
    @dev function is used to pick  winner, only admin can call this function
    @param _winner address of winner 
    */

    function setWinner(address _winner, address _highest) nonReentrant external _isAdmin returns(uint RewardsAmount){
        uint BshareRewardInBUSD = ((lastReward * 5)/10) > 10**21 ? (lastReward * 5)/10 : 10**21;
        address[] memory path = new address[](2);
            path[0] = Admin.BUSD();
            path[1] = Admin.BShare();
        uint BShareAmount  = IUniswapV2Router02(Admin.ApeswapRouter()).getAmountsOut(BshareRewardInBUSD * IBYSL(Admin.bYSL()).protocolPrice(), path)[1];
        (uint YSLRewards, uint xYSLRewards, uint bYSLRewards) = ITemporaryHolding(Admin.temporaryHolding()).withdrawForBshareReward(address(this));
        path[0] = Admin.YSL();
        path[1] = Admin.BUSD();
            uint YSLRewardInBUSD  = IUniswapV2Router02(Admin.ApeswapRouter()).getAmountsOut(YSLRewards, path)[1];
        path[0] = Admin.xYSL();
            uint xYSLRewardInBUSD  = IUniswapV2Router02(Admin.ApeswapRouter()).getAmountsOut(xYSLRewards, path)[1];
        path[0] = Admin.bYSL();
            uint bYSLRewardInBUSD  = IUniswapV2Router02(Admin.ApeswapRouter()).getAmountsOut((bYSLRewards * 90)/100, path)[1];
        IReceipt(Admin.bYSL()).burn(address(this), bYSLRewards /10);
        RewardsAmount = YSLRewardInBUSD + xYSLRewardInBUSD + bYSLRewardInBUSD + BshareRewardInBUSD;
        winningPrice storage win1 = winningDetails[_highest]; // = winningPrice(YSLRewards,xYSLRewards,(bYSLRewards * 90)/100, BShareAmount);
        winningPrice storage win2 = winningDetails[_winner];
        win1.YSLRewards += YSLRewards/2;
        win1.xYSLRewards += xYSLRewards/2;
        win1.BshareRewards += BShareAmount/2;
        win1.bYSLRewards += (bYSLRewards * 9)/10;

        win2.YSLRewards += YSLRewards/2;
        win2.xYSLRewards += xYSLRewards/2;
        win2.BshareRewards += BShareAmount/2;

        _deductBshareS(_winner,RewardsAmount);
        lastReward = RewardsAmount; 
    }

    /**
    @dev The user can claim its reward by calling this function
    */

    function claimReward() nonReentrant external{
        require(winningDetails[msg.sender].YSLRewards != 0 ||
                winningDetails[msg.sender].xYSLRewards != 0 ||
                winningDetails[msg.sender].bYSLRewards != 0 ||
                winningDetails[msg.sender].BshareRewards != 0,"nothing to claim"); 

        IERC20(Admin.YSL()).safeTransfer(msg.sender, winningDetails[msg.sender].YSLRewards);
        IERC20(Admin.xYSL()).safeTransfer(msg.sender, winningDetails[msg.sender].xYSLRewards);
        IERC20(Admin.bYSL()).safeTransfer(msg.sender, winningDetails[msg.sender].bYSLRewards);
        IReceipt(Admin.BShare()).mint(msg.sender, winningDetails[msg.sender].BshareRewards);

        winningDetails[msg.sender].YSLRewards = 0;
        winningDetails[msg.sender].xYSLRewards = 0;
        winningDetails[msg.sender].bYSLRewards = 0;
        winningDetails[msg.sender].BshareRewards = 0;
    }

    /**
    @dev sell BShare receipt tokens and acquire BShare LPtokens
    @param user address of user
    @param amount sell amount
    @param minAmount minAmount
    */

    function sell(address user, uint amount, uint minAmount) external nonReentrant _lastExchangeRatio() whenNotPaused() returns(uint){
        if(!IWhitelist(Admin.whitelist()).getAddresses(msg.sender)) {
            require(restrictTransfer[msg.sender] != block.number, "BshareVault: you can't interact in same block");
        }
        IReceipt(BshareS).burn(user,amount);
        uint balance = sellOf(amount);
        require(balance > minAmount, "BshareVault: Amount is less than the minAmount");
        IERC20(Admin.BShare()).safeTransfer(user,balance);
        restrictTransfer[msg.sender]= block.number;
        return(balance);
        emit PurchaseORSell("BshareVault",user,amount,block.number,block.timestamp);

    }

    /**
    @dev Setter Function for TradeTax
    @param _tradeTax , tradeTax amount as parameter.
    */

    function setTradeTax(uint _tradeTax) external _isAdmin{
        require(_tradeTax != 0,"BshareVault: Tax can't be Zero");
        emit SetterForUint("BshareVault",address(this),tradeTax,_tradeTax,block.number,block.timestamp);
        tradeTax = _tradeTax;
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */

    function unpause() external _isAdmin{
        _unpause();
    }

    /**
    @dev The user can get Bshare Receipt token  by calling this function
    */

    function receiptToken() external view returns(address){
        return BshareS;
    }

    function userDeposit(address user,uint256 _amount) public nonReentrant{
        UserDeposit[user] += _amount;
    } 

    /**
    @dev purchaseOf Function used for getting Reciept amount on purchase.
    @param amount , purchaseOf amount as parameter.
    */

    function purchaseOf(uint amount) public view returns(uint){
        return((amount * (100 - tradeTax) * 10 ** 16)/ exchangeRatio);
    }

    /**
    @dev sellOf Function used for getting Reciept amount on selling.
    @param amount , sellOf amount as parameter.
    */

    function sellOf(uint amount) public view returns(uint){
        return((amount * exchangeRatio * (100 - tradeTax))/10 ** 20);
    }
    
    /**
    @dev function is used to deduct BshareAmount of user
    @param user address of user
    @param  _rewardAmount amount of reward as uint
    */

    function _deductBshareS(address user,uint _rewardAmount) internal{
        address[] memory path = new address[](2);
            path[0] = Admin.BShare();
            path[1] = Admin.BUSD();
        uint balance = (UserDeposit[user] * exchangeRatio)/10 ** 18;
        uint depositInBUSD = IUniswapV2Router02(Admin.ApeswapRouter()).getAmountsOut(balance, path)[1];
        if((_rewardAmount/10) > depositInBUSD){
            path[0] = Admin.BUSD();
            path[1] = Admin.BShare();
            uint BShareAmount  = IUniswapV2Router02(Admin.ApeswapRouter()).getAmountsOut(_rewardAmount/10, path)[1];
            UserDeposit[user] -= purchaseOf(BShareAmount);
        }else{
            UserDeposit[user] = 0;
        }
    }     
}