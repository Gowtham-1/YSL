// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";

interface ISwapPage {
    function swapTokenToToken(address path0, address path1, uint amount, address sendTo, bool isBNB) external payable returns(uint);

    function getPriceBUSDToBYSL(address path0, address path1, uint amount) external view returns(uint);

    function swapBUSDToToken(address path0, address path1, uint amount) external returns(uint);

    function getsAmountsOut(address path0, address path1, uint amount) external view returns(uint);

    function addLiquidityTokenBUSD(address path0, address path1, uint amount0, uint amount1, address user, bool depositInVault) external;

    function swapPageForVaults(address user, address depositToken, uint depositAmount, address pairOne, address pairTwo, bool addInVault, bool isBUSD, bool isBNB) external payable;

    function getLPToToken(address user, IUniswapV2Pair depositLPAddress, address wantTokenAddress, address path0, address path1, uint depositLPAmount, bool isBNB) external;

    function setStartTime(uint _startTime) external;
    function lastBYSLSupply() external;
}
