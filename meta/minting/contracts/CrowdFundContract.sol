// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";



// TODO: make math convertion
// each amount should be valued in wei
// as this is the default way to check balances of accounts
// 1 wei = 1 / 1e18 ETH

// TODO: use price feed oracles to pass from minFundValue and fundValue arguments
// to the common denominator ETH, probably using a mapping

// TODO: add LINK token and send LINK funds to the contract to use price feed

// TODO: compare both external and public methods of SC for gas efficiency purpose

contract CrowdFundContract is 
    Initializable, 
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable 
{

    // structs 

    /**
     * user structure, it encapsulates user public key, 
     * the total amount of funds he locked in our smart contract
     * which ERC20 token user used
     * which creator did user vote for
     */ 

    struct User {
        address payable wallet;
        uint256 totalLockedAmount;
        address tokenFund;
        address creatorWallet;
        nftThreshold threshold;
    }

    /**
     * creator structure, it encapsulates creator public key,
     * the total amount of funds requested
     * how much tokens did creator already obtained (at a given time)
     * which users did vote for creator
     */ 

    struct Creator {
        address payable wallet;
        uint256 requestedFunds;
        uint256 totalFunds;
        string uri;
    }

    // enums
    enum nftThreshold {
        lowerThreshold,
        midThreshold,
        upperThreshold
    }

    // immutable state variables
    uint256 public immutable minFundValue;            // we require a certain minimum amount to be locked in our smart contract, in order to use it
    uint256 public immutable startTimeRequestFunds;   // starting time that creators have to request funds
    uint256 public immutable  endTimeRequestFunds;    // ending time that creators have to request funds
    uint256 public immutable startTimeCrowdFund;      // starting time that users can lock funds and vote for their favorite creator
    uint256 public immutable endTimeCrowdFund;        // endind time that users can lock funds and vote for their favorite creator

    // state variables
    
    // arrays
    User[] internal usersArray;                                                     // array of all users
    address[] public creatorsAddressArray;                                          // array of all creator's addresses

    // mappings'
    mapping(address => bool) public creatorsMapping;                                // mapping to store creators
    mapping(address => address payable[]) public creatorAddressToFanClubMapping;    // mapping from creator pubkey to array of fan's pubkeys
    mapping(address => address) public userAddressToCreatorAddressMapping;          // mapping user pubkey => creator pubkey
    mapping(address => bool) public allowedFundingTokens;                           // which ERC20 tokens are available to fund creators
    mapping(address => address) public userAllowedTokenMapping;                     // mapping that stores which tokens each user used to lock funds
    mapping(address => User) public addressToUserMapping;                           // mapping pubkey => user structure
    mapping(address => Creator) public addressToCreatorMapping;                     // mapping pubkey => creator structure
    mapping(address => bool) public elligibleCreatorsAddressMapping;                // mapping to store which creators are elligible (have art cover NFT available on platform, etc)
    mapping(address => address) public tokenPriceFeedMapping;                       // mapping that associates to each token address its Chainlink V3Aggregator price feed
    mapping(address => bool) public creatorGotFundedMapping;                        // mapping that keeps track if a creator already got funded
    mapping(address => address) public creatorAddressToNFTMintContractAddress;      // mapping that maps a creator address to its associated meta nft minting contract
    mapping(address => uint256[3]) private creatorAddressToNFTThresholdMapping;     // mapping from creator address to corresponding threshold nft mints

    // events
    event CreatorGotFunds(address creatorWallet);       // log event of Creator having obtained necessary funds

    // user defined errors
    error CreatorAlreadyRequestedFunds();           // error => creators are not allowed to request funds multiple times
    error CreatorIsNotElligible();                    // error => creator is not elligible (does not have art cover NFT available on platform, etc)

    // receive function
    receive() external payable {}

    /** 
     * Create a programatic crow fund smart contract
     * creators can first request funds to realize their projects
     * users can lock funds into our smart contract and associate these funds with creators
     * after crowd funded has ended, funds will be distributed among creators that obtained
     * sufficiently enough funds (meaning, users backing such creator contributed more than the total requested amount by creator)
     */ 

    function initialize(
        uint256 _minFundValue, 
        address[] memory _allowedFundingTokens, 
        uint256 _startTimeRequestFunds, 
        uint256 _endTimeRequestFunds,
        uint256 _startTimeCrowdFund,
        uint256 _endTimeCrowdFund
    )  public 
       initializer
    {   
        /**
         * Why use initialize function instead of an actual constructor ? 
         * We need to add this init call method that simulates a constructor function, but
         * in this case is used by clones of an initial CrowdFundContract, this will allow us to deploy
         * new crowd fund rounds in a more gas efficient way
         */ 

        // initialize both Ownable and Reentrancy Guard upgradeable contracts
        OwnableUpgradeable.__Ownable_init();
        ReentrancyGuardUpgradeable.__ReentrancyGuard_init();
        
        // minFundValue must be positive
        require(_minFundValue > 0, "minimum fund value should be positive");
        // min value of funds to lock, in order to use the contract
        minFundValue = _minFundValue;
        // start time to request funds should be after constructor is invoked
        require(_startTimeRequestFunds >= block.timestamp, "Votation starting time already in the past");
        // start time to request funds should be prior to end time to request funds
        require(_startTimeRequestFunds < _endTimeRequestFunds, "Invalid request funds period");
        // users can only lock funds into the crowd fund contract after period to request funds has finished
        require(_endTimeRequestFunds < _startTimeCrowdFund, "Crowd fund should start after request funds period");
        // start time for users to crowd fund projects should be prior to end time
        require(_startTimeCrowdFund < _endTimeCrowdFund, "Invalid crowd fund period");

        startTimeRequestFunds = _startTimeRequestFunds;
        endTimeRequestFunds = _endTimeRequestFunds;
        startTimeCrowdFund = _startTimeCrowdFund;
        endTimeCrowdFund = _endTimeCrowdFund;

        // store into a mapping available ERC20 tokens to fund projects
        for (uint256 index; index < _allowedFundingTokens.length; index++) {
            address token = _allowedFundingTokens[index];
            allowedFundingTokens[token] = true;
        }
        // we add the 0th address, which will be useful to deal with the case where we have to transfer ETH directly
        allowedFundingTokens[address(0)] = true;
    }

    // public view to check if start time to request funds already passed
    function requestFundsStarted() external view returns(bool) {
        return startTimeRequestFunds <= block.timestamp;
    }

    // public view to check if end time to request funds already passed
    function requestFundsEnded() external view returns(bool) {
        return endTimeRequestFunds <= block.timestamp;
    }  

    // public view to check if start time to request funds already passed
    function crowdFundStarted() external view returns(bool) {
        return startTimeCrowdFund <= block.timestamp;
    }

    // public view to check if end time to request funds already passed
    function crowdFundEnded() external view returns(bool) {
        return endTimeCrowdFund <= block.timestamp;
    }

    // modifier to check if we are at request funds period
    modifier requestFundsTimerOver {
        require(startTimeRequestFunds <= block.timestamp && block.timestamp <= endTimeRequestFunds, "Requesting funds period not available");
        _;
    }

    // modifier to check if we are at crowd fund period
    modifier crowdFundTimerOver {
        require(startTimeCrowdFund <= block.timestamp && block.timestamp <= endTimeCrowdFund);
        _;
    }

    // public view that checks how much time is left until request funds period is finished
    function getTimeLeftRequestFunds() external requestFundsTimerOver view returns(uint256) {
        console.log(block.timestamp);
        return endTimeRequestFunds - block.timestamp;
    }

    // public view that checks how much time is left until crowd funding period is finished
    function getTimeLeftCrowdFund() external crowdFundTimerOver view returns(uint256) {
        return endTimeCrowdFund - block.timestamp;
    }

    // sets price feed Chainlink V3 Aggregator smart contract
    function setPriceFeedContract(address _token, address _priceFeed) external onlyOwner {
        tokenPriceFeedMapping[_token] = _priceFeed;
    }

    // public view that returns price of a given ERC20 token
    function getTokenPrice(address _token) public returns(uint256) {
        address priceFeedAddress = tokenPriceFeedMapping[_token];
        AggregatorV3Interface priceFeed = AggregatorV3Interface(priceFeedAddress);
        (, int256 price,,,) = priceFeed.latestRoundData();
        return uint256(price);
    }
    /** 
     * a user is allowed to lock a certain amount of available ERC20 tokens 
     * and associate such funds to a given creator. This amount is locked into
     * the current contract until crowd fund is over. 
     * We need OpenZeppelin nonReentrant safety guard against possible reentrant attacks 
     */
    function fund(address _wallet) nonReentrant external payable {
        // require that we are into the crowd fund period
        require(startTimeCrowdFund < block.timestamp && block.timestamp < endTimeCrowdFund, "Not in crowd fund phase");

        // Require that msg.sender has enough funds to interact with our protocol
        require(uint256(msg.sender.balance) > minFundValue, "User has not enought ETH to fund project");
        // require that amount is bigger than the min value required by our protocol, 
        // this should be bigger than protocol fee fundValue + gas on the message transaction msg.value
        require(uint256(msg.value) > minFundValue, "Funded amount must be bigger than mininum value required");
        // Require that public key of creator is valid
        require(creatorsMapping[_wallet], "Creator's public address is unrecognized");
        // Require that creator is elligible, (that is, minted art cover NFT at the platform, etc)
        require(elligibleCreatorsAddressMapping[_wallet], "Creator's public address is not elligible");
        // Require that ERC token is allowed

        // define the creator value
        Creator memory creator = addressToCreatorMapping[_wallet];

        /**
         * Logic to compute creator threshold mint NFT, that will be then used 
         * by the NFT minting contract to mint the correct associated NFT
         */

        uint256 value = msg.value;
        uint256[3] calldata threholdsArray = creatorAddressToNFTThresholdMapping[_wallet];
        nftThreshold threhold;

        if (value <= thresholdsArray[0]) {
            threshold = nftThreshold.lowerThreshold;
        } else if (thresholdsArray[0] < value && value <= threhsoldsArray[1]) {
            threshold = nftThreshold.midThreshold;
        } else {
            threhold = nftThreshold.upperThreshold;
        }
        
        // Encapsulate data into a User structure
        User memory user = User(
            payable(msg.sender), 
            uint256(msg.value), 
            address(0), 
            _wallet, 
            threshold
        ); // since we are transferring ETH in this fund overload method, we use the null address `address(0)`

        // address to user mapping is updated
        addressToUserMapping[msg.sender] = user;

        
        /**
         * Lock funds from user into the current smart contract
         * Locked funds will correspond to the value of msg.value
         * however the amount funded to given creator corresponds to msg.value - minFundValue
         * These funds will be then distributed to the chosen creator, given that creator obtained enough funds
         * we require that the transaction was correctly processed
         */

        // user data is pushed to usersArray
        usersArray.push(user);

        // creator data is obtained by the creator's public key
        // we update the creator total funds variable
        creator.totalFunds += uint256(msg.value) - minFundValue;
        
        // update `creator address to fan club array` mapping
        creatorAddressToFanClubMapping[_wallet].push(payable(msg.sender));

        // we can now check if creator is elligible, and if so make it elligible inside our smart contract
        // notice that a creator is elligible, if for some user round fund the creator total amount funded is bigger than the request
        // total funds
        if (creatorProjectApproved(_wallet)) {
            makeCreatorElligible(_wallet);
        }  
    }

    /**
     * a user is allowed to lock a certain amount of available ERC20 tokens 
     * and associate such funds to a given creator. This amount is locked into
     * the current contract until crowd fund is over. 
     */


    // function overload to account for possible different fund tokens on the protocol
    function fund(uint256 _amount, address _tokenFundAddress, address _wallet) nonReentrant external payable {
        // require that we are into the crowd fund period
        require(startTimeCrowdFund <= block.timestamp && block.timestamp <= endTimeCrowdFund, "Not in crowd fund phase");
        // given ERC20 address, in which user wants to lock his funds (say ETH, USDT, LINK, ...), is allowed by the protocol
        require(isTokenAllowed(_tokenFundAddress), "Locked funds not allowed in this token");

        uint256 tokenPrice = getTokenPrice(_tokenFundAddress);
        uint256 fundValue = tokenPrice * _amount;

        // Require that msg.sender has enough funds
        require(msg.sender.balance >= fundValue, "User has not enought ETH to fund project");
        // require that amount is bigger than the min value required by our protocol, 
        // this should be bigger than protocol fee fundValue + gas on the message transaction msg.value
        require(fundValue > minFundValue + msg.value, "Funded amount must be bigger than zero");
        // Require that public key of creator is valid
        require(creatorsMapping[_wallet], "Creator's public address is unrecognized");
        // Require that creator is elligible, (that is, minted art cover NFT at the platform, etc)
        require(elligibleCreatorsAddressMapping[_wallet], "Creator's public address is not elligible");
        // Require that ERC token is allowed
        require(allowedFundingTokens[_tokenFundAddress], "Current token is not allowed to fund creators");

        // define the creator value
        Creator storage creator = addressToCreatorMapping[_wallet];
        // Encapsulate data into a User structure
        User memory user = User(payable(msg.sender), _amount, _tokenFundAddress, _wallet);
        // address to user mapping is updated
        addressToUserMapping[msg.sender] = user;
        // Lock funds from user into the current smart contract
        // These funds will be then distributed to the chosen creator, given that creator obtained enough funds
        IERC20 token = IERC20(_tokenFundAddress);
        // payable(msg.sender).transfer(address(this), _amount);
        token.transferFrom(msg.sender, address(this), _amount);

        // user data is pushed to usersArray
        usersArray.push(user);
        // creator data is obtained by the creator's public key
        // we update the creator total funds variable
        creator.totalFunds += fundValue - minFundValue;
        // update mapping
        creatorAddressToFanClubMapping[_wallet].push(payable(msg.sender));
    }

    function isTokenAllowed(address _address) private returns(bool) {
        // checks if given ERC20 token address can be used to fund creators, by the current smart contract
        return allowedFundingTokens[_address];
    }

    /** 
     * implements logic to allow creators requiring funds from community
     * funds should be requested between startTimeRequestFunds and endTimeRequestFunds
     * moreover, our platform should offer logic to interact with current smart contract
     * that specifies if current public key is elligible to request funds. This is done
     * by requiring creators to (partially) mint NFTs art cover to the platform, as well
     * as detailed description of the project working on
     */
    function requestFunds(
        uint256 _amount, 
        string calldata _uri, 
        uint256 lowerThreshold, 
        uint256 midThreshold, 
        uint256 upperThreshold
    ) 
        public 
    {
        // require that funds are requested between startTimeRequestFunds and endTimeRequestFunds period
        require(startTimeRequestFunds <= block.timestamp && block.timestamp <= endTimeRequestFunds, "Out of request funds phase");
        // require minimum fund value
        require(_amount > minFundValue, "Requested amount must be bigger than minimum fundable value");
        // check if creator is elligible, that is it already minted NFT art cover on platform, etc
        require(elligibleCreatorsAddressMapping[msg.sender], "Creator is not elligible to request funds");
        // check that lowerThreshold <= midThrehold
        require(lowerThreshold <= midThreshold, "invalid lower/middle thresholds");
        // check that midThreshold <= upperThreshold
        require(midThreshold <= upperThreshold, "invalid middle/upper thresholds");
        
        // update creatorsMapping to true on current creator wallet
        creatorsMapping[msg.sender] = true;
        // encapsulate data into a Creator structure instance
        Creator memory creator = Creator(payable(msg.sender), _amount, 0, _uri); // when requesting funds, we assume it is the first time creator does so, therefore its total funded value should be 0
        // update addressToCreatorMapping
        addressToCreatorMapping[msg.sender] = creator;
        // update threshold
        creatorAddressToNFTThresholdMapping[msg.sender] = [lowerThreshold, midThreshold, upperThreshold];
    }

    // This function should only be called by the owner of the platform
    // whenever creator is elligible on the platform it should interact with 
    // the current smart contract to make it elligible at the blockchain level as well
    function makeCreatorElligible(address _wallet) public onlyOwner {
        // update elligibleCreatorsAddressMapping to allow for current creator to be elligible
        if (!elligibleCreatorsAddressMapping[_wallet]) {
            creatorsAddressArray.push(_wallet);
            elligibleCreatorsAddressMapping[_wallet] = true;
        }
    }

    // returns total funds creator obtained until the current block timestamp
    function computeTotalFunds(address _wallet) public onlyOwner returns(uint256) {
        require(creatorsMapping[_wallet], "Unrecognized creator's public key");
        Creator memory creator;
        creator = addressToCreatorMapping[_wallet];
        return creator.totalFunds;
    }

    // returns requested funds from creator
    function computeRequestedFunds(address _wallet) public onlyOwner returns(uint256) {
        require(creatorsMapping[_wallet], "Unrecognized creator's public key");
        Creator memory creator = addressToCreatorMapping[_wallet];
        return creator.requestedFunds;
    }

    // returns true if creators obtained more crowd funds than his requested amount
    function creatorProjectApproved(address _wallet) public returns(bool) {
        uint256 totalFunds = computeTotalFunds(_wallet);
        Creator memory creator = addressToCreatorMapping[_wallet];
        uint256 requestedFunds = creator.requestedFunds;
        return requestedFunds <= totalFunds;
    }
    
    // implements logic to fund creators if these are elligible and
    // got enough funds from crowd fund 
    // This function will most likely be deprecated, but for now we keep its use
    function fundCreators(address _wallet) payable onlyOwner external {
        // creators should obtain funds after crowd fund period has finished
        require(endTimeCrowdFund < block.timestamp, "Vote period is not yet finished");
        // creator should exit
        require(creatorsMapping[_wallet], "Unrecognized public wallet");
        // check if creator is both elligible and obtained enough funds from the crowd fund
        require(creatorProjectApproved(_wallet), "Unfortunately, creator did not obtained enough funds");
        // make sure that this is the first time a creator requests funds
        require(!creatorGotFundedMapping[_wallet], "Creator already got funds from contract");
        // update creatorGotFundedMapping accordingly
        creatorGotFundedMapping[_wallet] = true;
        
        // creator's structure instance
        Creator memory creator = addressToCreatorMapping[_wallet];
        // users that voted for creator's project
        address payable[] memory fanClub = creatorAddressToFanClubMapping[_wallet];
        // we loop over each user that voted for creator's project
        // check which token did the user locked his funds
        // send those funds locked at the present smart contract
        // to the creator's public key
        for (uint256 i = 0; i < fanClub.length; i++) {
            // user public key address
            address userWallet = fanClub[i];
            User memory user = addressToUserMapping[userWallet];
            // total locked amount of user
            uint256 totalLockedAmount = user.totalLockedAmount;
            // which ERC20 token did user locked his funds
            address tokenAddress = userAllowedTokenMapping[userWallet];
            // if user funded creator with plain ETH we use a call to the call method
            if (tokenAddress == address(0)) {
                (bool sent, ) = _wallet.call{value: totalLockedAmount - minFundValue}("");
                require(sent, "failed transaction"); // TODO: if we stop the for loop here, we will need to run it again, which is not optimal from a gas viewpoint
            } else{
                // user funded creator using a valid ERC20 token address, so we use the IERC20 logic to make the transfer
                // get the ERC20 token out of token
                IERC20 token = IERC20(tokenAddress);                
                // transfer those ERC20 token funds from the present smart contract to creator's wallet
                token.transferFrom(address(this), _wallet, totalLockedAmount);
            }
        }
    }

    // implements logic to refund users that voted for creator's projects
    // that did not get enough funds and therefore are not 
    // elligible to get funds
    function refundUsers() payable onlyOwner external {
        // encapsulate the number of users of the smart contract 
        // into a variable totalNumberOfUsers
        uint256 totalNumberOfUsers = usersArray.length;
        for (uint256 index = 0; index < totalNumberOfUsers; index++) {
            // get user 
            User memory user = usersArray[index];
            // get ERC20 token address in which user transfered funds 
            // to the present smart contract
            address tokenAddress = user.tokenFund;
            // get creator's public key
            address wallet = user.wallet;
            // if creator's project was not approved
            // we refund user with the funds amount user locked
            if (!creatorProjectApproved(user.creatorWallet)) {
                // is user funded creator with plain ETH we use the call method to make the transfer
                if (tokenAddress == address(0)) {
                    (bool sent, ) = wallet.call{value: user.totalLockedAmount - minFundValue}("");
                    require(sent, "transaction failed"); // TODO: is this gas efficient ?
                } else {
                    // user instead opted for funding with some valid ERC20 token
                    // get the IERC20 token out of tokenAddress
                    IERC20 token = IERC20(tokenAddress);
                    // transfer funds back to user
                    token.transferFrom(address(this), wallet, user.totalLockedAmount);
                }
            }
        }
    }

    function getFundedCreatorsArray() 
        external 
        view 
        onlyOwner 
        returns(address[] memory fundedCreatorsAddressArray) 
    {
        address memory fundedCreatorsAddressArray;

        for(uint256 i; i < creatorsAddressArray.length; i++) {
            address creatorAddress = creatorsAddressArray[i];
            if (creatorGotFundedMapping[creatorAddress]) {
                fundedCreatorsAddressArray.push(creatorAddress);
            }
        }
    }

    // implements logic to fund each creator's associated meta nft minting contract,
    // we require that creators are elligible and got enough funds from crowd fund
    function fundNFTMintContract(
        address creatorAddress, 
        address payable _NFTMintContractAddress
    ) 
        payable 
        onlyOwner 
        external
    {
        /** 
         * This function should be similar to fundCreators, the only difference being that
         * it needs the address of the meta NFT minting contract
         * and send funds directly to it.
         */
        // creators should obtain funds after crowd fund period has finished
        require(endTimeCrowdFund < block.timestamp, "Vote period is not yet finished");
        // creator should exit
        require(creatorsMapping[creatorAddress], "Unrecognized public wallet");
        // check if creator is both elligible and obtained enough funds from the crowd fund
        require(creatorProjectApproved(creatorAddress), "Unfortunately, creator did not obtained enough funds");
        // make sure that this is the first time a creator requests funds
        require(!creatorGotFundedMapping[creatorAddress], "Creator already got funds from contract");
        // update creatorAddressToNFTMintContractAddress accordingly
        creatorAddressToNFTMintContractAddress[creatorAddress] = metaNFTMintContractAddress;

        // creator's structure instance
        Creator memory creator = addressToCreatorMapping[creatorAddress];
        // users that voted for creator's project
        address payable[] memory fanClub = creatorAddressToFanClubMapping[creatorAddress];
        
        // without different allowed tokens, we don't neet a for loop
        // transfer tokens to nft minting contract
        _NFTMintContractAddress.call{ value: totalLockedAmount - minFundValue * fanClub.length };

        // // we loop over each user that voted for creator's project
        // // check which token did the user locked his funds
        // // send those funds locked at the present smart contract
        // // to the creator's public key
        // for (uint256 i = 0; i < fanClub.length; i++) {
        //     // user public key address
        //     address userWallet = fanClub[i];
        //     User memory user = addressToUserMapping[userWallet];
        //     // total locked amount of user
        //     uint256 totalLockedAmount = user.totalLockedAmount;
        //     // which ERC20 token did user locked his funds
        //     address tokenAddress = userAllowedTokenMapping[userWallet];
        //     // if user funded creator with plain ETH we use a call to the call method
        //     if (tokenAddress == address(0)) {
        //         metaNFTMintContractAddress.call{value: totalLockedAmount - minFundValue}("");
        //     } else{
        //         // user funded creator using a valid ERC20 token address, so we use the IERC20 logic to make the transfer
        //         // get the ERC20 token out of token
        //         IERC20 token = IERC20(tokenAddress);                
        //         // transfer those ERC20 token funds from the present smart contract to creator's wallet
        //         token.transferFrom(address(this), metaNFTMintContractAddress, totalLockedAmount);
        //     }
        // }
    }
}
