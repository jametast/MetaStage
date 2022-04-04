// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";


contract StageTokenRegistry is Ownable {
    // events of the contract
    event TokenAdded(address token);
    event TokenRemoved(address token);

    mapping(address => bool) public enabled;
    EnumerableSet.AddressSet private _enabledTokens;

    function add(address token) external onlyOwner {
        require(!enabled[token], "token already added");
        enabled[token] = true;
        EnumerableSet.add(_enabledTokens, token);
        emit TokenAdded(token);
    }

    function remove(address token) external onlyOwner {
        require(enabled[token], "token not yet registered");
        enabled[token] = false;
        EnumerableSet.remove(_enabledTokens, token);
        emit TokenRemoved(token);
    }

    function getEnabledTokens() external view returns (address[] memory) {
        return EnumerableSet.values(_enabledTokens);
    }
}

