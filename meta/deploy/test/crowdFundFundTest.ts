import { expect, assert } from "chai";
import { ethers } from "hardhat";
import { getCrowdFundContract, getCurrentBlockTimestamp } from "./deployTest";
import { BigNumber, Contract, Signer } from "ethers";


describe("CrowdFundFund", function () {
    it("Funding creators", async function () {
        // get deployed crowd fund contract
        const crowdFundContract: Contract = await getCrowdFundContract();
        // get current block timestamp
        let currentBlockTimestamp: number = await getCurrentBlockTimestamp();

        // get users and creators signers
        const [owner, creator1, creator2, creator3, user1, user2, user3]: Signer[] = await ethers.getSigners();

        // get start time of crowd fund period
        const startTimeRequestFunds: number = await crowdFundContract.startTimeRequestFunds();
      
        // how many seconds to start crowd fund period
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
        const creatorAddress3: string = await creator3.getAddress();

        // owner of smart contract gives creators permission to request funds
        await crowdFundContract.connect(owner).makeCreatorElligible(creatorAddress1);
        await crowdFundContract.connect(owner).makeCreatorElligible(creatorAddress2);
        await crowdFundContract.connect(owner).makeCreatorElligible(creatorAddress3);
        
        await ethers.provider.send("evm_increaseTime", [1]);
        await ethers.provider.send("evm_mine", []);
        // creators request funds to contract
        const fundsRequestedCreator1 = ethers.utils.parseEther('1.0');
        const fundsRequestedCreator2 = ethers.utils.parseEther('2.5');
        const fundsRequestedCreator3 = ethers.utils.parseEther('5.0');

        await crowdFundContract.connect(creator1).requestFunds(fundsRequestedCreator1);
        await crowdFundContract.connect(creator2).requestFunds(fundsRequestedCreator2);
        await crowdFundContract.connect(creator3).requestFunds(fundsRequestedCreator3);

        // we now mint new block to get into funding phase
        const startTimeCrowdFund: number = await crowdFundContract.startTimeCrowdFund();
        currentBlockTimestamp = await getCurrentBlockTimestamp();
        increaseTimeInSeconds = startTimeCrowdFund - currentBlockTimestamp + 1;

        await ethers.provider.send("evm_increaseTime", [increaseTimeInSeconds]);
        await ethers.provider.send("evm_mine", []);
        
        const fundingStartedBool: boolean = await crowdFundContract.crowdFundStarted();
        const fundingEndedBool: boolean = await crowdFundContract.crowdFundEnded();
        const inFundingPhaseBool: boolean = fundingStartedBool && (!fundingEndedBool);
        // BigNumber { value: "9999999856299775393138" }
        // BigNumber { value: "9999999866007003351118" }
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
 
        await crowdFundContract.connect(user1)["fund(address)"](creatorAddress3, { value: fundsUser1 }); // user1 funds creator3, notice the weird syntax, this is due to ethers accessing solidity overloaded functions
        await crowdFundContract.connect(user2)["fund(address)"](creatorAddress3, { value: fundsUser2 }); // user2 funds creator3, notice the weird syntax, this is due to ethers accessing solidity overloaded functions
        await crowdFundContract.connect(user3)["fund(address)"](creatorAddress1, { value: fundsUser3 }); // user3 funds creator1, notice the weird syntax, this is due to ethers accessing solidity overloaded functions

        // check contract data is updated
        // 1. check contract balance
        let balanceOfContract: BigNumber = await ethers.provider.getBalance(contractAddress);

        assert(balanceOfContract.eq(fundsUser1.add(fundsUser2.add(fundsUser3)))); // smart contract balance should equal the sum of fundsUser1, fundsUser2, fundsUser3

        // for each user check that User data structure is correct
        const userContract1: any = await crowdFundContract.addressToUserMapping(userAddress1);
        const userContract2: any = await crowdFundContract.addressToUserMapping(userAddress2);
        const userContract3: any = await crowdFundContract.addressToUserMapping(userAddress3);

        // check that wallets are correctly specified
        assert(userContract1.wallet == userAddress1);
        assert(userContract2.wallet == userAddress2);
        assert(userContract3.wallet == userAddress3);

        // check that totalLoctotalFunkedAmount is correctly specified
        assert(userContract1.totalLockedAmount.eq(fundsUser1));
        assert(userContract2.totalLockedAmount.eq(fundsUser2));
        assert(userContract3.totalLockedAmount.eq(fundsUser3));

        // check that token funded corresponds to contract ETH representation
        assert(userContract1.tokenFund == 0x0);
        assert(userContract2.tokenFund == 0x0);
        assert(userContract3.tokenFund == 0x0);

        // check that creator wallets are correctly specified
        assert(userContract1.creatorWallet == creatorAddress3);
        assert(userContract2.creatorWallet == creatorAddress3);
        assert(userContract3.creatorWallet == creatorAddress1);

        // for each creator check that totalFunds and fanClub data has been updated
        const creatorContract1: any = await crowdFundContract.addressToCreatorMapping(creatorAddress1);
        const creatorContract2: any = await crowdFundContract.addressToCreatorMapping(creatorAddress2);
        const creatorContract3: any = await crowdFundContract.addressToCreatorMapping(creatorAddress3);

        // check that totalFunds are correctly specified
        // get minFundValue of contract
        const minFundValue: BigNumber = await crowdFundContract.minFundValue();

        // get totalFunds values for each creator
        const totalFunds1: BigNumber = creatorContract1.totalFunds;
        const totalFunds2: BigNumber = creatorContract2.totalFunds;
        const totalFunds3: BigNumber = creatorContract3.totalFunds;

        assert(totalFunds1.eq(fundsUser3.sub(minFundValue)));
        assert(totalFunds2.eq(ethers.utils.parseEther("0")));
        assert(totalFunds3.eq(fundsUser2.add(fundsUser1.sub(minFundValue)).sub(minFundValue)));

        // check fanClub's are correctly specified for each user
        const fanClub1: string = await crowdFundContract.creatorAddressToFanClubMapping(creatorAddress1, 0);
        const fanClub2: string = await crowdFundContract.creatorAddressToFanClubMapping(creatorAddress3, 0);
        const fanClub3: string = await crowdFundContract.creatorAddressToFanClubMapping(creatorAddress3, 1);

        assert(fanClub1 == userAddress3);
        assert(fanClub2 == userAddress1);
        assert(fanClub3 == userAddress2);

        //  let's move past the funding period
        increaseTimeInSeconds = 10000;
        await ethers.provider.send("evm_increaseTime", [increaseTimeInSeconds]);
        await ethers.provider.send("evm_mine", []);


        // get current creators balances 
        const creatorBalance1: BigNumber = await creator1.getBalance();
        const creatorBalance3: BigNumber = await creator3.getBalance();

        // our contract can now be called to fund creators
        // only creator1 and creator3 got funds
        // check creator 1
        await crowdFundContract.fundCreators(creatorAddress1);
        let newBalanceOfContract: BigNumber = await ethers.provider.getBalance(contractAddress);
        assert(balanceOfContract.sub(ethers.utils.parseEther("1.0")).eq(newBalanceOfContract));
        
        let newCreatorBalance1: BigNumber = await creator1.getBalance();
        assert(newCreatorBalance1.eq(creatorBalance1.add(ethers.utils.parseEther("1.0"))));
        
        // check creator 3
        await crowdFundContract.fundCreators(creatorAddress3);
        balanceOfContract = newBalanceOfContract;
        newBalanceOfContract = await ethers.provider.getBalance(contractAddress);
        assert(balanceOfContract.sub(ethers.utils.parseEther("5.0")).eq(newBalanceOfContract));

        let newCreatorBalance3: BigNumber = await creator3.getBalance();
        assert(newCreatorBalance3.eq(creatorBalance3.add(ethers.utils.parseEther("5.0"))));

        // now we test if creator2 can request his funds
        const creator2RequestFunds = async () => {
            try {
                await crowdFundContract.fundCreators(creatorAddress2);
            } catch(err) {
                console.log("creator is not allowed to get funds from contract since it did not obtain enough votes");
                console.log(err);
                expect(err).to.be.an("Error");
            }
        };

        let expectUndefined: void = await creator2RequestFunds();
        expect(expectUndefined).to.be.an("undefined");
        
        // we also check that creator3 cannot request funds once again
        const creator3RequestFunds = async () => {
            try {
                await crowdFundContract.fundCreators(creatorAddress3);
            } catch(err) {
                console.log("creator already got his funds");
                console.log(err)
                expect(err).to.be.an("Error");
            }
        };

        expectUndefined = await creator3RequestFunds();
        expect(expectUndefined).to.be.an("undefined");
    });
});