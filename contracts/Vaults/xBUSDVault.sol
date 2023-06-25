pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "../Interfaces/ILiquidityProvider.sol";
import "../Interfaces/IxBUSD.sol";
import "../Interfaces/IWhitelist.sol";
import "../Interfaces/IReceipt.sol";
import "../Interfaces/IEvents.sol";
import "../Interfaces/IAdmin.sol";

contract xBUSDVault is Initializable, ReentrancyGuard, Pausable,IEvents{
using SafeERC20 for IERC20;
address public xShare; // Receipt Token
uint256 public depositTax;// uint of deposit tax
uint256 public withdrawTax;
IAdmin public Admin;// Address for Admin contract
uint256 public exchangeRatio; // Exchange ratio as State Variables
uint256 public belowPegTax;// Tax on Below Peg 
bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE"); //byte for admin role
bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR"); //byte for operator role



/**
    Mapping for User deposits
 */

mapping(address => uint) public UserDeposit;


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

/**
    Initialize Function
 */
function initialize(address _admin) external initializer {
    Admin = IAdmin(_admin); 
    xShare = Clones.clone(Admin.masterNTT());
    IReceipt(xShare).initialize(_admin,address(this), "xShareS", "xShareS");
    depositTax = 10;
    exchangeRatio = 10 **18;
    withdrawTax = 10;
    belowPegTax = 0;
}




/**
    @dev Function for depositing BUSD as User Deposits  in the xBUSDVault. 
    @param user , Address of User 
    @param amount , Uint amount to be deposited
    @param isBUSD, a bool to know that the deposit token is BUSD or not
 */
function deposit(address user, uint amount, bool isBUSD)  external nonReentrant whenNotPaused() {
    require(isBUSD,"You can only deposit BUSD");
    require(amount > 0,"xBUSDVault : Invalid Amount");
    depositTax = 10;
    IERC20(Admin.BUSD()).safeTransferFrom(user, address(this),amount);
    exchangeRatio = exchangeRatio == 0 ? 10 ** 18 : exchangeRatio;
    address[] memory path = new address[](2);
        path[0] = Admin.BUSD();
        path[1] = Admin.xYSL();
    uint _amount;
    uint amountInPercentage;
    IERC20(Admin.BUSD()).safeApprove(Admin.ApeswapRouter(),amount);
    IERC20(Admin.BUSD()).safeApprove(Admin.liquidityProvider(),amount);
    IERC20(Admin.xBUSD()).safeApprove(Admin.liquidityProvider(),amount);
    uint amountOut = swap((amount * (depositTax)) / 100,path,address(this));
    IReceipt(Admin.xYSL()).burn(address(this),amountOut);   
    if(IxBUSD(Admin.xBUSD()).pegReturn() == 0){
        IReceipt(Admin.xBUSD()).mint(address(this),(amount * 190) / 100);
        amountInPercentage = (amount * 90);
        _amount = ((amount * (100 - depositTax) * (10 ** 18))/ (exchangeRatio * 100)) * 1000;

    }else{
        path[1] = Admin.xBUSD();
        amountInPercentage = (amount * 45);
        amountInPercentage = (swap(amountInPercentage / 100,path,address(this))) * 100;
        _amount = ((amount * (10 ** 18))/ (exchangeRatio)) * 1000;
        IReceipt(Admin.xBUSD()).mint(address(this),amount);
        depositTax = 0;
    }
        IUniswapV2Router02(Admin.ApeswapRouter()).addLiquidity(
            Admin.BUSD(),
            Admin.xBUSD(),
            IERC20(Admin.BUSD()).balanceOf(address(this)),
            (amountInPercentage / 100),
            1,
            1,
            address(this),
            block.timestamp + 1678948210
        );
        IReceipt(xShare).mint(user,_amount / 1000);
        UserDeposit[user] += (amount * (100 - depositTax) * (10 ** 18))/ (exchangeRatio * 100);
        exchangeRatio = IERC20(Admin.xBUSD()).balanceOf(address(this)) * (10 ** 18) / IERC20(xShare).totalSupply();
}

/**
    @dev Function for withdrawing xbUSD on behalf of User deposits of BUSD
    @param _user , address of the user 
    @param amount , amount to be withdraw
 */
function withdraw(address _user, uint amount)public nonReentrant whenNotPaused(){
    require(amount <= UserDeposit[_user],"xBUSDVault : Your withdraw amount exceeds deposit");
    exchangeRatio = exchangeRatio == 0 ? 10 ** 18 : exchangeRatio;
    if(IxBUSD(Admin.xBUSD()).pegReturn() == 0){
        IERC20(Admin.xBUSD()).transfer(_user, amount);
    }else{
        if(IxBUSD(Admin.xBUSD()).pegReturn() == 1){
            uint balance = (amount * exchangeRatio)/10 ** 18;
            IERC20(Admin.xBUSD()).transfer(_user, (balance * (100 - withdrawTax)) / 100);
        }
    } 
        IReceipt(xShare).burn(_user, amount);

}

/**
    @dev Function for swapping 2 tokens
    @param amount ,amount to be swapped 
    @param path, as an array 
    @param sendTo, sendTo address
*/
function swap(uint256 amount, address[] memory path, address sendTo) internal returns(uint){
        uint amountOut = IUniswapV2Router02(Admin.ApeswapRouter()).swapExactTokensForTokens( 
            amount,
            0,
            path,
            sendTo,
            block.timestamp + 1000
            )[path.length - 1];
        return amountOut;
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
    
}