// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface IBshareBUSDVault {
    function distribute(uint256 _rebaseReward) external;
}