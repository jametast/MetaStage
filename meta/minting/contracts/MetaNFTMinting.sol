// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol"; // we use ERC1155 in order to mint `semi` fungible NFTs for each creator 
import "../../deploy/contracts/CrowdFundContract.sol";


contract MetaNFTMinting is 
    Initializable, 
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable,
    ERC1155Upgradeable
{   
    // structure to encapsulate NFT minting data
    struct NFTMintData {
        address creatorAddres;
        string URIAddress;
    }

    address creatorAddress;
    address crowdFundContractAddress;   // corresponds to the address of the platform crowd fund contract
    address[] creatorFanClub;           // mapping between each creator address and the array of users that funded its project
    string uri;                         // set the uri to mint the NFT
    uint256 id;                         // set the id corresponding to our NFT  
    uint256 amount;                     // amount of `fungible` NFTs we have to mint

    function initialize(address _creatorAddress, address _crowdFundContractAddress, string _uri) public initializer {
        //  TODO: requirements needed: 
        // 1) creator address is well specified
        // 2) crowd fund timeline is complete 
        // 3) uri is valid?

        // initialize Ownable upgradeable contract
        OwnableUpgradeable.__Ownable_init();
        // initialize Reentrancy Guard upgradeable contract
        ReentrancyGuardUpgradeable.__ReentrancyGuard_init();
        // initialize ERC1155 upgradeable contract
        ERC1155Upgradeable.__ERC721_init(_uri);

        // get creator address
        creatorAddress = _creatorAddress;
        // get crowd fund contract address
        crowdFundContractAddress = _crowdFundContractAddress;
        // get uri
        uri = _uri;
    }

    function mintNFTsToUsers() public onlyOwner {
        // mints NFTs, 
        // needs to have access to crowd fund contract creators and respective fanClub 
        // needs to be in the correct timeline period
        uint256 amount;
        CrowdFundContract crowdFundContract = CrowdFundContract(crowdFundContractAddress);
        /**
         * @dev we want to simulate a fractional NFT minting that said, we will use the full functionality 
         * of the ERC1155 protocol so for each user, we compute its proportional percentage of final contribution 
         * to the creator's total amount of funds with that into place, we can then mint a total amount of 100 fungible 
         * NFTs and then each user will get an amount of user_total_percentage * 100, where usel_total_percentage 
         * can be computed as floor(user_funding_amount / creator_total_funding)
        */
        

        for (uint256 userIndex; userIndex < creatorFanClub.length(); userIndex++) {
            address userAddress = creatorFanClub[userIndex];
            amount = getAmount(userAddress);
            _mint(userAddress, id, amount, "");
        }
    }

    function getAmount(address userAddress) public {
        uint256 numberOfUsers = creatorFanClub.length();

    } 
}