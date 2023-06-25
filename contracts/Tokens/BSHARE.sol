// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../Interfaces/IBlacklist.sol";
import "../Interfaces/IWhitelist.sol";
import "../Interfaces/IAdmin.sol";
import "../Interfaces/IEvents.sol";
import "../Interfaces/IReceipt.sol";
import "../Interfaces/ISingleVault.sol";
import "./Receipt.sol";


/**
@dev It is a BShare token.
 */
contract BSHARE is Receipt, Pausable, IEvents {
    address public router;
    uint public lockTransactionTime ;  //For testing 24 hours = 10s; for deployment 24 hours = 86400s;
    uint public priceImpactProtection ; // Multiply coffiecient by 100
    uint256 public BShare_Tax ; //Tax always multiply by 100
    uint [] public BShare_Tax_Allocation ; // index 1 => BShare Vault, index 2 => treasury contract
    uint [] public BShare_BuyBack ; //[buyBack and burn, team address]

    mapping(address => uint) public transactionTimeLimit; // For Last Transaction Time
    mapping (address => uint) public restrictTransfer; // last block number when interacted
    mapping(address => bool) public liquidityPool; //list of LiquidityPool


    function initialise(
        address _admin
        ) external {
        initialize(_admin, IAdmin(_admin).operator(), "BShare", "BShare");
        router = Admin.ApeswapRouter();
        _setupRole(OPERATOR_ROLE, _msgSender());
        lockTransactionTime = 86400;
        priceImpactProtection = 10;
        BShare_Tax = 1500;
        BShare_Tax_Allocation = [1000, 500];
        BShare_BuyBack = [7500,2500]; 
    }



 /**
    Note allocation point should be equal to tax
        all the values should enter with 100 cofficient
        only admin can call 

    @dev set tax and allocation points
    @param _tax total tax
    @param allocationTax array of allocation point
     */
    function setBShareAndAllocationTax(uint _tax, uint[] memory allocationTax) external _isAdmin {
        require(_tax > 0, 'BShare: Tax should be greater than zero');
        require(allocationTax.length > 0, 'BShare: AllocationTax should not be empty');
        uint total;
        for(uint i; i < allocationTax.length; i++) {
            total += allocationTax[i];
        }     
        require(total == _tax, 'BShare: Tax not equal to sum of allocation tax');
        emit TaxAllocation("BshareToken", address(this), BShare_Tax, _tax, BShare_Tax_Allocation, allocationTax,block.number,block.timestamp);
        BShare_Tax = _tax;
        BShare_Tax_Allocation = allocationTax;
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
    @dev Mint token function
    @param account address of receiver
    @param amount amount to mint
    **/

    function mint(address account, uint amount) external override nonReentrant onlyRole(OPERATOR_ROLE) whenNotPaused{
         if(balanceOf(account) == 0){
                transactionTimeLimit[account] = block.timestamp;
            } 
        _mint(account, amount);
    }

    /**
    Note only minter role can call 
    @dev burn token function
    @param account address of receiver
    @param amount amount for burn    
     */

    function burn(address account, uint amount) external override nonReentrant onlyRole(OPERATOR_ROLE) whenNotPaused{
        _burn(account, amount);
    }


    function setRouter(address _router) external _isAdmin {
        require(_router != address(0),"BShare: invalid data");
        router = _router;
    }

    /**
    @dev setter function for Price Impact Protection
    */

    function setPriceImpactProtection(uint value) public _isAdmin {
        require(value > 0, 'Bshare: value for Bshare can not be zero');
        emit SetterForUint("BshareToken",address(this),priceImpactProtection,value,block.number,block.timestamp);
        priceImpactProtection = value;
    }

    /**
    @dev setter function For lockTransactionTime
    */

    function setLockTransactionTime(uint time) public _isAdmin {
        require(time > 0, 'Bshare: value for Bshare can not be zero');
        emit SetterForUint("BshareToken",address(this),lockTransactionTime,time,block.number,block.timestamp);
        lockTransactionTime = time;
    }

    function setLiquidityPool(address _lp, bool _value) external _isAdmin{
        liquidityPool[_lp] = _value;
    }

    function setBShare_BuyBack(uint[] memory _BShareBuyBack) external _isAdmin {
        BShare_BuyBack = _BShareBuyBack;
    }
   

    /**
    @dev override transfer function to make entity token
     */

    function _transfer(
        address sender, 
        address recipient, 
        uint256 amount
    ) internal virtual override {

        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");
        require(!(IBlacklist(Admin.Blacklist()).getAddresses(sender)), "BShare: address is Blacklisted");
        require(!(IBlacklist(Admin.Blacklist()).getAddresses(recipient)), "BShare: address is Blacklisted");
        
        isContractwhitelist(sender, recipient); 
        if(balanceOf(recipient) == 0){
                transactionTimeLimit[recipient] = block.timestamp;
            }

        if(liquidityPool[sender] || liquidityPool [recipient]){
            address user = liquidityPool[sender]  ? recipient : sender; 
            if(IWhitelist(Admin.whitelist()).getAddressesOfSwap(user)){
                super._transfer(sender, recipient, amount);
            }
             else{
                if(liquidityPool[sender]){
                    uint taxAmount = (amount * BShare_Tax)/ 10000;
                    super._transfer(sender, address(this), taxAmount);
                    amount -= taxAmount;
                    super._transfer(sender, recipient, amount);
                    tax(taxAmount);
                    exitRate(sender, amount);
                    blockNumber(user);
          
                 }
                 else {
                    require(transactionTimeLimit[sender] + lockTransactionTime <= block.timestamp,"BShare: transactionTimeLimit is greater than current time");
                    uint taxAmount = (amount * BShare_Tax)/ 10000;
                    super._transfer(sender, address(this), taxAmount);
                    amount -= taxAmount;
                    uint256 prevAmount = balanceOf(recipient); 
                    super._transfer(sender, recipient, amount);
                    uint256 currentAmount = balanceOf(recipient);  
                    require(prevAmount + ((prevAmount * priceImpactProtection)/1000) >= currentAmount, "BShare: priceImpactProtection");  
                    tax(taxAmount);
                    exitRate(sender, amount);
                    transactionTimeLimit[user] = block.timestamp;
                    blockNumber(user);
                }
            }
        }
        else if(IWhitelist(Admin.whitelist()).getAddresses(sender) || IWhitelist(Admin.whitelist()).getAddresses(recipient)){
            super._transfer(sender, recipient, amount);
        }else{
                require(transactionTimeLimit[sender] + lockTransactionTime <= block.timestamp,"BShare: transactionTimeLimit is greater than current time");
                uint taxAmount = (amount * BShare_Tax)/10000;
                super._transfer(sender, address(this), taxAmount);
                amount -= taxAmount;
                tax(taxAmount);
                blockNumber(sender);
                exitRate(sender, amount);  
                transactionTimeLimit[sender] = block.timestamp;             
                super._transfer(sender, recipient, amount);
          
        }
    }

    /**
    @dev Function to ensure that Non-WhiteList contract can't interact with BShare.
    @param sender address of Token holder
    @param recipient address of receiver
    **/

      function isContractwhitelist(address sender, address recipient) view internal {
        if(isContract(sender)){
            require(IWhitelist(Admin.whitelist()).getAddresses(sender),"BShare: No external contract interact with BShare");
        }
        if(isContract(recipient)){
            require(IWhitelist(Admin.whitelist()).getAddresses(recipient),"BShare: No external contract interact with BShare");
        }
    }

    /**
    @dev Function for Block restriction to ensure that User can't interact within same block
    @param user address of User or sender
    */

 function blockNumber(address user) internal {
        require(restrictTransfer[user] != block.number,"BShare: you can't interact in same block");
        restrictTransfer[user] = block.number;
    }

    /**
    @dev Function to get Tax amount 
    @param taxAmount uint for tax amount.
    **/

    function tax( uint256 taxAmount) internal {
        address[] memory path = new address[](2);
            path[0] = Admin.USDy();
            path[1] = Admin.BUSD();
            IERC20(address(this)).approve(router, taxAmount); //BSC Testnet pancake router address
            if(Admin.buyBackActivation()){
                if(Admin.buyBackActivationEpoch() + (3 * Admin.epochDuration()) < block.timestamp) {
                        98 * 10**16 <= IUniswapV2Router02(router).getAmountsOut(10**18,path)[1] ? 
                            Admin.setBuyBackActivation(false) : Admin.setBuyBackActivationEpoch();
                    }
                swap(taxAmount * BShare_BuyBack[1]/ 10000,Admin.TeamAddress());
                address[] memory path1 = new address[](3);
                path1[0] = address(this);
                path1[1] = Admin.BUSD();
                path1[2] = Admin.USDy();
                IUniswapV2Router02(router).swapExactTokensForTokens( 
                    taxAmount * BShare_BuyBack[0]/ 10000,
                    0,
                    path1,
                    address(this),
                    block.timestamp + 1000
                    )[path1.length - 1];
                IReceipt(Admin.USDy()).burn(address(this),IReceipt(Admin.USDy()).balanceOf(address(this)));
            } else {
                if(!Admin.buyBackOwnerActivation() && Admin.buyBackActivationEpoch() + (3 * Admin.epochDuration()) < block.timestamp &&
                    98 * 10**16 > IUniswapV2Router02(router).getAmountsOut(10**18, path)[1]) {
                            Admin.setBuyBackActivation(true);
                }
                swap((taxAmount * BShare_Tax_Allocation[0])/BShare_Tax,Admin.BShareBUSDVault());
                swap(((taxAmount * BShare_Tax_Allocation[1])/(BShare_Tax)),Admin.Treasury());
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
        path[1] = Admin.BUSD();
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

     function exitRate(address sender, uint256 amount) internal view{
        uint newTime = block.timestamp - transactionTimeLimit[sender];
            uint timeInDays = newTime / 86400;
            uint exitRateAmount;
            uint balance = balanceOf(sender);
            if(Admin.BShareVault() != address(0) && timeInDays > 102){
                if(ISingleVault(Admin.BShareVault()).UserDeposit(sender) != 0){
                    balance = (ISingleVault(Admin.BShareVault()).UserDeposit(sender) 
                        * ISingleVault(Admin.BShareVault()).exchangeRatio()) / 10 ** 18;
                    require(amount <= balance, 'BShare exit rate: Transfer amount equal to or less than staked amount');
                } else {
                    require(true, "BShare exit rate: Failed due to zero amount staked in BShare Vault");
                }
            } else {
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
            }
            require(exitRateAmount >= amount, "BShare: Amount is greater than the exitRateAmount");
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