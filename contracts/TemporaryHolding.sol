// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../contracts/Interfaces/ISingleVault.sol";
import "../contracts/Interfaces/IReceipt.sol";
import "../contracts/Interfaces/IAdmin.sol";

/**
@dev TemporaryHolding contract 
 */

contract TemporaryHolding is AccessControl, Initializable,ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant WITHDRAW_ROLE = keccak256("WITHDRAW_ROLE"); //role byte for admin
    address public YSL;
    address public xYSL;
    IAdmin public Admin;

    /**
    @dev one time called while deploying
    @param _owner admin address
    Note always pass rate by multiplying it with 100
     */

    function initialize(
        address _owner,
        address _Admin
    ) external initializer {
         Admin = IAdmin(_Admin); 
        _setupRole(WITHDRAW_ROLE, _owner);
        _setupRole(WITHDRAW_ROLE, IAdmin(Admin).BShareVault());
    }

    modifier _isAdmin(){
        require(Admin.hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        _;
    }

    /**
    @dev withdraw YSL and xYSL from YSL and xYSL
    @param recipient address of recipient
     */

    function withdrawForBshareReward(address recipient)
        nonReentrant external
        onlyRole(WITHDRAW_ROLE)
        returns(uint YSLRewards, uint xYSLRewards, uint bYSLReards)
    {
        require(
            recipient != address(0),
            "TemporaryHolding: recipient address required"
        );
        
        YSLRewards = IERC20(IAdmin(Admin).YSL()).balanceOf(address(this));
        xYSLRewards = IERC20(IAdmin(Admin).xYSL()).balanceOf(address(this));
        bYSLReards = IERC20(IAdmin(Admin).bYSL()).balanceOf(address(this));

        IERC20(IAdmin(Admin).YSL()).safeTransfer(recipient, YSLRewards);
        IERC20(IAdmin(Admin).xYSL()).safeTransfer(recipient, xYSLRewards);
        IERC20(IAdmin(Admin).bYSL()).safeTransfer(recipient, bYSLReards);
    } 
    
    /**
    @dev withdraw USDy from USDy
    @param recipient address of recipient
     */

    function withdrawUSDy(address recipient)
        nonReentrant public
        _isAdmin
    {
        require(
            recipient != address(0),
            "TemporaryHolding: recipient address required"
        );
        IERC20(Admin.USDy()).safeTransfer(recipient, IERC20(IAdmin(Admin).USDy()).balanceOf(address(this)));
    }

  
}
