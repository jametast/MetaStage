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
    mapping(uint256 => address) roundIdToCrowdFundContractAddressMapping; // mapping a roundId to address of a cloned CrowdFundContract
    uint256 private _currentRoundId; // current round Id
    event CrowdFundContractCreated(address crowdFundContractAddress); // event announcing clone CrowdFundContract creation

    constructor(address crowdFundContractMasterAddress) onlyOwner public {
        _currentRoundId = 0; // no contract deployed yet
        _crowdFundContractMasterAddress = crowdFundContractMasterAddress; // our initial master crowd fund contract, it can be updated later on
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
}
