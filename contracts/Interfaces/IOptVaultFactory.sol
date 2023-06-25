// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IOptVaultFactory{
     struct UserInfo {
        uint256 time;
        bool phoenixNFTStatus;
        nftStatus NFT;
        uint256 amount;
    }
    enum nftStatus {
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
     function initialize(address owner,address _BUSD,address _distributor,address _tempHolding,address _USDy,address _masterNTT,address nft,address phoenix,address _masterChef) external;
     function add( IERC20 _token, address _strat,string memory _name,string memory _symbol,uint32[] memory _multiplier) external;
     function setMultipliersLevel(address _token,uint32[] calldata _multiplier,uint32[] memory deductionValue) external;
     function Deposit(address user,address _token,uint _level,uint256 _amount) external ;
     function withdraw(address user,address _token,bool isReceipt,uint _recieptAmount,address sendTo) external ;
     function userInfo(uint pid,address user) external returns(UserInfo memory);
     function getPoolInfo(uint index) external view returns(address vaultAddress, bool isLP, address recieptInstance, IERC20 token,bool isCustomVault);
     function PIDsOfRewardVault(address token) external returns(uint256);
     function optimizationRewards(address user,address _token) external;
}