// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol"; // we use ERC1155 in order to mint `semi` fungible NFTs for each creator 
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./MetaNFTMinting.sol";


contract NFTMintingContract is 
    Initializable,
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable,
    ERC1155Upgradeable
{   
    // enums 
    enum nftThreshold {
        lowerThreshold,
        midThreshold,
        upperThreshold
    }

    // immutatble state variables
    address public immutable crowdFundContractAddress;                           // address of crowd fund contract to which the NFT minting process refers to

    // state variables 
    address[] public creatorsAddressArray;                                       // array of creators addresses
    mapping(address => MetaNFTMinting) public creatorAddressToNFTMintingMapping; // creator address to meta nft contract mapping
    mapping(address => bool) public creatorNFTsHaveBeenMintedMapping;            // mapping to track if creator nft has been minted
    bool public nftHasBeenMinted;                                                // bool value to track if creator nft's have already being minted
    mapping(address => uint256) creatorAddressToTotalFunds;                      // mapping to track each creator funds


    function initialize(address _crowdFundContractAddress) public initializer {
        // TODO: need to specify requirementes here
        // possibly require that the contract that is initializing this contract is the meta creator contract 
        
        // initialize Ownable upgradeable contract
        OwnableUpgradeable.__Ownable_init();
        // initialize Reentrancy Guard upgradeable contract
        ReentrancyGuardUpgradeable.__ReentrancyGuard_init();
        // initialize ERC1155 upgradeable contract
        ERC1155Upgradeable.__ERC721_init(_uri);

        crowdFundContractAddress = _crowdFundContractAddress;

        // nftIsMinted should be set to false
        _nftHasBeenMinted = false;
    }

    function getFundedCreatorsArray() 
        internal 
        view 
        onlyOwner
        returns(address[] memory) 
    {
        return CrowdFundContract(crowdFundContractAddress).getFundedCreatorsArray();
    }

    function nftHasBeenMinted() external view {
        return _nftHasBeenMinted;
    }

    // TODO: check these methods
    // function getTokenURI(address _creatorAddress, uint256 tokenId) public view returns(string memory) {
    //     return tokenURI(tokenId);
    // }

    // function setTokenURI(uint256 tokenId, string memory _tokenURI) onlyOwner public {
    //     _setTokenURI(tokenId, _tokenURI);
    // }

    function NFTMintingRound() onlyOwner external {
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

    function mintNFTRound() external onlyOwner {
        // get array of funded creator addresses
        address creatorAddressFundedArray = getFundedCreatorsArray();
        // instantiate the crowdFundContract
        CrowdFundContract crowdFundContract = CrowdFundContract(crowdFundContractAddress);

        // loop over funded creators
        for (uint256 creatorIndex; creatorIndex < creatorAddressFundedArray.length; creatorIndex++) {
            // get current creator address
            address creatorAddress = creatorAddressFundedArray[i];
            // call mint NFT round for given creator method
            mintNFTRoundForCreator(creatorAddress);
        }
    }

    function mintNFTRoundForCreator(address _creatorAddress) 
        public 
        onlyOwner 
    {
        // get creator's fan club array
        address[] memory creatorFanClub = crowdFundContract.creatorAddressToFanClubMapping[creatorAddress];
        // get creator's uri string
        string[3] memory uri = CrowdFundContract(crowdFundContractAddress).addressToCreatorMapping[_creatorAddress].uri;

        // loop over creator's fan club 
        for (uint256 userIndex; userIndex < creatorFanClub.length; userIndex++) {
            // get current user fan
            address userAddress = creatorFanClub[userIndex];
            // we get the threshold of NFT that user fan obtained
            uint8 threshold = creatorFanClub.threshold;

            if (threshold == 0) {
                // mint first threshold nft
                // TODO: check the medatadata
                _mint(userAddress, 0, 1, "");
            } else if (threshold == 1) {
                // mint second threshold nft
                // TODO: check the metadata
                _mint(userAddress, 0, 1, "");
            } else if (thrheshold == 2) {
                // mint third threshold nft
                // TODO: check the metadata
                _mint(userAddress, 0, 1, "");
            } else {
                // we revert contract because something went very wrong
                revert();
            }
        }  
    }
}