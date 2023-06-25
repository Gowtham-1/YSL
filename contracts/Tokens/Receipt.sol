// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./My20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../Interfaces/IBlacklist.sol";
import "../Interfaces/IWhitelist.sol";
import "../Interfaces/IAdmin.sol";
import "../Interfaces/IEvents.sol";


/**
@dev this contract is Non-Transferable Token.  
 **/
contract Receipt is My20, AccessControl, ReentrancyGuard, Initializable{
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR"); //byte for operator role
    IAdmin public Admin; //address admin

     /**
    @dev modifier for Admin role
    **/

    modifier _isAdmin(){
        require(Admin.hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        _;
    }
    modifier _isOperator(){
        require(Admin.hasRole(OPERATOR_ROLE, msg.sender));
        _;
    }

    function initialize(address _admin, address operator, string memory name_, string memory symbol_) public initializer{
        Admin = IAdmin(_admin); 
        _name = name_;
        _symbol = symbol_;
        _setupRole(DEFAULT_ADMIN_ROLE, operator);
        _setupRole(OPERATOR_ROLE, operator);
    }


    /** 
    Note only minter role can call 
    @dev Mint token function
    @param to address of receiver
    @param amount amount to be mint
    **/

    function mint (address to , uint amount) external virtual nonReentrant onlyRole(OPERATOR_ROLE){
        _mint(to,amount);

    }

    /**
    @dev grant minter role 

    @param _operator address who will get minter role

    Note only admin can call it 
     */
    function setOperator(address _operator) external _isAdmin {
        require(_operator != address(0), "Null address");
        _setupRole(OPERATOR_ROLE, _operator);
    }

    /** 
    Note only burner role can call 
    @dev Burn token function
    @param from address of receiver
    @param amount amount to be burn
    **/

    function burn (address from, uint amount ) external virtual nonReentrant onlyRole(OPERATOR_ROLE){
        _burn(from , amount);
    }


    /**
    @dev override transfer function 
     */
     
    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal virtual override nonReentrant{
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");
        require(!(IBlacklist(Admin.Blacklist()).getAddresses(sender)), "Receipt: address is Blacklisted");
        require(!(IBlacklist(Admin.Blacklist()).getAddresses(recipient)), "Receipt: address is Blacklisted");
        super._transfer(sender,recipient,amount);
    }   

    function burnBlacklistToken(address _address) public _isAdmin{
        require(IBlacklist(Admin.Blacklist()).getAddresses(_address), "Receipt: address is not Blacklisted");
        _burn(_address , balanceOf(_address));
    }
}