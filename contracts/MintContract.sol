// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "contracts/Tokens/TestBUSD.sol";
import "contracts/Interfaces/IReceipt.sol";

contract MintContract is Initializable{
address DAI;
address USDC;
address USDT;
address BUSD;
mapping(address => uint256) public UserTimestamp;
modifier perDayLimit(){
        require(block.timestamp > UserTimestamp[msg.sender] + 24 hours ,"Your limit reached per today");
        _;
        UserTimestamp[msg.sender] = block.timestamp;
    }

function initialize(address _BUSD, address _DAI, address _USDC, address _USDT) public initializer{
    BUSD = _BUSD;
    DAI = _DAI;
    USDC = _USDC;
    USDT = _USDT;
}

function Mint() public perDayLimit{
    TestBUSD(payable(BUSD)).transfer(msg.sender,10000 * 10 ** 18);
    IReceipt(DAI).mint(msg.sender,10000 * 10 ** 18);
    IReceipt(USDC).mint(msg.sender,10000 * 10 ** 18);
    IReceipt(USDT).mint(msg.sender,10000 * 10 ** 18);
}



}