// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface ISmartChefInitalizable {
    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
    }
    function accTokenPerShare() external returns(uint256);
    function userInfo(address _user) external view returns (UserInfo memory);
    function deposit(uint256 _amount) external;
    function withdraw(uint256 _amount) external;
}