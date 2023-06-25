// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IReceipt {
    function mint(address account, uint amount) external;
    function burn(address account, uint amount) external;
    function setOperator(address _operator) external;
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function mintByPrice() external  returns(uint);
    function initialize(address _admin, address operator, string memory name_, string memory symbol_) external;
    function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool) ;
    function calculateProtocolPrice() external returns(uint);
}