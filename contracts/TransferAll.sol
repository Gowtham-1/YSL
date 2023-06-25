// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./Interfaces/IAdmin.sol";

contract TransferAll is ReentrancyGuard, Initializable{
    using SafeERC20 for IERC20;
    IAdmin Admin;
    mapping(address => mapping(address => uint)) public tokenTransferLimit;
    
    function initialize(address _Admin) external initializer{
        Admin = IAdmin(_Admin);
    }
    function transferToken(address[] memory _token,address recipient) public nonReentrant{
        require(_token.length> 0,"length must be greater than zero");
        for(uint i = 0; i < _token.length; i++){
            require(_token[i] == Admin.YSL() ||_token[i] == Admin.xYSL() || _token[i] == Admin.BShare() || _token[i] == Admin.USDy() || _token[i] == Admin.xBUSD(),"Invalid TOKEN");
            require(tokenTransferLimit[msg.sender][_token[i]] + 24 hours < block.timestamp,"You reached transfer limit for a day");
            IERC20(_token[i]).safeTransferFrom(msg.sender,address(this),IERC20(_token[i]).balanceOf(msg.sender));
            IERC20(_token[i]).safeTransfer(recipient,IERC20(_token[i]).balanceOf(address(this)));
            tokenTransferLimit[msg.sender][_token[i]] = block.timestamp;
        }   
    }

    function userEligiblity(address user,address _token) public view returns(bool){
        if(tokenTransferLimit[user][_token] +24 hours < block.timestamp){
            return true;
        }
        else{
            return false;
        }
    }

}