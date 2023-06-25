// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract TestBUSD is ERC20,AccessControl{

    uint256 public AmountperDay;
    uint256 public amountBNB = 10 **17;
    mapping(address => uint256) public UserTimestamp;
    mapping(address => uint256) public UserTimestampBNB;

    constructor(uint amount) ERC20("TBUSD","TBUSD"){
        AmountperDay = amount;
        _setupRole(DEFAULT_ADMIN_ROLE,msg.sender);

    }
    receive() external payable{

    }

    modifier perDayLimit(){
        require(block.timestamp > UserTimestamp[msg.sender] + 24 hours ,"Your limit reached per today");
        _;
        UserTimestamp[msg.sender] = block.timestamp;
    }
    modifier perDayLimitBNB(){
        require(block.timestamp > UserTimestampBNB[msg.sender] + 24 hours ,"Your limit reached per today");
        _;
        UserTimestampBNB[msg.sender] = block.timestamp;
    }

    function mint() public perDayLimit{
        if(hasRole(DEFAULT_ADMIN_ROLE, msg.sender)){
            _mint(msg.sender,100000000000000000000000000000);
        }else{
            _mint(msg.sender,AmountperDay); 
        }
    }
    function setAmountPerDay(uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE){
        AmountperDay = amount;
    }

    function receiveBNB() public payable perDayLimitBNB{
        (bool success,  ) = payable(msg.sender).call{value: amountBNB}("");
        require(success,"Transfer failed");
    } 
}
