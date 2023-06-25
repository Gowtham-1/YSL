// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../Interfaces/IOptVaultFactory.sol";
import "../Interfaces/IPancakeMaster.sol";
import "../Interfaces/IReceipt.sol";
import "../Interfaces/IEvents.sol";
import "../Interfaces/IAdmin.sol";
import "../Interfaces/IBYSL.sol";

contract OptVault is AccessControl, Initializable,ReentrancyGuard, Pausable,IEvents {
    using SafeERC20 for IERC20;

    bytes32 public constant SETTER_ROLE = keccak256("SETTER_ROLE"); //role byte for setter functions   
    // enum for calling functions in a symmetry
    enum LiqStatus {
        SWAP_WANT_TO_BUSD,
        CONTROLLER_FEE,
        OPTIMIZATION_TAX
    }

    LiqStatus public liqStatusValue; // enum 
    uint[3] _setOptimizationTaxFEE;
    uint256 public exchangeRatio ; //exchange ratio of cake multiplied by cofficient 100
    uint256 public epochTime ;// epoch time as uint
    uint256 epochNumber;//epoch Number as uint
    uint256 usdyPrice ; // USDy price
    uint256 public id; // pid
    uint256 byslPrice; // bYSL price
    uint totalStaked;//totalStaked as uint
    uint tax;//tax as uint
    uint S;// Reward share per amount as uint
    address public recieptToken; //reciept token against deposit token
    address public teamAddress; // address of team address wallet
    address public router; // Router address
    address public BUSD;
    address public masterChef;
    IAdmin public  Admin; 
    IERC20 public token; //address of deposit token
    IERC20 public want; // Reward token from masterChef
    
    mapping(uint => uint32) public multiplierLevel; // level => deduction value of deposit (for level 7 it is 50%).
    mapping(address => uint) public UserLevel;
    mapping(address => uint) public UserReciept;
    mapping(address => uint) public stakedAmount;
    mapping(address => uint) public share;
    mapping(address => uint) public pendingReward;

    /**
    @dev One time called while deploying 
 
    @param _id Pool id
    @param _token Token for vault address
    @param _want Reward token address from masterChef
    @param _Admin.MasterChef() masterChef router address
    @param _Admin admin address

    Note this function set owner as Admin of the contract
     */

    function initialize(uint256 _id, address _token,
     address _want,address _Admin) external initializer {
        id = _id;
        want = IERC20(_want);
        token = IERC20(_token);
        Admin= IAdmin(_Admin);
        _setupRole(SETTER_ROLE, msg.sender);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        exchangeRatio = 100;
        usdyPrice = 1 * 10**18;
        epochTime = 8 hours;
        liqStatusValue = LiqStatus.SWAP_WANT_TO_BUSD;
        teamAddress = Admin.TeamAddress();
        BUSD = Admin.BUSD();
        masterChef = Admin.MasterChef();
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
            require(lastExchangeRatio > exchangeRatio, "OptVault: exchangeRatio decreased.");        
        }
    }

    /**
    @dev deposit tokens
    @param user address of user
    @param amount amount to be deposited
    */

    function deposit(address user,uint amount,uint32 _level,bool isBUSD) external _isAdminOrFactory _lastExchangeRatio() whenNotPaused() {
        require(amount > 0, 'OptVault: Amount must be greater than zero');
        require(Admin.Treasury() != address(0),'OptVault: Treasury address must be set');
        IERC20(token).transferFrom(user,address(this), amount);
        if(UserLevel[user] == 0 || (UserLevel[user] == _level)) {
        }
        else{
            IOptVaultFactory(Admin.optVaultFactory()).withdraw(user,address(token),false, UserReciept[user],address(this));
            amount = amount + UserReciept[user];
            UserReciept[user] = 0;
        }
        UserLevel[user] = _level;
        address[] memory path = new address[](2);
        path[0] = address(token);
        path[1] = BUSD;
        token.approve(router, ((amount*multiplierLevel[_level])/2000));
        uint256 convertedBUSD = IUniswapV2Router02(router).swapExactTokensForTokens(((amount*multiplierLevel[_level])/2000), 0, path, address(this), block.timestamp+1000)[1];
        path[0] = BUSD;
        path[1] = Admin.USDy();
        usdyPrice = IReceipt(Admin.USDy()).mintByPrice();
        uint mintedUSDy = convertedBUSD * 100/usdyPrice; 

        IReceipt(Admin.USDy()).mint(address(this), mintedUSDy);
        IERC20(Admin.USDy()).approve(router, mintedUSDy);
        IERC20(BUSD).approve(router, convertedBUSD);
        IUniswapV2Router02(router).addLiquidity(path[0], path[1], convertedBUSD, mintedUSDy, 1, 1,Admin.Treasury(), block.timestamp + 1678948210);
        uint mintRecieptToken ;

        exchangeRatio = IERC20(recieptToken).totalSupply() == 0 ? 100 : (IPancakeMaster(masterChef).userInfo(id, address(this)).amount * 100)/IERC20(recieptToken).totalSupply();
        mintRecieptToken = (amount -(amount * (multiplierLevel[_level])/1000)) * 100/exchangeRatio;
        IReceipt(recieptToken).mint(address(this), mintRecieptToken);
        UserReciept[user] += mintRecieptToken;

        // fetch price of bysl
        path[1] = address(Admin.bYSL());
        IReceipt(Admin.BShare()).mint(user,  (amount * (multiplierLevel[_level]/1000))/  IBYSL(Admin.bYSL()).protocolPrice() * 100);
        IERC20(token).approve(masterChef,(amount -((amount*multiplierLevel[_level])/2000)));
        // depositing amount by subtracting the percentage of which is being used for add liquidity of USDY BUSD pair.
        IPancakeMaster(masterChef).deposit(id, (amount -((amount*multiplierLevel[_level])/2000)));
        exchangeRatio = (IPancakeMaster(masterChef).userInfo(id, address(this)).amount * 100)/IERC20(recieptToken).totalSupply();
        if(stakedAmount[user] != 0){
            pendingReward[user] += (stakedAmount[user] * (S - share[user]))/10**18;
        }
        stakedAmount[user] += (amount -((amount*multiplierLevel[_level])/2000));
        totalStaked += (amount -((amount*multiplierLevel[_level])/2000));
        share[user] = S;
        emit OptDeposit("Opt Vault",address(this),user, amount,_level,block.number,block.timestamp);     
       
    }

