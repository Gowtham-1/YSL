// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "../Interfaces/IBSHAREBUSDVault.sol";
import "../Interfaces/IxYSLBUSDVault.sol";
import "../Interfaces/IYSLBUSDVault.sol";
import "../Interfaces/IWhitelist.sol";
import "../Interfaces/IBlacklist.sol";
import "../Interfaces/IReceipt.sol";
import "../Interfaces/IEvents.sol";
import "../Interfaces/IAdmin.sol";

/**
@dev This contract is for USDy vault 
 */
contract USDyVault is Initializable, ReentrancyGuard, Pausable, IEvents {
    using SafeERC20 for IERC20;
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR"); //byte for minter role

    uint256 public exchangeRatio; // uint of exchange ratio
    uint256 public depositTax; // uint of deposit tax
    uint256 public withdrawTax; // uint of withdraw tax
    uint256 public currentTimestamp; // current time stamp as uint
    uint256 public rebaseRate; //cofficient by 100
    uint256 public epochTime; //setting epochtime as uint
    uint256[] public rebase_Reward; // divide all the value
    address public router; // address of router
    address public USDs; // address of USDs
    IAdmin public Admin; // Admin contract address
    bool public completePause;

    mapping(address => uint256) public ss;
    mapping(address => uint256) public UserDeposit;
    mapping(address => uint256) public restrictTransfer; // last block number when interacted
    mapping(address => uint256) public getAPR;
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    modifier _isAdmin() {
        require(Admin.hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        _;
    }

    modifier _isAdminOrOperator() {
        require(
            Admin.operator() == msg.sender ||
                Admin.hasRole(DEFAULT_ADMIN_ROLE, msg.sender)
        );
        _;
    }

    modifier _lastExchangeRatio() {
        uint256 lastExchangeRatio = exchangeRatio;
        _;
        if (lastExchangeRatio > exchangeRatio) {
            _pause();
        }
    }

    modifier _completePause(){
        require(completePause == false,"completely Paused");
        _;
    }

    /** 
    @dev one time call while deploying
    @param _admin Admin contract address
    */

    function initialize(address _admin)
        external
        initializer
    {
        Admin = IAdmin(_admin);
        USDs = Clones.clone(Admin.masterNTT());
        IReceipt(USDs).initialize(
            address(Admin),
            address(this),
            "USDy-S",
            "USDy-S"
        );
        currentTimestamp = block.timestamp;
        exchangeRatio = 10**18;
        depositTax = 10;
        withdrawTax = 10;
        rebaseRate = 110;
        epochTime = 8 hours; // note For testing 8 Hours = 10 seconds
        rebase_Reward = [10, 20, 10, 10, 10, 10, 10, 20, 10];
    }

    /**
    @dev deposit USDy-BUSD lp
    @param _amount amount to deposit 
     */

    function deposit(
        address user,
        uint256 _amount,
        bool isBUSD
    ) external nonReentrant _lastExchangeRatio whenNotPaused _completePause{
        require(!(IBlacklist(Admin.Blacklist()).getAddresses(msg.sender)), "USDyVault: address is Blacklisted");
        require(IWhitelist(Admin.whitelist()).getAddresses(msg.sender) || user == msg.sender);
        require(_amount > 0, "USDyVault: Deposit amount can't be zero");
        if(_isContract(msg.sender)){
            require(IWhitelist(Admin.whitelist()).getAddresses(msg.sender),"USDyVault: No external contract interaction");
        }
        if(!IWhitelist(Admin.whitelist()).getAddresses(user)) {
            require(restrictTransfer[user] != block.number, "USDyVault: you can't interact in same block");
        }
        IERC20(Admin.USDy()).safeTransferFrom(user, address(this), _amount);
        exchangeRatio = exchangeRatio == 0 ? 10**18 : exchangeRatio;
        IReceipt(USDs).mint(
            address(this),
            (_amount * (100 - depositTax) * (10**18)) / (exchangeRatio * 100)
        );
        UserDeposit[user] +=
            (_amount * (100 - depositTax) * (10**18)) /
            (exchangeRatio * 100);
        exchangeRatio =
            (IERC20(Admin.USDy()).balanceOf(address(this)) * (10**18)) /
            IReceipt(USDs).totalSupply();
        restrictTransfer[msg.sender] = block.number;
        emit Deposit(
            "USDyVault",
            address(this),
            msg.sender,
            _amount,
            block.number,
            block.timestamp
        );
    }

    function withdraw(address user,uint256 amount,address sendTo) external whenNotPaused{
        require(!Admin.buyBackActivation(),"Cannot withdraw while buyBack");
        _withdraw(user, amount, sendTo);
    }
    function emergencyWithdraw() external{
        require(!Admin.buyBackActivation(),"YSL-BUSD: Can't withdraw");
        require(UserDeposit[msg.sender] != 0,"YSL-BUSD: Nothing to withdraw");
        _withdraw(msg.sender, UserDeposit[msg.sender], msg.sender);
    }


    /**
    @dev Setter Function for depositTax
    @param _depositTax , depositTax amount as parameter.
    */

    function setDepositTax(uint256 _depositTax) external _isAdmin {
        require(_depositTax != 0, "Tax can't be zero");
        depositTax = _depositTax;
    }

    function setWithdrawTax(uint256 _withdrawTax) external _isAdmin {
        require(_withdrawTax != 0, "Tax can't be zero");
        withdrawTax = _withdrawTax;
    }

    /**
    NOTE for testing epoch is 1 hour, for main net epoch is 8 hours
    @dev The user can get its reBaseRewards  by calling this function
    */

    function rewards() external nonReentrant _isAdminOrOperator {

        require(
            block.timestamp >= epochTime + currentTimestamp,
            "USDyVault : Rebase happens only after this epoch"
        );
        require(rebaseRate > 0, "USDyVault : No rewards");
        uint256 mintReward = (IERC20(Admin.USDy()).balanceOf(address(this)) *
            rebaseRate) / 10**4;
        
        IReceipt(Admin.USDy()).mint(address(this), mintReward);
        IERC20(Admin.USDy()).safeTransfer(
            Admin.YSLBUSDVault(),
            (mintReward * rebase_Reward[5]) / rebaseRate
        );
        getAPR[Admin.YSLBUSDVault()] = (mintReward * rebase_Reward[5]) / rebaseRate;
        IERC20(Admin.USDy()).safeTransfer(
            Admin.xYSLBUSDVault(),
            (mintReward * rebase_Reward[6]) / rebaseRate
        );
        getAPR[Admin.xYSLBUSDVault()] = (mintReward * rebase_Reward[6]) / rebaseRate;
        IERC20(Admin.USDy()).safeTransfer(
            Admin.USDyBUSDVault(),
            (mintReward * rebase_Reward[7]) / rebaseRate
        );
        getAPR[Admin.USDyBUSDVault()] = (mintReward * rebase_Reward[7]) / rebaseRate;
        IERC20(Admin.USDy()).safeTransfer(
            Admin.BShareBUSDVault(),
            (mintReward * rebase_Reward[8]) / rebaseRate
        );
        getAPR[Admin.BShareBUSDVault()] = (mintReward * rebase_Reward[8]) / rebaseRate;

        IERC20(Admin.USDy()).safeTransfer(
            Admin.BUSDVault(),
            (mintReward * rebase_Reward[3]) / rebaseRate
        );
        getAPR[Admin.BUSDVault()] = (mintReward * rebase_Reward[3]) / rebaseRate;
        
        IERC20(Admin.USDy()).safeTransfer(
            Admin.DAIVault(),
            (mintReward * rebase_Reward[0]) / rebaseRate
        );

        getAPR[Admin.DAIVault()] = (mintReward * rebase_Reward[0]) / rebaseRate;
         IERC20(Admin.USDy()).safeTransfer(
            (Admin.USDCVault()),
            (mintReward * rebase_Reward[2]) / rebaseRate
        );

        getAPR[(Admin.USDCVault())] = (mintReward * rebase_Reward[2]) / rebaseRate;
         IERC20(Admin.USDy()).safeTransfer(
            Admin.USDTVault(),
            (mintReward * rebase_Reward[4]) / rebaseRate
        );

        getAPR[Admin.USDTVault()] = (mintReward * rebase_Reward[4]) / rebaseRate;
        /*
        *********Must uncomment while YSLVault xYSLVault will be deployed*****************
        // IERC20(Admin.USDy()).safeTransfer(
        //     Admin.YSLVault(),
        //     (mintReward * rebase_Reward[5]) / rebaseRate
        // );
        // IERC20(Admin.USDy()).safeTransfer(
        //     Admin.xYSLVault(),
        //     (mintReward * rebase_Reward[6]) / rebaseRate
        // );
        */
        
        IYSLBUSDVault(Admin.YSLBUSDVault()).distribute(
            (mintReward * rebase_Reward[5]) / rebaseRate
        );
        IYSLBUSDVault(Admin.xYSLBUSDVault()).distribute(
            (mintReward * rebase_Reward[6]) / rebaseRate
        );
        IYSLBUSDVault(Admin.USDyBUSDVault()).distribute(
            (mintReward * rebase_Reward[7]) / rebaseRate
        );
        IYSLBUSDVault(Admin.BShareBUSDVault()).distribute(
            (mintReward * rebase_Reward[8]) / rebaseRate
        );
        IYSLBUSDVault(Admin.BUSDVault()).distribute(
            (mintReward * rebase_Reward[3]) / rebaseRate
        );
        IYSLBUSDVault(Admin.DAIVault()).distribute(
            (mintReward * rebase_Reward[0]) / rebaseRate
        );

        IYSLBUSDVault(Admin.USDCVault()).distribute(
            (mintReward * rebase_Reward[2]) / rebaseRate
        );
        IYSLBUSDVault(Admin.USDTVault()).distribute(
            (mintReward * rebase_Reward[4]) / rebaseRate
        );

        getAPR[address(this)] = (mintReward * rebase_Reward[1]) / rebaseRate;
        /*
        *********Must uncomment while YSLVault xYSLVault will be deployed*****************
        // IYSLBUSDVault(Admin.YSLVault()).distribute(
        //     (mintReward * rebase_Reward[5]) / rebaseRate
        // );
        // IYSLBUSDVault(Admin.xYSLVault()).distribute(
        //     (mintReward * rebase_Reward[6]) / rebaseRate
        // );
        */

        currentTimestamp = block.timestamp;
    }

    /**
    @dev setting RebaseRate for USdy.
    @param rate, rate of rebase as parameter
    */

    function setRebaseRateUSDY(uint256 rate) external _isAdmin {
        require(rate > 0 && rate <= 300, "USDyVault: Invalid rate amount");
        emit SetterForUint(
            "USDyVault",
            address(this),
            rebaseRate,
            rate,
            block.number,
            block.timestamp
        );
        rebaseRate = rate;
    }

    /**
    @dev function to set Rebase Reward and rebase Reward sum
    @param _rebaseRewardSum reward as uint
    @param _rebaseReward as an array
    */

    function setRebaseRewardAndRebaseRewardSum(
        uint256 _rebaseRewardSum,
        uint256[] memory _rebaseReward
    ) external _isAdmin{
        require(_rebaseRewardSum > 0, "USDyVault: invalid _rebaseRewardSum");
        require(_rebaseReward.length > 0, "USDyVault: invalid _rebaseReward");
        uint256 total;
        for (uint256 i; i < _rebaseReward.length; i++) {
            total += _rebaseReward[i];
        }
        require(total == _rebaseRewardSum, "USDyVault: incorrect inputs");
        rebase_Reward = _rebaseReward;
    }

    function setRouter(address _router) external _isAdmin{
        require(_router != address(0),"YSL-BUSD: invalid data");
        router = _router;
    }
    function setEpochTime(uint256 _epochTime) external _isAdmin{
        require(_epochTime != 0,"YSL-BUSD: invalid data");
        epochTime = _epochTime;
    }

    function setPause(bool _isPaused) external nonReentrant _isAdmin{
        _isPaused == true? _pause() : _unpause();
    }

    function setCompletePause(bool _completePause) external nonReentrant _isAdmin{
        completePause = _completePause;
    }

    /**
    @dev The user can get Bshare Receipt token  by calling this function
    */

    function receiptToken() external view returns (address) {
        return USDs;
    }


    /**
    @dev withdraw amount from vault
    @param user , user address as parameter.
    @param amount ,withdraw amount as parameter.
    */

    function _withdraw(
        address user,
        uint256 amount,
        address sendTo
    ) internal nonReentrant _lastExchangeRatio _completePause{
        require(
            amount <= UserDeposit[user],
            "USDyVault : Your withdraw amount exceeds deposit"
        );
        require(!(IBlacklist(Admin.Blacklist()).getAddresses(msg.sender)), "USDyVault: address is Blacklisted");
        require(IWhitelist(Admin.whitelist()).getAddresses(msg.sender) || (sendTo == msg.sender && user == msg.sender),"USDyVault: No external contract interaction");
        if(_isContract(msg.sender)){
            require(IWhitelist(Admin.whitelist()).getAddresses(msg.sender),"USDyVault: No external contract interaction");
        }
        if(!IWhitelist(Admin.whitelist()).getAddresses(user)) {
            require(restrictTransfer[user] != block.number, "USDyVault: you can't interact in same block");
        }
        uint256 balance = (amount * exchangeRatio) / 10**18;
        IERC20(Admin.USDy()).safeTransfer(
            sendTo,
            (balance * (100 - withdrawTax)) / 100
        );
        IReceipt(USDs).burn(address(this), amount);
        UserDeposit[user] -= amount;
        restrictTransfer[msg.sender] = block.number;
        emit Withdraw(
            "USDyVault",
            address(this),
            user,
            amount,
            block.number,
            block.timestamp
        );
    }
    function _isContract(address _addr) internal view returns (bool){
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }

}