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



    });
});