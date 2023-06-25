// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
interface ISingleVault {
    function initialize(
        address _admin,
        address owner
    ) external;
    function deposit(address user,uint256 _amount,bool isBUSD) external;
    function withdraw(address user,bool isReciept,uint256 amount,address sendTo) external ;
    function receiptToken() external view returns(address);
    function tradeTax() external view returns(uint);
    function UserDeposit(address) external view returns(uint);
    function exchangeRatio() external view returns(uint);
    function checkVaultStatus(address vaultAddress) external view returns(bool);
    function claimReward(address user) external;
    function rewards(address user) external view returns(uint);
}