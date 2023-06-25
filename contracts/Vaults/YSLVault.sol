// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "../Interfaces/IWhitelist.sol";
import "../Interfaces/IReceipt.sol";
import "../Interfaces/IEvents.sol";
import "../Interfaces/IAdmin.sol";

/**
@dev This contract is for YSL vault.
 */
 
contract YSLVault is Initializable,ReentrancyGuard, Pausable, IEvents {
    using SafeERC20 for IERC20;

    uint256 public exchangeRatio;// uint of exchange ratio
    uint256 public depositTax;// uint of deposit tax
    uint256 public withdrawTax; // uint of withdraw tax
    uint256 public tradeTax; //uint of TradeTax
    address public router;// address of router
    address public YSLs;
    uint256 public currentReward;
    uint256 public reward;

    mapping (address=>uint256) public ss;
    mapping(address => uint) public UserDeposit;
    mapping (address => uint) public restrictTransfer; // last block number when interacted
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;
    IAdmin public Admin;


    /**
    @dev one time call while deploying
    @param _admin Admin contract address.
    */

    function initialize(
        address _admin,
        address owner
        ) external initializer {
        Admin = IAdmin(_admin); 
        router = Admin.ApeswapRouter();
        YSLs = Clones.clone(Admin.masterNTT());
        IReceipt(YSLs).initialize(_admin,address(this), "YSLs", "YSLs");
        tradeTax = 5;
        exchangeRatio = 10 ** 18;
        depositTax = 10;
        withdrawTax = 0;
    }

    /**
    @dev modifier for admin
    */

    modifier _isAdmin(){
        require(Admin.hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        _;
    }

    /**
    @dev modifier for lastExchangeRatio
    */

    modifier _lastExchangeRatio(){
        uint256 lastExchangeRatio = exchangeRatio;
        _;
        if(lastExchangeRatio > exchangeRatio){
            require(lastExchangeRatio > exchangeRatio, "YSLVault: exchangeRatio decreased.");        
            _pause();
        }
    }

    /**
    @dev deposit YSL
    @param _amount amount to deposit 
    */

    function deposit(address user,uint256 _amount, uint32 _level,bool isBUSD) nonReentrant external _lastExchangeRatio() whenNotPaused(){
        require(_amount > 0, "YSLVault: Deposit amount can't be zero");
        if(UserDeposit[user] > 0){
            _claimRebaseReward(user);
        }else{
            ss[user] = currentReward;
        }
        if(!IWhitelist(Admin.whitelist()).getAddresses(user)) {
            require(restrictTransfer[user] != block.number, "YSLVault: you can't interact in same block");
        }
        IERC20(Admin.YSL()).safeTransferFrom(msg.sender, address(this), _amount);
        exchangeRatio = exchangeRatio == 0 ? 10 ** 18 : exchangeRatio;
        IReceipt(YSLs).mint(address(this),(_amount * (100 - depositTax) * (10 ** 18))/ (exchangeRatio * 100));
        UserDeposit[user] += (_amount * (100 - depositTax) * (10 ** 18))/ (exchangeRatio * 100);
        exchangeRatio = IERC20(Admin.YSL()).balanceOf(address(this)) * (10 ** 18) / IERC20(YSLs).totalSupply();
        restrictTransfer[msg.sender]= block.number; 
        emit Deposit("YSLVault",address(this),msg.sender,_amount,block.number,block.timestamp);
    }

    /**
    @dev Withdraw YSL
    @param user user address as a parameter 
    @param amount amount to be withdraw
    */

    function withdraw(address user,bool isReciept,uint256 amount,address sendTo) nonReentrant external _lastExchangeRatio() whenNotPaused(){
        require(amount <= UserDeposit[user],"YSLVault : Your withdraw amount exceeds deposit");
        if(UserDeposit[user] > 0){
            _claimRebaseReward(user);
        }
        if(!IWhitelist(Admin.whitelist()).getAddresses(user)) {
            require(restrictTransfer[user] != block.number, "YSLVault: you can't interact in same block");
        }
        if(isReciept){
            IERC20(YSLs).safeTransfer(sendTo,amount);
        }
        else{
            uint balance = (amount * exchangeRatio)/10 ** 18;
            IERC20(Admin.YSL()).transfer(sendTo, balance * (100- withdrawTax)/100);
            IReceipt(YSLs).burn(address(this), amount);
        }
        restrictTransfer[user]= block.number; 
        UserDeposit[user] -= amount;
        restrictTransfer[msg.sender]= block.number; 
        emit Withdraw("YSLVault",address(this),user,amount,block.number,block.timestamp);

    }

    /**
    @dev Setter Function for depositTax
    @param _depositTax , depositTax amount as parameter.
    */

    function setDepositTax(uint _depositTax) external _isAdmin{
        require(_depositTax != 0, "Tax can't be Zero");
        emit SetterForUint("YSLBUSDVault",address(this),depositTax,_depositTax,block.number,block.timestamp);
        depositTax = _depositTax;
    }

    function setWithdrawTax(uint _withdrawTax) external _isAdmin{
        require(_withdrawTax != 0,"Tax can't be zero");
        withdrawTax = _withdrawTax;
    }

    /**
    @dev purchase Function used for purchasing Reciept.
    @param user , user address as parameter.
    @param amount , purchasing amount as parameter.
    @param minAmount ,minimum amount to be received on purchase as parameter.
    */

    function purchase(address user, uint amount, uint minAmount) external nonReentrant _lastExchangeRatio() whenNotPaused() returns(uint){
        if(!IWhitelist(Admin.whitelist()).getAddresses(msg.sender)) {
            require(restrictTransfer[msg.sender] != block.number, "YSLVault: you can't interact in same block");
        }
        IERC20(Admin.YSL()).safeTransferFrom(user, address(this),amount);
        uint balance = purchaseOf(amount);
        require(balance > minAmount, "YSLVault: Amount is less than the minAmount");
        IReceipt(YSLs).mint(user, balance); //minting BShare receipt tokens for user
        exchangeRatio = (IERC20(Admin.YSL()).balanceOf(address(this)) * (10 ** 18))/(IERC20(YSLs).totalSupply());
        restrictTransfer[msg.sender]= block.number; 
        return(balance);
        emit PurchaseORSell("YSLVault",user,amount,block.number,block.timestamp);

    }

    /**
    @dev sell Function used for selling Reciept.
    @param user , user address as parameter.
    @param amount , selling amount as parameter.
    @param minAmount ,minimum amount of Reciept to be selled on as parameter.
    */

    function sell(address user, uint amount, uint minAmount) external nonReentrant _lastExchangeRatio() whenNotPaused() returns(uint){
        if(!IWhitelist(Admin.whitelist()).getAddresses(msg.sender)) {
            require(restrictTransfer[msg.sender] != block.number, "YSLVault: you can't interact in same block");
        }
        IReceipt(YSLs).burn(user,amount);
        uint balance = sellOf(amount);
        require(balance > minAmount, "YSLVault: Amount is less than the minAmount");
        IERC20(Admin.YSL()).safeTransfer(user,balance);
        restrictTransfer[msg.sender]= block.number; 
        return(balance);
        emit PurchaseORSell("YSLVault",user,amount,block.number,block.timestamp);

    }

    function distribute(uint256 _rebaseReward) external nonReentrant{
        currentReward = currentReward + ((_rebaseReward * 10 ** 18)/(IERC20(Admin.YSL()).totalSupply()));
    }

    function rewards(address user, address token) public view returns(uint){
        return(((_userAmount(user, token) * (currentReward - ss[msg.sender])) / 10 ** 18));
    }

    /**
    @dev Setter Function for TradeTax
    @param _tradeTax , tradeTax amount as parameter.
    */

    function setTradeTax(uint _tradeTax) external _isAdmin{
        require(_tradeTax != 0, "Tax can't be Zero");
        emit SetterForUint("YSLBUSDVault",address(this),tradeTax,_tradeTax,block.number,block.timestamp);
        tradeTax = _tradeTax;
    }

    function _claimRebaseReward(address user) internal {
        uint userAmount = ((UserDeposit[user] * exchangeRatio)/ IERC20(address(Admin.YSL())).totalSupply());
        reward =((userAmount * (currentReward - ss[user]))/ 10 ** 18);
        IERC20(Admin.USDy()).safeTransfer(user, reward);
        ss[user] = currentReward;
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function unpause() external nonReentrant _isAdmin{
        _unpause();
    }
    /**
    @dev The user can get  Receipt token  by calling this function
    */

    function receiptToken() external view returns(address){
        return YSLs;
    }

    function claimRebaseReward(address user) public nonReentrant {
        _claimRebaseReward(user);
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

    function _userAmount(address user, address token) internal view returns(uint){
        return((UserDeposit[user] * exchangeRatio)/ IERC20(token).totalSupply());
    }

}
