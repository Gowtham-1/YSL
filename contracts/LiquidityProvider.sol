// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Interfaces/IAdmin.sol";
import "./Interfaces/IReceipt.sol";
import "./Interfaces/ISingleVault.sol";

contract liquidityProvider is AccessControl, Initializable {
    using SafeERC20 for IERC20;
    using SafeERC20 for IUniswapV2Pair;
    IAdmin public Admin;
    address public router;

    bytes32 public constant BUSDTOLPCALL = keccak256("BUSDTOLPCALL"); //role byte for setter functions

    /**
    @dev initialize
   **/
   function initialize( 
    address _router, 
    address _Admin
    ) external initializer{
        router = _router;
        Admin = IAdmin(_Admin);
        _setupRole(BUSDTOLPCALL, Admin.YSLBUSDVault());
        _setupRole(BUSDTOLPCALL, Admin.xYSLBUSDVault()); 
        _setupRole(BUSDTOLPCALL, Admin.USDyBUSDVault()); 
        _setupRole(BUSDTOLPCALL, Admin.BShareBUSDVault()); 
    }

    
    /**
    @dev Function is used to AddLiquidity of tokens, with NO TAX
    @param tokenA address of Token A 
    @param tokenB address of Token B
    @param amountA amount of token A
    @param amountB amount of token B
    */

    function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB, uint256 amountAmin, uint256 amountBmin, address to) public {
        if(IERC20(tokenA).allowance(address(this),router) > 0){
                IReceipt(tokenA).decreaseAllowance(router,IERC20(tokenA).allowance(address(this),router));
            }
            if(IERC20(tokenB).allowance(address(this),router) > 0){
                IReceipt(tokenB).decreaseAllowance(router,IERC20(tokenB).allowance(address(this),router));
            }
        IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).safeTransferFrom(msg.sender, address(this), amountB);
        IERC20(tokenA).safeApprove(router, amountA);
        IERC20(tokenB).safeApprove(router, amountB);
        
        IUniswapV2Router02(router).addLiquidity(
            tokenA,
            tokenB,
            amountA,
            amountB,
            amountAmin,
            amountBmin,
            to,
            block.timestamp + 1678948210);
            IERC20(Admin.BUSD()).approve(router,0);

            if(IERC20(Admin.BUSD()).balanceOf(address(this)) > 0) {
                IERC20(Admin.BUSD()).safeTransfer(Admin.Treasury(), IERC20(Admin.BUSD()).balanceOf(address(this)));
                IReceipt(Admin.bYSL()).calculateProtocolPrice();
            }
        }
/**
@dev Function is used to remove liquidity
@param lp address pf Lp token
@param amount amount of lp as uint
 */
    function removeLiquidity(address lp, uint amount) public returns(uint amountA, uint amountB){
        IERC20(lp).safeTransferFrom(msg.sender,address(this),amount);
        IERC20(lp).safeApprove(router, amount);
        (amountA,amountB) = IUniswapV2Router02(router).removeLiquidity(IUniswapV2Pair(lp).token0(), 
            IUniswapV2Pair(lp).token1(), amount, 1, 1, msg.sender, block.timestamp);
    }

    /**
    @dev function to addLiquidity for ETH 
    @param token address of token
    @param amount amount for liquidity
     */
    function addLiquidityEth(address token, uint amount, address to) public payable{
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(token).safeApprove(router,amount);
        IUniswapV2Router02(router).addLiquidityETH{value : msg.value}(
            token,
            amount,
            1,
            1,
            to,
            block.timestamp + 1678948210);
    }
     /**
    @dev function to removeLiquidity for ETH 
    @param token address of token
    @param amount amount for liquidity
     */
    function removeLiquidityEth(address token, uint amount) public returns (uint amountA, uint amountBNB) {
        address lp = IUniswapV2Factory(IUniswapV2Router02(Admin.ApeswapRouter()).factory()).getPair(token,Admin.WBNB());
        IERC20(lp).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(lp).safeApprove(router, amount);
        (amountA, amountBNB) = IUniswapV2Router02(router).removeLiquidityETH(token,amount, 1, 1, msg.sender, block.timestamp);
    }

}