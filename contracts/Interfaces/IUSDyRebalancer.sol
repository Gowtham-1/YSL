// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "../Interfaces/ILiquidityProvider.sol";

interface IUSDyRebalancer {
    function lastTimeStamp() external;
    function epoch() external;
    function currentTimestamp() external;
    function isEnabled() external;
    function impactPercentageLimit() external;
    function Admin() external;
    function router() external;
    function factory() external;
    function pair() external;
    function lProvider() external;
    function lp() external;
    function initialize(address _admin, IUniswapV2Router02 _router, ILiquidityProvider _lProvider) external;
    function rebalance() external returns(bool);
    function sqrt(uint x) external pure returns (uint y);
    function rebalancerState() external returns(bool);
    function setImpactPercentageLimit(uint _impactPercentageLimit) external;
    function setMode(uint _mode) external;
}