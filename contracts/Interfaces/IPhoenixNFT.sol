// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
interface IPhoenixNFT is IERC721{
    enum Nft_status {
        INACTIVE,
        ACTIVE
    }
    function expiryTime() external view returns(uint256);
    function MintTimestamp(uint256 tokenid) external view returns(uint256);
    function Winner(uint256 tokenid) external view returns(uint256);
    function Won(address user) external view returns(uint256);
}