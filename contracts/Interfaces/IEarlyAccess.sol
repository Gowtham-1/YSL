pragma solidity ^0.8.7;

interface IEarlyAccess{

    function top() external returns(uint);

    function Won(address) external returns(uint);
}