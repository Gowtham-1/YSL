// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../Interfaces/IBlacklist.sol";
import "../Interfaces/IWhitelist.sol";
import "../Interfaces/IAdmin.sol";
import "../Interfaces/IEvents.sol";
import "../Interfaces/IReceipt.sol";
import "../Interfaces/ISingleVault.sol";
import "./Receipt.sol";

//todo: At the time of final deployment change the router, factory and token addresses, compensationlimit, DAYS_IN_SECONDS

    /**
    @dev this contract is for xYSL token.
    */

contract xYSL is Receipt, Pausable, IEvents {

    IERC20 public oldXYSL; // oldXysl token address


    address router; // router address
    address BUSD;
    uint256 public compensationLimit; //Limit for mint xYSL token i.e. set in constructor
    uint256 public deploymentTime; // Time when the contract deploys
    address public burn1; // Burn token address for old xYSL
    address public burn2; // Burn token address for old xYSL
    uint256 public xYSLMigrateDaysLimit ; // Days limit to migrate old xYSL in to new xYSL token
    uint256 public xYSL_Tax ; //Tax always multiply by 100
    uint256 public priceImpactProtection ; // Price Impact Protection of xYSL
    uint256 public lockTransactionTime ; 
    uint256[] public xYSL_Tax_Allocation;//index-1 => TemporaryHolding contract, index-2 => xYSL Burn address, index-3 => Treasury; All index value multiply by 100;
    uint256 [] public xYSL_BuyBack; //[buyBack and burn, team address]

    mapping(address => uint256) public restrictTransfer; // last block number when interacted
    mapping(address => uint) public transactionTimeLimit;
    mapping(address => bool) public liquidityPool; //list of LiquidityPool



    function initialise(
        address _admin,
        address _oldXYSL
        ) external {
        oldXYSL = IERC20(_oldXYSL);
        deploymentTime = block.timestamp;
        initialize(_admin, IAdmin(_admin).operator(), "xYSL", "xYSL");
        router = Admin.ApeswapRouter();
        burn1=0x000000000000000000000000000000000000dEaD;
        burn2=0x0000000000000000000000000000000000000000;
        xYSLMigrateDaysLimit = 1500;
        xYSL_Tax = 1500;
        priceImpactProtection = 10;
        lockTransactionTime = 86400;
        xYSL_Tax_Allocation = [500, 500, 500];
        xYSL_BuyBack = [7500,2500];
        BUSD =Admin.BUSD();
        compensationLimit = (oldXYSL.totalSupply() - (oldXYSL.balanceOf(burn1)+oldXYSL.balanceOf(burn2))); // Calculate compensation limit using total supply of old xYSL minus  sum of burn tokens from burn address
        _setupRole(OPERATOR_ROLE, _msgSender());
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
    Note only minter role can call 
    @dev mint token called yet compensation limit not reached
    @param account address of receiver
    @param amount amount to mint
     */

    function mint(address account, uint256 amount) external override onlyRole(OPERATOR_ROLE) whenNotPaused {
        if(balanceOf(account) == 0){
                transactionTimeLimit[account] = block.timestamp;
        }
        _mint(account, amount);
    }

   /**
    Note only minter role can call 
    @dev burn token called yet compensation limit not reached
    @param account address of receiver
    @param amount amount from burn
     */

    function burn(address account, uint256 amount) external override onlyRole(OPERATOR_ROLE) whenNotPaused {
        _burn(account, amount);
    }


    /**
    Note User will call migrate only if xYSL days limit not reaches xYSLMigrateDaysLimit or total supply not reaches compensation limit
    @dev user will call it for migrate old xYSL to xYSL token
    */
    function migrate() external nonReentrant {
        require(totalSupply() < compensationLimit,"xYSL: migrate: MINTING LIMIT EXCEEDED");
        uint day = (block.timestamp - deploymentTime)/86400;
        require(day <= xYSLMigrateDaysLimit,"xYSL: Days limit exceeded");
        uint amount= oldXYSL.balanceOf(msg.sender);
        oldXYSL.transferFrom(msg.sender,address(this),amount);
        _mint(msg.sender,amount);
        if(totalSupply() >= compensationLimit){
            _pause();
        }
    }

    /**
    Note only admin role can call 
    @dev It is called to swap old xYSL in to BUSD and send it to team address
     */
    function swapOldXYSL() external nonReentrant _isAdmin {
        uint day = (block.timestamp - deploymentTime)/86400;
        require(day > xYSLMigrateDaysLimit,"xYSL: Days threshold not reached yet");
        address[] memory path = new address[](2);
        path[0] = address(oldXYSL);
        path[1] =BUSD;
        oldXYSL.approve(router, oldXYSL.balanceOf(address(this)));
        IUniswapV2Router02(router).swapExactTokensForTokens(oldXYSL.balanceOf(address(this)),0,path,Admin.TeamAddress(),block.timestamp+1000)[1];
    }

    /**
    Note only admin role can call 
    @dev It is called to set old xYSL migrate days limit
    @param _xYSLMigrateDaysLimit Days limit for migrate old xYSL in to new xYSL token
     */

    function setMigrateDaysLimit(uint _xYSLMigrateDaysLimit) external _isAdmin{
        require(_xYSLMigrateDaysLimit > 0, 'xYSL: _xYSLMigrateDaysLimit must be greater than zero');
        emit SetterForUint("xYSLToken",address(this),xYSLMigrateDaysLimit,_xYSLMigrateDaysLimit,block.number,block.timestamp);
        xYSLMigrateDaysLimit= _xYSLMigrateDaysLimit;
    }

    /**
    Note allocation point should be equal to tax
        all the values should enter with 100 cofficient
        only admin can call 
    @dev set tax and allocation points
    @param _tax total tax
    @param allocationTax array of allocation point
     */

    function setxYSLAndAllocationTax(
        uint256 _tax,
        uint256[] memory allocationTax
    ) external _isAdmin {
        require(_tax > 0, "xYSL: Tax should be greater than zero");
        require(
            allocationTax.length > 0,
            "xYSL: AllocationTax should not be empty"
        );
        uint256 total;
        for (uint256 i; i < allocationTax.length; i++) {
            total += allocationTax[i];
        }
        require(total == _tax, "xYSL: Tax not equal to sum of allocation tax");
        emit TaxAllocation("xYSLToken", address(this), xYSL_Tax, _tax, xYSL_Tax_Allocation, allocationTax,block.number,block.timestamp);
        xYSL_Tax = _tax;
        xYSL_Tax_Allocation = allocationTax;
    }

    /**
    @dev setter function for Price Impact Protection
     */

    function setPriceImpactProtection(uint value) public _isAdmin {
        require(value > 0,"xYSLToken: Value can't be zero");
        emit SetterForUint("xYSLToken",address(this),priceImpactProtection,value,block.number,block.timestamp);
        priceImpactProtection = value;
    }

    /**
    @dev setter function for LockTransactionTime
     */

    function setLockTransactionTime(uint time) public _isAdmin {
        require(time > 0, 'xYSL: LockTransactionTime  for xYSL can not be zero');
        emit SetterForUint("xYSLToken",address(this),lockTransactionTime,time,block.number,block.timestamp);
        lockTransactionTime = time;
    }

    function setLiquidityPool(address _lp, bool _value) external _isAdmin{
        liquidityPool[_lp] = _value;
    }

    function setxYSL_BuyBack(uint[] memory _xYSLBuyBack) external _isAdmin {
        xYSL_BuyBack = _xYSLBuyBack;
    }

    function setRouter(address _router) external _isAdmin{
        require(_router != address(0),"xYSL: invalid data");
        router = _router;
    }

    /**
    @dev override transfer function to restrict and apply tax on transfer 
     */

    function _transfer(
        address sender, 
        address recipient, 
        uint256 amount
    ) internal virtual override {

        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");
        require(!(IBlacklist(Admin.Blacklist()).getAddresses(sender)), "xYSL: address is Blacklisted");
        require(!(IBlacklist(Admin.Blacklist()).getAddresses(recipient)), "xYSL: address is Blacklisted");

        isContractwhitelist(sender, recipient);
        if(balanceOf(recipient) == 0){
                transactionTimeLimit[recipient] = block.timestamp;
            }
        if(liquidityPool[sender] || liquidityPool[recipient]){
            address user = liquidityPool[sender]  ? recipient : sender;
            if(IWhitelist(Admin.whitelist()).getAddressesOfSwap(user)){
                super._transfer(sender, recipient, amount);
            }
            else {
                if(liquidityPool[sender]){
                    uint taxAmount = (amount * xYSL_Tax)/ 10000;
                    super._transfer(sender, address(this), taxAmount);
                    amount -= taxAmount;
                    super._transfer(sender, recipient, amount);                    
                    tax(taxAmount);
                    exitRate(sender, amount);
                    blockRestriction(user);

                }
                else {
                    require(transactionTimeLimit[sender] + lockTransactionTime <= block.timestamp,"xYSL: transactionTimeLimit is greater than current time");
                    uint taxAmount = (amount * xYSL_Tax)/ 10000;
                    super._transfer(sender, address(this), taxAmount);
                    amount -= taxAmount;
                    uint256 prevAmount = balanceOf(recipient); 
                    super._transfer(sender, recipient, amount);
                    uint256 currentAmount = balanceOf(recipient);   
                    require(prevAmount + ((prevAmount * priceImpactProtection)/1000) >= currentAmount, "xYSL: priceImpactProtection");
                    tax(taxAmount);
                    exitRate(sender, amount);
                    transactionTimeLimit[user] = block.timestamp;
                    blockRestriction(user);
                }
            }
        }
        else if(IWhitelist(Admin.whitelist()).getAddresses(sender) || IWhitelist(Admin.whitelist()).getAddresses(recipient)){
            super._transfer(sender, recipient, amount);
        }else{
               require(transactionTimeLimit[sender] + lockTransactionTime <= block.timestamp,"xYSL: transactionTimeLimit is greater than current time");
               uint taxAmount = (amount * xYSL_Tax)/10000;
               super._transfer(sender, address(this), taxAmount);
               amount -= taxAmount;
               tax(taxAmount);
               blockRestriction(sender);
               exitRate(sender, amount);
               transactionTimeLimit[sender] = block.timestamp;
               super._transfer(sender, recipient, amount);
        }
    }

    /**
    @dev Function for Block restriction to ensure that User can't interact within same block
    @param user address of User or sender
    */

    function blockRestriction(address user) internal {
        require(restrictTransfer[user] != block.number,"xYSL: you can't interact in same block");
        restrictTransfer[user] = block.number;
    }

    /**
    @dev Function to ensure that Non-WhiteList contract or User can't interact with BYSL.
    @param sender address of Token holder
    @param recipient address of receiver
    **/

    function isContractwhitelist(address sender, address recipient) view internal {
        if(isContract(sender)){
            require(IWhitelist(Admin.whitelist()).getAddresses(sender),"xYSL: No external contract interact with xYSL");
        }
        if(isContract(recipient)){
            require(IWhitelist(Admin.whitelist()).getAddresses(recipient),"xYSL: No external contract interact with xYSL");
        }
    }

    /**
    @dev Function to get Tax amount 
    @param taxAmount uint for tax amount.
    **/

    function tax( uint256 taxAmount) internal {
        address[] memory path = new address[](2);
            path[0] = Admin.USDy();
            path[1] =BUSD;
            IERC20(address(this)).approve(router, taxAmount); //BSC Testnet pancake router address
            if(Admin.buyBackActivation()){
                if(Admin.buyBackActivationEpoch() + (3 * Admin.epochDuration()) < block.timestamp) {
                        98 * 10**16 <= IUniswapV2Router02(router).getAmountsOut(10**18,path)[1] ? 
                            Admin.setBuyBackActivation(false) : Admin.setBuyBackActivationEpoch();
                    }
                swap(taxAmount * xYSL_BuyBack[1]/10000,Admin.TeamAddress());
                address[] memory path1 = new address[](3);
                path1[0] = address(this);
                path1[1] =BUSD;
                path1[2] = Admin.USDy();
                IUniswapV2Router02(router).swapExactTokensForTokens( 
                    taxAmount * xYSL_BuyBack[0]/10000,
                    0,
                    path1,
                    address(this),
                    block.timestamp + 1000
                    )[path1.length - 1];
                IReceipt(Admin.USDy()).burn(address(this),IReceipt(Admin.USDy()).balanceOf(address(this)));
            } else {
                if(!Admin.buyBackOwnerActivation() && Admin.buyBackActivationEpoch() + (3 * Admin.epochDuration()) < block.timestamp &&
                    98 * 10**16 > IUniswapV2Router02(router).getAmountsOut(10**18,path)[1]) {
                            Admin.setBuyBackActivation(true);
                    }
                _burn(address(this),taxAmount * xYSL_Tax_Allocation[0]/xYSL_Tax);
                taxAmount = taxAmount - (taxAmount * xYSL_Tax_Allocation[0]/xYSL_Tax);
                swap((taxAmount * xYSL_Tax_Allocation[1])/(xYSL_Tax - xYSL_Tax_Allocation[0]),Admin.temporaryHolding());
                swap(((taxAmount * xYSL_Tax_Allocation[2])/(xYSL_Tax - xYSL_Tax_Allocation[0])),Admin.Treasury());
                IReceipt(Admin.bYSL()).calculateProtocolPrice();
            }  
    }

    /**
    @dev Function for swapping token for token
    @param amount uint for amount to be swapped.
    @param sendTo address to which swapped token is sent
    **/

    function swap(uint256 amount, address sendTo) internal{
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] =BUSD;
        IUniswapV2Router02(router).swapExactTokensForTokens( 
            amount,
            0,
            path,
            sendTo,
            block.timestamp + 1000
            )[path.length - 1];
    }

    /**
    @dev Function for calculating Exit Rate
    @param sender address of sender.
    @param amount Uint for amount.
    **/

    function exitRate(address sender, uint256 amount) internal view {
        uint newTime = block.timestamp - transactionTimeLimit[sender];
        uint timeInDays = newTime / 86400;
        uint exitRateAmount;
        uint balance = balanceOf(sender);
        if(Admin.xYSLVault() != address(0)){
            if(ISingleVault(Admin.xYSLVault()).UserDeposit(sender) != 0){
                balance += (ISingleVault(Admin.xYSLVault()).UserDeposit(sender) 
                    * ISingleVault(Admin.xYSLVault()).exchangeRatio()) / 10 ** 18;
            }
        }
        if( timeInDays > 2 ){   
        uint exitRateOfDay = timeInDays - 2 ;
            if(exitRateOfDay >= 100){
                exitRateOfDay = 100;
            }

            exitRateAmount = ((balanceOf(sender) * exitRateOfDay)/100);
        }
        else{
            exitRateAmount = ((balanceOf(sender) * 1)/1000);
            }
        require(exitRateAmount >= amount, "xYSL: Amount is greater than the exitRateAmount");
    }

   

    /**
    @dev To verify contract address
    @param _addr contract address as parameter
    */

    function isContract(address _addr) internal view returns (bool){
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }
}
