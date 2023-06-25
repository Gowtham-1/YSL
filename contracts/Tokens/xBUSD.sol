// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../Interfaces/IBlacklist.sol";
import "../Interfaces/IWhitelist.sol";
import "../Interfaces/IAdmin.sol";
import "../Interfaces/IEvents.sol";
import "../Interfaces/IReceipt.sol";
import "../Interfaces/IReferral.sol";
/**
    @dev this contract is for xBUSD token.
*/
contract xBUSD is ERC20, AccessControl, Pausable, IEvents, ReentrancyGuard{

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE"); // role byte for minter
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE"); // byte for burner role
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR"); //byte for operator role
    address public BUSD;
    address public pair;

    uint256 public lockTransactionTime = 900 seconds; 
    uint256 public xBUSD_Tax = 1500; //Tax always multiply by 100
    uint256 [] public xBUSD_Tax_Allocation = [1000, 500]; //index-1 => Referer, index-2 => TeamAddress; All index value multiply by 100;
    
    uint durationInpercentage;
    uint public convertedBUSD;
    uint public priceImpactProtection = 10; //Price impact protection of 1%
    uint public epochtimestamp = block.timestamp;
    
    enum Peg {AbovePeg,BelowPeg}
    Peg public peg;
    
    IAdmin public Admin;
    IUniswapV2Router02 public router;
    
    mapping(address => uint256) public restrictTransfer; // last block number when interacted
    mapping(address => uint256) public transactionTimeLimit; // mapping for Users timestamp
    mapping(address => bool) public liquidityPool; //list of LiquidityPool


    constructor(address _admin, address operator)ERC20("xBUSD","xBUSD"){
        Admin = IAdmin(_admin); 
        router = IUniswapV2Router02(Admin.ApeswapRouter());
        BUSD = Admin.BUSD();
        pair = IUniswapV2Factory(IUniswapV2Router02(router).factory()).createPair(address(this), Admin.BUSD());
        _setupRole(OPERATOR_ROLE, operator);
        _setupRole(MINTER_ROLE, operator);
        _setupRole(BURNER_ROLE, operator);
    }

    /**
    @dev modifier for minter role
     */

    modifier _isMinter() {
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");
        _;
    }

     /**
    @dev modifier for burner role
    **/

    modifier _isBurner() {
        require(
            hasRole(BURNER_ROLE, msg.sender),
            "xBUSD: Caller is not a Burner"
        );
        _;
    }

    /**
    @dev modifier for operator role
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
    @dev Function for UnPause by an Operator
    **/
    function unpause() external nonReentrant _isOperator{
        _unpause();
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
    Note only minter role can call 
    @dev mint token called yet compensation limit not reached
    @param account address of receiver
    @param amount amount to mint
     */

    function mint(address account, uint256 amount) external _isAdmin whenNotPaused {
         if(balanceOf(account) == 0){
                transactionTimeLimit[account] = block.timestamp;
            }
        _mint(account, amount);
    }

    /**
    Note only Burner role can call 
    @dev burn token called yet compensation limit not reached
    @param account address of receiver
    @param amount amount from burn
     */

    function burn(address account, uint256 amount) external _isAdmin whenNotPaused {
        _burn(account, amount);
    }

    /**
    Note only admin can call it 
    @dev grant minter role 
    @param _minter address who will get minter role
     */

    function setMinter(address _minter) external _isAdmin {
        require(_minter != address(0), "Null address provided");
        _setupRole(MINTER_ROLE, _minter);
    }

    /**
    Note only admin can call it 
    @dev grant burner role 
    @param _burner address who will get burner role
     */

    function setBurner(address _burner) external _isAdmin {
        require(_burner != address(0), "xBUSD: Null address provided");
        _setupRole(BURNER_ROLE, _burner);
    }


    /**
    Note only admin can call it 
    @dev revoke minter role 
    @param _minter address whose role will revoke
     */

    function removeMinter(address _minter) external _isAdmin {
        require(_minter != address(0), "Null address provided");
        revokeRole(MINTER_ROLE, _minter);
    }
    /**
    @dev check if passing address is contract or not
    @param _addr is the address to check 
     */
 function isContract(address _addr) internal view returns (bool){
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }

    /**
    @dev Function to ensure that Non-WhiteList contract or User can't interact with BYSL.
    @param sender address of Token holder
    @param recipient address of receiver
    **/
    function isContractwhitelist(address sender, address recipient) internal {
        if(isContract(sender)){
            require(IWhitelist(Admin.whitelist()).getAddresses(sender),"xBUSD: No external interact");
        }
        if(isContract(recipient)){
            require(IWhitelist(Admin.whitelist()).getAddresses(recipient),"xBUSD: No external interact");
        }
    }

     /**
    @dev set tax and allocation points

    @param _tax total tax
    @param allocationTax array of allocation point

    Note allocation point should be equal to tax
        all the values should enter with 100 cofficient
        only admin can call 
     */
    function setxBUSDAndAllocationTax(uint _tax, uint[] memory allocationTax) external _isAdmin {
        require(_tax > 0, 'xBUSD: invalid tax');
        require(allocationTax.length > 0, 'xBUSD: invalid AllocationTax');
        uint total;
        for(uint i; i < allocationTax.length; i++) {
            total += allocationTax[i];
        }     
        require(total == _tax, 'xBUSD: incorrect inputs');
        emit TaxAllocation("xBUSDToken", address(this), xBUSD_Tax, _tax, xBUSD_Tax_Allocation, allocationTax,block.number,block.timestamp);
        xBUSD_Tax = _tax;
        xBUSD_Tax_Allocation = allocationTax;
    }
    
    /**
    setter function for Price Impact Protection
     */

    function setPriceImpactProtection(uint value) public _isAdmin {
        require(value > 0,"xBUSDToken: Value can't be zero");
        emit SetterForUint("xBUSDToken",address(this),priceImpactProtection,value,block.number,block.timestamp);
        priceImpactProtection = value;
    }


/**
    @dev Function for Block restriction to ensure that User can't interact within same block
    @param user address of User or sender
    */

    function blockRestriction(address user) internal {
        require(restrictTransfer[user] != block.number,"xBUSD: blockRestriction");
        restrictTransfer[user] = block.number;
    }

/**
    @dev setter function for LockTransactionTime
     */
    function setLockTransactionTime(uint time) public _isAdmin {
        require(time > 0, 'xBUSD: LockTransactionTime  for xBUSD can not be zero');
        emit SetterForUint("xBUSDToken",address(this),lockTransactionTime,time,block.number,block.timestamp);
        lockTransactionTime = time;
    }

    function setLiquidityPool(address _lp, bool _value) external _isAdmin{
        liquidityPool[_lp] = _value;
    }

    function pegReturn() public returns(uint){
        if(lastPeg() == Peg(0))
        {return 0;}
        else 
        {return 1;}
    }

/**
    @dev Function for swapping 2 tokens
    @param amount ,amount to be swapped 
    @param path, as an array 
    @param sendTo, sendTo address
 */
    function swap(uint256 amount, address[] memory path, address sendTo) internal nonReentrant returns(uint256){            
            convertedBUSD = IUniswapV2Router02(router).swapExactTokensForTokens( 
            amount,
            0,
            path,
            sendTo,
            block.timestamp + 1000
            )[path.length - 1];
            return convertedBUSD;
    }
    /**
    @dev override transfer function to restrict and apply tax on transfer 
     */

    function tax(uint256 taxAmount, address sender) internal 
    {
        address[] memory path = new address[](2);
            path[0] = address(this);
            path[1] = BUSD;
            IERC20(address(this)).approve(address(router), taxAmount);
            if(Admin.buyBackActivation()){
                if(Admin.buyBackActivationEpoch() + (3 * Admin.epochDuration()) < block.timestamp) {
                    (10**18 + 10**16) <= IUniswapV2Router02(Admin.ApeswapRouter()).getAmountsOut(10**18,path)[1] ? 
                        Admin.setBuyBackActivation(false) : Admin.setBuyBackActivationEpoch();
                }
               address[] memory path1 = new address[](3);
                path1[0] = address(this);
                path1[1] = Admin.BUSD();
                path1[2] = Admin.USDy();
                IUniswapV2Router02(Admin.ApeswapRouter()).swapExactTokensForTokens( 
                    (taxAmount * xBUSD_Tax_Allocation[0]) / xBUSD_Tax,
                    0,
                    path1,
                    address(this),
                    block.timestamp + 1000
                    )[path1.length - 1];
                swap((balanceOf(address(this)) * xBUSD_Tax_Allocation[1])/xBUSD_Tax, path, Admin.TeamAddress());
                IReceipt(Admin.USDy()).burn(address(this),IReceipt(Admin.USDy()).balanceOf(address(this)));
            } else {
                if(Admin.buyBackActivationEpoch() + (3 * Admin.epochDuration()) < block.timestamp &&
                    (10**18 + 10**16) > IUniswapV2Router02(Admin.ApeswapRouter()).getAmountsOut(10**18, path)[1]) {
                        Admin.setBuyBackActivation(true);
                }
                uint amount = IUniswapV2Router02(router).getAmountsOut((taxAmount * xBUSD_Tax_Allocation[0]) / xBUSD_Tax,path)[1];
                (uint _amount, uint leftAmount) = IReferral(Admin.Refferal()).rewardDistribution(sender, IERC20(BUSD).balanceOf((address(this))),amount);
                uint senderAmount;
                uint refferalAmount;
                uint teamAmount;
                if(_amount != 0){
                    senderAmount = (_amount *1) / 100;
                    refferalAmount = (_amount * 9) / 100;
                }
                else{
                    teamAmount = (_amount * 1) / 100;
                }
                if(leftAmount != 0){
                    teamAmount += leftAmount;
                }
                if(senderAmount > 0){
                swap((taxAmount * xBUSD_Tax_Allocation[1] * senderAmount) / 
                    (xBUSD_Tax * (senderAmount + refferalAmount + teamAmount)), path, msg.sender);
                }
                if(refferalAmount > 0){
                swap((taxAmount * xBUSD_Tax_Allocation[1] * refferalAmount) / 
                    (xBUSD_Tax * (senderAmount + refferalAmount + teamAmount)), path, Admin.Refferal());
                }
                if(teamAmount > 0){
                swap((taxAmount * xBUSD_Tax_Allocation[1] * teamAmount) / 
                    (xBUSD_Tax * (senderAmount + refferalAmount + teamAmount)), path, Admin.TeamAddress());
                }
                swap((taxAmount * xBUSD_Tax_Allocation[1]) / xBUSD_Tax, path, Admin.TeamAddress());
            }
    }

/**
    @dev override transfer function to make entity token
     */
    function _transfer(address sender, address recipient, uint256 amount) internal virtual override {

        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");
        require(!(IBlacklist(Admin.Blacklist()).getAddresses(sender)), "xBUSD: address is Blacklisted");
        require(!(IBlacklist(Admin.Blacklist()).getAddresses(recipient)), "xBUSD: address is Blacklisted");

        isContractwhitelist(sender, recipient);

        if(balanceOf(recipient) == 0){
                transactionTimeLimit[recipient] = block.timestamp;
            }
        if(liquidityPool[sender] || liquidityPool[recipient]){
            address user =  liquidityPool[sender] ? recipient : sender;

            if(IWhitelist(Admin.whitelist()).getAddressesOfSwap(user)){

                super._transfer(sender, recipient, amount);
            }
        else {
            if( liquidityPool[sender]){
                    uint taxAmount = (amount * xBUSD_Tax)/ 10000;
                    super._transfer(sender, address(this), taxAmount);
                    amount -= taxAmount;
                    super._transfer(sender, recipient, amount);
                    tax(taxAmount,sender);
                    transactionTimeLimit[user] = block.timestamp;
                    blockRestriction(user);

                }else {
                    uint taxAmount = (amount * xBUSD_Tax)/ 10000;
                    super._transfer(sender, address(this), taxAmount);
                    amount -= taxAmount;
                    uint256 prevAmount = balanceOf(recipient); 
                    super._transfer(sender, recipient, amount);
                    uint256 currentAmount = balanceOf(recipient);   
                    require(prevAmount + ((prevAmount * priceImpactProtection)/1000) >= currentAmount, "xBUSD: priceImpactProtection");
                    tax(taxAmount,sender);
                    DurationPeriod(sender,amount);
                    transactionTimeLimit[user] = block.timestamp;
                    blockRestriction(user);
                }
            }
        } 
        else if(IWhitelist(Admin.whitelist()).getAddresses(sender) || IWhitelist(Admin.whitelist()).getAddresses(recipient)){
                super._transfer(sender, recipient, amount);
        }
        else {
                uint taxAmount = (amount * xBUSD_Tax)/10000;
                super._transfer(sender, address(this), taxAmount);
                amount -= taxAmount;
                tax(taxAmount,sender);
                DurationPeriod(sender,amount);
                blockRestriction(sender);
                transactionTimeLimit[sender] = block.timestamp;             
                super._transfer(sender, recipient, amount);  
            }
    }

    /**
        @dev Function to get the status of LastPeg
     */
    function currentPeg() public _isOperator returns(Peg){
        uint amountxBUSD;
        uint amountBUSD;
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = Admin.BUSD();
        (amountxBUSD,amountBUSD,) = IUniswapV2Pair(IUniswapV2Factory(IUniswapV2Router02(router).factory()).getPair(address(this), Admin.BUSD())).getReserves();
        if (amountBUSD > amountxBUSD){
            peg = Peg(0);
        }
        else {
            peg = Peg(1);
        }
        return(peg);
    }

    /**
        @dev Function to get the status of CurrentPeg
     */
    function lastPeg() public view returns(Peg){
        return (peg);
    }

    /**
        @dev Function to get the epochTime i.e the time when Peg status is switched.
     */
    function epochTime ()external _isAdmin{
        if(lastPeg() != currentPeg()){
            epochtimestamp = block.timestamp;
        }
    }

    /**
        @dev Function is used to calculate the duration Period for Reward in Percentage
        @param _user, user address 
     */
    function DurationPeriod(address _user,uint amount) public {
        uint Max;
        Max = (epochtimestamp > transactionTimeLimit[_user]) ? epochtimestamp : transactionTimeLimit[_user];
        require (amount <= (balanceOf(_user)* (block.timestamp - Max) / 8640000),"xBUSD :Exit rate limit exceeds ");

        //todo percentage in days will be 8640000;
    }

}