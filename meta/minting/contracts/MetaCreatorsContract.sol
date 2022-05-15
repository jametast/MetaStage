// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./CrowdFundContract.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./NFTMintingContract.sol";


contract MetaCreatorsContract is Ownable {
    // Crowd Fund contract Factory, using Clone Factory contract from @optionality.io
    // we will need to deploy a `master` CrowdFund contract, for which every clone gets its logic from
    // using Clone Factories we reduce greatly the gas cost of deploying new CrowdFundContract's

    // state variables 
    address private _crowdFundContractMasterAddress;                              // master address, we can eventually change, for purposes of protocol updates
    address private _nftMintingContractMasterAddress;                             // master address of nft minting contract, we can eventually change, for purposes of protocol updates
    mapping(uint256 => address) public roundIdToCrowdFundContractAddressMapping;  // mapping a roundId to address of a cloned CrowdFundContract
    mapping(uint256 => address) public roundIdToNFTMintingContractAddressMapping; // mapping a roundId to address of a cloned NFTMintingContract
    uint256 private _currentRoundId;                                              // current round Id
    
    // events
    event newRoundStarted(uint256 roundId);                                       // event announcing the start of a new round of the procool
    event crowdFundContractCreated(address crowdFundContractAddress);             // event announcing clone CrowdFundContract creation
    event nftMintingContractCreated(address nftMintingContractAddress);           // event announcing clone NFT minting contract creation
    event roundHasFinished(uint256 roundId);                                      // event announcing the end of a round of the protocol

    // errors
    error invalidRoundId();                                                       // user defined error to handle case where the roundId variable is invalid (that is roundId > currentRoundId)                       

    constructor(address _crowdFundContractAddress, address _nftMintingContractAddress) onlyOwner public {
        // no contract deployed yet, therefore we initialize the current round id to 0
        _currentRoundId = 0;
        // our initial master crowd fund contract, it can be updated later on
        _crowdFundContractMasterAddress = _crowdFundContractAddress;
        // we set our initial round 0 to be mapped to master crowd fund contract address
        roundIdToCrowdFundContractAddressMapping[_currentRoundId] = _crowdFundContractMasterAddress; 
        // our initial master nft minting contract, it can be updated later on
        _nftMintingContractMasterAddress = _nftMintingContractAddress;
        // we set our initial round 0 to be mapped to master nft minting contract address
        roundIdToNFTMintingContractAddressMapping[_currentRoundId] = _nftMintingContractMasterAddress;
    }
    
    // helper function that returns the current round Id
    function getRoundId() external view returns(uint256) {
        return _currentRoundId;
    }

    // setter function to modify the master crowd fund contract address, can only be called by the owner of the current contract
    function setCrowdFundContractMasterAddress(address newCrowdFundContractAddress) onlyOwner external {
        _crowdFundContractMasterAddress = newCrowdFundContractAddress;
    }

    // helper function that returns the current master crowd fund contract address
    function getCrowdFundContractMasterAddress() external returns(address) {
        return _crowdFundContractMasterAddress;
    }

    // setter function to modify the master nft minting contract address, can only be called by the owner of the current contract
    function setNFTMintingContractMasterAddress(address newNFTMintingContractAddress) onlyOwner external {
        _nftMintingContractMasterAddress = newNFTMintingContractAddress;
    }

    // helper function that returns the current master nft minting contract address
    function getNFTMintingContractMasterAddress() external returns(address) {
        return _nftMintingContractMasterAddress;
    }

    /** main function that creates a new round of the protocol
     * it implements logic to clone a crowd fund contract from the initial master crowd fund contract
     * as well as to clone a nft minting contract from the initial master nft minting contract
     * while updating the currentRoundId variable (+= 1)
     */
    function createNewRound(
        uint256 _minFundValue, 
        address[] memory _allowedFundingTokens, 
        uint256 _startTimeRequestFunds, 
        uint256 _endTimeRequestFunds, 
        uint256 _startTimeCrowdFund, 
        uint256 _endTimeCrowdFund
    ) onlyOwner 
      external 
      returns(
          address cloneCrowdFundContractAddress, 
          address cloneNFTMintingContractAddress
        ) 
    {
        // we add the necessary input validity check requirements: 
        // minFundValue must be positive
        require(_minFundValue > 0, "minimum fund value should be positive");
        // start time to request funds should be after constructor is invoked
        require(_startTimeRequestFunds >= block.timestamp, "Votation starting time already in the past");
        // start time to request funds should be prior to end time to request funds
        require(_startTimeRequestFunds < _endTimeRequestFunds, "Invalid request funds period");
        // users can only lock funds into the crowd fund contract after period to request funds has finished
        require(_endTimeRequestFunds < _startTimeCrowdFund, "Crowd fund should start after request funds period");
        // start time for users to crowd fund projects should be prior to end time
        require(_startTimeCrowdFund < _endTimeCrowdFund, "Invalid crowd fund period");
        // get the previous crowd fund contract
        previousCrowdFundContractAddress = roundIdToCrowdFundContractAddressMapping[_currentRoundId];
        // finally we require that currentRoundId associated crowd fund contract is also finished
        require(CrowdFundContract(previousCrowdFundContractAddress).endTimeCrowdFund, "Previous crowd fund contract has not yet finished");

        // update round id 
        _currentRoundId += 1; 
        // deploy a Proxy Contract for current Crowd fund and get its address
        address cloneCrowdFundContractAddress = Clones.clone(_crowdFundContractMasterAddress); 
        // we now initialize a new round crowd fund contract address 
        CrowdFundContract(cloneCrowdFundContractAddress).initialize(
            _minFundValue, 
            _allowedFundingTokens,
            _startTimeRequestFunds, 
            _endTimeRequestFunds,
            _startTimeCrowdFund, 
            _endTimeCrowdFund
        );
         
        // emit event of creation of a new crowd fund contract
        emit CrowdFundContractCreated(cloneCrowdFundContractAddress); 
        // update our roundId to CrowdFuncContractAddress mapping
        roundIdToCrowdFundContractAddressMapping[_currentRoundId] = cloneCrowdFundContractAddress; 

        // deploy a Proxy Contract for current NFT minting process and get its address
        address cloneNFTMintingContractAddress = Clones.clone(_nftMintingContractMasterAddress);
        // we now initialize the associated nft minting contract
        NFTMintingContract(cloneNFTMintingContractAddress).initialize(cloneCrowdFundContractAddress);

        // emit event of creation of a new NFT minting contract
        emit nftMintingContractCreated(nftMintingContractAddress);
        //update our roundId to NFTMintingContractAddress mapping
        roundIdToNFTMintingContractAddressMapping[_currentRoundId] = cloneNFTMintingContractAddress;
    }

    /**
    * Given a roundId, the current contract will deploy a new crowd fund contract attached to this
    * roundId, therefore, the current contract will be the onlyOwner of such crowd fund contract
    * for this reason, we have to reimplement every method that it is owned by the current smart contract,
    * in order to be able to interact from the external (and actual) owner of the contract
    */

    // set the price feed contract of the roundId => crowd fund contract
    function setPriceFeedContract(address _token, address _priceFeed, uint256 _roundId) public onlyOwner {
        // we require that the given round id is valid 
        if (_roundId > _currentRoundId) {
            revert invalidRoundId();
        }
        address crowdFundContractAddress = roundIdToCrowdFundContractAddressMapping[_roundId];
        CrowdFundContract crowdFundContract = CrowdFundContract(crowdFundContractAddress);
        crowdFundContract.setPriceFeedContract(_token, _priceFeed);
    }

    // make a creator elligible for roundId => crowd fund contract 
    function makeCreatorElligible(address _wallet, uint256 _roundId) public onlyOwner {
        // we require that the given round id is valid 
        if (_roundId > _currentRoundId) {
            revert invalidRoundId();
        }
        address crowdFundContractAddress = roundIdToCrowdFundContractAddressMapping[_roundId];
        CrowdFundContract crowdFundContract = CrowdFundContract(crowdFundContractAddress);
        crowdFundContract.makeCreatorElligible(_wallet);
    }

    // fund creators for roundId => crowd fund contract
    function fundCreators(address _wallet, uint256 _roundId) payable onlyOwner public {
        // we require that the given round id is valid
        if (_roundId > _currentRoundId) {
            revert invalidRoundId();
        }
        address crowdFundContractAddress = roundIdToCrowdFundContractAddressMapping[_roundId];
        CrowdFundContract crowdFundContract = CrowdFundContract(crowdFundContractAddress);
        crowdFundContract.fundCreators(_wallet);
    }

    // refund users for roundId => crowd fund contract
    function refundUsers(uint256 _roundId) payable onlyOwner public {
        // we require that the given round id is valid 
        if (_roundId > _currentRoundId) {
            revert invalidRoundId();
        }
        address crowdFundContractAddress = roundIdToCrowdFundContractAddressMapping[_roundId];
        CrowdFundContract crowdFundContract = CrowdFundContract(crowdFundContractAddress);
        crowdFundContract.refundUsers();
    }

    // fund meta nft minting contract for roundId => crowd fund contract
    function fundMetaNFTMintContract(
        address creatorAddress, 
        address payable metaNFTMintContractAddress,
        uint256 _roundId
    ) 
        payable 
        onlyOwner 
        public 
    {   
        // we require that the given round id is valid 
        if (_roundId > _currentRoundId) {
            revert invalidRoundId();
        }
        address crowdFundContractAddress = roundIdToCrowdFundContractAddressMapping[_roundId];
        CrowdFundContract crowdFundContract = CrowdFundContract(crowdFundContractAddress);
        crowdFundContract.fundMetaNFTMintContract(creatorAddress, metaNFTMintContractAddress);
    }
}
