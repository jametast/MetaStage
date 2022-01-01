// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StageTokenContract is Ownable, ERC20 {
    constructor(uint256 initialSupply) public ERC20("Stage Token", "STAGE") {
        _mint(msg.sender, initialSupply);
    }
}
