const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { getCrowdFundContract, getCurrentBlockTimestamp } = require("./deployTest");



describe("CrowdFundRequestFunds", function () {
    it("Funding creators", async function () {
        // get deployed crowd fund contract
        const crowdFundContract = await getCrowdFundContract();
        // get current block timestamp
        let currentBlockTimestamp = await getCurrentBlockTimestamp();

        // get users and creators signers
        const [owner, creator1, creator2, creator3, user1, user2, user3] = await ethers.getSigners();

        // get start time of crowd fund period
        const startTimeCrowdFund = await crowdFundContract.startTimeCrowdFund();
        // get end time of crowd fund period
        const endTimeCrowdFund = await crowdFundContract.endTimeCrowdFund();

        // how many seconds to start crowd fund period
        let increaseTimeInSeconds = startTimeCrowdFund - currentBlockTimestamp + 1;
        
        // increase timestamp in block by increaseTimeInSeconds
        await ethers.provider.send("evm_increaseTime", [increaseTimeInSeconds]);
        // mine new block
        await ethers.provider.send("evm_mine");

        // get bool value determining if we are in request funds period
        const requestFundsPeriodStarted = await crowdFundContract.requestFundsStarted();
        const requestFundsPeriodEnded = await crowdFundContract.requestFundsEnded();
        const inRequestFundsPeriod = requestFundsPeriodStarted && !requestFundsPeriodEnded;
        // guarantee we are in request funds period
        assert(inRequestFundsPeriod);

        // get creator's public keys
        const creatorAddress1 = creator1.getAddress();
        const creatorAddress2 = creator2.getAddress();
        const creatorAddress3 = creator3.getAddress();

        // owner of smart contract gives creators permission to request funds
        await crowdFundContract.connect(owner).makeCreatorElligible(creatorAddress1);
        await crowdFundContract.connect(owner).makeCreatorElligible(creatorAddress2);
        await crowdFundContract.connect(owner).makeCreatorElligible(creatorAddress3);

        // creators request funds to contract
        const fundsRequestedCreator1 = ethers.utils.parseEth('1.0');
        const fundsRequestedCreator2 = ethers.utils.parseEth('2.5');
        const fundsRequestedCreator3 = ethers.utils.parseEth('5.0');

        await crowdFundContract.connect(creatorAddress1).requestFunds(fundsRequestedCreator1);
        await crowdFundContract.connect(creatorAddress2).requestFunds(fundsRequestedCreator2);
        await crowdFundContract.connect(creatorAddress3).requestFunds(fundsRequestedCreator3);

        // we now mint new block to get into funding phase
        currentBlockTimestamp = await getCurrentBlockTimestamp();
        increaseTimeInSeconds = startTimeCrowdFund - currentBlockTimestamp + 1;

        await ethers.provider.send("evm_increaseTime", [increaseTimeInSeconds]);
        await ethers.provider.send("evm_mine");

        const fundingStartedBool = await crowdFundContract.crowdFundStarted();
        const fundingEndedBool = await crowdFundContract.crowdFundEnded();
        const inFundingPhaseBool = fundingStartedBool && (!fundingEndedBool);

        // make certain we are in funding phase
        assert(inFundingPhaseBool);

        const userAddress1 = user1.getAddress();
        const userAddress2 = user2.getAddress();
        const userAddress3 = user3.getAddress();

        // values to be funded for each user
        const fundsUser1 = ethers.utils.parseEth('0.5');
        const fundsUser2 = ethers.utils.parseEth('4.5');
        const fundsUser3 = ethers.utils.parseEth('1.0');

        // funds are sent to smart contract
        await crowdFundContract.connect(userAddress1).fund(fundsUser1, creatorAddress3); // user1 funds creator3
        await crowdFundContract.connect(userAddress2).fund(fundsUser2, creatorAddress3); // user2 funds creator3
        await crowdFundContract.connect(userAddress3).fund(fundsUser3, creatorAddress1); // user3 funds creator1

        // check contract data is updated
        // 1. check contract balance
        //get contract address
        const contractAddress = crowdFundContract.address;
        const balanceOfContract = await ethers.provider.getBalance(contractAddress);

        assert(balanceOfContract.eq(fundsUser1.add(fundsUser2.add(fundsUser3)))); // smart contract balance should equal the sum of fundsUser1, fundsUser2, fundsUser3

        // for each user check that User data structure is correct
        const userContract1 = crowdFundContract.addressToUserMapping(userAddress1);
        const userContract2 = crowdFundContract.addressToUserMapping(userAddress2);
        const userContract3 = crowdFundContract.addressToUserMapping(userAddress3);

        // check that wallets are correctly specified
        assert(userContract1.wallet == userAddress1);
        assert(userContract2.wallet == userAddress2);
        assert(userContract3.wallet == userAddress3);

        // check that totalLockedAmount is correctly specified
        assert(userContract1.totalLockedAmount.eq(fundsUser1));
        assert(userContract2.totalLockedAmount.eq(fundsUser2));
        assert(userContract3.totalLockedAmount.eq(fundsUser3));

        // check that token funded corresponds to contract ETH representation
        assert(userContract1.tokenFund == "0x0");
        assert(userContract2.tokenFund == "0x0");
        assert(userContract3.tokenFund == "0x0");

        // check that creator wallets are correctly specified
        assert(userContract1.creatorWallet == creatorAddress3);
        assert(userContract2.creatorWallet == creatorAddress3);
        assert(userContract3.creatorWallet == creatorAddress3);

        // for each creator check that totalFunds and fanClub data has been updated
        const creatorContract1 = crowdFundContract.addressToCreatorMapping(creatorAddress1);
        const creatorContract2 = crowdFundContract.addressToCreatorMapping(creatorAddress2);
        const creatorContract3 = crowdFundContract.addressToCreatorMapping(creatorAddress3);

        // check that totalFunds are correctly specified
        // get minFundValue of contract
        const minFundValue = crowdFundContract.minFundValue();

        // get totalFunds values for each creator
        const totalFunds1 = creatorContract1.totalFunds;
        const totalFunds2 = creatorContract2.totalfunds;
        const totalFunds3 = creatorContract3.totalFunds;

        assert(totalFunds1.eq(fundsUser1.sub(minFundValue)));
        assert(totalFunds2.eq(fundsUser2.sub(minFundValue)));
        assert(totalFunds3.eq(fundsUser3.sub(minFundValue)));

        // check fanClub's are correctly specified for each user
        const fanClub1 = creatorContract1.fanClub;
        const fanClub2 = creatorContract2.fanClub;
        const fanClub3 = creatorContract3.fanClub;

        assert(fanClub1.length == 1);
        assert(fanClub2.length == 0);
        assert(fanClub3.length == 2);

        assert(fanClub1[0] == userAddress3);
        assert(fanClub3[0] == userAddress1);
        assert(fanClub3[1] == userAddress3);
    });
});