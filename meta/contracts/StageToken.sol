// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";


contract StageTokenContract is Ownable, ERC20, ERC20Permit {
    uint256 maxTotalSupplyCap;

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _maxTotalSupplyCap
    ) ERC20(_name, _symbol) ERC20Permit(_name) {
        require(_maxTotalSupplyCap > 0, "Total supply must be a positive number");
        maxTotalSupplyCap = _maxTotalSupplyCap;
    }

    function maxTotalCap() public view returns (uint256){
        return maxTotalSupplyCap;
    }

    function circulatingTotalCap() public view returns (uint256) {
        return totalSupply();
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount 
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        if (from == address(0)) {
            require(
                totalSupply() + amount <= maxTotalSupplyCap, 
                "Transaction exceeds max circulating cap of tokens"
            );
        }
    }

    function mint(address _to, uint256 _amount) public onlyOwner {
        _mint(_to, _amount);
    }
}
