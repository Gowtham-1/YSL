// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

contract Admin is AccessControl, Initializable{
    bool public lpDeposit;
    address public Trigger;
    address public POL;
    address public Treasury;
    address public BShareBUSDVault;
    address public bYSLVault;
    address public USDyBUSDVault;
    address public USDyVault;
    address public xYSLBUSDVault;
    address public xYSLVault;
    address public YSLBUSDVault;
    address public YSLVault;
    address public xBUSDVault;
    address public BShare;
    address public bYSL;
    address public USDs;
    address public USDy;
    address public xYSL;
    address public xBUSD;
    address public YSL;
    address public YSLS;
    address public xYSLS;
    address public swapPage;
    address public PhoenixNFT;
    address public Opt1155;
    address public EarlyAccess;
    address public optVaultFactory;
    address public swap;
    address public temporaryHolding;
    address public whitelist;
    address public BUSD;
    address public WBNB;
    address public BShareVault;
    address public masterNTT;
    address public biswapRouter;
    address public ApeswapRouter;
    address public pancakeRouter;
    address public TeamAddress;
    address public MasterChef;
    address public Refferal;
    address public liquidityProvider;
    address public Blacklist;
    address public admin;
    address public operator;
    address public helperSwap;
    address public USDyBUSDRebalancer;
    address public BSHAREBUSDRebalancer;
    address public BUSDVault;
    address public USDyBUSD;
    bool public buyBackActivation;
    bool public buyBackOwnerActivation;
    uint public lastEpoch;
    uint public epochDuration = 8 hours;
    uint public buyBackActivationEpoch;
    address public customVaultMaster;
    address public claimStakeAll;
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR"); //byte for minter role
    bytes32 public constant SETTER_ROLE = keccak256("SETTER_ROLE"); //role byte for setter functions
    bytes32 public constant BUYBACKACTIVATION_ROLE = keccak256("SETTER_ROLE"); //role byte for setter functions
    address public DAI;
    address public USDC;
    address public USDT;
    address public DAIVault;
    address public USDCVault;
    address public USDTVault;
    

/**
@dev initialize function
 */
    function initialize(address owner, address _operator) external initializer {
        admin = owner;
        operator = _operator;
        _setupRole(DEFAULT_ADMIN_ROLE, owner); 
        _setupRole(OPERATOR_ROLE, _operator);  
    }

    function setLpDeposit(bool deposit) public onlyRole(DEFAULT_ADMIN_ROLE){
        lpDeposit = deposit;
    }
    /**
        @dev this function used to set Admin address
        @param _admin address
     */
    function setAdmin(address _admin) external onlyRole(DEFAULT_ADMIN_ROLE){
        admin = _admin;
        _setupRole(DEFAULT_ADMIN_ROLE, _admin);
    }
    /**
        @dev this function used to set operator address
        @param _operator address
     */
    function setOperator(address _operator) external onlyRole(DEFAULT_ADMIN_ROLE){
        _setupRole(OPERATOR_ROLE, _operator);
    }
    /**
        @dev this function used to set refferal address
        @param _refferal address
     */
    function setRefferal(address _refferal) external onlyRole(DEFAULT_ADMIN_ROLE){
        Refferal = _refferal;
    }
    /**
        @dev this function used to set WBNB address
        @param _WBNB address
     */
    function setWBNB(address _WBNB) external onlyRole(DEFAULT_ADMIN_ROLE){
        WBNB = _WBNB;
    }
    /**
        @dev this function used to set BShareVault address
        @param _BShareVault address
     */
    function setBShareVault(address _BShareVault) external onlyRole(DEFAULT_ADMIN_ROLE){
       BShareVault= _BShareVault;
    }
    
    /**
        @dev this function used to set BUSD address
        @param _xBUSD address
     */
    function setxBUSD(address _xBUSD) external onlyRole(DEFAULT_ADMIN_ROLE){
        xBUSD = _xBUSD;
    }
    function setxBUSDVault(address _xBUSDVault) external onlyRole(DEFAULT_ADMIN_ROLE){
        xBUSDVault = _xBUSDVault;
    }

    /**
        @dev this function used to set BUSD address
        @param _BUSD address
     */
    function setBUSD(address _BUSD) external onlyRole(DEFAULT_ADMIN_ROLE){
        BUSD = _BUSD;
    }
    /**
        @dev this function used to set Whitelist address
        @param _whitelist address
     */
    function setWhitelist(address _whitelist) external onlyRole(DEFAULT_ADMIN_ROLE){
        whitelist = _whitelist;
    }
    /**
        @dev this function used to set VaultSwap address
        @param _helperSwap address
     */
    function setHelperSwap(address _helperSwap) external onlyRole(DEFAULT_ADMIN_ROLE){
        helperSwap = _helperSwap;
    }
    /**
        @dev this function used to set TemporaryHolding address
        @param _temporaryHolding address
     */
    function setTemporaryHolding(address _temporaryHolding) external onlyRole(DEFAULT_ADMIN_ROLE){
        temporaryHolding = _temporaryHolding;
    }

    /**
        @dev this function used to set Swap address
        @param _swap address
     */
    function setSwap(address _swap) external onlyRole(DEFAULT_ADMIN_ROLE){
        swap = _swap;
    }
    /**
        @dev this function used to set OptVaultFactory address
        @param _optVaultFactory address
     */
    function setOptVaultFactory(address _optVaultFactory) external onlyRole(DEFAULT_ADMIN_ROLE){
        optVaultFactory = _optVaultFactory;
    }
    
    /**
        @dev this function used to set EarlyAccess address
        @param _EarlyAccess address
     */
    function setEarlyAccess(address _EarlyAccess) external onlyRole(DEFAULT_ADMIN_ROLE){
        EarlyAccess = _EarlyAccess;
    }
    /**
        @dev this function used to set Opt1155 address
        @param _Opt1155 address
     */
    function setOpt1155(address _Opt1155) external onlyRole(DEFAULT_ADMIN_ROLE){
        Opt1155 = _Opt1155;
    }
    /**
        @dev this function used to set PhoenixNFT address
        @param _PhoenixNFT address
     */
    function setPhoenixNFT(address _PhoenixNFT) external onlyRole(DEFAULT_ADMIN_ROLE){
        PhoenixNFT = _PhoenixNFT;
    }
    /**
        @dev this function used to set SwapPage address
        @param _swapPage address
     */
    function setSwapPage(address _swapPage) external onlyRole(DEFAULT_ADMIN_ROLE){
        swapPage = _swapPage;
    }
    /**
        @dev this function used to set YSLS address
        @param _YSLS address
     */
    function setYSLS(address _YSLS) external onlyRole(DEFAULT_ADMIN_ROLE){
        YSLS = _YSLS;
    }
    /**
        @dev this function used to set YSL address
        @param _YSL address
     */
    function setYSL(address _YSL) external onlyRole(DEFAULT_ADMIN_ROLE){
        YSL = _YSL;
    }
    /**
        @dev this function used to set xYSLs address
        @param _xYSLS address
     */
    function setxYSLs(address _xYSLS) external onlyRole(DEFAULT_ADMIN_ROLE){
        xYSLS = _xYSLS;
    }
    /**
        @dev this function used to set xYSL address
        @param _xYSL address
     */
    function setxYSL(address _xYSL) external onlyRole(DEFAULT_ADMIN_ROLE){
        xYSL = _xYSL;
    }
    /**
        @dev this function used to set USDy address
        @param _USDy address
     */
    function setUSDy(address _USDy) external onlyRole(DEFAULT_ADMIN_ROLE){
        USDy = _USDy;
    }
    /**
        @dev this function used to set USDs address
        @param _USDs address
     */
    function setUSDs(address _USDs) external onlyRole(DEFAULT_ADMIN_ROLE){
        USDs = _USDs;
    }
    /**
        @dev this function used to set bysl address
        @param _bYSL address
     */
    function setbYSL(address _bYSL) external onlyRole(DEFAULT_ADMIN_ROLE){
        bYSL = _bYSL;
    }
    /**
        @dev this function used to set BShare address
        @param _BShare address
     */
    function setBShare(address _BShare) external onlyRole(DEFAULT_ADMIN_ROLE){
        BShare = _BShare;
    }
    /**
        @dev this function used to set YSLVault address
        @param _YSLVault address
     */
    function setYSLVault(address _YSLVault) external onlyRole(DEFAULT_ADMIN_ROLE){
        YSLVault = _YSLVault;
    }
    /**
        @dev this function used to set YSLBUSDVault address
        @param _YSLBUSDVault address
     */
    function setYSLBUSDVault(address _YSLBUSDVault) external onlyRole(DEFAULT_ADMIN_ROLE){
        YSLBUSDVault = _YSLBUSDVault;
    }
    /**
        @dev this function used to set xYSLVault address
        @param _xYSLVault address
     */
    function setxYSLVault(address _xYSLVault) external onlyRole(DEFAULT_ADMIN_ROLE){
        xYSLVault = _xYSLVault;
    }
    /**
        @dev this function used to set xYSLBUSDVault address
        @param _xYSLBUSDVault address
     */
    function setxYSLBUSDVault(address _xYSLBUSDVault) external onlyRole(DEFAULT_ADMIN_ROLE){
        xYSLBUSDVault = _xYSLBUSDVault;
    }
    /**
        @dev this function used to set USDyVault address
        @param _USDyVault address
     */
    function setUSDyVault(address _USDyVault) external onlyRole(DEFAULT_ADMIN_ROLE){
        USDyVault = _USDyVault;
    }
    /**
        @dev this function used to set USDyBUSDVault address
        @param _USDyBUSDVault address
     */
    function setUSDyBUSDVault(address _USDyBUSDVault) external onlyRole(DEFAULT_ADMIN_ROLE){
        USDyBUSDVault = _USDyBUSDVault;
    }
    /**
        @dev this function used to set bYSLVault address
        @param _bYSLVault address
     */
    function setbYSLVault(address _bYSLVault) external onlyRole(DEFAULT_ADMIN_ROLE) {
        bYSLVault = _bYSLVault;
    }
    /**
        @dev this function used to set BShareBUSD address
        @param _BShareBUSD address
     */
    function setBShareBUSD(address _BShareBUSD) external onlyRole(DEFAULT_ADMIN_ROLE) {
        BShareBUSDVault = _BShareBUSD;
    }
    /**
        @dev this function used to set Treasury address
        @param _Treasury address
     */
    function setTreasury(address _Treasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        Treasury = _Treasury;
    }
    /**
        @dev this function used to set Trigger address
        @param _Trigger address
     */
    function setTrigger(address _Trigger) external onlyRole(DEFAULT_ADMIN_ROLE) {
        Trigger = _Trigger;
    }
    /**
        @dev this function used to set POL address
        @param _POL address
     */
    function setPOL(address _POL) external onlyRole(DEFAULT_ADMIN_ROLE){
        POL = _POL;
    }
    /**
        @dev this function used to set MasterNTT address
        @param _masterNTT address
     */
    function setmasterNTT(address _masterNTT)external onlyRole(DEFAULT_ADMIN_ROLE){
        masterNTT=_masterNTT;
    }
    /**
        @dev this function used to set biswapRouter address
        @param _biswapRouter address
     */
    function setbiswapRouter(address _biswapRouter)external onlyRole(DEFAULT_ADMIN_ROLE){
        biswapRouter =_biswapRouter;
    }
    /**
        @dev this function used to set ApeswapRouter address
        @param _ApeswapRouter address
     */
    function setApeswapRouter(address _ApeswapRouter)external onlyRole(DEFAULT_ADMIN_ROLE){
        ApeswapRouter = _ApeswapRouter;
    }
    /**
        @dev this function used to set pancakeRouter address
        @param _pancakeRouter address
     */
    function setpancakeRouter(address _pancakeRouter)external onlyRole(DEFAULT_ADMIN_ROLE){
        pancakeRouter = _pancakeRouter;
    }
    /**
        @dev this function used to set TeamAddress address
        @param _TeamAddress address
     */
    function setTeamAddress(address _TeamAddress)external onlyRole(DEFAULT_ADMIN_ROLE){
        TeamAddress = _TeamAddress;
    }
    /**
        @dev this function used to set MasterChef address
        @param _MasterChef address
     */
    function setMasterChef(address _MasterChef)external onlyRole(DEFAULT_ADMIN_ROLE){
        MasterChef = _MasterChef;
    }
    /**
        @dev this function used to set blacklist address
        @param _blacklist address
     */
    function setBlacklist(address _blacklist) external onlyRole(DEFAULT_ADMIN_ROLE){
        Blacklist = _blacklist;
    }
    /**
        @dev this function used to set Liquidity Provider address
        @param _liquidityProvider address
     */
    function setLiquidityProvider(address _liquidityProvider) external onlyRole(DEFAULT_ADMIN_ROLE){
        liquidityProvider = _liquidityProvider;
    }
    /**
        @dev this function is used to set USDy-BUSD Liuidity Rebalancer address
        @param _USDyBUSDRebalancer address
     */
    function setUSDyBUSDRebalancer(address _USDyBUSDRebalancer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        USDyBUSDRebalancer = _USDyBUSDRebalancer;
    }

     /**
        @dev this function is used to set BSHARE-BUSD Liuidity Rebalancer address
        @param _BSHAREBUSDRebalancer address
     */
     function setBSHAREBUSDRebalancer(address _BSHAREBUSDRebalancer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        BSHAREBUSDRebalancer = _BSHAREBUSDRebalancer;
    }

     /**
        @dev this function is used to set BUSD Vault address
        @param _BUSDVault address
     */
    function setBUSDVault(address _BUSDVault) external onlyRole(DEFAULT_ADMIN_ROLE) {
        BUSDVault = _BUSDVault;

    }
    function setBuyBackActivation(bool _value) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || hasRole(BUYBACKACTIVATION_ROLE, msg.sender) ||
        msg.sender == operator,"Do not have role");
        buyBackActivation = _value;
        buyBackActivationEpoch = lastEpoch;
        if(!_value && hasRole(DEFAULT_ADMIN_ROLE, msg.sender)){
            buyBackOwnerActivation = true;
        }else if(hasRole(DEFAULT_ADMIN_ROLE, msg.sender)){
            buyBackOwnerActivation = false;
        }
    }

    function setLastEpoch() external{
        require(msg.sender == operator || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),"only operator can call");
        lastEpoch = block.timestamp;
    } 

    function setEpochDuration(uint _time) external onlyRole(DEFAULT_ADMIN_ROLE){
        epochDuration = _time;
    }

    function setUSDyBUSD(address _usdyBusd) external onlyRole(DEFAULT_ADMIN_ROLE){
        USDyBUSD = _usdyBusd;
    }

    function setBuyBackActivationEpoch() public{
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || hasRole(BUYBACKACTIVATION_ROLE, msg.sender) ||
        msg.sender == operator,"Do not have role");
        buyBackActivationEpoch = lastEpoch;
    }

    function setCustomVaultMaster(address _customVaultMaster) external onlyRole(DEFAULT_ADMIN_ROLE) {
        customVaultMaster = _customVaultMaster;
    }

    function setBuyBackActivationRole(address buyBackActivationRole) external onlyRole(DEFAULT_ADMIN_ROLE){
        _setupRole(BUYBACKACTIVATION_ROLE, buyBackActivationRole);
    }

    function removeBuyBackActivationRole(address buyBackActivationRole) external onlyRole(DEFAULT_ADMIN_ROLE){
        _revokeRole(BUYBACKACTIVATION_ROLE, buyBackActivationRole);
    }
    function setClaimStakeAll(address _claimStakeAll) external onlyRole(DEFAULT_ADMIN_ROLE){
        claimStakeAll = _claimStakeAll;
    }

    function updateBuyBack() external{
        require(msg.sender == operator,"only operator can call");
        address[] memory path = new address[](2);
        path[0] = USDy;
        path[1] = BUSD;
        if (buyBackActivation) {
            if (
                buyBackActivationEpoch + (3 * epochDuration) <
                block.timestamp
            ) {
                98 * 10**16 <=
                    IUniswapV2Router02(ApeswapRouter).getAmountsOut(10**18, path)[1]
                    ? setBuyBackActivation(false)
                    : setBuyBackActivationEpoch();
            }
        }else{
            if (
                !buyBackOwnerActivation &&
                buyBackActivationEpoch + (3 * epochDuration) <
                block.timestamp &&
                98 * 10**16 >
                IUniswapV2Router02(ApeswapRouter).getAmountsOut(10**18, path)[1]
            ) {
                setBuyBackActivation(true);
            }
        }
    } 

    function setDefenderOperator(address _operator) external onlyRole(DEFAULT_ADMIN_ROLE){
        operator = _operator;
    }

    function setDAI(address _dai) external onlyRole(DEFAULT_ADMIN_ROLE){
        DAI =_dai;
    }

    function setUSDT(address _usdt) external onlyRole(DEFAULT_ADMIN_ROLE){
        USDT =_usdt;
    }

    function setUSDC(address _usdc) external onlyRole(DEFAULT_ADMIN_ROLE){
        USDC =_usdc;
    }

    function setDAIVault(address _daivault) external onlyRole(DEFAULT_ADMIN_ROLE){
        DAIVault =_daivault;
    }

    function setUSDTVault(address _usdtvault) external onlyRole(DEFAULT_ADMIN_ROLE){
        USDTVault =_usdtvault;
    }

    function setUSDCVault(address _usdcvault) external onlyRole(DEFAULT_ADMIN_ROLE){
        USDCVault =_usdcvault;
    }
}