// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./Interfaces/IAdmin.sol";

/**
@dev this contract is for Blacklist contact addresses and user addresses for protocol
 */
contract Blacklist is Initializable{

    IAdmin public  Admin; 

    mapping(address => bool) public addresses; // contract addresses => bool

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR"); //byte for operator role

    
    /**
    @dev one time called while deploying

    @param _admin address of admin contract 
     */
    function initialize(address _admin) public initializer{
        Admin = IAdmin(_admin);
    }
/**
@dev modifier for operator
 */
    modifier _isOperator(){
        require(Admin.hasRole(OPERATOR_ROLE, msg.sender));
        _;
    }

  /**
    @dev function to add contract in Blacklist

    @param _protocol is array of address to Blacklist

    Note only admin can call
     */
    function addBlacklist(address[] calldata _protocol) external _isOperator{
        for(uint i = 0; i < _protocol.length; i++){
            addresses[_protocol[i]] = true;
        }  
    }
    /**
    @dev function to remove contract address from Blacklist

    @param _protocol array of address to remove

    Note only admin can call
     */
    function revokeBlacklist(address[] calldata _protocol) external _isOperator{
        for(uint i = 0; i < _protocol.length; i++){
            require(addresses[_protocol[i]],"Blacklist: not Blacklisted");
            addresses[_protocol[i]] = false;
        }  
    }
    /**
    @dev get contract address Blacklisted or not

    @param _protocol address of contract
     */
    function getAddresses(address _protocol) public view returns(bool){
        return(addresses[_protocol]);
    }
  
}
