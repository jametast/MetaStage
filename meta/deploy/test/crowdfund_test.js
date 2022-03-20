const { expect, assert } = require("chai");
const { ethers } = require("hardhat");


describe("CrowdFundContract", function () {
    it("Timeline testing of crowd funding contract", async function () {
        // get contract factory
        const CrowdFundContract = await ethers.getContractFactory("CrowdFundContract");
    
        // get current timestamp in seconds 
        const nowInSeconds = Math.floor(Date.now() / 1000);
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
        
        const startedRequestFundsPeriodBool = await crowdFundContract.requestFundsStarted();
        const endRequestFundsPeriodBool = await crowdFundContract.endRequestFundsEnded();
        const startCrowdFundPeriodBool = await crowdFundContract.crowdFundStarted();
        const endCrowdFundPeriodBool = await crowdFundContract.crowdFundEnded();

        // assert that requesting funds has not yet started
        assert(startedRequestFundsPeriodBool);
        // assert that requesting funds has not yet ended
        assert(!endRequestFundsPeriodBool);
        // assert that crowd funding has not yet started
        assert(!startCrowdFundPeriodBool);
        // assert that crowd funding has not yet ended
        assert(!endCrowdFundPeriodBool);

        // we pass forward time to start requesting funds
        let increaseTimeInSeconds = 60 * 2 + 1;
        // request new block with new timestamp of 2 minutes more
        await ethers.provider.send("evm_increaseTime", [increaseTimeInSeconds]);
        // request mining new block with this new timestamp
        await ethers.provider.send("evm_mine");
        
        startedRequestFundsPeriodBool = await crowdFundContract.requestFundsStarted();
        endRequestFundsPeriodBool = await crowdFundContract.endRequestFundsEnded();
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
            
        // we pass forward time to end requesting funds
        increaseTimeInSeconds += 60 * 5
        // request new block with new timestamp of 5 minutes more
        await ethers.provider.send("evm_increaseTime", [increaseTimeInSeconds]);
        // request mining new block with this new timestamp
        await ethers.provider.send("evm_mine");

        startedRequestFundsPeriodBool = await crowdFundContract.requestFundsStarted();
        endRequestFundsPeriodBool = await crowdFundContract.endRequestFundsEnded();
        startCrowdFundPeriodBool = await crowdFundContract.crowdFundStarted();
        endCrowdFundPeriodBool = await crowdFundContract.crowdFundEnded();
        
        // requesting funds should have started by now
        assert(startedRequestFundsPeriodBool);
        // requesting funds should have ended by now
        assert(endRequestFundsPeriodBool);
        // assert that crowd funding has not yet started
        assert(!startCrowdFundPeriodBool);
        // assert that crowd funding has not yet ended
        assert(!endCrowdFundPeriodBool);

        // we pass forward time to start crowd funding 
        increaseTimeInSeconds += 60 
        // request new block with new timestamp of 1 minute more
        await ethers.provider.send("evm_increaseTime", [increaseTimeInSeconds]);
        // request mining new block with this new timestamp
        await ethers.provider.send("evm_mine");
        
        startedRequestFundsPeriodBool = await crowdFundContract.requestFundsStarted();
        endRequestFundsPeriodBool = await crowdFundContract.endRequestFundsEnded();
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

        
        
    })
})
