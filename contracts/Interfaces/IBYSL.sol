// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface IBYSL {

    function isMinter(address _address) external view returns (bool result);
    function mint(address account, uint amount) external;
    function burn(address account, uint amount) external;
    function setMinter(address _minter) external;
    function removeMinter(address _minter) external; 
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function protocolPrice() external view returns(uint);
    function backedPrice() external returns(uint);
    function calculateProtocolPrice() external returns(uint);
    function setTransactionLimit(address sender) external;
    function transactionTimeLimit(address) external view returns(uint);
    function backpriceRatio() external view returns(uint);
}