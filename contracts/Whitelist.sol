// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./Interfaces/IAdmin.sol";

/**
@dev this contract is for whitelist contact addresses and user addresses for protocol
 */

contract WhiteList is Initializable{

    IAdmin public  Admin; 

    mapping(address => bool) public addresses; // contract addresses => bool
    mapping(address => bool) public addressesOfSwap; // contract addresses => bool

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR"); //byte for operator role

    
    /**
    @dev one time called while deploying

    @param _admin address of admin contract 
     */
    function initialize(address _admin) public initializer{
        Admin = IAdmin(_admin);
    }

    modifier _isOperator(){
        require(Admin.hasRole(OPERATOR_ROLE, msg.sender));
        _;
    }

    

    /**
    @dev get contract address whitlisted or not

    @param _protocol address of contract
     */
    function getAddresses(address _protocol) public view returns(bool){
        return(addresses[_protocol]);
    }

    /**
    @dev get contract address whitlisted or not

    @param _protocol address of contract
     */

    function getAddressesOfSwap(address _protocol) public view returns(bool){
        return(addressesOfSwap[_protocol]);
    }
    /**
    @dev function to add contract in whitelist

    @param _protocol is array of address to whitelist

    Note only admin can call
     */
    function addWhiteList(address[] calldata _protocol) external _isOperator{
        for(uint i = 0; i < _protocol.length; i++){
            require(_protocol[i] != address(0),"Whitelist: Zero address");
            addresses[_protocol[i]] = true;
        }  
    }

    /**
    @dev function to remove contract address from whitlist

    @param _protocol array of address to remove

    Note only admin can call
     */
    function revokeWhiteList(address[] calldata _protocol) external _isOperator{
        for(uint i = 0; i < _protocol.length; i++){
            require(addresses[_protocol[i]],"WhiteList: not whitelisted");
            addresses[_protocol[i]] = false;
        }  
    }
    
    /**
    @dev function to add contract in whitelist

    @param _protocol is array of address to whitelist

    Note only admin can call
     */
    function addWhiteListForSwap(address[] calldata _protocol) external _isOperator{
        for(uint i = 0; i < _protocol.length; i++){
            addressesOfSwap[_protocol[i]] = true;
        }  
    }

    /**
    @dev function to remove contract address from whitlist

    @param _protocol array of address to remove

    Note only admin can call
     */
    function revokeWhiteListOfSwap(address[] calldata _protocol) external _isOperator{
        for(uint i = 0; i < _protocol.length; i++){
            require(addressesOfSwap[_protocol[i]],"WhiteList: not whitelisted");
            addressesOfSwap[_protocol[i]] = false;
        }  
    }
}