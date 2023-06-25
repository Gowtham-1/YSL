// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../Interfaces/IAdmin.sol";
import "../Interfaces/IEvents.sol";


contract Opt1155 is ERC1155, AccessControl,ReentrancyGuard ,IEvents{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    IAdmin public Admin;
    mapping(string => uint256) public NftForVault;
    mapping(uint256 => bool) public TokenExistance;

    constructor(address _Admin) ERC1155("abcd") {
        Admin = IAdmin(_Admin);
        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, Admin.optVaultFactory());
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControl, ERC1155)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
/**
@dev this function create NFT for vault
@param Id tokenID
@param name vault name
 */
    function createNFTForVault(uint256 Id, string memory name) external onlyRole(MINTER_ROLE){
        require(!exists(Id), " The token Id already exists");
        NftForVault[name] = Id;
        TokenExistance[Id] = true;
    }
/**
@dev this function mints NFT
@param to to address
@param Id token id
@param amount amount of NFT's
 */
    function mint(
        address to,
        uint256 Id,
        uint256 amount
    ) external nonReentrant onlyRole(MINTER_ROLE) {
        _mint(to, Id, amount, "");
    }
/**
@dev this function burn's NFT 
@param from from address
@param Id token ID
@param amount amount of NFT to be burnt
 */
    function burn(
        address from,
        uint256 Id,
        uint256 amount
    ) external nonReentrant onlyRole(MINTER_ROLE) {
        _burn(from, Id, amount);
    }
/**
@dev this function returns whether a token ID exists or not
@param number tokenID number
 */
    function exists(uint256 number) public view returns (bool) {
        return TokenExistance[number];
    }
}
