// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
// import "@openzeppelin/contracts/security/ReentrancyGuard.sol";


interface IProtocolOwnedLiquidity {
    function convertedBUSDForbYSL(uint amount) external;
    function sellBYSL(address user,uint byslAmount)  external ;
    function setCounter() external;
}