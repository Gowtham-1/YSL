// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "../Interfaces/IWhitelist.sol";
import "../Interfaces/IReceipt.sol";
import "../Interfaces/IReferral.sol";
import "../Interfaces/IAdmin.sol";
import "../Interfaces/IEvents.sol";
import "../Interfaces/IBlacklist.sol";
import "../Interfaces/IPhoenixNFT.sol";
/**
@dev This contract is for YSL-BUSD vault.
 */
contract YSLBUSDVault is Initializable, ReentrancyGuard, Pausable, IEvents {
    using SafeERC20 for IERC20;

    uint256 public depositTax; //setting deposit tax as uint
    uint256 public withdrawTax; // uint of withdraw tax
    uint256 public exchangeRatio; //setting exchange ratio as uint
    uint256 public currentReward;
    uint256 public percentYSL;
    address public router;// router address
    address public yslBUSD_A;//Reciept address
    address public yslBUSD;//Pair address
    address public BUSD;
    bool public completePause;
    uint public totalDeposit;


    mapping(address => uint256) public ss;
    mapping(address => uint256) public UserDeposit;
    mapping(address => uint) public restrictTransfer; // last block number when interacted
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;
    IAdmin public Admin;
    mapping(uint256 => uint256) public epochReward;
    address public USDy;
    address public YSL;
    /**
    @dev one time call while deploying
    */

    function initialize(address _admin, address _lp) external initializer {
        Admin = IAdmin(_admin);
        yslBUSD = _lp;
        router = Admin.ApeswapRouter();
        yslBUSD_A = Clones.clone(Admin.masterNTT());
        IReceipt(yslBUSD_A).initialize(_admin,address(this), "YSL-LP", "YSL-LP");
        depositTax = 10;
        exchangeRatio = 10**18;
        BUSD = Admin.BUSD();
        USDy = Admin.USDy();
        YSL = Admin.YSL();
    }

    modifier _isAdmin() {
        require(Admin.hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
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

    modifier _securityCheck(address user, address sendto){
        require(!(IBlacklist(Admin.Blacklist()).getAddresses(msg.sender)), "YSLBUSDVault:Blacklisted");
        require(IWhitelist(Admin.whitelist()).getAddresses(msg.sender) || user == msg.sender,"YSLBUSDVault:InValidAddress");
        if(_isContract(msg.sender)){
            require(IWhitelist(Admin.whitelist()).getAddresses(msg.sender),"YSLBUSDVault:ExternalInteraction");
        }
        if(!IWhitelist(Admin.whitelist()).getAddresses(user)) {
            require(restrictTransfer[user] != block.number, "YSLBUSDVault:SameBlock");
        }
        _;
    }

    /**
    @dev Deposit Function used for depositing LP token.
    @param user , User address as parameter.
    @param amount , amount of LP as parameter.
     */
    function deposit(address user, uint amount,bool isBUSD) nonReentrant external _lastExchangeRatio _completePause whenNotPaused _securityCheck(user,user){
        require(amount > 0,"YSLBUSDVault:0");
        require(isBUSD,"YSLBUSDVault:BUSD");
        if(rewards(user)[0] > 0){
            _claimRebaseReward(user);
        } else {
            ss[user] = currentReward;
        }

        IERC20(BUSD).safeTransferFrom(user, address(this), amount);
        _tax(amount);

        uint reserveYSL = IERC20(YSL).balanceOf(address(yslBUSD));
        uint reservesBUSD = IERC20(BUSD).balanceOf(address(yslBUSD));
        uint YSLRequire = (reserveYSL * amount * 30)/(reservesBUSD * 100);
        uint USDyLiquidity = (IERC20(USDy).balanceOf(Admin.USDyBUSD()) * (amount * 1/2)/ IERC20(BUSD).balanceOf(Admin.USDyBUSD()));
        uint USDyPrice  = IReceipt(USDy).mintByPrice();
        uint USDyAmount;
        if (IERC20(YSL).balanceOf(address(this)) >= YSLRequire) {
            percentYSL = 30;
            USDyAmount = ((2 * amount * (10**18)) / USDyPrice);
            IReceipt(USDy).mint(
                address(this),
                USDyLiquidity + USDyAmount
            );
            _convertBUSDToLP(
                (amount * percentYSL) / 100,
                (reserveYSL * ((amount * percentYSL) / 100)) / reservesBUSD,
                BUSD,
                YSL
            );
        } else {
            percentYSL = 15;
            USDyAmount = (amount * (10**18)) / USDyPrice;
            address[] memory path = new address[](2);
            path[0] = BUSD;
            path[1] = YSL;
            IERC20(BUSD).safeApprove(router, ((amount * percentYSL) / 100));
            _swap(((amount * percentYSL) / 100), path, address(this));
            reserveYSL = IERC20(YSL).balanceOf(address(yslBUSD));
            reservesBUSD = IERC20(BUSD).balanceOf(address(yslBUSD));
            IReceipt(USDy).mint(
                address(this),
                USDyLiquidity + ((amount * (10**18)) / USDyPrice)
            );
            if (
                IERC20(YSL).balanceOf(address(this)) <=
                (reserveYSL * amount * percentYSL) / (reservesBUSD * 100)
            ) {
                _convertBUSDToLP(
                    (reservesBUSD *
                        IERC20(YSL).balanceOf(address(this))) /
                        reserveYSL,
                    IERC20(YSL).balanceOf(address(this)),
                    BUSD,
                    YSL
                );
            } else {
                _convertBUSDToLP(
                    (amount * percentYSL) / 100,
                    (reserveYSL * amount * percentYSL) / (reservesBUSD * 100),
                    BUSD,
                    YSL
                );
                IReceipt(YSL).burn(
                    address(this),
                    IERC20(YSL).balanceOf(address(this))
                );
            }
        }
        _convertBUSDToLP((amount * 1/2), USDyLiquidity,BUSD, USDy);
        IERC20(BUSD).safeTransfer(Admin.TeamAddress(), IERC20(BUSD).balanceOf(address(this)));
        exchangeRatio = exchangeRatio == 0 ? 10 ** 18 : exchangeRatio;
        restrictTransfer[msg.sender]= block.number;
        IReceipt(yslBUSD_A).mint(address(this),(USDyAmount * (100 - depositTax) * (10 ** 18))/ (exchangeRatio * 100));
        totalDeposit += USDyAmount;
        UserDeposit[user] += (USDyAmount * (100 - depositTax) * (10 ** 18))/ (exchangeRatio * 100);
        exchangeRatio = totalDeposit * (10 ** 18)/(IERC20(yslBUSD_A).totalSupply());
        emit Deposit("YSLBUSD Vault",address(this),user,amount,block.number,block.timestamp);
    }

    function withdraw(address user,uint _amount,address sendTo) external whenNotPaused{
        require(!Admin.buyBackActivation(),"Cannot withdraw while buyBack");
        _withdraw(user, _amount, sendTo);
    }

    function distribute(uint256 _rebaseReward) external nonReentrant{
        require(msg.sender == Admin.USDyVault());
        if(IERC20(yslBUSD_A).totalSupply() != 0){
            currentReward = currentReward + ((_rebaseReward * 10 ** 18)/(IERC20(yslBUSD_A).totalSupply()));
        }
        epochReward[block.timestamp] = currentReward;
    }

    /**
    @dev Setter Function for depositTax
    @param _depositTax , depositTax amount as parameter.
    */
    function setDepositTax(uint _depositTax) external _isAdmin {
        require(_depositTax != 0, "TaxZero");
        emit SetterForUint(
            "YSLBUSDVault",
            address(this),
            depositTax,
            _depositTax,
            block.number,
            block.timestamp
        );
        depositTax = _depositTax;
    }

    function setWithdrawTax(uint _withdrawTax) external _isAdmin {
        require(_withdrawTax != 0, "Taxzero");
        withdrawTax = _withdrawTax;
    }

    function setPause(bool _isPaused) external nonReentrant _isAdmin{
        _isPaused == true? _pause() : _unpause();
    }

    function setCompletePause(bool _completePause) external nonReentrant _isAdmin{
        completePause = _completePause;
    }

    function setRouter(address _router) external _isAdmin {
        require(_router != address(0), "YSL-BUSD:InvalidData");
        router = _router;
    }

    function emergencyWithdraw() external{
        require(!Admin.buyBackActivation(),"YSL-BUSD: Can't withdraw");
        require(UserDeposit[msg.sender] != 0,"YSL-BUSD: Nothing to withdraw");
        _withdraw(msg.sender, UserDeposit[msg.sender], msg.sender);
    }

    function setyslBUSD(address _yslBUSD) external _isAdmin {
        require(_yslBUSD != address(0), "YSL-BUSD:InvalidData");
        yslBUSD = _yslBUSD;
    }

    /**
    @dev The user can get Bshare Receipt token  by calling this function
    */
    function receiptToken() external view returns(address){
        return yslBUSD_A;
    }    



    function claimReward(address user) public nonReentrant whenNotPaused _completePause _securityCheck(user,user){
        _claimRebaseReward(user);
    }

    /**
    @dev The user will get his rewards through this function 
    @param user, address of user 
    */
    function rewards(address user) public view returns (uint[] memory reward){
        uint rewardShare = ss[user];
        uint epoch;
        uint epochDuration = Admin.epochDuration();
        reward = new uint[](2);
        IPhoenixNFT PhoenixNFT = IPhoenixNFT(Admin.PhoenixNFT());
        if(address(PhoenixNFT) != address(0) && IReceipt(address(PhoenixNFT)).balanceOf(user) >= 1){
            if(block.timestamp > (PhoenixNFT.MintTimestamp(PhoenixNFT.Won(msg.sender)) + (PhoenixNFT.expiryTime() * epochDuration))){
                uint m = (Admin.lastEpoch() - (PhoenixNFT.MintTimestamp(PhoenixNFT.Won(msg.sender))) + (PhoenixNFT.expiryTime() * epochDuration)) % epochDuration;
                uint y = epochDuration - m;
                epoch = (PhoenixNFT.MintTimestamp(PhoenixNFT.Won(msg.sender)) + (PhoenixNFT.expiryTime() * epochDuration)) - y;
                reward[0] = (UserDeposit[user] * (epochReward[epoch] - rewardShare)) / 10 **18;
                reward[1] = (reward[0] / 4);
                reward[0] = (reward[0] + (reward[0] / 4));
                rewardShare = epochReward[epoch];
                reward[0] += (UserDeposit[user] * (currentReward - rewardShare)) / 10 **18;
            }
            else{
                epoch = Admin.lastEpoch();
                reward[0] = (UserDeposit[user] * (epochReward[epoch] - ss[user])) / 10 **18;
                reward[1] = (reward[0] / 4);
                reward[0] = (reward[0] + (reward[0] / 4));
            }
        }
        else{
            reward[0] = (UserDeposit[user] * (currentReward - rewardShare)) / 10 **18;
        }

    }

    /**
    @dev Withdraw Function used for Withdrawal of Reciept.
    @param user , user address as parameter.
    @param _amount ,withdraw amount as parameter.
    */
    function _withdraw(address user,uint _amount,address sendTo) nonReentrant internal _lastExchangeRatio _completePause _securityCheck(user,sendTo){
        require(_amount <= UserDeposit[user],"YSL-BUSD:InvalidData");
        if(rewards(user)[0] > 0){
            _claimRebaseReward(user);
        }
        
        uint balance = (_amount * exchangeRatio)/10 ** 18;
        IERC20(USDy).safeTransfer(sendTo,balance * (100- withdrawTax)/100); 
        totalDeposit -= balance * (100- withdrawTax)/100;
        IReceipt(yslBUSD_A).burn(address(this),_amount);
        UserDeposit[user] -= _amount;
        restrictTransfer[msg.sender]= block.number;
        exchangeRatio = totalDeposit * (10 ** 18)/(IERC20(yslBUSD_A).totalSupply());
        emit Withdraw("YSLBUSD Vault",address(this),user, _amount,block.number,block.timestamp);     
    }

    function _tax(uint amount) internal{
        address[] memory path = new address[](2);
        path[0] = USDy;
        path[1] = BUSD;
        if (Admin.buyBackActivation()) {
            if (
                Admin.buyBackActivationEpoch() + (3 * Admin.epochDuration()) <
                block.timestamp
            ) {
                98 * 10**16 <=
                    IUniswapV2Router02(router).getAmountsOut(10**18, path)[1]
                    ? Admin.setBuyBackActivation(false)
                    : Admin.setBuyBackActivationEpoch();
            }
            IERC20(BUSD).safeApprove(router, (amount * 20 * 75) / 10000);
            IERC20(BUSD).safeTransfer(
                Admin.TeamAddress(),
                (amount * 20 * 25) / 10000
            );
            path[0] = BUSD;
            path[1] = USDy;
            uint amountOut = IUniswapV2Router02(router)
                .swapExactTokensForTokens(
                    (amount * 20 * 75) / 10000,
                    0,
                    path,
                    address(this),
                    block.timestamp + 1000
                )[path.length - 1];
            IReceipt(USDy).burn(address(this), amountOut);
        } else {
            if (
                !Admin.buyBackOwnerActivation() &&
                Admin.buyBackActivationEpoch() + (3 * Admin.epochDuration()) <
                block.timestamp &&
                98 * 10**16 >
                IUniswapV2Router02(router).getAmountsOut(10**18, path)[1]
            ) {
                Admin.setBuyBackActivation(true);
            }
            IERC20(BUSD).safeTransfer(Admin.Treasury(), amount / 10);
            IReceipt(Admin.bYSL()).calculateProtocolPrice();
            (uint256 BUSDAmount, uint256 leftAmount) = IReferral(
                Admin.Refferal()
            ).rewardDistribution(msg.sender, (amount * 9) / 100, amount);
            if (BUSDAmount != 0) {
                IERC20(BUSD).safeTransfer(msg.sender, (amount * 1) / 100);
                IERC20(BUSD).safeTransfer(Admin.Refferal(), BUSDAmount);
            } else {
                IERC20(BUSD).safeTransfer(
                    Admin.TeamAddress(),
                    (amount * 1) / 100
                );
            }
            if (leftAmount != 0) {
                IERC20(BUSD).safeTransfer(Admin.TeamAddress(), leftAmount);
            }
        }
    }

    function _convertBUSDToLP(
        uint amountBUSD,
        uint amountToken2,
        address path0,
        address path1
    ) internal {
        IERC20(path0).approve(router, amountBUSD);
        IERC20(path1).approve(router, amountToken2);
        IUniswapV2Router02(router).addLiquidity(
            path0,
            path1,
            amountBUSD,
            amountToken2,
            1,
            1,
            Admin.Treasury(),
            block.timestamp + 1678948210
        );
    }

    function _swap(
        uint256 amount,
        address[] memory path,
        address sendTo
    ) internal returns (uint) {
        uint amountOut = IUniswapV2Router02(router).swapExactTokensForTokens(
            amount,
            0,
            path,
            sendTo,
            block.timestamp + 1000
        )[path.length - 1];
        return amountOut;
    }

    function _claimRebaseReward(address user) internal  {
        if(rewards(user)[1] > 0){
            IReceipt(Admin.USDy()).mint(address(this),rewards(user)[1]);
        }
        IERC20(Admin.USDy()).safeTransfer(user, rewards(user)[0]);
        ss[user] = currentReward;
    }

    function _isContract(address _addr) internal view returns (bool) {
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }

    function getBalance(address user) external view returns(uint) {
        return (UserDeposit[user] * exchangeRatio)/10**18;
    }
}
