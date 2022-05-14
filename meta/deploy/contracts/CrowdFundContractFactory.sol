// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./CrowdFundContract.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";


contract CrowdFundContractFactory is Ownable {
    // Crowd Fund contract Factory, using Clone Factory contract from @optionality.io
    // we will need to deploy a `master` CrowdFund contract, for which every clone gets its logic from
    // using Clone Factories we reduce greatly the gas cost of deploying new CrowdFundContract's

    address private _crowdFundContractMasterAddress; // master address, we can eventually change, for purposes of protocol updates
    mapping(uint256 => address) public roundIdToCrowdFundContractAddressMapping; // mapping a roundId to address of a cloned CrowdFundContract
    uint256 private _currentRoundId; // current round Id
    event CrowdFundContractCreated(address crowdFundContractAddress); // event announcing clone CrowdFundContract creation

    error invalidRoundId(); 

    constructor(address crowdFundContractMasterAddress) onlyOwner public {
        _currentRoundId = 0; // no contract deployed yet
        _crowdFundContractMasterAddress = crowdFundContractMasterAddress; // our initial master crowd fund contract, it can be updated later on
        roundIdToCrowdFundContractAddressMapping[_currentRoundId] = _crowdFundContractMasterAddress; // we set our initial round 0 to be on the master crowd fund contract
    }

    function getRoundId() public returns(uint256) {
        return _currentRoundId;
    }

    function setCrowdFundContractFactory(address newCrowdFundContractAddress) onlyOwner public {
        _crowdFundContractMasterAddress = newCrowdFundContractAddress;
    }

    function getCrowdFundContractMasterAddress() public returns(address) {
        return _crowdFundContractMasterAddress;
    }

    function createCrowdFund(
        uint256 _minFundValue, 
        address[] memory _allowedFundingTokens, 
        uint256 _startTimeRequestFunds, 
        uint256 _endTimeRequestFunds, 
        uint256 _startTimeCrowdFund, 
        uint256 _endTimeCrowdFund
    ) onlyOwner 
      public 
      returns(address) 
    {  
        // update round id 
        _currentRoundId += 1; 
        // deploy a Proxy Conctract and get its address
        address cloneCrowdFundContractAddress = Clones.clone(_crowdFundContractMasterAddress); 
        CrowdFundContract(cloneCrowdFundContractAddress).initialize(
            _minFundValue, 
            _allowedFundingTokens,
            _startTimeRequestFunds, 
            _endTimeRequestFunds,
            _startTimeCrowdFund, 
            _endTimeCrowdFund
        );
         
        // emit event
        emit CrowdFundContractCreated(cloneCrowdFundContractAddress); 
        // update our roundId to CrowdFuncContractAddress mapping
        roundIdToCrowdFundContractAddressMapping[_currentRoundId] = cloneCrowdFundContractAddress; 

        return cloneCrowdFundContractAddress;
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
