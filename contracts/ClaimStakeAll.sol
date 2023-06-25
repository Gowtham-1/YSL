// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./Interfaces/IAdmin.sol";
import "./Interfaces/ISingleVault.sol";


contract ClaimStakeAll is ReentrancyGuard, Initializable{
    using SafeERC20 for IERC20;

    IAdmin public Admin;

    struct SingleVaults{
        address vault;
        address token;
    }

    address[] public vaults;
    mapping(address => uint) public vaultIndex;

    SingleVaults[] public singleVaults;
    mapping(address => uint) public singleVaultIndex;


    function initialize(address _Admin) external initializer{
        Admin = IAdmin(_Admin);
    }

    function addSingleVault(address[] calldata _vaults, address[] calldata _token) external{
        for(uint i; i < _vaults.length; i++){
            singleVaultIndex[_vaults[i]] = singleVaults.length;
            singleVaults.push(SingleVaults(_vaults[i],_token[i]));
        }
    }

    function removeSingleVault(address[] calldata _vaults) external{
        for(uint i; i < _vaults.length; i++){
            uint index = singleVaultIndex[_vaults[i]];
            singleVaults[index] = singleVaults[singleVaults.length-1];
            singleVaults.pop();
        }
    }


    function stakeAll() external nonReentrant {
        for(uint i; i < singleVaults.length; i++){
            uint balance = IERC20(singleVaults[i].token).balanceOf(msg.sender);
            if(balance > 0){
                ISingleVault(singleVaults[i].vault).deposit(msg.sender, balance, false);
            }
        }
    }

    function claimAll() external nonReentrant {
        for(uint i; i < vaults.length; i++) {
            if(vaults[i] != Admin.USDyVault()){
                if(ISingleVault(vaults[i]).rewards(msg.sender) > 0) {
                    ISingleVault(vaults[i]).claimReward(msg.sender);
                }
            }
        }
    }

    function addVault(address[] calldata _vaults) external {
        for(uint i; i < _vaults.length; i++){
            vaultIndex[_vaults[i]] = vaults.length;
            vaults.push(_vaults[i]);
        }
    }

    function removeVault(address[] calldata _vaults) external {
        for(uint i; i < _vaults.length; i++) {
            uint index = vaultIndex[_vaults[i]];
            vaults[index] = vaults[vaults.length-1];
            vaults.pop();
        }
    }

    function vaultsAddresses() external view returns(address[] memory){
        return(vaults);
    }

    function rewardsAll(address user) public view returns(uint reward){
         for(uint i; i < vaults.length; i++) {
            if(vaults[i] != Admin.USDyVault()){
                if(ISingleVault(vaults[i]).rewards(user) > 0){
                    reward += ISingleVault(vaults[i]).rewards(user);
                }
            }
         }    
    }
}
