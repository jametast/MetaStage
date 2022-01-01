// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract MetaTreasury is Ownable {
    address[] public stageHolders;
    address[] public creators;
    uint256 minValueProtocol;
    mapping(address => uint256) public stageHoldersTreasury;
    mapping(address => uint256) public creatorsRequestedFunds;
    mapping(address => address) public votingMap;
    mapping(address => bool) public creatorObtainedRequestedFunds; 
    mapping(address => uint256) public totalFundsForCreators;
    IERC20 private stageToken;
    bool private votingHasOccurred;
    bool private inVotePeriod;


    constructor(address _dAppTokenAddress) public {
        stageToken = IERC20(_dAppTokenAddress);
        minValueProtocol = 10;
        inVotePeriod = false;
    }
    
    function depositFunds(uint256 _amount) public {
        require(_amount > 0, "Funded amount must be bigger than zero");
        require(stageToken.balanceOf(msg.sender) > _amount + minValueProtocol, "User must have enough funds");
        require(!treasuryContainsUser(msg.sender), "User already deposited funds");
        stageHoldersTreasury[msg.sender] = _amount;
        stageHolders.push(msg.sender);
        stageToken.transferFrom(msg.sender, address(this), _amount); // funds are transferred to the treasury
    }

    function requestFunds(uint256 _amount) public {
        require(_amount > 0, "Requested amount must be bigger than zero");
        require(stageToken.balanceOf(msg.sender) > minValueProtocol, "Creator must hold enough Stage tokens in order to use the MetaStage protocol");
        require(!creatorHasRequestFunds(msg.sender), "Creator already requested funds");
        creatorsRequestedFunds[msg.sender] = _amount;
        creators.push(msg.sender);
    }

    function treasuryContainsUser(address wallet) public returns(bool) {
        return stageHoldersTreasury[wallet] > 0;
    }

    function creatorHasRequestFunds(address wallet) public returns(bool) {
        return creatorsRequestedFunds[wallet] > 0;
    }
    
    function getVoteFunding(address creatorWallet) public {
        require(inVotePeriod, "Votation is not yet open to users");
        require(treasuryContainsUser(msg.sender), "Invalid user");
        require(creatorHasRequestFunds(creatorWallet), "Invalid creator");
        votingMap[msg.sender] = creatorWallet;
    }

    modifier isFundable {
        require(votingHasOccurred);
        _;
    }

    function votationHasOccurred() public {
        votingHasOccurred = true;
    }

    function computeCreatorTotalFunds() public {
        address user;
        address votedCreator;

        for (uint256 creatorIndex = 0; creatorIndex < creators.length; creatorIndex++) {
            address creator = creators[creatorIndex];
            
            for (uint256 userIndex = 0; userIndex < stageHolders.length; userIndex++) {
                user = stageHolders[userIndex];
                votedCreator = votingMap[user];

                if (creator == votedCreator) {
                    totalFundsForCreators[creator] += stageHoldersTreasury[user];
                }
            }
        }
    }

    function obtainedRequestedFunds(address creatorWallet) public view returns (bool) {
        return totalFundsForCreators[creatorWallet] > creatorsRequestedFunds[creatorWallet];
    }

    function fundCreators() payable isFundable public {
        computeCreatorTotalFunds();
        address creator;
        for (uint256 creatorIndex; creatorIndex < creators.length; creatorIndex++) {
            creator = creators[creatorIndex];
            if (totalFundsForCreators[creator] > 0) {
                stageToken.transfer(creator, totalFundsForCreators[creator]);
            }
        }
        votingHasOccurred = false; // at the end 
    }
}