/**
    @dev purchase receipt tokens
    @param user address of user
    @param amount purchase amount
    @param minAmount minAmount
    */

    function purchase(address user, uint amount, uint minAmount) nonReentrant external _lastExchangeRatio() whenNotPaused() returns(uint){
        IERC20(token).safeTransferFrom(user, address(this),amount);
        IERC20(token).approve(masterChef, amount);
        IPancakeMaster(masterChef).deposit(id, amount);
        uint balance = purchaseOf(amount);
        require(balance > minAmount, "OptVault: Amount is less than the minAmount");
        IReceipt(recieptToken).mint(user, balance);
        exchangeRatio = (IPancakeMaster(masterChef).userInfo(id, address(this)).amount * 100)/IERC20(recieptToken).totalSupply();
        return(balance);
        emit PurchaseORSell("optVault",user,amount,block.number,block.timestamp);

    }

    /**
    @dev sell receipt tokens and acquire cake tokens
    @param user address of user
    @param amount sell amount
    @param minAmount minAmount
    */

    function sell(address user, uint amount, uint minAmount) nonReentrant external _lastExchangeRatio() whenNotPaused() returns(uint){
        IERC20(recieptToken).safeTransferFrom(user, address(this),amount);
        uint balance = sellOf(amount);
        require(balance > minAmount, "OptVault: Amount is less than the minAmount");
        IERC20(token).approve(masterChef, amount);
        IPancakeMaster(masterChef).withdraw(id, balance);
        IERC20(token).safeTransfer(user,balance);
        return(balance);
        emit PurchaseORSell("optVault",user,amount,block.number,block.timestamp);

    }

    /**
    @dev Setter Function for setTax
    @param value amount as parameter.
    */

    function setTax(uint value) external _isAdminOrFactory{
        require(value !=0,"Tax can't be zero");
        emit SetterForUint("optVault",address(this),tax,value,block.number,block.timestamp);
        tax = value;
    }

    /**
    @dev Setter Function for setting receipt address
    @param _reciept , reciept address
    */

    function setreciept(address _reciept) external onlyRole(SETTER_ROLE){
        require(_reciept != address(0),"Reciept Token address can't be zero");
        emit SetterForAddress("OptVault",address(this),recieptToken,_reciept,block.number,block.timestamp);
        recieptToken = _reciept;
    }

    function swapWantToBUSD() nonReentrant external onlyRole(DEFAULT_ADMIN_ROLE) {
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
    @dev  Function for deducting controller fee
    @param fee , fee amount
    */

    function deductControllerFee(uint fee) nonReentrant  external onlyRole(SETTER_ROLE) {
        require(fee > 0, 'OptVault: fee can not be zero.');
        require(liqStatusValue == LiqStatus.CONTROLLER_FEE, 'OptVault: Swap want to BUSD first');
        IERC20(BUSD).transfer(teamAddress, fee);
        liqStatusValue = LiqStatus.OPTIMIZATION_TAX;
    }

    function collectOptimizationTax() nonReentrant external onlyRole(SETTER_ROLE) {
        require(liqStatusValue == LiqStatus.OPTIMIZATION_TAX, 'OptVault: Pay controller fee first');
        address[] memory path = new address[](2);
        uint balanceUSD = IERC20(BUSD).balanceOf(address(this));
        S += (balanceUSD * 10 ** 18)/ totalStaked;
        path[0] = BUSD;
        path[1] = Admin.YSL();
        IERC20(BUSD).approve(router, balanceUSD); //BSC Testnetapeswap router address
        uint convertedYSL = IUniswapV2Router02(router).swapExactTokensForTokens( 
            (balanceUSD*_setOptimizationTaxFEE[0])/100,
            0,
            path,
            address(this),
            block.timestamp + 1000
        )[1];
        path[1] = Admin.xYSL();
        uint convertedxYSL = IUniswapV2Router02(router).swapExactTokensForTokens( 
            (balanceUSD*_setOptimizationTaxFEE[1])/100,
            0,
            path,
            address(this),
            block.timestamp + 1000
        )[1]; 
        IERC20(Admin.YSL()).transfer(Admin.temporaryHolding(), (convertedYSL*20)/100);
        IERC20(Admin.YSL()).transfer(Admin.YSLVault(), (convertedYSL*80)/100);
        IERC20(Admin.xYSL()).transfer(Admin.temporaryHolding(), (convertedxYSL*20)/100);
        IERC20(Admin.xYSL()).transfer(Admin.xYSLVault(), (convertedxYSL*80)/100);
        IERC20(BUSD).transfer(Admin.Treasury(),(balanceUSD*_setOptimizationTaxFEE[2])/(100 * 2));
        IERC20(BUSD).transfer(Admin.TeamAddress(),(balanceUSD*_setOptimizationTaxFEE[2])/(100 * 2));
        liqStatusValue = LiqStatus.SWAP_WANT_TO_BUSD;
    }

    /**
    @dev function for optimizaation reward
    @param user user address
    @param optMultiplier multiplier amount
    */

    function optimizationReward(address user, uint optMultiplier) external onlyRole(SETTER_ROLE) {
        address[] memory path = new address[](2);
        path[0] = BUSD;
        path[1] = Admin.USDy();
        uint poolPriceUSDy = IUniswapV2Router02(router).getAmountsOut(1 * 10**18, path)[1];
        if(usdyPrice < poolPriceUSDy) {
            usdyPrice = poolPriceUSDy * 100;
        } else {
            usdyPrice = 100 * 10**18; //1 dollar coffcient by 100
        }
        uint BUSDAmount = pendingReward[user] + (stakedAmount[user] * (S - share[user]))/10**18;
        share[user] = S;
        uint mintReward = BUSDAmount * optMultiplier/usdyPrice;
        IReceipt(Admin.USDy()).mint(user, mintReward);
        emit OptimizationRewards(address(this), user, mintReward,block.number,block.timestamp);
    }

    /**
    @dev  Setter function for optimizationTAXfee
    @param getOptimizationTaxFEE , tax fee as parameter.
    */

    function setOptimizationTaxFEE(uint[3] calldata getOptimizationTaxFEE) external _isAdminOrFactory{
        require(getOptimizationTaxFEE[0]+getOptimizationTaxFEE[1]+getOptimizationTaxFEE[2] == 100 ,"OptVault: Total value should be equal to 100");
        emit SetterForOptimizationTaxFee("Optvault", address(this), _setOptimizationTaxFEE, getOptimizationTaxFEE ,block.number,block.timestamp);
        _setOptimizationTaxFEE[0] = getOptimizationTaxFEE[0];
        _setOptimizationTaxFEE[1] = getOptimizationTaxFEE[1];
        _setOptimizationTaxFEE[2] = getOptimizationTaxFEE[2];
    }

     function setMultiplierLevel(uint32 _level,uint32 amount) external _isAdminOrFactory returns(uint32){
        require(_level != 0,"optVault: Level can't be Zero");
        emit SetterForMultiplierLevel("optVault", address(this), _level, multiplierLevel[_level], amount,block.number,block.timestamp);
        multiplierLevel[_level] = amount;
        return amount;
    }

    /**
    @dev Setter Function for router
    @param _router , router address as parameter.
    */

    function setRouter(address _router) external _isAdminOrFactory{
        require(_router != address(0),"OptVault : Router address can not be null");
        emit SetterForAddress("optVault",address(this),router,_router,block.number,block.timestamp);
        router = _router;
    }

    /**
    @dev Setter Function for team address
    @param _teamAddress , address as parameter.
    */

    function setTeamAddress(address _teamAddress) external _isAdminOrFactory{
        require(_teamAddress != address(0),"OptVault : Team Address can not be null");
        emit SetterForAddress("optVault",address(this),teamAddress,_teamAddress,block.number,block.timestamp);
        teamAddress = _teamAddress;
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
    @dev withdraw from vault
    @param user //user address
    @param isReciept //reciept or not
    @param _amount //withdraw amount
    */

    function withdraw(address user, bool isReciept, uint _amount, address sendTo)  public _isAdminOrFactory _lastExchangeRatio() whenNotPaused() {
        require(UserReciept[user] > 0,"OptVault: You need to first deposit");
        require(_amount <= UserReciept[user],"OptVault: Invalid Amount");
        IOptVaultFactory(Admin.optVaultFactory()).optimizationRewards(user,address(token));
        address sendTo = msg.sender == Admin.optVaultFactory() ? address(this) : msg.sender;
        (,uint balance) = rewardState(user, _amount);
        if(isReciept){
            IERC20(recieptToken).safeTransfer(sendTo,_amount);
        }else{
            IPancakeMaster(masterChef).withdraw(id, balance);
            IERC20(token).safeTransfer(sendTo, balance);
            IReceipt(recieptToken).burn(address(this), _amount);
        }
        UserReciept[user] -= _amount;
        emit Optwithdraw("Opt Vault",address(this),user, _amount,block.number,block.timestamp);     

    }

    /**
    @dev  Function for purchaseOf
    @param amount amount as parameter.
    */

    function purchaseOf(uint amount) public view returns(uint){
        return((amount * (exchangeRatio - tax))/100);
    }

    /**
    @dev  Function for sellOf
    @param amount amount as parameter.
    */

    function sellOf(uint amount) public view returns(uint){
        return((amount * exchangeRatio * (100 - tax))/10000);

    }

    /**
    @dev Reward state
    @param user user address
    @param _amount amount
    */

    function rewardState(address user,uint _amount) internal returns(uint,uint){
         uint totalBalance = (UserReciept[user] * exchangeRatio)/100;
        uint balance = (_amount * exchangeRatio)/100;
        pendingReward[user] += (stakedAmount[user] * (S - share[user]))/10**18;
        share[user] = S;
        totalStaked -= (UserReciept[user] * balance) / totalBalance;
        stakedAmount[user] -= (UserReciept[user] * balance) / totalBalance;
        return (totalBalance,balance);
    }

    

    /**
    @dev Function for withdrawAcc
    @param _amount , amount as parameter.
    */

    function withdrawAcc(uint256 _amount) internal {

        uint256 totalCompounds = IPancakeMaster(masterChef).userInfo(id, address(this)).amount;
        if (totalCompounds > 0) {

            IPancakeMaster(masterChef).withdraw(id, _amount);

        }
    }
   
}