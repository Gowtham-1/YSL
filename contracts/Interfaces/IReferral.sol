// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface IReferral{
    function rewardDistribution(address user, uint _reward, uint volume) external returns(uint amount, uint leftAmount);
    function getReferrer(address user) external returns(address);
}