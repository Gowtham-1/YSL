// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../Interfaces/ITrigger.sol";
import "../Interfaces/IAdmin.sol";
import "../Interfaces/IBYSL.sol";
import "../Interfaces/IProtocolOwnedLiquidity.sol";
//todo hardcode BUSD before live and routers

/**
@dev This contract is used for rebalancing or 
    feeding the POL contract
 */
contract Trigger is AccessControl,ReentrancyGuard,  Initializable {
    using SafeERC20 for IERC20;
    bytes32 constant public POL_ROLE = keccak256("POL_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR"); //byte for minter role
    uint256 reBalancePercentage; // Ratio between treasury and POL and coff is 100.
    uint256 coff; //cofficient for optimise calculation
    IAdmin public  Admin; 
    address public owner;

    uint public interval;  /** Use an interval in seconds and a timestamp to slow execution of Upkeep */
    uint public lastTimeStamp;
    uint256 public lastBackedPrice;
    uint256 public rebalanceStartTime;
    uint256 public BalanceOfPOL;

     modifier _isAdmin() {
        require(Admin.hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        _;
    }

    modifier _isAdminOrOperator(){
        require(msg.sender == Admin.operator() || Admin.hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        _;
    }

    /**
    Note this function set owner as Admin of the contract
     */

    function initialize(
        address _owner,
        address _Admin,
        uint updateInterval
    ) external initializer {
        require(_owner != address(0), 'Trigger: Owner address can not be null');
        Admin= IAdmin(_Admin);
        require(
            Admin.Treasury()!=address(0),
            "Trigger:: initialize: Treasury address can not be null"
        );
        owner = _owner;
        interval = updateInterval;
        lastTimeStamp = block.timestamp;
        _setupRole(DEFAULT_ADMIN_ROLE, _owner);
        _setupRole(DEFAULT_ADMIN_ROLE, address(this));
        _setupRole(POL_ROLE, Admin.POL());
        reBalancePercentage = 2500;
        coff = 100;
        interval = 24 hours;
    }

    /**
    @dev To set Rebalance percentage

    @param _reBalancePercentage array of percentage reBalance

    Note Percentage should be add with cofficient i.e 100
     */
    function setReBalanceValues(uint256 _reBalancePercentage)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(
            _reBalancePercentage != 0,
            "Trigger:: setReBalanceValues: invalid value"
        );
        reBalancePercentage = _reBalancePercentage;
    }
    
/**
    @dev it is a view function, that returns balanceOfPOL as in uint
     */
    function resetReBalanceEpochTime() external onlyRole(POL_ROLE) {
        lastTimeStamp = block.timestamp;
    }


    /**
    @dev this function is used to rebalance the Treasury and POL Contract
    Note Need to call setReBalanceValues first for 
            set reBalancePercentage if want change percentage
        only admin can call 
     */
    function reBalancePool() external nonReentrant _isAdminOrOperator {
        IProtocolOwnedLiquidity(Admin.POL()).setCounter();
        uint256 netBalance;
        lastBackedPrice = IBYSL(Admin.bYSL()).backedPrice();
        uint256 treasuryBalance = IERC20((Admin.BUSD())).balanceOf(Admin.Treasury());
        uint256 POLBalance = IERC20((Admin.BUSD())).balanceOf(Admin.POL());
        uint256 total = treasuryBalance + POLBalance;
        uint256 POLReBalance = ((total * reBalancePercentage) / (100 * coff));
        if (POLBalance < POLReBalance){
            netBalance = POLReBalance - POLBalance;
            ITrigger(Admin.Treasury()).withdraw(netBalance);
        }
        rebalanceStartTime = block.timestamp;
        BalanceOfPOL = IERC20(Admin.BUSD()).balanceOf(Admin.POL());
    }

    /**
    @dev it is a view function, that returns lastbackedprice as in uint
     */
    function LastBackedPrice() public view returns(uint256){
        return lastBackedPrice;
    }
    /**
    @dev it is a view function, that returns balanceOfPOL as in uint
     */
    function balanceOfPOL() public view returns(uint256){
        return BalanceOfPOL;
    }
    /**
    @dev it is a view function, that returns RebalanceStartTime as in uint
     */
    function RebalanceStartTime() public view returns(uint256){
        return rebalanceStartTime;
    }

    function setInterval(uint _interval) public _isAdmin{
       require(_interval != 0,"Value cannot be zero");
        interval = _interval;
    }
}