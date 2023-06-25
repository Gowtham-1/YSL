// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface IYSLBUSDVault {
    function distribute(uint256 _rebaseReward) external;
}