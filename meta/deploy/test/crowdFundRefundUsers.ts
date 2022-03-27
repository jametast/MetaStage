import { assert, expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber, Contract, Signer, providers } from "ethers";

import { getCrowdFundContract, getCurrentBlockTimestamp } from "./deployTest";



describe("CrowdFundRefundUsers", function () {
    it("Refuding users that voted for creators which didn't get enough funds", async function () {
    
        let [ owner, creator1, creator2, user1, user2, user3 ]: Signer[] = await ethers.getSigners();
        const crowdFundContract: Contract = await getCrowdFundContract();
        
        const startTimeRequestFunds: number = await crowdFundContract.startTimeRequestFunds();
        
        // how many seconds to start crowd fund period
        let currentBlockData: providers.Block = await ethers.provider.getBlock("latest");
        let currentBlockTimestamp: number = currentBlockData["timestamp"];
        let increaseTimeInSeconds: number = startTimeRequestFunds - currentBlockTimestamp + 1;
        
        // increase timestamp in block by increaseTimeInSeconds
        await ethers.provider.send("evm_increaseTime", [increaseTimeInSeconds]);
        // mine new block
        await ethers.provider.send("evm_mine", []);

        // get bool value determining if we are in request funds period
        const requestFundsPeriodStarted: boolean = await crowdFundContract.requestFundsStarted();
        const requestFundsPeriodEnded: boolean = await crowdFundContract.requestFundsEnded();
        const inRequestFundsPeriod: boolean = requestFundsPeriodStarted && !requestFundsPeriodEnded;
        // guarantee we are in request funds period
        assert(inRequestFundsPeriod);

        // get creator's public keys
        const creatorAddress1: string = await creator1.getAddress();
        const creatorAddress2: string = await creator2.getAddress();

        // owner of smart contract gives creators permission to request funds
        await crowdFundContract.connect(owner).makeCreatorElligible(creatorAddress1);
        await crowdFundContract.connect(owner).makeCreatorElligible(creatorAddress2);
    
        // mine a new block
        await ethers.provider.send("evm_increaseTime", [1]);
        await ethers.provider.send("evm_mine", []);

        // creators request funds to contract
        const fundsRequestedCreator1 = ethers.utils.parseEther('1.0');
        const fundsRequestedCreator2 = ethers.utils.parseEther('8.0');

        await crowdFundContract.connect(creator1).requestFunds(fundsRequestedCreator1);
        await crowdFundContract.connect(creator2).requestFunds(fundsRequestedCreator2);

        // we now mint new block to get into funding phase
        const startTimeCrowdFund: number = await crowdFundContract.startTimeCrowdFund();
        currentBlockTimestamp = await getCurrentBlockTimestamp();
        increaseTimeInSeconds = startTimeCrowdFund - currentBlockTimestamp + 1;

        await ethers.provider.send("evm_increaseTime", [increaseTimeInSeconds]);
        await ethers.provider.send("evm_mine", []);
        
        const fundingStartedBool: boolean = await crowdFundContract.crowdFundStarted();
        const fundingEndedBool: boolean = await crowdFundContract.crowdFundEnded();
        const inFundingPhaseBool: boolean = fundingStartedBool && (!fundingEndedBool);
        
        // make certain we are in funding phase
        assert(inFundingPhaseBool);

        const userAddress1: string = await user1.getAddress();
        const userAddress2: string = await user2.getAddress();
        const userAddress3: string = await user3.getAddress();

        // values to be funded for each user
        const fundsUser1: BigNumber = ethers.utils.parseEther('0.51'); // 0.5 + 0.01 to account for minFundValue
        const fundsUser2: BigNumber = ethers.utils.parseEther('4.51'); // 4.5 + 0.01 to account for minFundValue
        const fundsUser3: BigNumber = ethers.utils.parseEther('1.01'); // 1.0 + 0.01 to account for minFundValue

        // now funds are sent to smart contract:
        //get contract address
        const contractAddress: string = crowdFundContract.address;
        
        // creator 1 is able to get enough funds, but not creator 2
        await crowdFundContract.connect(user1)["fund(address)"](creatorAddress2, { value: fundsUser1 }); // user1 funds creator3, notice the weird syntax, this is due to ethers accessing solidity overloaded functions
        await crowdFundContract.connect(user2)["fund(address)"](creatorAddress2, { value: fundsUser2 }); // user2 funds creator3, notice the weird syntax, this is due to ethers accessing solidity overloaded functions
        await crowdFundContract.connect(user3)["fund(address)"](creatorAddress1, { value: fundsUser3 }); // user3 funds creator1, notice the weird syntax, this is due to ethers accessing solidity overloaded functions

        //  let's move past the funding period
        increaseTimeInSeconds = 10000;
        await ethers.provider.send("evm_increaseTime", [increaseTimeInSeconds]);
        await ethers.provider.send("evm_mine", []);

        // now users request funds

        // get users current balance 
        const userBalance1: BigNumber = await user1.getBalance();
        const userBalance2: BigNumber = await user2.getBalance();
        const userBalance3: BigNumber = await user3.getBalance();

        // user1 and user2 are both not elligible to request funds to contract but user3 it is
        await crowdFundContract.fundCreators(creatorAddress1);      // already tested
        await crowdFundContract.refundUsers();

        const newUserBalance1: BigNumber = await user1.getBalance();
        const newUserBalance2: BigNumber = await user2.getBalance();
        const newUserBalance3: BigNumber = await user3.getBalance();
        
        console.log("---------------");
        console.log(userAddress1);
        console.log(userAddress2);
        console.log(userAddress3);
        console.log("---------------");

        console.log("---------------");
        console.log(newUserBalance1);
        console.log(userBalance1);
        console.log(fundsUser1);
        console.log("---------------");

        console.log("---------------");
        console.log(newUserBalance1);
        console.log(userBalance2);
        console.log(fundsUser2);
        console.log("---------------");

        console.log("---------------");
        console.log(newUserBalance3);
        console.log(userBalance3);
        console.log(fundsUser3);
        console.log("---------------");

        assert(newUserBalance1.eq(userBalance1.add(fundsUser1)));
        assert(newUserBalance2.eq(userBalance2.add(fundsUser2)));
        assert(newUserBalance3.eq(userBalance3));
    });
});