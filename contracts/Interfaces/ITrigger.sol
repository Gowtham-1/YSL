// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface ITrigger {

    function deposit(uint _amount) external;

    function withdraw(uint _amount) external;

    function withdrawFromPOL(address _receiver, uint _amount) external;
    
    function resetReBalanceEpochTime() external;

    function LastBackedPrice() external view returns(uint256);

    function balanceOfPOL() external view returns(uint256);

    function RebalanceStartTime() external view returns(uint256);

}