// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IOptVault {
    function initialize(uint256 _id,  address _token, address _want, address _Admin) external;
    function setMultiplierLevel(uint32 _level,uint32 amount) external returns(uint32);
    function vaultToken() external view returns(address);
    function swapWantToBUSD() external;
    function UserLevel(address _user) external returns(uint);
    function setreciept(address _reciept) external;
    function optimizationReward(address user, uint optMultiplier) external;
    function deductControllerFee(uint fee) external;
    function purchase(address user,uint amount, uint minAmount) external returns(uint);
    function sell(address user,uint amount, uint minAmount) external returns(uint);
    function collectOptimizationTax() external;
    function deposit(address user,uint amount,uint32 _level,bool isBUSD) external;
    function withdraw(address user, bool isReciept, uint _amount, address sendTo) external;
    function setRole(address Admin) external;
    function setPoolDetails(address _smartChef, address _wantToken) external;
}
