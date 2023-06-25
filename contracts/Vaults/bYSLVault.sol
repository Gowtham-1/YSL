pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "../Interfaces/IWhitelist.sol";
import "../Interfaces/IReceipt.sol";
import "../Interfaces/IAdmin.sol";
import "../Interfaces/IEvents.sol";

contract bYSLVault is Initializable,ReentrancyGuard, Pausable,IEvents {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE"); //byte for admin role
    uint256 public totalDeposited;
    uint256 public exchangeRatio;
    uint256 public depositTax;
    uint256 public withdrawTax; 
    uint256 public tradeTax;
    uint256 public currentReward;
    uint256 public reward;
    address public xYSLs; // xYSLs token address
    address public router;
    
    mapping(address => uint) public UserDeposit;
    mapping (address => uint) public restrictTransfer; // last block number when interacted
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;
    IAdmin public Admin;

    modifier _isAdmin(){
        require(Admin.hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        _;
    }
    modifier _lastExchangeRatio(){
        uint256 lastExchangeRatio = exchangeRatio;
        _;
        if(lastExchangeRatio > exchangeRatio){
            require(lastExchangeRatio > exchangeRatio, "bYSLVault: exchangeRatio decreased.");        
            _pause();
        }
    }

    function initialize(address _admin) external initializer{
        Admin = IAdmin(_admin);
        router = Admin.ApeswapRouter();
        tradeTax = 5;
        exchangeRatio = 10 ** 18;
        depositTax = 5;
        withdrawTax = 5;
    }


    function deposit(address user,uint256 _amount,uint32 level,bool isBUSD) external nonReentrant _lastExchangeRatio() whenNotPaused(){
        require(_amount > 0, "bYSLVault: Deposit amount can't be zero");
        if(!IWhitelist(Admin.whitelist()).getAddresses(user)) {
            require(restrictTransfer[user] != block.number, "bYSLVault: you can't interact in same block");
        }
        require(_amount > 0, "bYSLVault: Deposit amount can't be zero");
        IERC20(Admin.bYSL()).transferFrom(user, address(this), _amount);
        exchangeRatio = exchangeRatio == 0 ? 10 ** 18 : exchangeRatio;
        IReceipt(Admin.xBUSD()).mint(address(this),(_amount * (100 - depositTax) * (10 ** 18))/ (exchangeRatio * 100));
        UserDeposit[user] += (_amount * (100 - depositTax) * (10 ** 18))/ (exchangeRatio * 100);
        exchangeRatio = (IERC20(Admin.bYSL()).balanceOf(address(this)) * (10 ** 18)) / IERC20(Admin.xBUSD()).totalSupply();
        restrictTransfer[msg.sender]= block.number; 
        emit Deposit("bYSLVault",address(this),msg.sender, _amount,block.number,block.timestamp);
    }

    function withdraw(address user,bool isReciept,uint256 amount, address sendTo) nonReentrant external  _lastExchangeRatio() whenNotPaused(){
        require(amount <= UserDeposit[user],"bYSLVault: Your withdraw amount exceeds the deposit");
        if(!IWhitelist(Admin.whitelist()).getAddresses(user)) {
            require(restrictTransfer[user] != block.number, "bYSLVault: you can't interact in same block");
        }
        if(isReciept){
            IERC20(xYSLs).safeTransfer(sendTo,amount);
        }
        else{
            uint balance = (amount * exchangeRatio)/10 ** 18;
            IERC20(Admin.bYSL()).safeTransfer(sendTo, balance * (100- withdrawTax)/100);
            IReceipt(Admin.xBUSD()).burn(address(this), amount);
        }
        UserDeposit[user] -= amount;
        restrictTransfer[msg.sender]= block.number; 
        emit Withdraw("bYSLVault",address(this),user, amount,block.number,block.timestamp);

    }

     function setDepositTax(uint _depositTax) external _isAdmin{
        require(_depositTax !=0,"Tax can't be zero");
        emit SetterForUint("bYSLVault",address(this),depositTax,_depositTax,block.number,block.timestamp);
        depositTax = _depositTax;
    }

    function setWithdrawTax(uint _withdrawTax) external _isAdmin{
        require(_withdrawTax != 0,"Tax can't be zero");
        withdrawTax = _withdrawTax;
    }


    function setTradeTax(uint _tradeTax) external _isAdmin{
        require(tradeTax !=0,"Tax can't be zero");
        emit SetterForUint("bYSLVault",address(this),tradeTax,_tradeTax,block.number,block.timestamp);
        tradeTax = _tradeTax;
    }


     function unpause() external nonReentrant _isAdmin{
        _unpause();
    }

}