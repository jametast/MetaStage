// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./MetaNFTMinting.sol";


contract NFTMintingRoundContract is 
    Initializable,
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable 
{
    
    address public crowdFundContractAddress;                                     // address of crowd fund contract to which the NFT minting process refers to
    address[] public creatorsAddressArray;                                       // array of creators addresses
    mapping(address => MetaNFTMinting) public creatorAddressToNFTMintingMapping; // creator address to meta nft contract mapping

    function initialize(address _crowdFundContractAddress) public initializer {
        // TODO: need to specify requirementes here

         // initialize Ownable upgradeable contract
        OwnableUpgradeable.__Ownable_init();
        // initialize Reentrancy Guard upgradeable contract
        ReentrancyGuardUpgradeable.__ReentrancyGuard_init();

        crowdFundContractAddress = _crowdFundContractAddress;
    }

    function createNFTMintingContract() onlyOwner public {
        // TODO Implement this
    }

    function NFTMintingRound() onlyOwner public {
        for (uint256 index; index < creatorsAddressArray.lenght(); index++) {
            address creatorAddress = creatorsAddressArray[index];
            // TODO: how to get the true uri ? 
            string uri = ""; 
            MetaNFTMinting mintContract = MetaNFTMinting(crowdFundContractAddress, creatorAddress, uri);
            mintContract.mintNFTsToUsers();
        }
    }

    function fundMetaNFTMintContract(address creatorAddres, address metaNFTMintingContractAddress) onlyOwner public {
        crowdFundContract.fundNFTContract(creatorAddress, metaNFTMintingContractAddress);
    }

    function fundCreators() onlyOwner public {
        
    }
}