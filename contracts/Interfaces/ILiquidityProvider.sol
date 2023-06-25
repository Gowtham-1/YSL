// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface ILiquidityProvider {
    function initialize( 
    address _router, 
    address _Admin
    ) external;
    function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB, uint256 amountAmin, uint256 amountBmin, address to) external;
    function addLiquidityEth(address token, uint amount, address to) external payable;
    function removeLiquidity(address lp, uint amount) external returns(uint amountA, uint amountB);
    function removeLiquidityEth(address token, uint amount) external;
    function depositBUSDToLP(address user,uint amount,address lp) external  returns(uint);
    function lpDollarValue(address lp,address tokenA, address tokenB) external view returns(uint256);
}