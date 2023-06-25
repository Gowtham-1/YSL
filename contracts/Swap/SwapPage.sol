// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../Interfaces/IProtocolOwnedLiquidity.sol";
import "../Interfaces/IAdmin.sol";
import "../Interfaces/IBYSL.sol";
import "../Interfaces/IEarlyAccess.sol";
import "../Interfaces/IReferral.sol";
import "../Interfaces/IReceipt.sol";

/**
@dev this contract is for swap page
 */
contract SwapPage is Initializable, Pausable {
    using SafeERC20 for IERC20;
    address public BUSD; //address of BUSD
    address public bYSL; // address of bYSL
    address public Treasury; // address of Treasury
    address public POL; // address of POL
    address public WETH; //address of WETH
    address public APE_SWAP_ROUTER_ADDRESS;
    uint256 public exit_Fees = 1000; //Tax multiply by 100
    uint256 public startTime;
    uint256 public lastBYSLSupply;
    uint256[] public exit_Fees_Allocation = [1000];
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    mapping(address => uint256) public transactionTimeLimit;
    IAdmin public Admin; // address of Admin

    uint256 [] public buyBack = [7500,2500]; //[buyBack and burn, team address]


    /**
 @dev an Initialize function 
 */
    function initialize(address _admin) external initializer {
        Admin = IAdmin(_admin);
        bYSL = Admin.bYSL();
    }

    /**
    @dev a modifier for Admin
 */
    modifier _isAdmin() {
        require(Admin.hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        _;
    }

    /**
    @dev function is used to purchase BYSl by providing BUSD
    @param givenToken address of token 
    @param amount amount as uint
     */
    function purchaseBYSL(address givenToken, uint256 amount) external whenNotPaused{
        require(amount > 0, "amount is greater than zero.");
        require(startTime != 0, "purchase yet to start");
        if (
            startTime +
                (IEarlyAccess(Admin.EarlyAccess()).top() * 1 hours) >=
            block.timestamp
        ) {
            require(
                (IEarlyAccess(Admin.EarlyAccess()).Won(msg.sender) != 0) &&  (startTime +
                    ((IEarlyAccess(Admin.EarlyAccess()).Won(msg.sender) -
                        1) * 1 hours) <=
                    block.timestamp)
                    ,
                "no access to purchase"
            );
        }
        if (givenToken == Admin.BUSD()) {
            IERC20(Admin.BUSD()).safeTransferFrom(
                msg.sender,
                address(this),
                amount
            );
        } else {
            IERC20(givenToken).safeTransferFrom(
                msg.sender,
                address(this),
                amount
            );
            IERC20(givenToken).approve(Admin.ApeswapRouter(), amount);
            address[] memory path = new address[](2);
            path[0] = givenToken;
            path[1] = Admin.BUSD();
            amount = IUniswapV2Router02(Admin.ApeswapRouter())
                .swapExactTokensForTokens(
                    amount,
                    0,
                    path,
                    address(this),
                    block.timestamp + 1000
                )[1];
        }
        tax(amount);
        IERC20(Admin.BUSD()).safeTransfer(
            Admin.TeamAddress(),
            ((amount * 9) / 20)
        );
        IERC20(Admin.BUSD()).safeTransfer(
            Admin.Treasury(),
            ((amount * 9) / 20)
        );
        uint256 ProtocolPricebYSL = ((((amount * 9) / 10) * (10**18)) /
            (IBYSL(bYSL).calculateProtocolPrice())); //Divide by 10**18 for testing
        IBYSL(Admin.bYSL()).mint(msg.sender, ProtocolPricebYSL);
        lastBYSLSupply += ProtocolPricebYSL;
        if(lastBYSLSupply != IBYSL(Admin.bYSL()).totalSupply()){
            _pause();
        }
    }

    function setStartTime(uint256 _startTime) external {
        require(
            msg.sender == Admin.EarlyAccess() || msg.sender == Admin.operator()
        );
        startTime = _startTime;
    }

    /**
    @dev function to sell bysl via swappage contract
    @param wantToken address of desired token
    @param amount amount for token as uint
     */
    function sellBYSLviaSWAP(address wantToken, uint256 amount) external whenNotPaused{
        require(amount > 0, "Amount cannot be zero");
        uint256 leftAmount;
        IProtocolOwnedLiquidity(Admin.POL()).sellBYSL(msg.sender, amount);
        lastBYSLSupply -= amount;
        if(lastBYSLSupply != IBYSL(Admin.bYSL()).totalSupply()){
            _pause();
        }
        amount = IERC20(Admin.BUSD()).balanceOf(address(this));
        tax(amount);
        uint BUSDAmount = (amount * 9) / 10;
        if (wantToken == Admin.BUSD()) {
            IERC20(Admin.BUSD()).safeTransfer(
                msg.sender,
                BUSDAmount
            );
        } else {
            address[] memory path = new address[](2);
            path[0] = Admin.BUSD();
            path[1] = wantToken;
            IERC20(Admin.BUSD()).safeApprove(Admin.ApeswapRouter(),amount);
            IUniswapV2Router02(Admin.ApeswapRouter()).swapExactTokensForTokens(
                amount,
                0,
                path,
                msg.sender,
                block.timestamp + 1000
            );
        }
    }

    /**
    @dev set tax and allocation points

    @param ExitFees total tax
    @param allocationExitFees array of allocation point

    Note allocation point should be equal to tax
        all the values should enter with 100 cofficient
        only admin can call 
     */
    function setbYSLAndAllocationTax(
        uint256 ExitFees,
        uint256[] memory allocationExitFees
    ) external _isAdmin {
        require(ExitFees > 0, "bYSL: Tax Should be greater than Zero");
        require(
            allocationExitFees.length > 0,
            "bYSL: AllocationTax should not be empty"
        );
        uint256 total;
        for (uint256 i; i < allocationExitFees.length; i++) {
            total += allocationExitFees[i];
        }
        require(
            total == ExitFees,
            "bYSL: Tax not equal to sum of allocation tax"
        );
        exit_Fees = ExitFees;
        exit_Fees_Allocation = allocationExitFees;
    }

    function unpause() public _isAdmin{
        _unpause();
    }

    function tax(uint amount) internal{
        address[] memory path = new address[](2);
        path[0] = Admin.USDy();
        path[1] = Admin.BUSD();
        if(Admin.buyBackActivation()){
            IERC20(address(this)).approve(Admin.ApeswapRouter(), amount/10); //BSC Testnet pancake router address
            if(Admin.buyBackActivationEpoch() + (3 * Admin.epochDuration()) < block.timestamp) {
                    98 * 10**16 <= IUniswapV2Router02(Admin.ApeswapRouter()).getAmountsOut(10**18,path)[1] ? 
                        Admin.setBuyBackActivation(false) : Admin.setBuyBackActivationEpoch();
                }
            IERC20(Admin.BUSD()).safeTransfer( Admin.TeamAddress(),IReceipt(Admin.BUSD()).balanceOf(address(this)) * buyBack[1] / 10000);
            path[0] = Admin.BUSD();
            path[1] = Admin.USDy();
            IUniswapV2Router02(Admin.ApeswapRouter()).swapExactTokensForTokens( 
                IReceipt(Admin.BUSD()).balanceOf(address(this)) * buyBack[0] / 10000,
                0,
                path,
                address(this),
                block.timestamp + 1000
                )[path.length - 1];
            IReceipt(Admin.USDy()).burn(address(this),IReceipt(Admin.USDy()).balanceOf(address(this)));
        } else {
            if(!Admin.buyBackOwnerActivation() && Admin.buyBackActivationEpoch() + (3 * Admin.epochDuration()) < block.timestamp &&
                98 * 10**16 > IUniswapV2Router02(Admin.ApeswapRouter()).getAmountsOut(10**18,path)[1]) {
                        Admin.setBuyBackActivation(true);
                }
            (uint256 BUSDAmount, uint256 leftAmount) = IReferral(Admin.Refferal()).rewardDistribution
                            (msg.sender,(amount * 9) / 100,amount); 
            if (BUSDAmount != 0) {
                IERC20(Admin.BUSD()).transfer(msg.sender, (amount * 1) / 100);
                IERC20(Admin.BUSD()).transfer(Admin.Refferal(), BUSDAmount);
            }else{
                IERC20(Admin.BUSD()).transfer(Admin.TeamAddress(), (amount * 1) / 100);
            }
            if (leftAmount != 0) {
                IERC20(Admin.BUSD()).transfer(Admin.TeamAddress(), leftAmount);
            }     
        }
    }

    function setBuyBack(uint[] memory _buyBack) external _isAdmin {
        buyBack = _buyBack;
    }

    function setAdmin(address _admin) external _isAdmin {
        Admin = IAdmin(_admin);
    }

    function setBYSL(address _bysl) external _isAdmin {
        bYSL = _bysl;
    }
}
