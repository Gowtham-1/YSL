// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "../Interfaces/IOptVaultFactory.sol";
import "../Interfaces/IOptVault.sol";
import "../Interfaces/IAdmin.sol";
import "../MockRouter/interfaces/IUniswapV2Router02.sol";
import "../MockRouter/interfaces/IUniswapV2Pair.sol";
import "../MockRouter/interfaces/IUniswapV2Factory.sol";

contract HelperSwap is Initializable{
    using SafeERC20 for IERC20;
    IUniswapV2Router02 public router; // address of router
    IAdmin public Admin; // address of Admin
    address public WBNB;

    receive() external payable {
    }

    /**
        @dev one time call while deploying
     */
    function initialize(address _router, address _admin) external initializer{
            router = IUniswapV2Router02(_router);
            Admin = IAdmin(_admin); 
            WBNB = Admin.WBNB();         
        }
    /**
    @dev swap Lp with token
    @param lp give the address of lp
    @param _amount amount user want to send
     */

    function LPToToken(address lp, uint _amount) public{
        address tokenA = IUniswapV2Pair(lp).token0();
        address tokenB = IUniswapV2Pair(lp).token1();
        IERC20(lp).safeTransferFrom(msg.sender,address(this),_amount);
        IERC20(lp).safeApprove(address(router),_amount);
        if(tokenA == Admin.BUSD() || tokenB == Admin.BUSD()){
            address token = tokenA == Admin.BUSD() ? tokenB : tokenA;
            if(token == WBNB){
                //BNB represents Admin.BUSD()
                (,uint amountBNB) = router.removeLiquidityETH(token, _amount, 1, 1, address(this), block.timestamp);
                address[] memory path = new address[](2);
                path[0] = WBNB;
                path[1] = Admin.BUSD();         
                router.swapExactETHForTokens{value: amountBNB}(
                    1,
                    path,
                    msg.sender,
                    block.timestamp + 1800
                    );
                IERC20(Admin.BUSD()).safeTransfer(msg.sender,IERC20(Admin.BUSD()).balanceOf(address(this)));
            }else{
                //CAKE represents Admin.BUSD()
                router.removeLiquidity(tokenA, tokenB, _amount, 1, 1, address(this), block.timestamp);
                address[] memory path = new address[](2);
                path[0] = token;
                path[1] = Admin.BUSD();
                IERC20(token).safeApprove(address(router),_amount);     
                router.swapExactTokensForTokens(
                    IERC20(token).balanceOf(address(this)),
                    1,
                    path,
                    msg.sender,
                    block.timestamp + 1800
                    );
                IERC20(Admin.BUSD()).safeTransfer(msg.sender,IERC20(Admin.BUSD()).balanceOf(address(this)));
            }
        }else if(tokenA == WBNB || tokenB == WBNB){
            // CAKE-BNB 
            address token = tokenA == WBNB ? tokenB : tokenA;
            (, uint amountBNB) = router.removeLiquidityETH(token, _amount, 1, 1, address(this), block.timestamp);
            address[] memory path = new address[](2);
            path[0] = WBNB;
            path[1] = Admin.BUSD();
            router.swapExactETHForTokens{value: amountBNB}(
                1,
                path,
                msg.sender,
                block.timestamp + 1800
                );
            path[0] = token;
            IERC20(token).safeApprove(address(router),IERC20(token).balanceOf(address(this)));
            router.swapExactTokensForTokens(
                IERC20(token).balanceOf(address(this)),
                1,
                path,
                msg.sender,
                block.timestamp + 1800
                );
            IERC20(Admin.BUSD()).safeTransfer(msg.sender,IERC20(Admin.BUSD()).balanceOf(address(this)));
        }else{
            //cake-xyz
            router.removeLiquidity(tokenA, tokenB, _amount, 1, 1, address(this), block.timestamp);
            address[] memory path = new address[](2);
            path[0] = tokenA;
            path[1] = Admin.BUSD(); 
            IERC20(tokenA).safeApprove(address(router),_amount);
            router.swapExactTokensForTokens(
                IERC20(tokenA).balanceOf(address(this)),
                1,
                path,
                msg.sender,
                block.timestamp + 1800
                );
            path[0] = tokenB;
            IERC20(tokenB).safeApprove(address(router),_amount);
            router.swapExactTokensForTokens(
                IERC20(tokenB).balanceOf(address(this)),
                1,
                path,
                msg.sender,
                block.timestamp + 1800
                );
            IERC20(Admin.BUSD()).safeTransfer(msg.sender,IERC20(Admin.BUSD()).balanceOf(address(this)));
        }
    }   
}