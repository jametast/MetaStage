// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./contracts/CrowdFundContract.sol";
import "@optionality.io/clone-factory/contracts/CloneFactory.sol";


contract CrowdFundContractFactory is Ownable, CrowdFundContract, CloneFactory {
    // Crowd Fund contract Factory, using Clone Factory contract from @optionality.io
    // we will need to deploy a `master` CrowdFund contract, for which every clone gets its logic from
    // using Clone Factories we reduce greatly the gas cost of deploying new CrowdFundContract's

    address private _crowdFundContractMasterAddress; // master address, we can eventually change, for purposes of protocol updates
    address mapping(uint256 => address) roundIdToCrowdFundContractAddressMapping; // mapping a roundId to address of a cloned CrowdFundContract
    uint256 private _currentRoundId; // current round Id
    event CrowdFundContractCreated(address crowdFundContractAddress); // event announcing clone CrowdFundContract creation

    function constructor() onlyOwner {
        _currentRoundId = 0; // no contract deployed yet

        CrowdFundContract crowdFundContract = new CrowdFundContract(
                                                    _minFundValue,
                                                    allowedFundingTokens,
                                                    _endTimeRequestFunds,
                                                    _startTimeCrowdFund,
                                                    _endTimeCrowdFund
                                                ); // our initial master crowd fund contract, it can be updated later on
        
        _crowdFundContractMasterAddress = crowdFundContract.address;
        roundIdToCrowdFundContractAddressMapping[_currentRoundId] = _crowdFundContractMasterAddress
    }

    function getRoundId() public returns(int256) {
        return _currentRoundId;
    }

    function setCrowdFundContractFactory(address newCrowdFundContractAddress) public OnlyOwner {
        _crowdFundContractAddress = newCrowdFundContractAddress;
    }

    function getCrowdFundContractMasterAddress() public returns(address) {
        return _crowdFundContractMasterAddress;
    }

    function createCrowdFundContract(
        uint256 _minFundValue, 
        address[] memory _allowedFundingTokens, 
        uint256 _startTimeRequestFunds, 
        uint256 _endTimeRequestFunds,
        uint256 _startTimeCrowdFund,
        uint256 _endTimeCrowdFund
    ) onlyOwner public {  
        currentRoundId += 1;
        address clone = createClone(_crowdFundContractAddress);
        CrowdFundContract(clone).__init__(
            _minFundValue, 
            _allowedFundingTokens, 
            _startTimeRequestFunds, 
            _endTimeRequestFunds, 
            _startTimeCrowdFund, 
            _endTimeCrowdFund
        );
        CrowdFundContractCreated(clone);
        roundToIdCrowdFundContractAddressMapping[currentRoundId] = clone; // update our roundId to CrowdFuncContractAddress mapping
    }
}