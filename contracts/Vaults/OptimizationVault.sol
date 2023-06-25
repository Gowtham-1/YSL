// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../Interfaces/IEvents.sol";
import "../Interfaces/IAdmin.sol";
import "../Interfaces/IOpt1155.sol";

contract OptimizationVault is  AccessControl, Initializable,ReentrancyGuard, Pausable, IEvents {
    using SafeERC20 for IERC20;

    struct UserDetail {
        uint stakedAmount;
        uint userLevel;
        uint nftExpireTime;
        bool isNftActive;
    }

    bytes32 public constant SETTER_ROLE = keccak256("SETTER_ROLE"); //role byte for setter functions 

    uint public poolId;
    uint public maxLevel;
    uint public exchangeRatio ; //exchange ratio of cake multiplied by cofficient 100
    uint[] public depositFeeAlloc;
    address public depositToken;
    address public recieptToken;

    IAdmin public Admin; //Admin contract address

    mapping(uint => uint) public multiplierLevel; // level => deduction value of deposit (for level 7 it is 50%). User must pass value by multiplying it with 10
    mapping(uint => uint) public depositFeeAllocation; 
    mapping(address => UserDetail) public users;

    modifier _lastExchangeRatio(){
        uint256 lastExchangeRatio = exchangeRatio;
        _;
        if(lastExchangeRatio > exchangeRatio){
            require(lastExchangeRatio > exchangeRatio, "OptVault: exchangeRatio decreased.");        
        }
    }

    function initialize(uint _poolId, address _depositToken, address _recieptToken, address _Admin) external initializer {
        Admin= IAdmin(_Admin);
        poolId = _poolId;
        depositToken = _depositToken;
        recieptToken = _recieptToken;
        maxLevel = 7;
        exchangeRatio = 100;
        depositFeeAlloc = [150, 120, 90, 60, 30, 3]; // coefficient by 10;
        setDepositFeeAllocation(depositFeeAlloc);
    }

    function deductDepositFee(uint amount, uint level) internal {
        uint totalFee = amount * depositFeeAllocation[level];
        IERC20(depositToken).transfer(Admin.Refferal(), (totalFee * 2)/3);
        
   }

    function deposit(address user,uint amount,uint32 _level) external whenNotPaused() {
            require(amount > 0, 'OptimizationVault: Amount must be greater than zero');
            require(_level > 0 && _level <= maxLevel, 'OptimizationVault: Invalid level value');
            IERC20(depositToken).transferFrom(user, address(this), amount);
            if(users[user].stakedAmount == 0 && !users[user].isNftActive) {
                IOpt1155(IAdmin(Admin).Opt1155()).mint(user, poolId, 1);
                users[user].nftExpireTime = 730 hours;
                users[user].isNftActive = true;
            }
            if(users[user].isNftActive && users[user].stakedAmount <= amount) {
                users[user].nftExpireTime = 730 hours;
            }
            users[user].stakedAmount += amount;
            deductDepositFee(amount, _level);
    }

    function setDepositFeeAllocation(uint[] memory feeAllocation) public {
        require(feeAllocation.length == maxLevel, 'OptimizationVault: Array length must be equals to max level');
        for(uint i = 1; i <= feeAllocation.length; i++) {
            depositFeeAllocation[i] = feeAllocation[i-1];
        }
    }
   
    
 }