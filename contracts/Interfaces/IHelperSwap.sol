// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface IHelperSwap{
    function LPToToken(address lp,  uint _amount) external;
}