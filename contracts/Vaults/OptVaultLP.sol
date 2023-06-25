// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../Interfaces/IOptVaultFactory.sol";
import "../Interfaces/IPancakeMaster.sol";
import "../Interfaces/IReceipt.sol";
import "../Interfaces/IHelperSwap.sol";
import "../Interfaces/IEvents.sol";
import "../Interfaces/IAdmin.sol";
import "../Interfaces/IBYSL.sol";

contract OptVaultLp is AccessControl, Initializable,ReentrancyGuard, Pausable ,IEvents{
    using SafeERC20 for IERC20;
    bytes32 public constant SETTER_ROLE = keccak256("SETTER_ROLE"); //role byte for setter functions
    // enum for calling functions in a symmetry
    enum LiqStatus {
        SWAP_WANT_TO_BUSD,
        CONTROLLER_FEE,
        OPTIMIZATION_TAX
    }

    IERC20 public want; // Reward token from masterchef
    address public token; //address of deposit token
    address public recieptToken; //reciept token against deposit token
    address public router; // Router address
    address public teamAddress; // address of team address wallet
    address public WBNB;// WBNB address
    address public Treasury;//treasury address
    address public BUSD;//BUSd token address
    address public USDy;//Usdy token address
    address public bYSL;//bYSL token address
    address public YSL;// YSL token address
    address public xYSL;//xYSl token address
    address public BShare;//BShare token address
    address public masterchef;
    address public temporaryHolding;//Temporary holding contract address
    address public helperSwap;
    uint256 public id; // pid
    uint256 byslPrice; // bYSL price
    uint256 usdyPrice ; // USDy price
    uint256 public exchangeRatio=100 ; //exchange ratio of cake multiplied by cofficient 100
    uint256 public epochTime ;//epochTime as uint
    uint256 epochNumber;//epochNumber as uint
    uint tax;//tax as uint
    uint totalStaked;//totalStaked as uint
    uint S;// Reward share per amount as uint
    uint[3] _setOptimizationTaxFEE;//setting optimization tax fee as uint

    IAdmin public Admin; //Admin contract address
    LiqStatus public liqStatusValue; // enum 

    mapping(uint => uint32) public multiplierLevel; // level => deduction value of deposit (for level 7 it is 50%). User must pass value by multiplying it with 10
    mapping(address => uint) public UserLevel;
    mapping(address => uint) public UserReciept;
    mapping(address => uint) public stakedAmount;
    mapping(address => uint) public share;
    mapping(address => uint) public pendingReward;

    /**
    @dev One time called while deploying 
    @param _id Pool id
    @param _token Token for vault address
    @param _want Reward token address from Admin.MasterChef()
    @param _Admin Admin address
    Note this function set owner as Admin of the contract
    */

    function initialize(uint256 _id,address _token, 
        address _want,address _Admin) external initializer {
            Admin= IAdmin(_Admin);
            id = _id;
            want = IERC20(_want);
            token = _token;
            _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
            _setupRole(SETTER_ROLE, msg.sender);
            exchangeRatio = 100;
            usdyPrice = 1 * 10**18;
            epochTime = 8 hours;
            liqStatusValue = LiqStatus.SWAP_WANT_TO_BUSD;
            WBNB = Admin.WBNB();
            Treasury = Admin.Treasury();
            BUSD = Admin.BUSD();
            USDy = Admin.USDy();
            bYSL = Admin.bYSL();
            YSL = Admin.YSL();
            xYSL = Admin.xYSL();
            BShare = Admin.BShare();
            masterchef = Admin.MasterChef();
            temporaryHolding = Admin.temporaryHolding();
            teamAddress = Admin.TeamAddress();
            helperSwap = Admin.helperSwap();
    }

     modifier _isAdmin(){
        require(Admin.hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        _;
    }

    modifier _isAdminOrFactory(){
        require(Admin.hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || hasRole(SETTER_ROLE,msg.sender));
        _;
    }

    modifier _lastExchangeRatio(){
        uint256 lastExchangeRatio = exchangeRatio;
        _;
        if(lastExchangeRatio > exchangeRatio){
            require(lastExchangeRatio > exchangeRatio, "OptVaultLp: exchangeRatio decreased.");        
            _pause();
        }
    }

    /**
    @dev Deposit Function used for depositing LP token or Reciept.
    @param user , User address as parameter.
    @param amountLp , amount of LP as parameter.
    */

    function deposit(address user, uint amountLp,uint32 _level,bool isBUSD) external _isAdminOrFactory _lastExchangeRatio() whenNotPaused() {
        require(amountLp > 0, 'OptVault: Amount must be greater than zero');
        require(Treasury != address(0),'OptVault: Treasury address must be set');
        if(UserLevel[user] == 0 || (UserLevel[user] == _level)) {
        }
        else{
            IOptVaultFactory(Admin.optVaultFactory()).withdraw(user,address(token),false, UserReciept[user],address(this));
            amountLp = amountLp + UserReciept[user];
            UserReciept[user] = 0;
        }
        UserLevel[user] = _level;
        address[] memory path = new address[](2);
        IERC20(token).transferFrom(user, address(this), amountLp);
        IERC20(token).approve(address(helperSwap), (amountLp*multiplierLevel[_level])/2000);
        uint busdBefore = IERC20(BUSD).balanceOf(address(this));
        IHelperSwap(helperSwap).LPToToken(token,(amountLp*multiplierLevel[_level])/2000);
        uint busdAfter = IERC20(BUSD).balanceOf(address(this));
        uint differenceAmount = busdAfter-busdBefore;
        path[0] = BUSD;
        path[1] = USDy;

        if(usdyPrice < IUniswapV2Router02(router).getAmountsOut(1*10**18, path)[1]) {
            usdyPrice = IUniswapV2Router02(router).getAmountsOut(1*10**18, path)[1] * 100;
        } else {
            usdyPrice = 100 * 10**18; //1 dollar coffcient by 100
        }
        uint mintedUSDy = differenceAmount * 100/usdyPrice;        
        IReceipt(USDy).mint(address(this), mintedUSDy);
        IERC20(USDy).approve(router, mintedUSDy);
        IERC20(BUSD).approve(router, differenceAmount);
        IUniswapV2Router02(router).addLiquidity(path[0], path[1], (differenceAmount), mintedUSDy, 1, 1, Treasury, block.timestamp + 1678948210);
        uint mintRecieptToken ;

        exchangeRatio = IERC20(recieptToken).totalSupply() == 0 ? 100 : (IPancakeMaster(masterchef).userInfo(id, address(this)).amount * 100)/IERC20(recieptToken).totalSupply();
        mintRecieptToken = (amountLp -(amountLp * (multiplierLevel[_level]/1000))) * 100/exchangeRatio;
        IReceipt(recieptToken).mint(address(this), mintRecieptToken);
        UserReciept[user] += mintRecieptToken;

        // fetch price of bysl
        path[1] = address(bYSL);
        IReceipt(BShare).mint(user,  (amountLp * (multiplierLevel[_level]/1000))/ (IBYSL(bYSL).protocolPrice() * 100));
        IERC20(token).approve(masterchef,(amountLp -((amountLp*multiplierLevel[_level])/2000)));
        // depositing amount by subtracting the percentage of which is being used for add liquidity of USDY BUSD pair.
        IPancakeMaster(masterchef).deposit(id, (amountLp -((amountLp*multiplierLevel[_level])/2000)));
        exchangeRatio = (IPancakeMaster(masterchef).userInfo(id, address(this)).amount* 100)/IERC20(recieptToken).totalSupply();
        rewardStateForDeposit(user,amountLp,_level);
        emit OptDeposit("Opt VaultLP",address(this),user, amountLp,_level,block.number,block.timestamp);     

    }

    
    /**
    @dev withdraw amount from vault
    @param user , user address as parameter.
    @param isReciept , a bool as parameter.
    @param _amount ,withdraw amount as parameter.
    */

    function withdraw(address user, bool isReciept, uint _amount , address sendTo) external _isAdminOrFactory _lastExchangeRatio() whenNotPaused() {
        require(UserReciept[user] > 0,"OptVault: You need to first deposit");
        require(_amount <= UserReciept[user],"OptVault: Invalid Amount");
        IOptVaultFactory(Admin.optVaultFactory()).optimizationRewards(user,address(token));
        rewardState(user, _amount);
        if(isReciept){
            IERC20(recieptToken).safeTransfer(user,_amount);
        }else{
            exchangeRatio = (IPancakeMaster(masterchef).userInfo(id, address(this)).amount * 100)/IERC20(recieptToken).totalSupply();
            uint balance = (_amount * exchangeRatio)/100;
            IPancakeMaster(masterchef).withdraw(id, balance);
            IERC20(token).safeTransfer(msg.sender, balance);
            IReceipt(recieptToken).burn(address(this), _amount);
        }
        UserReciept[user] -= _amount;
        emit Optwithdraw("Opt VaultLP",address(this),user, _amount,block.number,block.timestamp);     

    }

    /**
    @dev purchase Function used for purchasing Reciept.
    @param user , user address as parameter.
    @param amount , purchasing amount as parameter.
    @param minAmount ,minimum amount to be received on purchase as parameter.
    */

    function purchase(address user, uint amount, uint minAmount) nonReentrant external _lastExchangeRatio() whenNotPaused() returns(uint){
        IERC20(token).safeTransferFrom(user, address(this),amount);
        IERC20(token).approve(masterchef, amount);
        IPancakeMaster(masterchef).deposit(id, amount);
        uint balance = purchaseOf(amount);
        require(balance > minAmount, "OptVaultLp: Amount is less than the minAmount");
        IReceipt(recieptToken).mint(user, balance);
        exchangeRatio = (IPancakeMaster(masterchef).userInfo(id, address(this)).amount * 100)/IERC20(recieptToken).totalSupply();
        return(balance);
        emit PurchaseORSell("optVaultLP",user,amount,block.number,block.timestamp);

    }

    /**
    @dev sell Function used for selling Reciept.
    @param user , user address as parameter.
    @param amount , selling amount as parameter.
    @param minAmount ,minimum amount of Reciept to be selled on as parameter.
    */

    function sell(address user, uint amount, uint minAmount) nonReentrant _lastExchangeRatio() whenNotPaused() external returns(uint){
        IReceipt(recieptToken).burn(user, amount);
        uint balance = sellOf(amount);
        require(balance > minAmount, "OptVaultLp: Amount is less than the minAmount");
        IPancakeMaster(masterchef).withdraw(id, balance);
        IERC20(token).safeTransfer(user,balance);
        return(balance);
        emit PurchaseORSell("optVaultLP",user,amount,block.number,block.timestamp);

    }

    /**
    @dev Setter Function for Tax
    @param value ,Tax value as parameter.
    */

    function setTax(uint value) external _isAdmin{
        require(value !=0,"OptVaultLP:Tax can't be zero");
        emit SetterForUint("optVaultLP",address(this),tax,value,block.number,block.timestamp);
        tax = value;
    }

    /**
    @dev Setter Function for Reciept
    @param _reciept ,reciept address as parameter.
    */

    function setreciept(address _reciept) external onlyRole(SETTER_ROLE){
        require(_reciept != address(0),"OptVaultLP:Receipt can't be zero");
        emit SetterForAddress("OptVaultLP",address(this),recieptToken,_reciept,block.number,block.timestamp);
        recieptToken = _reciept;
    }

    /**
    @dev swapWantToBUSD Function for swapping reward token from router to BUSD.
    */

    function swapWantToBUSD() nonReentrant external onlyRole(SETTER_ROLE) {
        require(liqStatusValue == LiqStatus.SWAP_WANT_TO_BUSD, 'OptVault: Initialize your OptVault first');
        address[] memory path = new address[](2);
        path[0] = address(want);
        path[1] = BUSD;

        uint256 wantBalanceBefore = want.balanceOf(address(this));
        // Get current APR from the protocol
        withdrawAcc(0);
        uint256 wantBalanceAfter = want.balanceOf(address(this));
        // Convert to BUSD
        uint256 wantBalance = wantBalanceAfter - wantBalanceBefore;
        if (wantBalance > 0) {
            want.approve(router, wantBalance);
            IUniswapV2Router02(router).swapExactTokensForTokens(
                wantBalance,
                1,
                path,
                address(this),
                block.timestamp + 10000
            );
        }
            liqStatusValue = LiqStatus.CONTROLLER_FEE;
    }
    /**
    @dev deductControllerFee Function for controller fee deduction.
    */
    function deductControllerFee(uint fee) external onlyRole(SETTER_ROLE) {
        require(fee > 0, 'OptVault: fee can not be zero.');
        require(liqStatusValue == LiqStatus.CONTROLLER_FEE, 'OptVault: Swap want to BUSD first');
        IERC20(BUSD).transfer(teamAddress, fee);
        liqStatusValue = LiqStatus.OPTIMIZATION_TAX;
    }
    /**
    @dev collectOptimizationTax Function for OptimizationTax collection.
    */
    function collectOptimizationTax() nonReentrant external onlyRole(SETTER_ROLE) {
        require(liqStatusValue == LiqStatus.OPTIMIZATION_TAX, 'OptVault: Pay controller fee first');
        address[] memory path = new address[](2);
        uint balanceUSD = IERC20(BUSD).balanceOf(address(this));
        S += (balanceUSD * 10 ** 18)/ totalStaked;
        path[0] = BUSD;
        path[1] = YSL;
        IERC20(BUSD).approve(router, balanceUSD); //BSC Testnetapeswap router address
        uint convertedYSL = IUniswapV2Router02(router).swapExactTokensForTokens( 
            (balanceUSD*_setOptimizationTaxFEE[0])/100,
            0,
            path,
            address(this),
            block.timestamp + 1000
        )[1];
        path[1] = xYSL;
        uint convertedxYSL = IUniswapV2Router02(router).swapExactTokensForTokens( 
            (balanceUSD*_setOptimizationTaxFEE[1])/100,
            0,
            path,
            address(this),
            block.timestamp + 1000
        )[1]; 
        IERC20(YSL).transfer(temporaryHolding, (convertedYSL*20)/100);
        IERC20(YSL).transfer(Admin.YSLVault(), (convertedYSL*80)/100);
        IERC20(xYSL).transfer(temporaryHolding, (convertedxYSL*20)/100);
        IERC20(xYSL).transfer(Admin.xYSLVault(), (convertedxYSL*80)/100);
        IERC20(BUSD).transfer(Treasury,(balanceUSD*_setOptimizationTaxFEE[2])/(100 * 2));
        IERC20(BUSD).transfer(teamAddress,(balanceUSD*_setOptimizationTaxFEE[2])/(100 * 2));
        liqStatusValue = LiqStatus.SWAP_WANT_TO_BUSD;
    }
    /**
    @dev optimizationReward Function for optimizingReward.
    */
    function optimizationReward(address user, uint optMultiplier) nonReentrant external onlyRole(SETTER_ROLE) {
        address[] memory path = new address[](2);
        path[0] = BUSD;
        path[1] = USDy;
        uint poolPriceUSDy = IUniswapV2Router02(router).getAmountsOut(1 * 10**18, path)[1];
        if(usdyPrice < poolPriceUSDy) {
            usdyPrice = poolPriceUSDy * 100;
        } else {
            usdyPrice = 100 * 10**18; //1 dollar coffcient by 100
        }
        uint BUSDAmount = pendingReward[user] + (stakedAmount[user] * (S - share[user]))/10**18;
        share[user] = S;
        uint mintReward = BUSDAmount * optMultiplier/usdyPrice;
        IReceipt(USDy).mint(user, mintReward);
        emit OptimizationRewards(address(this), user, mintReward,block.number,block.timestamp);

    }
    /**
    @dev Setter Function for OptimizationTaxFEE
    @param getOptimizationTaxFEE ,uint getOptimizationTaxFEE as parameter.
    */
    function setOptimizationTaxFEE(uint[3] calldata getOptimizationTaxFEE) external onlyRole(SETTER_ROLE){
        require(getOptimizationTaxFEE[0]+getOptimizationTaxFEE[1]+getOptimizationTaxFEE[2] == 100 ,"OptVault: Total value should be equal to 100");
        emit SetterForOptimizationTaxFee("OptvaultLP", address(this), _setOptimizationTaxFEE, getOptimizationTaxFEE,block.number,block.timestamp);
        _setOptimizationTaxFEE[0] = getOptimizationTaxFEE[0];
        _setOptimizationTaxFEE[1] = getOptimizationTaxFEE[1];
        _setOptimizationTaxFEE[2] = getOptimizationTaxFEE[2];
    }

    function setMultiplierLevel(uint32 _level,uint32 amount) _isAdminOrFactory external returns(uint32){
        require(_level != 0,"OptVaultLP : Level can't be Zero");
        emit SetterForMultiplierLevel("optVaultLP", address(this), _level, multiplierLevel[_level], amount,block.number,block.timestamp);
        multiplierLevel[_level] = amount;
        return amount;
    }

    /**
    @dev Setter Function for Router
    @param _router ,router address as parameter.
    */

    function setRouter(address _router) external _isAdmin{
        require(_router != address(0),"OptVaultLP : Router address can not be null");
        emit SetterForAddress("OptVaultLP",address(this),router,_router,block.number,block.timestamp);
        router = _router;
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
    */
    
    function unpause() external _isAdmin{
        _unpause();
    }
    
    /**
    @dev purchaseOf Function used for getting Reciept amount on purchase.
    @param amount , purchaseOf amount as parameter.
    */

    function purchaseOf(uint amount) public view returns(uint){
        return((amount * (100 - tax))/100);
    }

    /**
    @dev sellOf Function used for getting Reciept amount on selling.
    @param amount , sellOf amount as parameter.
    */

    function sellOf(uint amount) public view returns(uint){
        return((amount * exchangeRatio * (100 - tax))/10000);
    }

    
    /**
    @dev withdrawAcc function for getting APY from masterchef.
    @param _amount , uint amount as parameter.
    */
    function withdrawAcc(uint256 _amount) nonReentrant internal {
        uint256 totalCompounds = IPancakeMaster(masterchef).userInfo(id, address(this)).amount;
        if (totalCompounds > 0) {
            IPancakeMaster(masterchef).withdraw(id, _amount);
        }
    }
    
    function rewardState(address user,uint _amount) internal{
         uint totalBalance = (UserReciept[user] * exchangeRatio)/100;
        uint balance = (_amount * exchangeRatio)/100;
        pendingReward[user] += (stakedAmount[user] * (S - share[user]))/10**18;
        share[user] = S;
        totalStaked -= (UserReciept[user] * balance) / totalBalance;
        stakedAmount[user] -= (UserReciept[user] * balance) / totalBalance;
        
    }

    function rewardStateForDeposit(address user,uint amountLp,uint _level) internal{
        if(stakedAmount[user] != 0){
            pendingReward[user] += (stakedAmount[user] * (S - share[user]))/10**18;
        }
        stakedAmount[user] += (amountLp -((amountLp*multiplierLevel[_level])/2000));
        totalStaked += (amountLp -((amountLp*multiplierLevel[_level])/2000));
        share[user] = S;
    }
}
