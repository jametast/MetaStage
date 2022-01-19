// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract CrowdFundContract is Ownable {
    
    bool public startVotation;
    bool public endVotation;
    uint256 public minFundValue;
    mapping(address => bool) public usersMapping;
    mapping(address => bool) public creatorsMapping;
    mapping(address => bool) public allowedFundableTokens;
    mapping(address => uint256) public usersLockedFundsMapping;
    mapping(address => address) public userAllowedTokenMapping;
    mapping(address => uint256) public creatorsFundsMapping;
    mapping(address => bool) public creatorsFundedProjectsMapping;
    mapping(address => uint256) public creatorTotalFundsMapping;
    mapping(address => address[]) public creatorVotesMapping;


    constructor(uint256 _minFundValue, address[] _allowedFundableTokens) public {
        start = False;
        end = False;
        minFundValue = _minFundValue;
        for (address token of _allowedFundableTokens) {
            allowedFundableTokens[token] = true;
        }
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
        require(isCreatorElligible(msg.sender), "Creator is not elligible to request funds);
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
            token.transferFrom(address(this), _wallet, usersLockedFundsMapping[user])
        }
    }

}
