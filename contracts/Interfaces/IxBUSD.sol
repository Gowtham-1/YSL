// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


interface IxBUSD {

    enum Peg {AbovePeg,BelowPeg}
    function mint(address account, uint256 amount) external;
    function burn(address account, uint256 amount) external;
    function removeMinter(address _minter) external;
    function setBurner(address _burner) external;
    function setMinter(address _minter) external;
    function isBurner(address _address) external;
    function isMinter(address _address) external;
    function unpause() external;
    function setxBUSDAndAllocationTax(uint _tax, uint[] memory allocationTax) external;
    function setLockTransactionTime(uint time) external;
    function setPriceImpactProtection(uint value) external;
    function epochTime ()external;
    function currentPeg() external;
    function lastPeg() external;
    function DurationPeriod(address _user,uint amount) external;
    function pegReturn() external returns(uint);
}