// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/interfaces/AggregatorV3Interface.sol";

contract CrowdFundContract is Ownable {
    
    struct User {
        address wallet;
        uint256 totalAmount;
    }

    struct Creator {
        address wallet;
        uint256 requestedFunds;
        uint256 totalFunds;
    }

    bool public votationHasStarted;
    bool public votationHasEnded;
    uint256 public minFundValue;
    uint256 public startTime;
    uint256 public endTime;
    mapping(address => bool) public usersMapping;
    mapping(address => bool) public creatorsMapping;
    mapping(address => bool) public allowedFundableTokens;
    mapping(address => uint256) public usersLockedFundsMapping;
    mapping(address => address) public userAllowedTokenMapping;
    mapping(address => uint256) public creatorsFundsMapping;
    mapping(address => bool) public creatorsFundedProjectsMapping;
    mapping(address => uint256) public creatorTotalFundsMapping;
    mapping(address => address[]) public creatorVotesMapping;
    mapping(address => address) public tokenPriceFeedMapping;

    event CreatorGotFunds(address creatorWallet);
    // error CrowdFundAlreadyEnded();
    // error UserAlreadyVoted(address userWallet);
    // error CrowdFundNotYetEnded();
    // error tokenNotAllowed(address token);


    constructor(uint256 _minFundValue, address[] _allowedFundableTokens, uint256 _startTime, uint256 _endTime) public {
        minFundValue = _minFundValue;
        require(startTime > now, "Votation starting time already in the past");
        startTime = _startTime;
        endTime = _endTime;
        for (uint256 index; index < _allowableFundableTokens; index++) {
            address token = _allowableFundableTokens[index];
            allowedFundableTokens[token] = true;
        }
    }

    function hasStarted() public view returns(bool) {
        return startTime < now;
    }

    function hasEnded() public view returns(bool) {
        return endTime < now;
    }

    modifier timerOver {
        require(now <= _end, "Votation has already ended");
        _;
    }

    function getTimeLeft() public timerOver view returns(uint256) {
        return endTime - now;
    }

    function setPriceFeedContract(address _token, address _priceFeed) public onlyOwner {
        tokenPriceFeedMapping[_token] = _priceFeed;
    }

    function getTokenPrice(address _token) public view returns(uint256, uint256) {
        address priceFeedAddress = tokenPriceFeedAddress[_token];
        AggregatorV3Interface priceFeed = AggregatorV3Interface(priceFeedAddress);
        (, int256 price,,,) = priceFeed.latestRoundData();
        uint256 decimals = uint256(priceFeed.decimals());
        return (uint256(price), decimals);
    }

    function fund(uint256 _amount, address _toFundAddress) public {
        requireVotationTimeline();
        require(_amount > 0, "Funded amount must be bigger than zero");
        require(isTokenAllowed(_toFundAddress), "Locked funds not allowed in this token");
        require(userHasLockedFunds(msg.sender), "User already locked funds");
        usersMapping[msg.sender] = True;
        usersLockedFundsMapping[msg.sender] = _amount;
        userAllowedTokenMapping[msg.sender] = _toFundAddress;
        _toFundAddres.transferFrom(msg.sender, address(this), _amount);     // funds are locked
    }

    function isTokenAllowed(address _address) private returns(bool) {
        return allowedFundableTokens[_address];
    }

    function userHasLockedFunds(address _wallet) public returns(bool) {
        return usersMapping[_wallet];
    }

    function requestFunds(uint256 _amount) public {
        requireVotationTimeline();
        require(_amount > 0, "Requested amount must be bigger than zero");
        require(!creatorsMapping[msg.sender], "Creator already requested funds for project");
        require(isCreatorElligible(msg.sender), "Creator is not elligible to request funds");
        creatorsMapping[msg.sender] = true;
        creatorVotesMapping[_wallet].push(msg.sender);
    }

    function requireVotationTimeline() private {
        require(start, "Votation has not yet begun");
        require(!end, "Votation already finished");
    }

    function isCreatorElligible(address _wallet) public returns(bool) {
        return true;
    }

    function voteForProject(address _wallet) public {
        requireVotationTimeline();
        require(creatorsMapping[_wallet], "Unrecognized public wallet");
        require(usersMapping[msg.sender], "Unable to vote, didn't locked funds");
        userVoteMapping[msg.sender] = _wallet;
        creatorsFundsMapping[_wallet] += usersLockedFundsMapping[msg.sender];
    }

    function votationHasFinished() public returns(bool) {
        return end;
    }
    modifier isFundable {
        require(votationHasFinished);
        _;
    }

    function computeTotalFunds(address _wallet) private returns(uint256) {
        return creatorsFundsMapping[_wallet];
    }

    function creatorProjectApproved(address _wallet) public returns(bool) {
        uint256 totalFunds = computeTotalFunds(_wallet);
        return creatorsFundsMapping[_wallet] > totalFunds;
    }

    function fundCreators(address _wallet) payable isFundable public {
        require(end, "Vote period is not yet finished");
        require(creatorsFundedProjectsMapping[_wallet], "Creator did not get enough funds from community");
        address[] fundsByUsers = creatorVotesMapping[_wallet];
        for (uint256 i = 0; i < fundsByUsers.length; i++) {
            address user = fundsByUsers[i];
            address token = userAllowedTokenMapping[user];
            token.transferFrom(address(this), _wallet, usersLockedFundsMapping[user]);
        }
    }

}
