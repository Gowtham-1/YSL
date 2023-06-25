// SPDX-License-Identifier: MIT

import "./IBEP20.sol";
pragma solidity 0.8.7;

interface IPancakeMaster {
    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
    }
    function add(uint256 _allocPoint, IBEP20 _lpToken, bool _withUpdate) external;

    function deposit(uint256 id, uint256 amount) external;

    function withdraw(uint256 poolId, uint256 amount) external;

    function userInfo(uint256 id, address _user) external view returns (UserInfo memory);

    function enterStaking(uint256 _amount) external;

    function leaveStaking(uint256 _amount) external;

    function pendingCake(uint256 _pid, address _user) external view returns (uint256);
}
