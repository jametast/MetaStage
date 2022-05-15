// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./MetaNFTMinting.sol";


contract NFTMintingContract is 
    Initializable,
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable 
{   
    address public immutable crowdFundContractAddress;                                     // address of crowd fund contract to which the NFT minting process refers to
    address[] public creatorsAddressArray;                                       // array of creators addresses
    mapping(address => MetaNFTMinting) public creatorAddressToNFTMintingMapping; // creator address to meta nft contract mapping
    mappind(address => bool) public creatorNFTsHaveBeenMintedMapping;            // mapping to track if creator nft has been minted
    bool private _nftHasBeenMinted;                                              // bool value to track if creator nft's have already being minted

    function initialize(address _crowdFundContractAddress) public initializer {
        // TODO: need to specify requirementes here
        
        // initialize Ownable upgradeable contract
        OwnableUpgradeable.__Ownable_init();
        // initialize Reentrancy Guard upgradeable contract
        ReentrancyGuardUpgradeable.__ReentrancyGuard_init();

        crowdFundContractAddress = _crowdFundContractAddress;

        // nftIsMinted should be set to false
        _nftHasBeenMinted = false;
    }

    function createNFTMintingContract() onlyOwner public {
        // TODO Implement this
    }

    function nftHasBeenMinted() external view {
        return _nftHasBeenMinted;
    }

    function NFTMintingRound() onlyOwner public {
        for (uint256 index; index < creatorsAddressArray.lenght(); index++) {
            address creatorAddress = creatorsAddressArray[index];
            // TODO: how to get the true uri ? We probably need to coordinate with the backend infrastructure
            string uri = ""; 
            if (creatorAddressToNFTMintingMapping[creator]) {
                // if current creator's nft has already been minted, then we don't need to mint it again
                // this is probably inefficient from a gas point of view
                // indeed we are looping over unnecessary indexes, where we could probably remove them from the array
                continue;
            }
            MetaNFTMinting mintContract = MetaNFTMinting(crowdFundContractAddress, creatorAddress, uri);
            mintContract.mintNFTsToUsers();
            creatorAddressToNFTMintingMapping[creatorAddress] = true;
        }

        _nftHasBeenMinted = true; // TODO: Is this really a safe method ? What happens if the for loop above fails ? 
    }

    function fundMetaNFTMintContract(address creatorAddres, address metaNFTMintingContractAddress) onlyOwner public {
        crowdFundContract.fundNFTContract(creatorAddress, metaNFTMintingContractAddress);
    }

    // TODO: need to refactor this function to not depend on input creatorAddress
    function mintNFTsToUsers(address creatorAddress) external onlyOwner {
        MetaNFTMinting nftMintingContract = creatorAddressToNFTMintingMapping[creatorAddress];
        nftMintingContract.mintNFTsToUsers();
    }

    function setElligibleCreators(address[] calldata elligibleCreatorsAddressArray) external onlyOwner {
        creatorsAddressArray = elligibleCreatorsAddressArray;
    }   
}