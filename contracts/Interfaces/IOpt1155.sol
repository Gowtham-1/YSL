// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface IOpt1155 {
    function createNFTForVault(uint256 Id,string memory name) external;
    function mint(address to, uint256 Id, uint256 amount) external;
    function burn(address from,uint256 Id, uint256 amount) external;
}