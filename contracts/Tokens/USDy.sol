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
import "../Interfaces/IReferral.sol";
import "../Interfaces/ISingleVault.sol";
import "./Receipt.sol";

/**
@dev this contract is for USDy token
 */
contract USDy is Receipt, Pausable, IEvents {
    address public router; //Apeswap router address
    uint public priceImpactProtection ; // Price Impact Protection of USDy
    uint public lockTransactionTime ;
    uint public USDy_Tax ; //Tax always multiply by 100
    uint [] public USDy_Tax_Allocation ; //index-1 => , index-2 =>  All index value multiply by 100;
    uint [] public USDy_BuyBack ; //[buyBack and burn, team address]
    uint protocolPriceUSDY ;
    mapping(address => uint256) public restrictTransfer; // last block number when interacted
    mapping(address => uint) public transactionTimeLimit; // timelimit for transaction
    mapping(address => bool) public liquidityPool; //list of LiquidityPool

    

    function initialise(
        address _admin
        ) external {
        initialize(_admin, IAdmin(_admin).operator(), "USDy", "USDy");
        router = Admin.ApeswapRouter();
        _setupRole(OPERATOR_ROLE, _msgSender());
        protocolPriceUSDY = 1 * 10**18;
        USDy_BuyBack = [3334,3333,3333];
        USDy_Tax_Allocation = [1000, 1000, 1000];
        USDy_Tax = 3000;
        lockTransactionTime = 86400;
        priceImpactProtection = 10;
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
    function mint(address account, uint256 amount) external override nonReentrant onlyRole(OPERATOR_ROLE) whenNotPaused{
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
    function burn(address account, uint256 amount) external override nonReentrant onlyRole(OPERATOR_ROLE) whenNotPaused{
        _burn(account, amount);
    }
    //100 coefficient for the price. Make sure to divide the price with 100 before using it in any kind of mathematical operations
    function mintByPrice() external view returns(uint){
        address[] memory path = new address[](2);
        path[0] = Admin.BUSD();
        path[1] = address(this);
        uint poolPriceUSDy = IUniswapV2Router02(router).getAmountsOut(1*10**18, path)[1];
        if(protocolPriceUSDY < poolPriceUSDy) {
            return poolPriceUSDy;
        } else {
            return protocolPriceUSDY; 
        }
    }

    /**
    Note allocation point should be equal to tax
        all the values should enter with 100 cofficient
        only admin can call 
    @dev set tax and allocation points
    @param _tax total tax
    @param allocationTax array of allocation point
     */

    function setUSDyAndAllocationTax(uint _tax, uint[] memory allocationTax) external _isAdmin {
        require(_tax > 0, 'USDy: Tax should be greater than zero');
        require(allocationTax.length > 0, 'USDy: AllocationTax should not be empty');
        uint total;
        for(uint i; i < allocationTax.length; i++) {
            total += allocationTax[i];
        }     
        require(total == _tax, 'USDy: Tax not equal to sum of allocation tax');
        USDy_Tax = _tax;
        USDy_Tax_Allocation = allocationTax;
    }




    /**
    @dev setter function for Price Impact Protection
     */

    function setPriceImpactProtection(uint value) public _isAdmin {
        require(value != 0,"USDyToken: Value for PriceImpactProtection can't be zero");
        emit SetterForUint("USDyToken", address(this), priceImpactProtection, value,block.number,block.timestamp);
        priceImpactProtection = value;
    }

    /**
    @dev setter function for Lock Transaction Time
    */

    function setLockTransactionTime(uint time) public _isAdmin {
        emit SetterForUint("USDyToken", address(this), lockTransactionTime, time,block.number,block.timestamp);
        lockTransactionTime = time;
    }

    function setLiquidityPool(address _lp, bool _value) external _isAdmin{
        liquidityPool[_lp] = _value;
    }

    function setUSDy_BuyBack(uint[] memory _USDyBuyBack) external _isAdmin {
        USDy_BuyBack = _USDyBuyBack;
    }

    function setRouter(address _router) external _isAdmin{
        require(_router != address(0),"USDy: invalid data");
        router = _router;
    }
   
    /**
    NOTE Need to whitelist USDyVault and Temporary holding contract before transfering USDy
    @dev override transfer function from and to whitelist contract
     */

    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal virtual override {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");
        require(!(IBlacklist(Admin.Blacklist()).getAddresses(sender)), "USDy: address is Blacklisted");
        require(!(IBlacklist(Admin.Blacklist()).getAddresses(recipient)), "USDy: address is Blacklisted");
        isContractwhitelist(sender, recipient);

        if(balanceOf(recipient) == 0){
                transactionTimeLimit[recipient] = block.timestamp;
        }
        if(liquidityPool[sender] || liquidityPool[recipient]){
            address user = liquidityPool[sender] ? recipient : sender;
            if(IWhitelist(Admin.whitelist()).getAddressesOfSwap(user)){
                super._transfer(sender, recipient, amount);
            } 
            else {
                if(liquidityPool[sender]){
                    uint taxAmount = (amount * USDy_Tax)/ 10000;
                    super._transfer(sender, address(this), taxAmount);
                    tax(taxAmount,sender,amount);
                    amount -= taxAmount;                    
                    super._transfer(sender, recipient, amount);        
                    exitRate(sender, amount);
                    blockRestriction(user);
                }
                else {
                    require(transactionTimeLimit[sender] + lockTransactionTime <= block.timestamp,"USDy: transactionTimeLimit is greater than current time");
                    uint taxAmount = (amount * USDy_Tax)/ 10000;
                    super._transfer(sender, address(this), taxAmount);
                    tax(taxAmount, sender,amount);
                    amount -= taxAmount;
                    uint256 prevAmount = balanceOf(recipient); 
                    super._transfer(sender, recipient, amount);
                    uint256 currentAmount = balanceOf(recipient);   
                    require(prevAmount + ((prevAmount * priceImpactProtection)/1000) >= currentAmount, "USDy: priceImpactProtection");
                    exitRate(sender, amount);    
                    transactionTimeLimit[user] = block.timestamp;  
                    blockRestriction(user);
                }   
            }      
        }  else if(IWhitelist(Admin.whitelist()).getAddresses(sender) || IWhitelist(Admin.whitelist()).getAddresses(recipient)){
            super._transfer(sender, recipient, amount);
        }  else {
                require(transactionTimeLimit[sender] + lockTransactionTime <= block.timestamp,"USDy: transactionTimeLimit is greater than current time");
                uint taxAmount = (amount * USDy_Tax)/10000;
                super._transfer(sender, address(this), taxAmount);
                tax(taxAmount, sender,amount);
                amount -= taxAmount;
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
        require(restrictTransfer[user] != block.number,"USDy: you can't interact in same block");
        restrictTransfer[user] = block.number;
    }

    /**
    @dev Function to ensure that Non-WhiteList contract or User can't interact with USDy.
    @param sender address of Token holder
    @param recipient address of receiver
    **/

    function isContractwhitelist(address sender, address recipient) internal view{
        if(isContract(sender)){
            require(IWhitelist(Admin.whitelist()).getAddresses(sender),"USDy: No external contract interact with USDy");
        }
        if(isContract(recipient)){
            require(IWhitelist(Admin.whitelist()).getAddresses(recipient),"USDy: No external contract interact with USDy");
        }
    }

    /**
    @dev Function to get Tax amount 
    @param taxAmount uint for tax amount.
    **/

    function tax( uint256 taxAmount, address sender, uint amount) internal {
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = Admin.BUSD();
        IERC20(address(this)).approve(router, taxAmount); //BSC Testnet pancake router address

        if(Admin.buyBackActivation()){
            if(Admin.buyBackActivationEpoch() + (3 * Admin.epochDuration()) < block.timestamp) {
                98 * 10**16 <= IUniswapV2Router02(router).getAmountsOut(10**18,path)[1] ? 
                    Admin.setBuyBackActivation(false) : Admin.setBuyBackActivationEpoch();
            }
            _burn(address(this), taxAmount * USDy_BuyBack[0]/10000);
            swap(taxAmount * USDy_BuyBack[1]/10000, path, Admin.Treasury());
            IReceipt(Admin.bYSL()).calculateProtocolPrice();
            address[] memory path1 = new address[](3);
            path1[0] = address(this);
            path1[1] = Admin.BUSD();
            path1[2] = Admin.xYSL();
            swap(taxAmount * USDy_BuyBack[2]/10000, path1, address(this));
            IReceipt(Admin.xYSL()).burn(address(this),IERC20(Admin.xYSL()).balanceOf(address(this)));

        } else {
            if(!Admin.buyBackOwnerActivation() && Admin.buyBackActivationEpoch() + (3 * Admin.epochDuration()) < block.timestamp &&
                98 * 10**16 > IUniswapV2Router02(router).getAmountsOut(10**18,path)[1]) {
                    Admin.setBuyBackActivation(true);
            }
            swap(taxAmount, path, address(this));
            (uint _amount, uint leftAmount) = IReferral(Admin.Refferal()).rewardDistribution(sender, (IERC20(Admin.BUSD()).balanceOf((address(this))) * USDy_Tax_Allocation[0])/ USDy_Tax, amount);
            if(_amount != 0){
                IERC20(address(this)).transfer(Admin.Refferal(),_amount);
            }
            if(leftAmount != 0){
                IERC20(address(this)).transfer(Admin.TeamAddress(),leftAmount);
            }
            IERC20(Admin.BUSD()).transfer(Admin.Treasury(), (IERC20(Admin.BUSD()).balanceOf((address(this))) * USDy_Tax_Allocation[1]) / (USDy_Tax));
            IReceipt(Admin.bYSL()).calculateProtocolPrice();
            path[0] = Admin.BUSD();
            path[1] = Admin.xYSL();
            swap((IERC20(Admin.BUSD()).balanceOf((address(this))) * USDy_Tax_Allocation[2]) / (USDy_Tax),path,address(this));
            IReceipt(Admin.xYSL()).burn(address(this),IERC20(Admin.xYSL()).balanceOf(address(this)));
        }        
    }

    /**
    @dev Function for swapping token for token
    @param amount uint for amount to be swapped.
    @param path address of path for swap.
    @param sendTo address to which swapped token is sent
    **/

    function swap(uint256 amount, address[] memory path, address sendTo) internal nonReentrant{
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

    function exitRate(address sender, uint256 amount) internal  view {
        uint newTime = block.timestamp - transactionTimeLimit[sender];
        uint timeInDays = newTime / 86400;
        uint exitRateAmount;
        uint balance = balanceOf(sender);
        if(Admin.USDyVault() != address(0) && timeInDays > 102){
            if(ISingleVault(Admin.USDyVault()).UserDeposit(sender) != 0){
                balance = (ISingleVault(Admin.USDyVault()).UserDeposit(sender) 
                    * ISingleVault(Admin.USDyVault()).exchangeRatio()) / 10 ** 18;
                require(amount <= balance, 'USDy exit rate: Transfer amount equal to or less than staked amount');
            } else {
                require(true, "USDy exit rate: Failed due to zero amount staked in USDy Vault");
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

       
        require(exitRateAmount >= amount, "USDy: Amount is greater than the exitRateAmount");
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
 
}
