// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface IWhitelist {
    function getAddresses(address _protocol) external view returns(bool);
    function getAddressesOfSwap(address _protocol) external view returns(bool);

    function addWhiteList(address[] calldata _protocol) external;
    function addWhiteListForSwap(address[] calldata _protocol) external;

    function revokeWhiteList(address[] calldata _protocol) external;
    function revokeWhiteListOfSwap(address[] calldata _protocol) external;

}