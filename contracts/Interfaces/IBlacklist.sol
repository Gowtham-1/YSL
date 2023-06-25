// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface IBlacklist {
    function getAddresses(address _protocol) external view returns(bool);
    function addBlacklist(address[] calldata _protocol) external;
    function revokeBlacklist(address[] calldata _protocol) external;
}