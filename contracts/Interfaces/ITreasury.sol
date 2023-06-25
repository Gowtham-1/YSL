// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface ITreasury {
    function owner() external;
    function Admin() external;
    function initialize(address _owner,address _admin) external;
    function withdraw(uint256 _amount) external;
    function emergencyWithdraw() external;
    function removeLiquidity(address _lpToken,address _router) external;
    function swapLiquidity(address _lpToken, address _prevRouter, address _newRouter) external;
    function setRebalancerRole(address _rebalancer) external;
    function getLpFromTreasury(address _contractAddress, address _lpToken, uint _amount) external;   
}