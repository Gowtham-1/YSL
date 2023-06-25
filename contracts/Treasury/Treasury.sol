// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../Interfaces/IAdmin.sol";

/**
@dev It's a treasury contract which holds BUSD
 */ 
 
contract Treasury is AccessControl, Initializable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public owner; //Owner address
    IAdmin public  Admin; // Admin Address

    bytes32 public constant WITHDRAW_ROLE = keccak256("WITHDRAW_ROLE"); // byte role for withdrawal
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE"); // byte role for admin
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR"); //byte for operator role
    bytes32 public constant REBALANCER_ROLE = keccak256("REBALANCER"); // byte for rebalancer role 
    
    function initialize(address _owner,address _admin) external initializer{
         Admin = IAdmin(_admin);
        require(
            Admin.BUSD() != address(0),
            "Treasury:: initialize: Address can not be null"
        );
        owner = _owner;
        _setupRole(ADMIN_ROLE, _owner);
        _setupRole(WITHDRAW_ROLE, Admin.Trigger());
    }
        /**
    @dev modifier for operator role
    **/

    modifier _isOperator(){
        require(Admin.hasRole(OPERATOR_ROLE, msg.sender));
        _;
    }

    /**
    @dev modifier for admin role or operator role
    */

    modifier _isAdminOrOperator(){
        require(Admin.hasRole(OPERATOR_ROLE, msg.sender) || Admin.hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        _;
    }

    /** 
    @dev withdraw given amount 

    @param _amount amount to tranfer

    Note only called by withdrawal role addresses
        the amount will transfer to POL only 
     */
    function withdraw(uint256 _amount) external nonReentrant onlyRole(WITHDRAW_ROLE) {
        require(
            Admin.POL() != address(0),
            "Treasury: POL address is not set"
        );
        require(_amount > 0, "Treasury:: withdraw: Amount can not be zero");
        IERC20(Admin.BUSD()).transfer(Admin.POL(),_amount);        
    }

    /**
    @dev withdraw whole funds
        only called by admin role
     */
    function emergencyWithdraw() external nonReentrant onlyRole(ADMIN_ROLE) {
        IERC20(Admin.BUSD()).transfer(owner,IERC20(Admin.BUSD()).balanceOf(address(this)));
    }

    function removeLiquidity(address _lpToken,address _router) external nonReentrant _isOperator(){
        require(IUniswapV2Pair(_lpToken).balanceOf(address(this)) > 0,"Treasury: LP amount should be valid");
        require(IUniswapV2Factory(IUniswapV2Router02(_router).factory()).getPair(IUniswapV2Pair(_lpToken).token0(), 
        IUniswapV2Pair(_lpToken).token1()) == _lpToken, "Treasury: Invalid Router Address");
        IUniswapV2Pair(_lpToken).approve(_router, IUniswapV2Pair(_lpToken).balanceOf(address(this)));
        IUniswapV2Router02(_router).removeLiquidity(IUniswapV2Pair(_lpToken).token0(), 
        IUniswapV2Pair(_lpToken).token1(), IUniswapV2Pair(_lpToken).balanceOf(address(this)), 1, 1, Admin.TeamAddress(), block.timestamp +1000);
    }
    function swapLiquidity(address _lpToken, address _prevRouter, address _newRouter) external nonReentrant _isOperator(){
        require(IUniswapV2Pair(_lpToken).balanceOf(address(this)) > 0,"Treasury: LP amount should be valid");
        require(IUniswapV2Factory(IUniswapV2Router02(_prevRouter).factory()).getPair(IUniswapV2Pair(_lpToken).token0(), 
            IUniswapV2Pair(_lpToken).token1()) == _lpToken, "Treasury: Router address should be valid");
        IUniswapV2Pair(_lpToken).approve(_prevRouter, IUniswapV2Pair(_lpToken).balanceOf(address(this)));
        IUniswapV2Router02(_prevRouter).removeLiquidity(IUniswapV2Pair(_lpToken).token0(), 
            IUniswapV2Pair(_lpToken).token1(), IUniswapV2Pair(_lpToken).balanceOf(address(this)), 1, 1, address(this), block.timestamp); 
        uint amountToken0 = IERC20(IUniswapV2Pair(_lpToken).token0()).balanceOf(address(this));
        uint amountToken1 = IERC20(IUniswapV2Pair(_lpToken).token1()).balanceOf(address(this));
        IERC20(IUniswapV2Pair(_lpToken).token0()).approve(_newRouter, amountToken0);
        IERC20(IUniswapV2Pair(_lpToken).token1()).approve(_newRouter, amountToken1);
        IUniswapV2Router02(_newRouter).addLiquidity(
            IUniswapV2Pair(_lpToken).token0(),
            IUniswapV2Pair(_lpToken).token1(),
            amountToken0,
            amountToken1,
            1,
            1,
            address(this),
            block.timestamp + 1678948210
       );
    }

    /** 
    @dev assigns the role REBALANCER_ROLE to the contract 
    @param _rebalancer address of the rebalancer contract which is to be assigned the role
    */

    function setRebalancerRole(address _rebalancer) public _isAdminOrOperator{
        _setupRole(REBALANCER_ROLE, _rebalancer);
    }

    /** 
    @dev approves the rebalancer to access the lp tokens and transfers to the rebalancer's address
    @param _contractAddress address of the rebalancer contract
    @param _lpToken address of the lp tokens
    @param _amount amount of lp tokens 
    */

    function getLpFromTreasury(address _contractAddress, address _lpToken, uint _amount) public onlyRole(REBALANCER_ROLE) {
        IERC20(_lpToken).approve(_contractAddress, _amount);
        IERC20(_lpToken).transfer(_contractAddress, _amount);
    }

    function setAdmin(address _admin) external _isAdminOrOperator{
        Admin = IAdmin(_admin);
    }

    function setwithdrawRole(address _withdrawer) public _isAdminOrOperator{
        _setupRole(WITHDRAW_ROLE, _withdrawer);
    }
    
}
