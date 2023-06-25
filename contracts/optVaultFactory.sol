// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";
import "./Interfaces/IAdmin.sol";
import "./Interfaces/IOptVault.sol";
import "./Interfaces/ISingleVault.sol";
import "./Interfaces/ILPVault.sol";
import "./Interfaces/IReceipt.sol";
import "./Interfaces/IEvents.sol";
import "./Interfaces/IPhoenixNFT.sol";
import "./Interfaces/IOpt1155.sol";

contract OptVaultFactory is Initializable, KeeperCompatibleInterface, ReentrancyGuard,IEvents {
    using SafeERC20 for IERC20;

    struct UserInfo {
        uint256 time;
        bool phoenixNFTStatus;
        nftStatus NFT;
        uint256 amount;
    }
    enum  nftStatus {
        NOT_MINTED,
        ACTIVE
    }

    struct PoolInfo {
        IERC20 token;
        address vault;
        address recieptInstance;
        bool status;
        bool isLp;
        bool isAuto;
        bool isCustomVault;
        uint32[] multiplier;
    }

    enum LiqStatus {
        SWAP_WANT_TO_BUSD,
        CONTROLLER_FEE,
        OPTIMIZATION_TAX,
        OPTIMIZATION_REWARDS
    }
    LiqStatus public liqStatusValue; // enum

    uint256 public BUSDCollected;
    uint256 public controllerFee;
    uint256 counter;
    uint256 epochTime;
    address public masterNTT;
    address public ApeswapRouter;
    address public distributor; // address of distributor
    address public OptVault; // address of Optvault
    address public OptVaultAuto; // address of OptvaultAuto
    address public OptVaultLp; // address of OptVaultLP
    address public router; // Router address
    address public YSL; // address of YSL
    address public owner;// address of the owner
    IAdmin public Admin; // address of Admin

    uint public interval;  /** Use an interval in seconds and a timestamp to slow execution of Upkeep */
    uint public lastTimeStamp;

    PoolInfo[] public poolInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo; //PID => user => info
    mapping(address => uint256) public PIDsOfRewardVault; //token => pid

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    modifier isActive(uint256 _pid) {
        require(poolInfo[_pid].status, "OptVaultFactory: Pool is diactivated");
        _;
    }
    

    modifier externalDefence() {
        require(
            !_isContract(msg.sender),
            "OptVaultFactory: Not reliable external call"
        );
        _;
    }
    modifier _isAdmin(){
        require(Admin.hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        _;
    }
    
    function initialize(
        address _owner,
        address _Admin,
        address _optVault,
        address _optVaultLp,
        address _optVaultAuto,
        uint256 updateInterval
    ) external initializer {
        owner = _owner;
        Admin = IAdmin(_Admin);
        OptVault = _optVault;
        OptVaultLp = _optVaultLp;
        masterNTT = Admin.masterNTT();
        ApeswapRouter = Admin.ApeswapRouter();
        OptVaultAuto = _optVaultAuto;
        liqStatusValue = LiqStatus.SWAP_WANT_TO_BUSD;
        interval = updateInterval;
        lastTimeStamp = block.timestamp;
        epochTime = 1 hours;
    }

    /** 
        @dev Add a new lp or token to the pool. Can only be called by the owner.
        XXX DO NOT add the same LP token more than once. Rewards , will be messed up if you do.
    */

    function add(
        IERC20 _token,
        address _want,
        string memory _name,
        string memory _symbol,
        bool isLpToken,
        bool isAuto,
        address _smartChef,
        uint32[] memory _multiplier
    ) nonReentrant external _isAdmin returns (address) {
        require(PIDsOfRewardVault[address(_token)] == 0,"OptVaultFactory : Vault for this token exists");
        address instance = Clones.clone(masterNTT);
        address strat;
        if(isLpToken){
            strat = Clones.clone(OptVaultLp);
        }else if(isAuto){
            strat = Clones.clone(OptVaultAuto);
            require(_smartChef != address(0),"invalid smartChef");
            IOptVault(strat).setRole(address(Admin));
            IOptVault(strat).setPoolDetails(_smartChef,_want);
        }else{
            strat = Clones.clone(OptVault);
        }
        PoolInfo memory pool = PoolInfo(_token,strat,instance,true,isLpToken,isAuto,false,_multiplier);
        poolInfo.push(pool);
        IOptVault(strat).initialize(poolInfo.length, address(_token), _want, address(Admin));
        IOptVault(strat).setreciept(instance);
        IReceipt(instance).initialize(address(Admin), strat, _name, _symbol); 
        PIDsOfRewardVault[address(_token)] = poolInfo.length-1;
        IOpt1155(IAdmin(Admin).Opt1155()).createNFTForVault(poolInfo.length, _name);
        emit OptAdd(address(_token),isLpToken,isAuto,_smartChef,strat,instance,block.number,block.timestamp);
        return (instance);
    }
    function setMultipliersLevel(address _token,uint32[] calldata _multiplier,uint32[] memory deductionValue) external _isAdmin{
        require(_multiplier.length ==  deductionValue.length,"OptVaultFactory : Invalid length ");
        uint256 id = PIDsOfRewardVault[_token];
            
            for(uint32 i; i <= _multiplier.length -1; i++){
                emit OptMultiplierLevel("optfactory",_token, _multiplier, deductionValue, block.number,block.timestamp);
                IOptVault(poolInfo[id].vault).setMultiplierLevel((i + 1),deductionValue[i]);
            }
    }
   
/**
@dev this function sets controller fee amount
 */

    function setControllerFee(uint256 _amount)
        external
        _isAdmin
    {
        require(_amount > 0, "OptVaultFactory: Invalid Amount");
        emit SetterForUint("Optfactory",address(this),controllerFee,_amount ,block.number,block.timestamp);
        controllerFee = _amount;
    }

    /**
        @dev this function used to set Multiplier address
        @param pid Give the pId
        @param _number Give the number
     */

    function setMultiplier(uint256 pid, uint32[] memory _number)
        external
        _isAdmin
    {
        emit OptMultiplier("optfactory",pid, _number,block.number,block.timestamp);
        poolInfo[pid].multiplier = _number;
    }

/**
@dev this function updates status of pool token
 */

    function changeStatus(address _token)
        external
        _isAdmin
    {
        uint256 id = PIDsOfRewardVault[_token];
        if (poolInfo[id].status) {
            poolInfo[id].status = false;
        } else {
            poolInfo[id].status = true;
        }

    }
    function deposit(address user,address _token,uint32 _level,uint256 _amount)
         external 
        isActive(PIDsOfRewardVault[_token])
    {   
        require(
            _amount >=
                 userInfo[PIDsOfRewardVault[_token]][user].amount,
            "OptVaultFactory: Invalid Amount"
        );
        if (IPhoenixNFT(IAdmin(Admin).PhoenixNFT()).balanceOf(user) > 0) {
            userInfo[PIDsOfRewardVault[_token]][user]
                .phoenixNFTStatus = true;
        }
        
        if (
            userInfo[PIDsOfRewardVault[_token]][user].NFT == nftStatus(0)
        ) { 
            IOpt1155(IAdmin(Admin).Opt1155()).mint(user, PIDsOfRewardVault[_token], 1);
            userInfo[PIDsOfRewardVault[_token]][user].NFT = nftStatus(1);
        }
        IOptVault(poolInfo[PIDsOfRewardVault[_token]].vault).deposit(user,_amount,_level,false);
        userInfo[PIDsOfRewardVault[_token]][user].time = block.timestamp;
        userInfo[PIDsOfRewardVault[_token]][user].amount += _amount;
        emit OptDeposit("Optfactory", address(this),user,_amount,_level ,block.number,block.timestamp);
        
    }

    function withdraw(address user,address _token,bool isReceipt,uint _recieptAmount, address sendTo)  external  {
        require(
            userInfo[PIDsOfRewardVault[_token]][user].NFT == nftStatus(1),
            "OptVault : Cannot find any deposit from this account"
        );
        IOptVault(poolInfo[PIDsOfRewardVault[_token]].vault).withdraw(user, isReceipt, _recieptAmount, sendTo);
        IOpt1155(IAdmin(Admin).Opt1155()).burn(user, PIDsOfRewardVault[_token], 1);
        userInfo[PIDsOfRewardVault[_token]][user].NFT = nftStatus(0);
        emit Optwithdraw("OptFactory",address(this),user,_recieptAmount ,block.number,block.timestamp);
    }

    /**
    @dev this function calculates APR , only called by Admin
     */
    function calculateAPR() nonReentrant internal  {
        require(
            liqStatusValue == LiqStatus.SWAP_WANT_TO_BUSD,
            "OptVault: Initialize your OptVault first"
        );
        BUSDCollected = 0;
        for (uint256 id = 0; id < poolInfo.length; id++) {
            if (poolInfo[id].status) {
                emit CalculateAPR((poolInfo[id].vault),IERC20(IAdmin(Admin).BUSD()).balanceOf(poolInfo[id].vault),block.number,block.timestamp);
                IOptVault(poolInfo[id].vault).swapWantToBUSD();
                BUSDCollected += IERC20(IAdmin(Admin).BUSD()).balanceOf(poolInfo[id].vault);
                emit BUSDcollected(BUSDCollected,block.number,block.timestamp);
            }
        }
        liqStatusValue = LiqStatus.CONTROLLER_FEE;
    }

    /**
    @dev calculating the controllerFee is only called by Admin
     */

    function calculateControllerFee() nonReentrant internal  {
        require(
            liqStatusValue == LiqStatus.CONTROLLER_FEE,
            "OptVault: Swap want to BUSD first"
        );
        for (uint256 id = 0; id < poolInfo.length; id++) {
            if (poolInfo[id].status) {
                uint256 amount = ((controllerFee) *
                    (IERC20(IAdmin(Admin).BUSD()).balanceOf(poolInfo[id].vault))) / BUSDCollected;
                
                IOptVault(poolInfo[id].vault).deductControllerFee(amount);
                emit ControllerFee((poolInfo[id].vault),amount,block.number,block.timestamp);
            }
        }
        liqStatusValue = LiqStatus.OPTIMIZATION_TAX;
    }

    function optimization() internal  {
        require(
            liqStatusValue == LiqStatus.OPTIMIZATION_TAX,
            "OptVault: Pay controller fee first"
        );
        for (uint256 id = 0; id < poolInfo.length; id++) {
            if (poolInfo[id].status) {
                IReceipt(IAdmin(Admin).USDy()).mint(Admin.temporaryHolding(), IERC20(IAdmin(Admin).BUSD()).balanceOf(poolInfo[id].vault));
                IOptVault(poolInfo[id].vault).collectOptimizationTax();
            }
        }
        liqStatusValue = LiqStatus.SWAP_WANT_TO_BUSD;

    }

    function optimizationRewards(address user,address _token)
       nonReentrant  external
    {   
        uint256 id = PIDsOfRewardVault[_token];
        if(msg.sender == user){
            user = msg.sender;
        }
        if (
            poolInfo[id].status &&
            block.timestamp <= userInfo[id][user].time + 30 days &&
            userInfo[id][user].phoenixNFTStatus
        ) {
            uint256 modulus = (block.timestamp -
                userInfo[id][user].time) / epochTime;
            IOptVault(poolInfo[id].vault).optimizationReward(user,
                ((poolInfo[id].multiplier[(IOptVault(poolInfo[id].vault).UserLevel(user))-1] +
                    ((poolInfo[id].multiplier[(IOptVault(poolInfo[id].vault).UserLevel(user))-1]) * 25) /
                    100) * (80**modulus)) / (100**modulus)
                );   
        } else {
            if (
                poolInfo[id].status &&
                block.timestamp <= userInfo[id][user].time + 30 days
            ) {
                uint256 modulus = (block.timestamp -
                    userInfo[id][user].time) / epochTime;

                         IOptVault(poolInfo[id].vault).optimizationReward(user,
                ((poolInfo[id].multiplier[(IOptVault(poolInfo[id].vault).UserLevel(user))-1] +
                    ((poolInfo[id].multiplier[(IOptVault(poolInfo[id].vault).UserLevel(user))-1]) * 25) /
                    100) * (80**modulus)) / (100**modulus)
            );
            } else {
                if (
                    poolInfo[id].status &&
                    block.timestamp > userInfo[id][user].time + 30 days
                ) {
                    uint256 modulus = (block.timestamp -
                        userInfo[id][user].time) / epochTime;
                                 IOptVault(poolInfo[id].vault).optimizationReward(user,
                                                ((poolInfo[id].multiplier[(IOptVault(poolInfo[id].vault).UserLevel(user))-1] +
                                                        ((poolInfo[id].multiplier[(IOptVault(poolInfo[id].vault).UserLevel(user))-1]) * 25) /
                                                                100) * (80**modulus)) / (100**modulus)
                                                 );
                                 IOptVault(poolInfo[id].vault).optimizationReward(user,
                                            (100 * (80**(modulus - 90))) / (100**(modulus - 90))
                                                );
                            
                }
            }
        }

    }

    function checkUpkeep(bytes calldata /* checkData */) external view override returns (bool upkeepNeeded , bytes memory performData) {
        upkeepNeeded = (block.timestamp - lastTimeStamp) > interval;
        // We don't use the checkData in this example. The checkData is defined when the Upkeep was registered.
    }

    function performUpkeep(bytes calldata /* performData */) external override {
        //We highly recommend revalidating the upkeep in the performUpkeep function
        if ((block.timestamp - lastTimeStamp) > interval ) {
            lastTimeStamp = block.timestamp;
            calculateAPR();
            calculateControllerFee();
            optimization();
        }
        // We don't use the performData in this example. The performData is generated by the Keeper's call to your checkUpkeep function
    }

    function getPoolInfo(uint index) public view returns(address vaultAddress, bool isLP, address recieptInstance, IERC20 token,bool isCustomVault){
        return (poolInfo[index].vault, poolInfo[index].isLp, poolInfo[index].recieptInstance,poolInfo[index].token, poolInfo[index].isCustomVault);  
    }
    
    /**
    @dev check if passing address is contract or not

    @param _addr is the address to check 
     */
    function _isContract(address _addr) internal view returns (bool) {
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }
}
