// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../Interfaces/IBlacklist.sol";
import "../Interfaces/IWhitelist.sol";
import "../Interfaces/IAdmin.sol";
import "../Interfaces/IEvents.sol";
/**
@dev this contract is for bYSL token.
 */
contract bYSL is ERC20, Pausable, AccessControl, IEvents, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE"); // byte for minter role
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE"); // byte for burner role
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR"); //byte for operator role

    uint256 public backpriceRatio;
    uint256 public ProtocolPrice; // Protocol price of bysl token.
    uint256 public lockTransactionTime = 24 hours;//Transaction Lock time will be 24 hours only.
    //For testing 1 day = 10s; for deployment 1 day = 86400s;//
    mapping(address => uint256) public restrictTransfer; // last block number when interacted
    mapping(address => uint) public transactionTimeLimit;
    mapping(address => bool) public _routerBlacklist;

    IAdmin public Admin; //admin address

    constructor(
        address _admin
    ) ERC20("bYSL", "bYSL") {
        Admin = IAdmin(_admin);  
        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(BURNER_ROLE, _msgSender());
        ProtocolPrice = ((IERC20(Admin.BUSD()).balanceOf(Admin.Treasury()) + IERC20(Admin.BUSD()).balanceOf(Admin.POL()))) / 10000;
        ProtocolPrice = ProtocolPrice < 10 **18 ? 10 ** 18 : ProtocolPrice;
    }

    /**
    @dev modifier for minter role
    **/

    modifier _isMinter() {
        require(
            hasRole(MINTER_ROLE, msg.sender),
            "bYSL: Caller is not a minter"
        );
        _;
    }

    /**
    @dev modifier for burner role
    **/

    modifier _isBurner() {
        require(
            hasRole(BURNER_ROLE, msg.sender),
            "bYSL: Caller is not a Burner"
        );
        _;
    }

    /**
    @dev modifier for Operator role
    **/

    modifier _isOperator(){
        require(Admin.hasRole(OPERATOR_ROLE, msg.sender));
        _;
    }

    /**
    @dev modifier for Admin role
    **/

    modifier _isAdmin(){
        require(Admin.hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        _;
    }

  /**
    @dev Function for Pause by an Operator
    **/

     function pause() external nonReentrant _isOperator{
        _pause();
    }

    /**
    Note only minter role can call 
    @dev Mint token function
    @param account address of receiver
    @param amount amount to mint
    
    **/

    function mint(address account, uint256 amount)
        external 
        nonReentrant
        _isMinter
        whenNotPaused
    { 
         if(balanceOf(account) == 0){
                transactionTimeLimit[account] = block.timestamp;
            }
        _mint(account, amount);
    }
    /**
    @dev Function for UnPause by an Operator
    **/
    function unpause() external _isOperator{
        _unpause();
    }
/**
    Note only minter role can call 
    @dev burn token function
    @param account address of receiver
    @param amount amount for burn
     */
    function burn(address account, uint256 amount)
        external
        nonReentrant
        _isBurner
        whenNotPaused
    {
        _burn(account, amount);
    }

    /**
    Note only admin can call it 
    @dev grant minter role 
    @param _minter address who will get minter role
     */

    function setMinter(address _minter) external _isAdmin {
        require(_minter != address(0), "bYSL: Null address provided");
        _setupRole(MINTER_ROLE, _minter);
    }

    /*
    Note only admin can call it 
    @dev grant burner role 
    @param _burner address who will get burner role
     */

    function setBurner(address _burner) external _isAdmin {
        require(_burner != address(0), "bYSL: Null address provided");
        _setupRole(BURNER_ROLE, _burner);
    }

    /**
    Note only admin can call it 
    @dev revoke minter role 
    @param _minter address whose role will revoke
     */

    function removeMinter(address _minter)
        external
        _isAdmin
    {
        require(_minter != address(0), "bYSL: Null address provided");
        revokeRole(MINTER_ROLE, _minter);
    }

    /**
    @dev status for minter
    @param _address address to check for minter role
     */

    function isMinter(address _address) external view returns (bool result) {
        result = hasRole(MINTER_ROLE, _address);
        return result;
    }

    /**
    @dev status for burner
    @param _address address to check for burner role
     */

    function isBurner(address _address) external view returns (bool result) {
        result = hasRole(BURNER_ROLE, _address);
        return result;
    }


    
    /**
    @dev setter function for LockTransactionTime
    @param time transaction time to be locked 
     */
     
    function setLockTransactionTime(uint time) public  _isAdmin { 
        emit SetterForUint("bYSLToken", address(this), lockTransactionTime, time,block.number,block.timestamp);
        lockTransactionTime = time;
    }

    function setBlacklistedRouter(address router) public _isAdmin{
        require(router != address(0),"Invalid Router Address");
        _routerBlacklist[router] = true;
    }

    /**
    @dev Function to return the Protocol Price
    **/

    function protocolPrice() public view returns(uint)  {
        return ProtocolPrice;
    }

    function calculateProtocolPrice() external returns(uint){
        ProtocolPrice = ((IERC20(Admin.BUSD()).balanceOf(Admin.Treasury()) + IERC20(Admin.BUSD()).balanceOf(Admin.POL()))) / 10000;
        ProtocolPrice = ProtocolPrice < 10 **18 ? 10 ** 18 : ProtocolPrice;
        return(ProtocolPrice);
    }

    /**
    @dev Function Calculates Backed Price and returns the same
    **/
    function backedPrice() public view returns(uint256){
        return(ProtocolPrice * backpriceRatio /100);
    }

    function setBackPriceRatio(uint ratio) public _isAdmin{
        require(ratio != 0,"bYSL: can't be zero");
        backpriceRatio = ratio;
    }
    
  

    /**
    @dev override transfer function from and to whitelist contract
     */

    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal virtual override nonReentrant {
        require(!(IBlacklist(Admin.Blacklist()).getAddresses(sender)), "bYSL: address is Blacklisted");
        require(!(IBlacklist(Admin.Blacklist()).getAddresses(recipient)), "bYSL: address is Blacklisted");
        require(_routerBlacklist[sender] == false || _routerBlacklist[recipient] == false,"Routers can't interact");
        isWhitelist(sender,recipient);
        if(!IWhitelist(Admin.whitelist()).getAddresses(sender) && !IWhitelist(Admin.whitelist()).getAddresses(recipient))
        {
            blockRestriction(sender);
            transactionTimelimit24hrs(sender);
        }
        if(balanceOf(recipient) == 0){
                transactionTimeLimit[recipient] = block.timestamp;
            }
        super._transfer(sender, recipient, amount);  

        ProtocolPrice = ((IERC20(Admin.BUSD()).balanceOf(Admin.Treasury()) + IERC20(Admin.BUSD()).balanceOf(Admin.POL()))) / 10000;
        ProtocolPrice = ProtocolPrice < 10 **18 ? 10 ** 18 : ProtocolPrice;
    }

    /**
    @dev Function for Block restriction to ensure that User can't interact within same block
    @param sender address of User
    **/

    function blockRestriction(address sender) internal  {
        require(restrictTransfer[sender] != block.number,"bYSL: you cann't interact in same block");
         restrictTransfer[sender] = block.number;
    }

    /**
    @dev Function to ensure that Non-WhiteList contract or User can't interact with BYSL.
    @param sender address of Token holder
    @param recipient address of receiver
    **/

    function isWhitelist(address sender,address recipient) internal {
        if(isContract(sender)){
            require(IWhitelist(Admin.whitelist()).getAddresses(sender),"bYSL: No external contract interact with bYSL");
        }
        if(isContract(recipient)){
            require(IWhitelist(Admin.whitelist()).getAddresses(recipient),"bYSL: No external contract interact with bYSL");
        }
    }

    /**
    @dev TransactionTimelimit24hrs, ensures that User can made only one transaction within 24hrs. either deposit or withdraw.
    @param sender address of User
    **/

    function transactionTimelimit24hrs (address sender) internal {
         require(transactionTimeLimit[sender] + lockTransactionTime <= block.timestamp,
        "bYSL: transactionTimeLimit is greater than current time"); 
        transactionTimeLimit[sender] = block.timestamp;
    }

    /**
    @dev TransactionTimelimit24hrs, ensures that User can made only one transaction within 24hrs. either deposit or withdraw.
    @param sender address of User
    **/
    function setTransactionLimit(address sender) external {
        require(Admin.swapPage() == msg.sender || Admin.POL() == msg.sender,"bYSL: don't have access");
        require(transactionTimeLimit[sender] + lockTransactionTime <= block.timestamp,
        "bYSL: transactionTimeLimit is greater than current time"); 
        transactionTimeLimit[sender] = block.timestamp;
    }

    

    /**
    @dev To verify contract address
    @param _addr contract address as parameter
    */

    function isContract(address _addr) internal view returns (bool) {
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }

    /**
    @dev Pause mint and burn functionality 
    **/

    function _pause() internal virtual override {
        super._pause();
    }
    
      
}
