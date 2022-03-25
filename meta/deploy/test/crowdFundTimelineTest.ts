import { expect, assert } from "chai";
import { ethers } from "hardhat";
import { BigNumber, ContractFactory, Contract, providers } from "ethers";


describe("CrowdFundContractTimeLine", function () {
    it("Timeline testing of crowd funding contract", async function () {
        // get contract factory
        const CrowdFundContract: ContractFactory = await ethers.getContractFactory("CrowdFundContract");
        
        // get latest block number
        let blockNumber: number = ethers.provider.blockNumber;
        // get current block data
        let currentBlockData: providers.Block = await ethers.provider.getBlock(blockNumber);
        // get current block timestamp
        let currentBlockTimestamp: number = currentBlockData["timestamp"];
        
        // get current timestamp in seconds 
        const nowInSeconds: number = currentBlockTimestamp + 1 // prior, we were testing it with date now method:  Math.floor(Date.now() / 1000);
        // starts in 2 minutes
        const startRequestFunds: number = nowInSeconds + 60 * 2 
        // requesting funds will have a duration of 5 minutes
        const endRequestFunds: number = nowInSeconds + 60 * (2 + 5) 
        // crowd funding starts 1 minute laters
        const startCrowdFund: number = nowInSeconds + 60 * (2 + 5 + 1) 
        // crow fundings lasts for 10 minutes
        const endCrowdFund: number = nowInSeconds + 60 * (2 + 5 + 1 + 10) 
        // 0.001 ETH = 1e15 Wei
        const minFundValue: number = 1000000000000000; 
        // for the moment we only allow funding in ETH
        const allowedFundingTokens: string[] = [] 
        
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
        let startedRequestFundsPeriodBool: boolean = await crowdFundContract.requestFundsStarted();
        // does request funds period ended?
        let endRequestFundsPeriodBool: boolean = await crowdFundContract.requestFundsEnded();
        // does crowd fund period started?
        let startCrowdFundPeriodBool: boolean = await crowdFundContract.crowdFundStarted();
        // does crowd fund period ended?
        let endCrowdFundPeriodBool: boolean = await crowdFundContract.crowdFundEnded();

        // assert that requesting funds has not yet started
        assert(!startedRequestFundsPeriodBool);
        // assert that requesting funds has not yet ended
        assert(!endRequestFundsPeriodBool);
        // assert that crowd funding has not yet started
        assert(!startCrowdFundPeriodBool);
        // assert that crowd funding has not yet ended
        assert(!endCrowdFundPeriodBool);

        // test that getTimeLeftRequestFunds() throws an error outside request funds period
        const getTimeLeftRequestFunds = async (): Promise<void> => {
            try {
                await crowdFundContract.getTimeLeftRequestFunds();
            } catch(err) {
                const error = err;
                expect(error).to.be.an("Error");
            }
        };

        // expect null output from getTimeLeftRquestFunds == expect(error) to be an error
        let expectUndefined: void = await getTimeLeftRequestFunds();
        expect(expectUndefined).to.be.a("undefined");

        // test that getTimeLeftCrowdFund() throws an error outside request funds period
        const getTimeLeftCrowdFund = async (): Promise<void> => {
            try {
                await crowdFundContract.getTimeLeftCrowdFund;
            } catch(err) {
                const error = err;
                expect(error).to.be.an("Error");
            }
        }

        // expect null output from getTimeLeftCrowdFund == expect(error) to be an error
        expectUndefined = await getTimeLeftCrowdFund();
        expect(expectUndefined).to.be.a("undefined");

        // get latest block number
        blockNumber = ethers.provider.blockNumber;
        // get current block data
        currentBlockData = await ethers.provider.getBlock(blockNumber);
        // get current block timestamp
        currentBlockTimestamp = currentBlockData["timestamp"];
        
        // we pass forward time to start requesting funds
        let increaseTimeInSeconds: number = startRequestFunds - currentBlockTimestamp + 1;
        // request new block with new timestamp of 2 minutes more
        await ethers.provider.send("evm_increaseTime", [increaseTimeInSeconds]);
        // request mining new block with this new timestamp
        await ethers.provider.send("evm_mine", []);
        
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

        // get latest block number
        blockNumber = ethers.provider.blockNumber;
        // get current block data
        currentBlockData = await ethers.provider.getBlock(blockNumber);
        // get current block timestamp
        currentBlockTimestamp = currentBlockData["timestamp"];
        
        // get number of seconds from current block timstamp to end request funds time 
        const endRequestFundsToCurrentTimeBlock: number = endRequestFunds - currentBlockTimestamp;
        
        // assert timeLeftRequestFunds == endRequestFundsToCurrentTimeBlock
        assert(endRequestFundsToCurrentTimeBlock == timeLeftRequestFunds);
        
        // get latest block number
        blockNumber = ethers.provider.blockNumber;
        // get current block data
        currentBlockData = await ethers.provider.getBlock(blockNumber);
        // get current block timestamp
        currentBlockTimestamp = currentBlockData["timestamp"];
        
        // we pass forward time to start requesting funds
        increaseTimeInSeconds = endRequestFunds - currentBlockTimestamp + 1;
        // request new block with new timestamp of 2 minutes more
        await ethers.provider.send("evm_increaseTime", [increaseTimeInSeconds]);
        // request mining new block with this new timestamp
        await ethers.provider.send("evm_mine", []);
        
        startedRequestFundsPeriodBool = await crowdFundContract.requestFundsStarted(); 
        endRequestFundsPeriodBool = await crowdFundContract.requestFundsEnded();
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

        // test that getTimeLeftRequestFunds throws an error outside request funds period
        expectUndefined = await getTimeLeftRequestFunds();
        expect(expectUndefined).to.be.a("undefined");

        // test that getTimeLeftCrowdFund throws an error outside crowd funds period
        expectUndefined = await getTimeLeftCrowdFund();
        expect(expectUndefined).to.be.a("undefined");

        // get latest block number
        blockNumber = ethers.provider.blockNumber;
        // get current block data
        currentBlockData = await ethers.provider.getBlock(blockNumber);
        // get current block timestamp
        currentBlockTimestamp = currentBlockData["timestamp"];
         
        // we pass forward time to start requesting funds
        increaseTimeInSeconds = startCrowdFund - currentBlockTimestamp + 1;
         
        // request new block with new timestamp of 1 minute more
        await ethers.provider.send("evm_increaseTime", [increaseTimeInSeconds]);
        // request mining new block with this new timestamp
        await ethers.provider.send("evm_mine", []);
        
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
        expectUndefined = await getTimeLeftRequestFunds();
        expect(expectUndefined).to.be.a("undefined");

        // test getTimeLeftCrowdFund() method
        const timeLeftCrowdFund: number = await crowdFundContract.getTimeLeftCrowdFund();

        // get latest block number
        blockNumber = ethers.provider.blockNumber;
        // get current block data
        currentBlockData = await ethers.provider.getBlock(blockNumber);
        // get current block timestamp
        currentBlockTimestamp = currentBlockData["timestamp"];
        
        // get number of seconds from current block timstamp to end request funds time 
        const endCrowdFundToCurrentBlockTimestamp = endCrowdFund - currentBlockTimestamp;
        
        // assert timeLeftRequestFunds == endRequestFundsToCurrentTimeBlock
        assert(endCrowdFundToCurrentBlockTimestamp == timeLeftCrowdFund);
        
        // get latest block number
        blockNumber = ethers.provider.blockNumber;
        // get current block data
        currentBlockData = await ethers.provider.getBlock(blockNumber);
        // get current block timestamp
        currentBlockTimestamp = await currentBlockData["timestamp"];
         
        // we pass forward time to start requesting funds
        increaseTimeInSeconds = endCrowdFund - currentBlockTimestamp + 1;
         
        // request new block with new timestmap of 10 minutes more 
        await ethers.provider.send("evm_increaseTime", [increaseTimeInSeconds]);
        // request mining new block with this new timestamp
        await ethers.provider.send("evm_mine", []);

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
        // crowd funding should have ended by now
        assert(endCrowdFundPeriodBool);

        // expect that getTimeLeftRequestFunds throws an error
        expectUndefined = await getTimeLeftRequestFunds();
        expect(expectUndefined).to.be.a("undefined");

        // test that getTimeLeftCrowdFund throws an error outside crowd funds period
        expectUndefined = await getTimeLeftCrowdFund();
        expect(expectUndefined).to.be.a("undefined");        
    })
})
