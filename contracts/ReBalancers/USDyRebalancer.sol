// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "../Interfaces/ILiquidityProvider.sol";
import "../Interfaces/IWhitelist.sol";
import "../Interfaces/IReceipt.sol";
import "../Interfaces/IEvents.sol";
import "../Interfaces/IAdmin.sol";
import "../Interfaces/ITreasury.sol";

/**
@dev USDy-BUSD liquidity rebalancer 
Note After every 21 epoch interval, if the liquidity pool price for USDy-BUSD is above/below $1.00, then the protocol will bring the pool price back to $1.00
*/
contract USDyRebalancer is Initializable, ReentrancyGuard, AccessControl {
    using SafeERC20 for IERC20;
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR"); //byte for minter role

    uint256 public currentTimestamp; // current timestamp
    bool public isEnabled; // enable or disable the rebalancer
    uint256 public mode; // enable or disable peg directions
    uint256 public impactPercentageLimit; // liquidity impact percentage limit
    uint256 public epoch;

    IAdmin public Admin; // Admin
    IUniswapV2Router02 public router; // Uniswap router object
    IUniswapV2Factory public factory; // Uniswap factory object
    ILiquidityProvider public lProvider;

    /**
    @dev used to initialize the state variables and is called only once while deploying
    @param _admin admin's address
    */

    function initialize(
        address _admin,
        IUniswapV2Router02 _router,
        ILiquidityProvider _lProvider
    ) external initializer {
        Admin = IAdmin(_admin);
        router = IUniswapV2Router02(_router);
        lProvider = ILiquidityProvider(_lProvider);
        isEnabled = true;
        mode = 3;
        impactPercentageLimit = 10;
    }

    modifier _isAdminOrOperator() {
        require(
            Admin.hasRole(OPERATOR_ROLE, msg.sender) ||
                Admin.hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "USDyBUSDRebalancer: caller is neither admin nor operator"
        );
        _;
    }

    modifier _isAdmin() {
        require(
            Admin.hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "USDyBUSDRebalancer: caller is not admin"
        );
        _;
    }

    /**
    @dev function to rebalance the liquidity to make the price = $1.00
    */

    function rebalance() public _isAdminOrOperator returns (bool) {
        require(isEnabled, "USDyBUSDRebalancer: rebalancer has been disabled");
        address[] memory path = new address[](2);
        path[0] = Admin.USDy();
        path[1] = Admin.BUSD();

        IUniswapV2Pair pair = IUniswapV2Pair(
            IUniswapV2Factory(IUniswapV2Router02(router).factory()).getPair(
                Admin.USDy(),
                Admin.BUSD()
            )
        );
        uint256 r1 = IERC20(Admin.USDy()).balanceOf(address(pair)); // r1 is reserve of USDy
        uint256 r2 = IERC20(Admin.BUSD()).balanceOf(address(pair)); // r2 is reserve of BUSD
        if (r1 < r2 && (mode == 2 || mode == 3)) {
            // price is > $1.00 i.e. above peg
            uint256 x = (sqrt(r1) * sqrt(r2 * 1003 / 1000)) - r1; // x is the amount of USDy purchased
            uint256 inputAmount = (10015 * x) / 10**4; // Amount of USDy that should be added in pool to make price = $1.00
            IReceipt(Admin.USDy()).mint(address(this), inputAmount);
            IERC20(Admin.USDy()).safeApprove(address(router), inputAmount);
            router.swapExactTokensForTokens(
                inputAmount,
                1,
                path,
                address(this),
                1692771516
            ); // amount of BUSD that comes out of the pool in exchange of USDy
            r1 = IERC20(Admin.USDy()).balanceOf(address(this));
            r2 = IERC20(Admin.BUSD()).balanceOf(address(this));

            IReceipt(Admin.USDy()).mint(address(this), r2); // mint equal units of USDy token as amountOut to bring the price to $1.00
            if(IERC20(Admin.USDy()).allowance(address(this),address(lProvider)) > 0){
                IReceipt(Admin.USDy()).decreaseAllowance(address(lProvider),IERC20(Admin.USDy()).allowance(address(this),address(lProvider)));
            }
            if(IERC20(Admin.BUSD()).allowance(address(this),address(lProvider)) > 0){
                IReceipt(Admin.BUSD()).decreaseAllowance(address(lProvider),IERC20(Admin.BUSD()).allowance(address(this),address(lProvider)));
            }
            IERC20(Admin.USDy()).safeApprove(address(lProvider), r2 * 10**18);
            IERC20(Admin.BUSD()).safeApprove(address(lProvider), r2 * 10**18);
 
            lProvider.addLiquidity(
                Admin.USDy(),
                Admin.BUSD(),
                r2,
                r2,
                1,
                1,
                Admin.Treasury()
            );
            IReceipt(Admin.USDy()).burn(
                address(lProvider),
                IERC20(Admin.USDy()).balanceOf(address(lProvider))
            );
        } else if (r1 > r2 && (mode == 1 || mode == 3)) {
            // price < $1.00 i.e. below peg
            uint256 x = (sqrt(r2) * sqrt(r1 * 1003 / 1000)) - r2; // x is the amount of USDy purchased
            uint256 ratio = r1 / r2;
            x *= sqrt(ratio);
            uint256 inputAmount = (10015 * x) / 10**4; // Amount of liquidity that should be added in pool to make price = $1.00

            if (checkLiquidityImpact(inputAmount, r1)) {
                address lp = address(
                    IUniswapV2Factory(IUniswapV2Router02(router).factory())
                        .getPair(Admin.USDy(), Admin.BUSD())
                );
                uint256 amountOfLp = IERC20(lp).balanceOf(Admin.Treasury());

                ITreasury(Admin.Treasury()).getLpFromTreasury(
                    address(this),
                    lp,
                    inputAmount
                );
                IERC20(lp).approve(address(lProvider), amountOfLp);
                lProvider.removeLiquidity(lp, inputAmount);

                uint256 amountUSDy = IERC20(Admin.USDy()).balanceOf(
                    address(this)
                );
                uint256 amountBUSD = IERC20(Admin.BUSD()).balanceOf(
                    address(this)
                );

                path[0] = Admin.BUSD();
                path[1] = Admin.USDy();
                if(IERC20(Admin.BUSD()).allowance(address(this),address(router)) > 0){
                IReceipt(Admin.BUSD()).decreaseAllowance(address(router),IERC20(Admin.BUSD()).allowance(address(this),address(router)));
                }
                IERC20(Admin.BUSD()).safeApprove(address(router), amountBUSD);
                uint256[] memory amountsOut = router.swapExactTokensForTokens(
                    amountBUSD,
                    1,
                    path,
                    address(this),
                    1692771516
                );
                uint256 totalUSDy = amountUSDy + amountsOut[1];
                IReceipt(Admin.USDy()).burn(address(this), totalUSDy);
                uint remainingBUSD = IERC20(Admin.BUSD()).balanceOf(address(this));
                if(remainingBUSD > 0) {
                    IERC20(Admin.BUSD()).safeTransfer(Admin.Treasury(), remainingBUSD);
                    IReceipt(Admin.bYSL()).calculateProtocolPrice();
                }
            } else {
                return false;
            }
        }
        epoch = Admin.lastEpoch();
        return true;
    }

    function defenderRebalancer() external{
        if(block.timestamp >= epoch + (21 * Admin.epochDuration())){
            rebalance();
        }
    }

    /**
    @dev finds square root of the number passed in the arguement
    @param x number whose square root needs to be found out
     */

    function sqrt(uint256 x) public pure returns (uint256 y) {
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    /**
    @dev checks whether liquity impact percentage is less than or equal to the value set by the admin
    @param inputAmount amount that needs to be removed
    @param USDyTotal total amount of USDy present in pool
    */

    function checkLiquidityImpact(uint256 inputAmount, uint256 USDyTotal)
        internal
        view
        returns (bool)
    {
        uint256 liquidityPercentage = (inputAmount * 100) / USDyTotal;
        if (liquidityPercentage <= impactPercentageLimit) {
            return true;
        } else {
            return false;
        }
    }

    /**
    @dev used to enable or disable the rebalancer
     */

    function rebalancerState() public _isAdmin returns (bool) {
        isEnabled = !isEnabled;
        return isEnabled;
    }

    /**
    @dev function for admin to set the liquidity impact percentage
    */

    function setImpactPercentageLimit(uint256 _impactPercentageLimit)
        public
        _isAdmin
    {
        impactPercentageLimit = _impactPercentageLimit;
    }

    /**
    @dev disables or enables peg directions
    @param _mode number that indicates peg's direction. It could be 1, 2 or 3
    */

    function setMode(uint256 _mode) public _isAdmin {
        mode = _mode;
    }



}
