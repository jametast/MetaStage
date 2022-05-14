// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol"; // we use ERC1155 in order to mint `semi` fungible NFTs for each creator 
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "../../deploy/contracts/CrowdFundContract.sol";

/**
 * TODO: we need to rethink our strategy of fractional minting or threshold minting
 * where threshold minting uses a threshold of a creator to allow more scarce items to be minted
 * to those users which funded a greater amount of funds
 */
 
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

    function initialize(address _creatorAddress, address _crowdFundContractAddress, string memory _uri) public initializer {
        // get access to the current crowd fund contract
        CrowdFundContract crowdFundContract = CrowdFundContract(_crowdFundContractAddress);
        // require crowd fund timeline is complete
        require(CrowdFundContract.endTimeCrowdFund(), "MetaNFTMinting: crowd funding is not yet finished");
        // require that creator address is well specified
        require(CrowdFundContract.isCreatorElligible(_creatorAddress), "MetaNFTMinting: creator is not elligible");
        // require that uri is valid

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

        creatorFanClub = crowdFundContract.creatorAddressToFanClubMapping(_crowdFundContractAddress);
    }

    function getTokenURI(uint256 tokenId) public view returns(string memory) {
        return tokenURI(tokenId);
    }

    function setTokenURI(uint256 tokenId, string memory _tokenURI) onlyOwner public {
        _setTokenURI(tokenId, _tokenURI);
    }

    function mintNFTsToUsers() public onlyOwner {
        // mints NFTs, 
        // needs to have access to crowd fund contract creators and respective fanClub 
        // needs to be in the correct timeline period
        uint256 amount;
        /**
         * @dev we want to simulate a fractional NFT minting that said, we will use the full functionality 
         * of the ERC1155 protocol so for each user, we compute its proportional percentage of final contribution 
         * to the creator's total amount of funds with that into place, we can then mint a total amount of 100 fungible 
         * NFTs and then each user will get an amount of user_total_percentage * 100, where usel_total_percentage 
         * can be computed as floor(user_funding_amount / creator_total_funding)
        */
        for (uint256 userIndex; userIndex < creatorFanClub.length(); userIndex++) {
            address userAddress = creatorFanClub[userIndex];
            if (isSingleTokenCrowdFund) {
                amount = getAmountWithEth(userAddress);
            } else {
                amount = getAmount(userAddress);
            }
            _mint(userAddress, id, amount, "");
        }
    }

    function getAmount(address userAddress) public {
        CrowdFundContract crowdFundContract = CrowdFundContract(crowdFundContractAddress);
        
        address tokenAddress = crowdFundContract.addressToUserMapping[userAddress].tokenAddress;
        uint256 tokenAmount = crowdFundContract.addressToUserMapping[userAddress].totalLockedAmount;
        uint256 priceOfToken = crowdFundContract.getTokenPrice(tokenAddress);

        uint256 absoluteUserContribution = priceOfToken * tokenAmount;
        uint256 totalCreatorFunds = crowdFundContract.addressToCreatorMapping[creatorAddress].totalFunds;
        uint256 percentageUserContribution = absoluteUserContribution / totalCreatorFunds;

        return percentageUserContribution;
    } 

    function getAmountWithEth(address userAddress) public {
        CrowdFundContract crowdFundContract = CrowdFundContract(crowdFundContractAddress);

        uint256 tokenAmount = crowdFundContract.addressToUserMapping[userAddress].totalLockedAmount;
        uint256 totalCreatorFunds = crowdFundContract.addressToCreatorMapping[creatorAddress].totalFunds;
        uint256 percentageUserContribution = absoluteUserContribution / totalCreatorFunds;
        
        return percentageUserContribution;
    }
}