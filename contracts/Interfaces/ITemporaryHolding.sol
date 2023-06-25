// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface ITemporaryHolding {
    function withdrawForBshareReward(address recipient) external returns(uint YSLRewards, uint xYSLRewards, uint bYSLReards);
}