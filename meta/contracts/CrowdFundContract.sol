// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/interfaces/AggregatorV3Interface.sol";


contract CrowdFundContract is Ownable {
    
    // user structure, it encapsulates user public key, 
    // the total amount of funds he locked in our smart contract
    // which ERC20 token user used
    // which creator did user vote for
    struct User {
        address payable wallet;
        uint256 totalLockedAmount;
        address tokenFund;
        Creator creator;
    }

    // creator structure, it encapsulates creator public key,
    // the total amount of funds requested
    // how much tokens did creator already obtained (at a given time)
    // which users did vote for creator
    struct Creator {
        address payable wallet;
        uint256 requestedFunds;
        uint256 totalFunds;
        User[] fanClub;
    }

    uint256 public minFundValue;            // we require a certain minimum amount to be locked in our smart contract, in order to use it
    uint256 public startTimeRequestFunds;   // starting time that creators have to request funds
    uint256 public endTimeRequestFunds;     // ending time that creators have to request funds
    uint256 public startTimeCrowdFund;      // starting time that users can lock funds and vote for their favorite creator
    uint256 public endTimeCrowdFund;        // endind time that users can lock funds and vote for their favorite creator

    User[] usersArray;    // array of all users

    mapping(address => bool) public usersMapping;                       // mapping to store users 
    mapping(address => bool) public creatorsMapping;                    // mapping to store creators
    mapping(address => bool) public allowedFundingTokens;               // which ERC20 tokens are available to fund creators
    mapping(address => address) public userAllowedTokenMapping;         // mapping that stores which tokens each user used to lock funds
    mapping(address => User) public addressToUserMapping;               // mapping pubkey => user structure
    mapping(address => Creator) public addressToCreatorMapping;         // mapping pubkey => creator structure
    mapping(address => bool) public elligibleCreatorsAddressMapping;    // mapping to store which creators are elligible (have art cover NFT available on platform, etc)
    mapping(address => address) public tokenPriceFeedMapping;           // mapping that associates to each token address its Chainlink V3Aggregator price feed

    event CreatorGotFunds(address creatorWallet);       // log event of Creator having obtained necessary funds

    error CreatorAlreadyRequestedFunds();           // error => creators are not allowed to request funds multiple times
    error CreatorIsNotElligible;                    // error => creator is not elligible (does not have art cover NFT available on platform, etc)

    // Create a programatic crow fund smart contract
    // creators can first request funds to realize their projects
    // users can lock funds into our smart contract and associate these funds with creators
    // after crowd funded has ended, funds will be distributed among creators that obtained
    // sufficiently enough funds (meaning, users backing such creator contributed more than the total requested amount by creator)
    constructor(
        uint256 _minFundValue, 
        address[] _allowedFundingTokens, 
        uint256 _startTimeRequestFunds, 
        uint256 _endTimeRequestFunds,
        uint256 _startTimeCrowdFund;
        uint256 _endTimeCrowdFund;
    ) 
    onlyOwner public {
        // min value of funds to lock, in order to use the contract
        minFundValue = _minFundValue;
        // start time to request funds should be after constructor is invoked
        require(_startTimeRequestFunds > now, "Votation starting time already in the past");
        // start time to request funds should be prior to end time to request funds
        require(_startTimeRequestFunds < endTimeRequestFunds, "Invalid request funds period");
        // users can only lock funds into the crowd fund contract after period to request funds has finished
        require(_endTimeRequestFunds < _startTimeCrowdFund, "Crowd fund should start after request funds period");
        // start time for users to crowd fund projects should be prior to end time
        require(_startTimeCrowdFund < _endTimeCrowdFund, "Invalid crowd fund period");

        startTimeRequestFunds = _startTimeRequestFunds;
        endTimeRequestFunds = _endTimeRequestFunds;
        startTimeCrowdFund = _startTimeCrowdFund;
        endTimeCrowdFund = _endTimeCrowdFund;

        // store into a mapping available ERC20 tokens to fund projects
        for (uint256 index; index < _allowableFundingTokens; index++) {
            address token = _allowableFundableTokens[index];
            allowedFundingTokens[token] = true;
        }
    }

    // public view to check if start time to request funds already passed
    function requestFundsStarted() public view returns(bool) {
        return startTimeRequestFunds < now;
    }

    // public view to check if end time to request funds already passed
    function requestFundsEnded() public view returns(bool) {
        return endTimeRequestFunds < now;
    }  

    // public view to check if start time to request funds already passed
    function crowdFundStarted() public view returns(bool) {
        return startTimeCrowdFund;
    }

    // public view to check if end time to request funds already passed
    function crowdFundEnded() public view returns(bool) {
        return endTimeCrowdFund;
    }

    // modifier to check if we are at request funds period
    modifier requestFundsTimerOver {
        require(startTimeRequestFunds <= now && now <= endTimeRequestFunds, "Request funds has already finished");
        _;
    }

    // modifier to check if we are at crowd fund period
    modifier crowdFundTimerOver {
        require(startTimeCrowdFund <= now && now <= endTimeCrowdFund);
        _;
    }

    // public view that checks how much time is left until request funds period is finished
    function getTimeLeftRequestFunds() public requestFundsTimerOver view returns(uint256) {
        return endTimeRequestFunds - now;
    }

    // public view that checks how much time is left until crowd funding period is finished
    function getTimeLeftCrowdFund() public crowdFundTimerOver view returns(uint256) {
        return endTimeCrowdFund - now;
    }

    // sets price feed Chainlink V3 Aggregator smart contract
    function setPriceFeedContract(address _token, address _priceFeed) public onlyOwner {
        tokenPriceFeedMapping[_token] = _priceFeed;
    }

    // public view that returns price of a given ERC20 token
    function getTokenPrice(address _token) public view returns(uint256, uint256) {
        address priceFeedAddress = tokenPriceFeedAddress[_token];
        AggregatorV3Interface priceFeed = AggregatorV3Interface(priceFeedAddress);
        (, int256 price,,,) = priceFeed.latestRoundData();
        uint256 decimals = uint256(priceFeed.decimals());
        return (uint256(price), decimals);
    }

    // a user is allowed to lock a certain amount of available ERC20 tokens 
    // and associate such funds to a given creator. This amount is locked into
    // the current contract until crowd fund is over. 
    function fund(uint256 _amount, address _tokenFundAddress, address _wallet) public {
        // require that we are into the crowd fund period
        require(startTimeCrowdFund < block.timestmap && block.timestamp < endTimeCrowdFund, "Not in crowd fund phase");
        // given ERC20 address, in which user wants to lock his funds (say ETH, USDT, LINK, ...), is allowed by the protocol
        require(isTokenAllowed(_tokenFundAddress), "Locked funds not allowed in this token");
        // require that amount is bigger than the min value required by our protocol
        (uint256, uint256) (tokenPrice, decimals) = getTokenPrice(_tokenFund);
        uint256 fundValue = tokenPrice * _amount;
        require(fundValue > minFundValue, "Funded amount must be bigger than zero");
        // Require that public key of creator is valid
        require(creatorsMapping[_wallet], "Creator's public address is unrecognized");
        // Require that creator is elligible, (that is, minted art cover NFT at the platform, etc)
        require(isCreatorElligible(_wallet), "Creator's public address is not elligible");

        // Encapsulate data into a User structure
        user = User(msg.sender, _amount, _tokenFundAddress, _wallet);
        // users mapping is updated with the public key interacting with the contract
        usersMapping[msg.sender] = true;
        // address to user mapping is updated
        addressToUserMapping[msg.sender] = user;
        // Lock funds from user into the current smart contract
        // These funds will be then distributed to the chosen creator, given that creator obtained enough funds
        _tokenFundAddress.transferFrom(msg.sender, address(this), _amount);
        // user data is pushed to usersArray
        usersArray.push(user);

        // creator data is obtained by the creator's public key
        creator = addressToCreatorMapping[_wallet];
        // we update the creator total funds variable
        creator.totalFunds += fundValue;
        // we update the array containing users that contributed with funds to creator with msg.sender
        creator.fanClub.push(user);
    }

    function isTokenAllowed(address _address) private returns(bool) {
        // checks if given ERC20 token address can be used to fund creators, by the current smart contract
        return allowedFundingTokens[_address];
    }

    function userHasLockedFunds(User user) public returns(bool) {
        // checks if public address has locked funds in current smart contract
        return usersMapping[_wallet];
    }

    // implements logic to allow creators requiring funds from community
    // funds should be requested between startTimeRequestFunds and endTimeRequestFunds
    // moreover, our platform should offer logic to interact with current smart contract
    // that specifies if current public key is elligible to request funds. This is done
    // by requiring creators to (partially) mint NFTs art cover to the platform, as well
    // as detailed description of the project working on
    function requestFunds(uint256 _amount) public {
        // require that funds are requested between startTimeRequestFunds and endTimeRequestFunds period
        require(startTimeRequestFunds < block.timestamp && block.timestamp < endTimeRequestFunds, "Out of request funds phase")
        // require minimum fund value
        require(_amount > minFundValue, "Requested amount must be bigger than zero");
        // check if creator is elligible, that is it already minted NFT art cover on platform, etc
        require(isCreatorElliglbe(msg.sender), "Creator is not elligible to request funds");
        
        // update creatorsMapping to true on current creator wallet
        creatorsMapping[msg.sender] = true;
        // encapsulate data into a Creator structure instance
        creator = Creator(msg.sender, _amount, 0);    // when requesting funds, we assume it is the first time creator does so, therefore its total funded value should be 0
        // update addressToCreatorMapping
        addressToCreatorMapping[msg.sender] = creator;
    }

    // This function should only be called by the owner of the platform
    // whenever creator is elligible on the platform it should interact with 
    // the current smart contract to make it elligible at the blockchain level as well
    function makeCreatorElligible(address _wallet) public onlyOwner {
        // update elligibleCreatorsAddressMapping to allow for current creator to be elligible
        elligibleCreatorsAddressMapping[_wallet] = True;
    }

    // checks if a given public key corresponds to an elligible creator
    function isCreatorElligible(address _wallet) public returns(bool) {
        return elligibleCreatorsAddressMapping[_wallet];
    }

    // returns total funds creator obtained until the current block timestamp
    function computeTotalFunds(address _wallet) public returns(uint256) {
        require(creatorsMapping[_wallet], "Unrecognized creator's public key");
        Creator creator;
        creator = addressToCreatorMapping[_wallet]
        return creator.totalFunds;
    }

    // returns requested funds from creator
    function computeRequestedFunds(address _wallet) public returns(uint256) {
        require(creatorsMapping[_wallet], "Unrecognized creator's public key");
        Creator creator;
        creator = addressToCreatorMapping[_wallet];
        return creator.requestedFunds
    }

    // returns true if creators obtained more crowd funds than his requested amount
    function creatorProjectApproved(address _wallet) public returns(bool) {
        // require that public address corresponds to an elligible creator
        require(isElligibleCreatorMapping[_wallet], "Creator is not elligible");
        uint256 totalFunds = computeTotalFunds(_wallet);
        uint256 requestedFunds = computeRequestedFunds(_wallet);
        return requestedFunds < totalFunds;
    }
    
    // implements logic to fund creators if these are elligible and
    // got enough funds from crowd fund 
    function fundCreators(address _wallet) payable isFundable onlyOwner public {
        // creators should obtain funds after crowd fund period has finished
        require(endTimeCrowdFund < block.timestamp, "Vote period is not yet finished");
        // creator should exit
        require(creatorsMapping[_wallet], "Unrecognized public wallet");
        // check if creator is both elligible and obtained enough funds from the crowd fund
        require(creatorProjectApproved(_wallet), "Unfortunately, creator did not obtained enough funds");
        // creator's structure instance
        creator = addressToCreatorMapping[_wallet];
        // users that voted for creator's project
        address[] fanClub = creator.fanClub;
        // we loop over each user that voted for creator's project
        // check which token did the user locked his funds
        // send those funds locked at the present smart contract
        // to the creator's public key
        for (uint256 i = 0; i < fanClub.length; i++) {
            // user public key address
            address user = fundsByUsers[i];
            // which ERC20 token did user locked his funds
            address token = userAllowedTokenMapping[user];
            // transfer those ERC20 token funds from the present smart contract to creator's wallet
            token.transferFrom(address(this), _wallet, user.totalLockedAmount);
        }
    }

    // implements logic to refund users that voted for creator's projects
    // that did not get enough funds and therefore are not 
    // elligible to get funds
    function refundUsers() payable isFundable onlyOwner public {
        // encapsulate the number of users of the smart contract 
        // into a variable totalNumberOfUsers
        uint totalNumberOfUsers = usersArray.length()
        for (uint256 index = 0; index < totalNumberOfUsers; index++) {
            // get user 
            User user = usersArray[index];
            // get ERC20 token address in which user transfered funds 
            // to the present smart contract
            address tokenAddress = user.tokenFund;
            // get creator
            Creator creator = user.creator;
            // get creator's public key
            address wallet = creator.wallet;
            // if creator's project was not approved
            // we refund user with the funds amount user locked
            if (!creatorProjectApproved(wallet)) {
                // transfer funds back to user
                tokenAddress.transferFrom(address(this), _wallet, user.totalLockedAmount);
            }
        }
    }
}
