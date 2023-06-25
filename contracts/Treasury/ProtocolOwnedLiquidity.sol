// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../Interfaces/IAdmin.sol";
import "../Interfaces/IBYSL.sol";
import "../Interfaces/ITrigger.sol";
import "../Interfaces/IReferral.sol";

/**
@dev this contract it used for swap page to hold BUSD.
 */
contract ProtocolOwnedLiquidity is
    AccessControl,
    Initializable,
    Pausable,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;

    bytes32 public constant WITHDRAW_ROLE = keccak256("WITHDRAW_ROLE"); //role byte for withdrawal
    bytes32 public constant SWAP_ROLE = keccak256("SWAP_ROLE"); //role byte for withdrawal
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE"); //role byte for admin
    uint256 public currentTimestamp;
    uint256 public counter;
    uint256 public level;
    uint256 public maxLEVEL;
    mapping(uint256 => uint256) public LevelOfEpoch;
    IAdmin public Admin;
    uint256 lastbYSLSupply;
    uint256 public lastBackedPricebYSL;


    modifier _isAdmin(){
        require(Admin.hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        _;
    }

    /**
    @dev one time called while deploying.

    Note Need to call setTriggerAddress function once we deployed BUSD_Protocol contract
     */

    function initialize(address _Admin) external initializer {
        Admin = IAdmin(_Admin);
        require(
            Admin.Treasury() != address(0),
            "ProtocolOwnedLiquidity:: initialize: Treasury Address can not be null"
        );
        require(
            Admin.BUSD() != address(0),
            "ProtocolOwnedLiquidity:: initialize: BUSD can not be null"
        );
        require(
            Admin.swapPage() != address(0),
            "ProtocolOwnedLiquidity:: initialize: SwapPage can not be null"
        );
        _setupRole(WITHDRAW_ROLE, Admin.Trigger());
        _setupRole(SWAP_ROLE, Admin.swapPage());
        currentTimestamp = block.timestamp;
        level = 1;
        maxLEVEL = 10;
    }

/**
    @dev function is called to sell bysl 
    @param user address of user
    @param byslAmount selling amount 
 */
    function sellBYSL(address user, uint256 byslAmount)
        external
        nonReentrant
        whenNotPaused
        onlyRole(SWAP_ROLE)
    {
        require(
            byslAmount > 0,
            "ProtocolOwnerLiquidity: byslAmount must be greater than zero"
        );
        uint userBalance = IERC20(Admin.bYSL()).balanceOf(user);
        IERC20(Admin.bYSL()).transferFrom(user, address(this), byslAmount);
        uint noOfDays = (block.timestamp - IBYSL(Admin.bYSL()).transactionTimeLimit(user))/86400;
        uint ratio = noOfDays * 25;
        ratio = ratio > 2500 ? 2500 : ratio;
        uint BUSDAmount;
        IBYSL(Admin.bYSL()).setTransactionLimit(user);
        if((byslAmount * 10000)/userBalance <= ratio){
            BUSDAmount = (byslAmount * IBYSL(Admin.bYSL()).protocolPrice());
        }else{
            BUSDAmount = (byslAmount * IBYSL(Admin.bYSL()).backedPrice());
        }

        uint futureProtocolPrice = IBYSL(Admin.bYSL()).protocolPrice() - (BUSDAmount/10**22);

        if((byslAmount * 10000)/userBalance <= ratio){
            BUSDAmount = (byslAmount * futureProtocolPrice);
        }else{
            BUSDAmount = (byslAmount * (futureProtocolPrice * IBYSL(Admin.bYSL()).backpriceRatio() /100));
        }

        require(((IERC20(Admin.BUSD()).balanceOf(Admin.Treasury()) + 
                IERC20(Admin.BUSD()).balanceOf(Admin.POL())) / 100) >= BUSDAmount / (10 **18),"POL: Liquidity Restriction");
        withdrawBUSD(BUSDAmount/ (10 **18), Admin.swapPage());
        IBYSL(Admin.bYSL()).burn(address(this), byslAmount);
    }
    
    /**
    @dev this function is only called by address having withdraw roles i.e. Trigger and swappage

    @param _receiver address who receive that amount
    @param _amount amount to transfer

    Note Caller is BUSD_Protocol and receiver should be treasury
     */
    function withdrawFromPOL(address _receiver, uint256 _amount)
        public
        whenNotPaused
        onlyRole(WITHDRAW_ROLE)
    {
        require(_amount > 0, "ProtocolOwnedLiquidity: Amount can not be zero");
        require(
            _receiver == Admin.Treasury(),
            "ProtocolOwnedLiquidity: Invalid receiver"
        );
        IERC20(Admin.BUSD()).transfer(Admin.Treasury(), _amount);
        lastbYSLSupply = IBYSL(Admin.bYSL()).totalSupply();
        lastBackedPricebYSL = IBYSL(Admin.bYSL()).backedPrice();
    }


/**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function UnPaused() public _isAdmin {
        _unpause();
    }
/**
     @dev function use to withdraw BUSD
     @param amount amount to be withdrawn 
     @param user address of user 
*/
    function withdrawBUSD(uint256 amount, address user) internal {
        require(
            amount < IERC20(Admin.BUSD()).balanceOf(address(this)),
            "ProtocolOwnedLiquidity : the contract does not have enough balance"
        );
        require(
            counter < (maxLEVEL - 1),
            "ProtocolOwnedLiquidity : Maximum limit reached to reset rebalance time"
        );
        uint256 currentBackedPrice = IBYSL(Admin.bYSL()).backedPrice();
        uint256 modulus = ((block.timestamp -
            ITrigger(Admin.Trigger()).RebalanceStartTime()) /
            ((1440 / maxLEVEL) * 60));
        if (
            currentBackedPrice <
            ITrigger(Admin.Trigger()).LastBackedPrice()
        ) {
            ITrigger(Admin.Trigger()).resetReBalanceEpochTime();
        }
        if (
            amount >
            ((modulus / 10) *
                ITrigger(Admin.Trigger()).balanceOfPOL())
        ) {
            ITrigger(Admin.Trigger()).resetReBalanceEpochTime();
            counter++;
        }
        IERC20(Admin.BUSD()).transfer(user, amount);
    }

    function setCounter() external{
        require(msg.sender == Admin.Trigger(),"Only trigger can call");
        counter = 0;
    }

}