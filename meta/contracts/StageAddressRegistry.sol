// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0; 


import "@openzeppelin/contracts/access/Ownable.sol";


contract MetaStageAddressRegistry is Ownable {
    address public tokenRegistry;
    address public stageToken;
    address public metaTreasury;

    function updateTokenRegistry(address _tokenRegistry) external onlyOwner {
        tokenRegistry = _tokenRegistry;
    }

    function updateStageToken(address _stageToken) external onlyOwner {
        stageToken = _stageToken;
    }

    function updateMetaTreasury(address _metaTreasury) external onlyOwner {
        metaTreasury = _metaTreasury;
    }
}