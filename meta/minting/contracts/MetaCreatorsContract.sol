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

    // immutable state variables 
    address private immutable _crowdFundContractMasterAddress;                    // master address, we can eventually change, for purposes of protocol updates
    address private immutable _nftMintingContractMasterAddress;                   // master address of nft minting contract, we can eventually change, for purposes of protocol updates
    
    // state variables
    mapping(uint256 => address) public roundIdToCrowdFundContractAddressMapping;  // mapping a roundId to address of a cloned CrowdFundContract
    mapping(uint256 => address) public roundIdToNFTMintingContractAddressMapping; // mapping a roundId to address of a cloned NFTMintingContract
    mapping(address => string) public creatorAddressToURIMapping;                 // mapping a creator address to its associated, and uniquely defined, URI
    mapping(uint256 => bool) public roundIdToNFTHasBeenMinted;                    // mapping to keep track if nft contract has been funded 
    uint256 private _currentRoundId;                                              // current round Id
    
    // events
    event newRoundStarted(uint256 roundId);                                       // event announcing the start of a new round of the procool
    event crowdFundContractCreated(address crowdFundContractAddress);             // event announcing clone CrowdFundContract creation
    event nftMintingContractCreated(address nftMintingContractAddress);           // event announcing clone NFT minting contract creation
    event roundHasFinished(uint256 roundId);                                      // event announcing the end of a round of the protocol
    event nftMintEvent(address creatorAddress);                                   // event announcing the minting of users NFTs for given creator

    // errors
    error invalidRoundId();                                                       // user defined error to handle case where the roundId variable is invalid (that is roundId > currentRoundId)                       

    constructor(
        address _crowdFundContractAddress, 
        address _nftMintingContractAddress
    ) 
        onlyOwner 
        public
    {
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
        // get the previous nft minting contract
        previousNFTMintingContractAddress = roundIdToNFTMintingContractAddressMapping[_currentRoundId];
        // finally we require that currentRoundId associated crowd fund contract is also finished
        require(CrowdFundContract(previousCrowdFundContractAddress).endTimeCrowdFund, "Previous crowd fund contract has not yet finished");
        // we also require that all users have been refund and creators nfts being minted
        require(NFTMintingContract(previousNFTMintingContractAddress).nftHasBeenMinted(), "Previous round has not yet finished minting all NFTs");

        // update round id 
        _currentRoundId += 1; 
        // deploy a Proxy Contract for current Crowd fund and get its address
        address cloneCrowdFundContractAddress = Clones.clone(_crowdFundContractMasterAddress); 
        // we now initialize a new round crowd fund contract address 
        CrowdFundContract _currentCrowdFundContract = CrowdFundContract(cloneCrowdFundContractAddress).initialize(
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
        NFTMintingContract _currentNFTMintingContract = NFTMintingContract(cloneNFTMintingContractAddress).initialize(cloneCrowdFundContractAddress);

        // emit event of creation of a new NFT minting contract
        emit nftMintingContractCreated(nftMintingContractAddress);
        //update our roundId to NFTMintingContractAddress mapping
        roundIdToNFTMintingContractAddressMapping[_currentRoundId] = cloneNFTMintingContractAddress;
    }

    /**
     * we now implement logic to deal with the end of a crowd fund and the start of a minting process
     */

    function mintNFTRound() public onlyOwner {
        // get the current crowd fund contract
        CrowdFundContract crowdFundContract = CrowdFundContract(roundIdToCrowdFundContractAddressMapping[_currentRoundId]);
        // get the current nft minting contract
        NFTMintingContract nftMintingContract = NFTMintingContarct(roundIdToNFTMintingContractAddressMapping[_currentRoundId]);
        // we require that the crowd fund round is over
        require(crowdFundContract.crowdFundEnded(), "current crowd fund is not yet over");
        // we require that the associated nft minting process is not over
        require(!nftMintingContract.nftHasBeenMinted(), "creators NFT's already been minted");

        // get the elligible creators array from our current crowd fund contract
        address[] memory elligibleCreatosArray = crowdFundContract.elligibleCreatorsArray;

        // we loop over every possible elligible creator address to mint necessary NFTs
        for (uint256 index; index < elligibleCreatosArray.length; index++) {
            // get current creator address
            address creatorAddress = elligibleCreatosArray[index];
            // mint NFTs for each user that funded creator project
            nftMintingContract.mintNFTsToUsers(creatorAddress);
            // we emit event of new minted nft 
            emit nftMintEvent(creatorAddress);
        }
    }

    /**
     * Given a roundId, the current contract will deploy a new crowd fund contract attached to this
     * roundId, therefore, the current contract will be the onlyOwner of such crowd fund contract
     * for this reason, we have to reimplement every method that it is owned by the current smart contract,
     * in order to be able to interact from the external (and actual) owner of the contract
     */

    // helper function that checks when request funds phase started
    function requestFundsStarted() external view returns(bool) {
        // get current crowd fund contract address
        address currentCrowdFundContractAddress = roundIdToCrowdFundContractAddressMapping[_currentRoundId];
        // call to request funds Started
        return CrowdFundContract(currentCrowdFundContractAddress).requestFundsStarted();
    }

    // helper function that checks when request funds phase ended
    function requestFundsEnded() external view returns(bool) {
        // get current crowd fund contract address
        address currentCrowdFundContractAddress = roundIdToCrowdFundContractAddressMapping[_currentRoundId];
        // call to request Funds Ended
        return CrowdFundContract(currentCrowdFundContractAddress).requestFundsEnded();
    }

    // helper function that checks when crowd fund starts
    function crowdFundStarted() external view returns(bool) {
        // get current crowd fund contract address
        address currentCrowdFundContractAddress = roundIdToCrowdFundContractAddressMapping[_currentRoundId];
        // call to crowdFundStarted method
        return CrowdFundContract(currentCrowdFundContractAddress).crowdFundStarted();
    }

    // helper function that checks when crowd fund ends
    function crowdFundEnded() external view returns(bool) {
        // get current crowd fund contract address
        address currentCrowdFundContractAddress = roundIdToCrowdFundContractAddressMapping[_currentRoundId];
        // call to crowdFundEnded method
        return CrowdFundContract(currentCrowdFundContractAddress).crowdFundEnded();
    }

    // helper function to compute how much time is left for request funds phase
    function getTimeLeftRequestFunds() external view returns(uint256) {
        // get current crowd fund contract address
        address currentCrowdFundContractAddress = roundIdToCrowdFundContractAddressMapping[_currentRoundId];
        // call to get Time Left Request funds
        return CrowdFundContract(currentCrowdFundContractAddress).getTimeLeftRequestFunds();
    }

    // helper function to compute how much time is left for crowd fund
    function getTimeLeftCrowdFund() external view returns(uint256) {
        // call to get Time Left Request funds
        return currentCrowdFundContract.getTimeLeftCrowdFunds();
    }

    // set the price feed contract of the roundId => crowd fund contract
    function setPriceFeedContract(address _token, address _priceFeed) public onlyOwner {
        // get current crowd fund contract address
        address currentCrowdFundContractAddress = roundIdToCrowdFundContractAddressMapping[_currentRoundId];
        // call to setPriceFeedContract
        CrowdFundContract(currentCrowdFundContractAddress).setPriceFeedContract(_token, _priceFeed);
    }

    // get the price feed contract of the roundId => crowd fund contract
    function getTokenPrice(address _token) public returns(uint256)  {
        // get current crowd fund contract address
        address currentCrowdFundContractAddress = roundIdToCrowdFundContractAddressMapping[_currentRoundId];
        // call to getTokenPrice
        return CrowdFundContract(currentCrowdFundContractAddress).getTokenPrice(_token);
    }

    // fund creator contract for roundId => crowd fund contract 
    function fund(address _wallet) nonReentrant public payable {
        // get current crowd fund contract address
        address currentCrowdFundContractAddress = roundIdToCrowdFundContractAddressMapping[_currentRoundId];
        // call to fund creator method
        CrowdFundContract(currenCrowdFundContractAddress).fund(_wallet);
    }

    // helper function to check if a given token address is allowed by the protocol
    // TODO: do we need this method ? 
    function isTokenAllowed(address _address) private returns(bool) {
        // get current crowd fund contract address
        address currentCrowdFundContractAddress = roundIdToCrowdFundContractAddressMapping[_currentRoundId];
        // call to isTokenAllowed method
        return CrowdFundContract(currentCrowdFundContractAddress).isTokenAllowed(_address);
    }
    
    // function to request funds 
    function requestFunds(uint256 _amount, string calldata _uri) public {
        // get current crowd fund contract address
        address currentCrowdFundContractAddress = roundIdToCrowdFundContractAddressMapping[_currentRoundId];
        // call to requestFunds method
        CrowdFundContract(currentCrowdFundContractAddress).requestFunds(_amount, _uri);
    }

    // make a creator elligible for roundId => crowd fund contract 
    function makeCreatorElligible(address _wallet, uint256 _roundId) external onlyOwner {
        // get current crowd fund contract address
        address currentCrowdFundContractAddress = roundIdToCrowdFundContractAddressMapping[_currentRoundId];
        // call to make creator elligible
        CrowdFundContract(currentCrowdFundContractAddress).makeCreatorElligible(_wallet);
    }  

    // function that returns total funds creator obtained until the current block timestamp
    function computeTotalFunds(address _wallet) public returns(uint256) {
        // get current crowd fund contract address
        address currentCrowdFundContractAddress = roundIdToCrowdFundContractAddressMapping[_currentRoundId];
        // call to compute total funds
        return CrowdFundContract(currentCrowdFundContractAddress).computeTotalFunds(_wallet);
    }

    // returns requested funds from creator
    function computeRequestedFunds(address _wallet) public onlyOwner returns(uint256) {
        // get current crowd fund contract address
        address currentCrowdFundContractAddress = roundIdToCrowdFundContractAddressMapping[_currentRoundId];
        // call to compute request funds
        return CrowdFundContract(currentCrowdFundContractAddress).computeRequestedFunds(_wallet);
    }

    // returns true if creators obtained more crowd funds than his requested amount
    function creatorProjectApproved(address _wallet) public returns(bool) {
        // get current crowd fund contract address
        address currentCrowdFundContractAddress = roundIdToCrowdFundContractAddressMapping[_currentRoundId];
        // call to creator project approved
        return CrowdFundContract(currentCrowdFundContractAddress).creatorProjectApproved(_wallet);
    }

    // fund creators for roundId => crowd fund contract
    function fundCreators(address _wallet) payable onlyOwner public {
        // get current crowd fund contract address
        address currentCrowdFundContractAddress = roundIdToCrowdFundContractAddressMapping[_currentRoundId];
        // call to fund creators method
        CrowdFundContract(currentCrowdFundContractAddress).fundCreators(_wallet);
    }

    // refund users for roundId => crowd fund contract
    function refundUsers() payable onlyOwner public {
        // get current crowd fund contract address
        address currentCrowdFundContractAddress = roundIdToCrowdFundContractAddressMapping[_currentRoundId];
        // call to refund users method
        CrowdFundContract(currentCrowdFundContractAddress).refundUsers();
    }

    // fund meta nft minting contract for roundId => crowd fund contract
    function fundMetaNFTMintContract() payable onlyOwner external {   
        // get current crowd fund contract address
        address currentCrowdFundContractAddress = roundIdToCrowdFundContractAddressMapping[_currentRoundId];
        // get current crowd fund contract
        CrowdFundContract currentCrowdFundContract = CrowdFundContract(currentCrowdFundContractAddress);
        // require that current crowd fund has already finished
        require(currentCrowdFundContract.crowdFundEnded(), "crowd fund has not yet finished");
        // get creator address array from current crowd fund contract
        address[] creatorsAddressArray = currentCrowdFundContract.creatorsAddressArray;
        // get current nft minting contract address
        address currentNFTMintingContractAddress = roundIdToCrowdFundContractAddressMapping[_currentRoundId];
        // get current nft minting contract
        NFTMintingContract currentNFTMintingContract = NFTMintingContract(currentNFTMintingContractAddress);
        
        for (uin256 index; index < creatorsAddressArray.length; index++) {
            address creatorAddress = creatorsAddressArray[index];
            Creator creatorStruct = currentCrowdFundContract.addressToCreatorMapping[creatorAddress];
            uri = creatorStruct.uri;
            creatorAddressToURIMapping[creatorAddress] = uri;
            
            currentCrowdFundContract.fundNFTMintContract(creatorAddress, currentNFTMintContractAddress);
            currentNFTMintingContract.creatorAddressToTotalFunds[creatorAddress] = creatorStruct.totalFunds;
        }

        roundIdToNFTHasBeenMinted[_currentRoundId] = true;
    }

    // mint creator's nfts for roundId => nft minting contract
    function mintNFTPerContract() onlyOwner external {
        // require that nft minting contract has been funded
        require(roundIdToNFTHasBeenMinted[_currentRoundId], "nft minting contract hasn't been funded yet");
        // get current nft minting conttract address
        address currentNFTMintingContractAddress = roundIdToNFTMintingContractAddressMapping[_currentRoundId];
        // get current nft minting contract
        NFTMintingContract currentNFTMintingContract = NFTMintingContract(currentNFTMintingContractAddress);
        
    }
}
