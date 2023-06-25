// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
 interface ILPVault {
    function initialize(
        address _admin,
        address owner,
        address _lp
    ) external;
    function deposit(address user, uint amountLp,bool isBUSD) external;
    function withdraw(address user, bool isReciept,uint _amount,address sendTo) external;
    function receiptToken() external view returns(address);
 }