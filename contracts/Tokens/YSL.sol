// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../Interfaces/IBlacklist.sol";
import "../Interfaces/IWhitelist.sol";
import "../Interfaces/IEvents.sol";
import "../Interfaces/IAdmin.sol";
import "../Interfaces/IReceipt.sol";
import "../Interfaces/ISingleVault.sol";
import "./Receipt.sol";

//todo: at the time of live change router, factory and token, compensationlimit, dayInSec

/**
    @dev this contract is for YSL token.
    */
contract YSL is Receipt, Pausable, IEvents{

    uint256 public deploymentTime;
    address public router;
    uint public compensationLimit; //Total amount for compensation 
    uint public priceImpactProtection; //Price impact protection of 1%
    uint public lockTransactionTime; 
    uint public YSL_Tax; //Tax always multiply by 100
    uint [] public YSL_Tax_Allocation; //index-1 => temporaryHolding, index-2 => Treasury; All index value multiply by 100;
    uint [] public YSL_BuyBack; //[buyBack and burn, team address] multiple with 100
    uint public DaysCompensationsLimit;

    mapping(address => uint) public compensationUsers; // amount to compensate
    mapping (address => uint) public restrictTransfer; // last block number when interacted
    mapping(address => uint) public transactionTimeLimit; // timelimit for transaction
    mapping(address => bool) public liquidityPool; //list of LiquidityPool
    
    function initialise(
        address _admin
        ) external {
        initialize(_admin, IAdmin(_admin).operator(), "YSL", "YSL");
        deploymentTime = block.timestamp;
        router = Admin.ApeswapRouter();
        _setupRole(OPERATOR_ROLE, _msgSender());
        compensationLimit = 426400 * 10**18;
        priceImpactProtection = 10;
        lockTransactionTime = 86400; 
        YSL_Tax = 1500;
        YSL_Tax_Allocation = [1000, 500];
        YSL_BuyBack = [7500,2500];
        DaysCompensationsLimit= 180;

    }


    /**
    @dev mint token called yet compensation limit not reached

    @param account address of receiver
    @param amount amount to mint

    Note only minter role can call 
     */
    function mint(address account, uint amount) external override nonReentrant onlyRole(OPERATOR_ROLE) whenNotPaused {
         if(balanceOf(account) == 0){
                transactionTimeLimit[account] = block.timestamp;
            }
        _mint(account, amount);
    }

    /**
    @dev burn token called yet compensation limit not reached

    @param account address of receiver
    @param amount amount for burn

    Note only minter role can call 
     */
    function burn(address account, uint amount) external override nonReentrant onlyRole(OPERATOR_ROLE) whenNotPaused {
        _burn(account, amount);
    }


    /**
    @dev Function for Pause by an Operator
    **/
    function pause() external nonReentrant _isOperator {
        _pause();
    }

    /**
    @dev Function for UnPause by an Operator
    **/
    function unpause() external nonReentrant _isOperator {
        _unpause();
    }

    /**
    @dev set tax and allocation points

    @param _tax total tax
    @param allocationTax array of allocation point

    Note allocation point should be equal to tax
        all the values should enter with 100 cofficient
        only admin can call 
     */
    function setYSLAndAllocationTax(
        uint256 _tax,
        uint256[] memory allocationTax
    ) external _isAdmin {
        require(_tax > 0, "YSL: invalid tax");
        require(allocationTax.length > 0, "YSL: invalid AllocationTax");
        uint256 total;
        for (uint256 i; i < allocationTax.length; i++) {
            total += allocationTax[i];
        }
        require(total == _tax, "YSL: incorrect inputs");
        emit TaxAllocation(
            "YSLToken",
            address(this),
            YSL_Tax,
            _tax,
            YSL_Tax_Allocation,
            allocationTax,
            block.number,
            block.timestamp
        );
        YSL_Tax = _tax;
        YSL_Tax_Allocation = allocationTax;
    }

    function setYSL_BuyBack(uint[] memory _YSLBuyBack) external _isAdmin {
        YSL_BuyBack = _YSLBuyBack;
    }

    /**
    @dev set compensationAmount

    @param userAddresses array of user who will get compensation
    @param amounts array of amount they will get

    Note both the array should be equal
        only admin can call it 
     */
    function setYSLCompensationAmount(
        address[] memory userAddresses,
        uint256[] memory amounts
    ) external _isAdmin {
        require(
            userAddresses.length > 0 && amounts.length > 0,
            "YSL: null array"
        );
        require(userAddresses.length == amounts.length, "YSL: unequal array");
        for (uint256 i; i < userAddresses.length; i++) {
            if (userAddresses[i] != address(0)) {
                compensationUsers[userAddresses[i]] = amounts[i];
            }
        }
    }

    /**
    @dev Function to set Days Compensation Limit
    @param _DaysCompensationLimit uint for days 
    **/
    function setDaysCompensationLimit(uint256 _DaysCompensationLimit) external _isAdmin{
        require(_DaysCompensationLimit!=0,"YSL: invalid data");
        emit SetterForUint("YSLToken",address(this),DaysCompensationsLimit,_DaysCompensationLimit,block.number,block.timestamp);
        DaysCompensationsLimit=_DaysCompensationLimit;
    }

    function setRouter(address _router) external _isAdmin{
        require(_router != address(0),"YSL: invalid data");
        router = _router;
    }

    /**
    @dev user will call it for claim

    Note first we need to call setYSLCompensationAmount function
        user will get the amount we set will set compensation
     */
    function claimYSL() external nonReentrant{
        require(compensationUsers[msg.sender] != 0, 'YSL: zero YSL');
        uint day = (block.timestamp - deploymentTime)/86400;
        require(day <= DaysCompensationsLimit, 'YSL: Period over');
        require(totalSupply() < compensationLimit, 'YSL: reached limit');
        uint amount = totalSupply() +  compensationUsers[msg.sender];  
        if(amount > compensationLimit) {
            amount = amount - compensationLimit;
            amount = compensationUsers[msg.sender] - amount;
        } else {
            amount = compensationUsers[msg.sender];
        }
        compensationUsers[msg.sender] = 0;
        _mint(msg.sender, amount);
        if (totalSupply() >= compensationLimit) {
            _pause();
        }
    }

    /**
    @dev Admin will call it to send unclaimed tokens to YSLVault for increase the ratio
    */
    function getUnClaimedYSL() external _isAdmin {
        uint day = (block.timestamp - deploymentTime)/86400;
        require(day > DaysCompensationsLimit, 'YSL: Claim period is not over');
        require(totalSupply() < compensationLimit, 'YSL: No unclaimed tokens left');
        uint amount = compensationLimit - totalSupply();
        _mint(Admin.YSLVault(), amount);
    }

    /**
    @dev set amount for CompensationLimit

    @param _compensationLimit amount of old YSL token
     */
    function setCompensationLimit(uint256 _compensationLimit)
        external
        _isAdmin
    {
        require(_compensationLimit > 0, "YSL: invalid input");
        emit SetterForUint(
            "YSLToken",
            address(this),
            compensationLimit,
            _compensationLimit,
            block.number,
            block.timestamp
        );
        compensationLimit = _compensationLimit;
    }

    /**
    setter function for Price Impact Protection
     */

    function setPriceImpactProtection(uint256 value) public _isAdmin {
        require(value > 0, "YSLToken: Value can't be zero");
        emit SetterForUint(
            "YSLToken",
            address(this),
            priceImpactProtection,
            value,
            block.number,
            block.timestamp
        );
        priceImpactProtection = value;
    }

    /**
    setter function For lockTransactionTime
     */

    function setLockTransactionTime(uint256 time) public _isAdmin {
        require(time > 0, "YSLToken: Value can't be zero");
        emit SetterForUint(
            "YSLToken",
            address(this),
            lockTransactionTime,
            time,
            block.number,
            block.timestamp
        );
        lockTransactionTime = time;
    }

    function setLiquidityPool(address _lp, bool _value) external _isAdmin{
        liquidityPool[_lp] = _value;
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
        require(
            !(IBlacklist(Admin.Blacklist()).getAddresses(sender)),
            "YSL:address is Blacklisted "
        );
        require(
            !(IBlacklist(Admin.Blacklist()).getAddresses(recipient)),
            "YSL: address is Blacklisted"
        );
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
                    uint taxAmount = (amount * YSL_Tax)/ 10000;
                    super._transfer(sender, address(this), taxAmount);
                    amount -= taxAmount;
                    super._transfer(sender, recipient, amount);
                    tax(taxAmount);
                    transactionTimeLimit[user] = block.timestamp;
                    exitRate(sender, amount);
                    blockRestriction(user);
                } else {
                    require(
                        transactionTimeLimit[sender] + lockTransactionTime <=
                            block.timestamp,
                        "YSL: transactionTimeLimit reached"
                    );
                    uint256 taxAmount = (amount * YSL_Tax) / 10000;
                    super._transfer(sender, address(this), taxAmount);
                    amount -= taxAmount;
                    uint256 prevAmount = balanceOf(recipient); 
                    super._transfer(sender, recipient, amount);
                    uint256 currentAmount = balanceOf(recipient); 
                    require(prevAmount + ((prevAmount * priceImpactProtection)/1000) >= currentAmount, "YSL: priceImpactProtection");
                    tax(taxAmount);
                    exitRate(sender, amount);
                    transactionTimeLimit[user] = block.timestamp;
                    blockRestriction(user);
                }
            }
        } else if (
            IWhitelist(Admin.whitelist()).getAddresses(sender) ||
            IWhitelist(Admin.whitelist()).getAddresses(recipient)
        ) {
            super._transfer(sender, recipient, amount);
        } else {
            require(
                transactionTimeLimit[sender] + lockTransactionTime <=
                    block.timestamp,
                "YSL: transactionTimeLimit reached"
            );
            uint256 taxAmount = (amount * YSL_Tax) / 10000;
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
        require(
            restrictTransfer[user] != block.number,
            "YSL: blockRestriction"
        );
        restrictTransfer[user] = block.number;
    }

    /**
    @dev Function to ensure that Non-WhiteList contract or User can't interact with BYSL.
    @param sender address of Token holder
    @param recipient address of receiver
    **/

    function isContractwhitelist(address sender, address recipient) internal view {
        if (isContract(sender)) {
            require(
                IWhitelist(Admin.whitelist()).getAddresses(sender),
                "YSL: No external interact"
            );
        }
        if (isContract(recipient)) {
            require(
                IWhitelist(Admin.whitelist()).getAddresses(recipient),
                "YSL: No external interact"
            );
        }
    }

    /**
    @dev Function to get Tax amount 
    @param taxAmount uint for tax amount.
    **/

    function tax(uint256 taxAmount) internal{
        address[] memory path = new address[](2);
        path[0] = Admin.USDy();
        path[1] = Admin.BUSD();
        IERC20(address(this)).approve(router, taxAmount); //BSC Testnet pancake router address
        if(Admin.buyBackActivation()){
            if(Admin.buyBackActivationEpoch() + (3 * Admin.epochDuration()) < block.timestamp) {
                    98 * 10**16 <= IUniswapV2Router02(router).getAmountsOut(10**18,path)[1] ? 
                        Admin.setBuyBackActivation(false) : Admin.setBuyBackActivationEpoch();
                }
            swap((taxAmount * YSL_BuyBack[1])/10000,Admin.TeamAddress());
            address[] memory path = new address[](3);
            path[0] = address(this);
            path[1] = Admin.BUSD();
            path[2] = Admin.USDy();
            IUniswapV2Router02(router).swapExactTokensForTokens( 
                (taxAmount * YSL_BuyBack[0])/10000,
                0,
                path,
                address(this),
                block.timestamp + 1000
                )[path.length - 1];
            IReceipt(Admin.USDy()).burn(address(this),IERC20(Admin.USDy()).balanceOf(address(this)));
        } else {
            if(!Admin.buyBackOwnerActivation() && Admin.buyBackActivationEpoch() + (3 * Admin.epochDuration()) < block.timestamp &&
                98 * 10**16 > IUniswapV2Router02(router).getAmountsOut(10**18,path)[1]) {
                        Admin.setBuyBackActivation(true);
                }
            swap((taxAmount * YSL_Tax_Allocation[0])/YSL_Tax,Admin.temporaryHolding());
            swap(((taxAmount * YSL_Tax_Allocation[1])/(YSL_Tax)),Admin.Treasury());
            IReceipt(Admin.bYSL()).calculateProtocolPrice();
        }  
    }

    /**
    @dev Function for swapping token for token
    @param amount uint for amount to be swapped.
    @param sendTo address to which swapped token is sent
    **/

    function swap(uint256 amount, address sendTo) internal {
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
            if(Admin.YSLVault() != address(0)){
                if(ISingleVault(Admin.YSLVault()).UserDeposit(sender) != 0){
                    balance += (ISingleVault(Admin.YSLVault()).UserDeposit(sender) 
                        * ISingleVault(Admin.YSLVault()).exchangeRatio()) / 10 ** 18;
                }
            }
            if( timeInDays > 2 ){   

                uint exitRateOfDay = timeInDays - 2 ;
                if(exitRateOfDay >= 100){
                    exitRateOfDay = 100;
                }

                exitRateAmount = ((balance * exitRateOfDay)/100);
            }
            else{
                exitRateAmount = ((balance * 1)/1000);
            }
        require(exitRateAmount >= amount, "YSL: exitRateAmount");
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

    
}
