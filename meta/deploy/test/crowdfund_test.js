const { expect, assert } = require("chai");
const { ethers } = require("hardhat");


describe("CrowdFundContract", function () {
    it("Timeline testing of crowd funding contract", async function () {
        // get contract factory
        const CrowdFundContract = await ethers.getContractFactory("CrowdFundContract");
        
        // get current block data
        let currentBlockData = await ethers.provider.getBlock();
        // get current block timestamp
        let currentBlockTimestamp = currentBlockData["timestamp"];
        
        // get current timestamp in seconds 
        const nowInSeconds = currentBlockTimestamp + 1 // prior, we were testing it with date now method:  Math.floor(Date.now() / 1000);
        // starts in 2 minutes
        const startRequestFunds = nowInSeconds + 60 * 2 
        // requesting funds will have a duration of 5 minutes
        const endRequestFunds = nowInSeconds + 60 * (2 + 5) 
        // crowd funding starts 1 minute laters
        const startCrowdFund = nowInSeconds + 60 * (2 + 5 + 1) 
        // crow fundings lasts for 10 minutes
        const endCrowdFund = nowInSeconds + 60 * (2 + 5 + 1 + 10) 
        // 0.001 ETH = 1e15 Wei
        const minFundValue = 1000000000000000; 
        // for the moment we only allow funding in ETH
        const allowedFundingTokens = [] 
        
        // deploy Crowd Funding contract
        const crowdFundContract = await CrowdFundContract.deploy(
            minFundValue, 
            allowedFundingTokens, 
            startRequestFunds, 
            endRequestFunds, 
            startCrowdFund, 
            endCrowdFund
        );
        
        // does request funds period started?
        let startedRequestFundsPeriodBool = await crowdFundContract.requestFundsStarted();
        // does request funds period ended?
        let endRequestFundsPeriodBool = await crowdFundContract.requestFundsEnded();
        // does crowd fund period started?
        let startCrowdFundPeriodBool = await crowdFundContract.crowdFundStarted();
        // does crowd fund period ended?
        let endCrowdFundPeriodBool = await crowdFundContract.crowdFundEnded();

        // assert that requesting funds has not yet started
        assert(!startedRequestFundsPeriodBool);
        // assert that requesting funds has not yet ended
        assert(!endRequestFundsPeriodBool);
        // assert that crowd funding has not yet started
        assert(!startCrowdFundPeriodBool);
        // assert that crowd funding has not yet ended
        assert(!endCrowdFundPeriodBool);

        // test that getTimeLeftRequestFunds() throws an error outside request funds period
        const getTimeLeftRequestFunds = async () => {
            try {
                await crowdFundContract.getTimeLeftRequestFunds();
            } catch(err) {
                error = err;
            }
            expect(error).to.be.an("Error")
        };

        // expect null output from getTimeLeftRquestFunds == expect(error) to be an error
        const expectNull = await getTimeLeftRequestFunds();
        assert(expectNull).to.be.a("null");

        // test that getTimeLeftCrowdFund() throws an error outside request funds period
        const getTimeLeftCrowdFund = async () => {
            try {
                await crowdFundContract.getTimeLeftCrowdFund;
            } catch(err) {
                error = err;
            }
            expect(error).to.be.an("Error");
        }

        // expect null output from getTimeLeftCrowdFund == expect(error) to be an error
        expectNull = await getTimeLeftCrowdFund();
        assert(expectNull).to.be.a("null");

        // we pass forward time to start requesting funds
        let increaseTimeInSeconds = 60 * 2 + 1;
        // request new block with new timestamp of 2 minutes more
        await ethers.provider.send("evm_increaseTime", [increaseTimeInSeconds]);
        // request mining new block with this new timestamp
        await ethers.provider.send("evm_mine");
        
        startedRequestFundsPeriodBool = await crowdFundContract.requestFundsStarted();
        endRequestFundsPeriodBool = await crowdFundContract.requestFundsEnded();
        startCrowdFundPeriodBool = await crowdFundContract.crowdFundStarted();
        endCrowdFundPeriodBool = await crowdFundContract.crowdFundEnded();

        // requesting funds should have started by now
        assert(startedRequestFundsPeriodBool);
        // assert that requesting funds has not yet ended
        assert(!endRequestFundsPeriodBool);
        // assert that crowd funding has not yet started
        assert(!startCrowdFundPeriodBool);
        // assert that crowd funding has not yet ended
        assert(!endCrowdFundPeriodBool);

        // testing getTimeLeftRequestFunds() method
        const timeLeftRequestFunds = await crowdFundContract.getTimeLeftRequestFunds();

        // get current block data
        currentBlockData = await ethers.provider.getBlock();
        // get current block timestamp
        currentBlockTimestamp = await currentBlockData["timestamp"];
        
        // get number of seconds from current block timstamp to end request funds time 
        const endRequestFundsToCurrentTimeBlock = endRequestFunds - currentBlockTimestamp;
        
        // assert timeLeftRequestFunds == endRequestFundsToCurrentTimeBlock
        assert(endRequestFundsToCurrentTimeBlock == timeLeftRequestFunds);
        
        // we pass forward time to end requesting funds
        increaseTimeInSeconds += 60 * 5
        // request new block with n funds has already finishedew timestamp of 5 minutes more
        await ethers.provider.send("evm_increaseTime", [increaseTimeInSeconds]);
        // request mining new block with this new timestamp
        await ethers.provider.send("evm_mine");
        
        startRequestFundsTimeValue = await crowdFundContract.requestFundsStarted(); 
        endRequestFundsTimeValue = await crowdFundContract.requestFundsEnded();
        startCrowdFundTimeValue = await crowdFundContract.crowdFundStarted();
        endCrowdFundTimeValue = await crowdFundContract.crowdFundsEnded();  
        
        // requesting funds should have started by now
        assert(startedRequestFundsPeriodBool);
        // requesting funds should have ended by now
        assert(endRequestFundsPeriodBool);
        // assert that crowd funding has not yet started
        assert(!startCrowdFundPeriodBool);
        // assert that crowd funding has not yet ended
        assert(!endCrowdFundPeriodBool);

        // test that getTimeLeftRequestFunds throws an error outside request funds period
        expectNull = await getTimeLeftRequestFunds();
        assert(expectNull).to.be.a("null");

        // test that getTimeLeftCrowdFund throws an error outside crowd funds period
        expectNull = await getTimeLeftCrowdFund();
        assert(expectNull).to.be.a("null");


        // we pass forward time to start crowd funding 
        increaseTimeInSeconds += 60 
        // request new block with new timestamp of 1 minute more
        await ethers.provider.send("evm_increaseTime", [increaseTimeInSeconds]);
        // request mining new block with this new timestamp
        await ethers.provider.send("evm_mine");
        
        startedRequestFundsPeriodBool = await crowdFundContract.requestFundsStarted();
        endRequestFundsPeriodBool = await crowdFundContract.requestFundsEnded();
        startCrowdFundPeriodBool = await crowdFundContract.crowdFundStarted();
        endCrowdFundPeriodBool = await crowdFundContract.crowdFundEnded();
        
        // requesting funds should have started by now
        assert(startedRequestFundsPeriodBool);
        // requesting funds should have ended by now
        assert(endRequestFundsPeriodBool);
        // crowd funding should have started by now
        assert(startCrowdFundPeriodBool);
        // assert that crowd funding has not yet ended
        assert(!endCrowdFundPeriodBool);

        // test that getTimeLeftRequestFunds throws an error outside request funds period
        expectNull = await getTimeLeftRequestFunds();
        assert(expectNull).to.be.a("null");

        // test getTimeLeftCrowdFund() method
        const timeLeftCrowdFund = crowdFundContract.getTimeLeftCrowdFund();

        // get current block data
        currentBlockData = await ethers.provider.getBlock();
        // get current block timestamp
        currentBlockTimestamp = await currentBlockData["timestamp"];
        
        // get number of seconds from current block timstamp to end request funds time 
        const endCrowdFundToCurrentBlockTimestamp = endCrowdFund - currentBlockTimestamp;
        
        // assert timeLeftRequestFunds == endRequestFundsToCurrentTimeBlock
        assert(endCrowdFundToCurrentBlockTimestamp == timeLeftCrowdFund);
        
        // finally we pass forward time to end crowd funding
        increaseTimeInSeconds += 60 * 10
        // request new block with new timestmap of 10 minutes more 
        await ethers.provider.send("evm_increaseTime", [increaseTimeInSeconds]);
        // request mining new block with this new timestamp
        await ethers.provider.send("evm_mine");

        // requesting funds should have started by now
        assert(startedRequestFundsPeriodBool);
        // requesting funds should have ended by now
        assert(endRequestFundsPeriodBool);
        // crowd funding should have started by now
        assert(startCrowdFundPeriodBool);
        // crowd funding should have ended by now
        assert(endCrowdFundPeriodBool);

        // expect that getTimeLeftRequestFunds throws an error
        expectNull = await getTimeLeftRequestFunds();
        assert(expectNull).to.be.a("null");

        // test that getTimeLeftCrowdFund throws an error outside crowd funds period
        expectNull = await getTimeLeftCrowdFund();
        assert(expectNull).to.be.a("null");        
    })
})
