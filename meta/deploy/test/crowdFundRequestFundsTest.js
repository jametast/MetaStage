const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
import { getCrowdFundContract, getCurrentBlockTimestamp } from "./deployTest";


describe("CrowdFundRequestFunds", function () {
    it("Request funds", async function () {

      // get deployed crowd fund contract
      const crowdFundContract = await getCrowdFundContract();
      // get current block timestamp
      let currentBlockTimestamp = await getCurrentBlockTimestamp();

      // get start time of request funds period
      const startTimeRequestFunds = await crowdFundContract.startTimeRequestFunds();
      // get end time of request funds period
      const endTimeRequestFunds = await crowdFundContract.endTimeRequestFunds();

      // how many seconds to start request funds period
      let increaseTimeInSeconds = startTimeRequestFunds - currentBlockTimestamp + 1;
      
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

      // get owner and three other signers (ethers account abstraction)
      const [owner, addr1, addr2, addr3] = await ethers.getSigners();

      // get addr1 public key
      const account1 = await addr1.getAddress();
      // addr1 ETH balance
      let balanceOfAccount = await ethers.provider.getBalance(account1);

      // define funds to be requested
      let fundsRequested = ethers.utils.parseEther('1.0');

      // owner makes addr1 elligible to request funds
      await crowdFundContract.connect(owner).makeCreatorElligible(account1);
      // is account1 elligible to request funds to our contract
      let accountIsElligibleBool = await crowdFundContract.isCreatorElligible(account1);
      // assert that addr1 public key belongs to contract elligible creators object
      assert(accountIsElligibleBool);

      // request funds to our smart contract
      await crowdFundContract.connect(addr1).requestFunds(fundsRequested);
      // assert that addresToCreatorMapping mapping of our contract has been updated with addr1 public key
    
      // extract creator structure from contract
      let creator = await crowdFundContract.addressToCreatorMapping(account1);
      // assert that creator's requestFunds BigNumber value equals fundsRequested 
      assert(creator.requestedFunds.eq(fundsRequested));
      // assert that creator's totalFunds BigNumber equals 0 for the time being
      assert(creator.totalFunds.eq(ethers.utils.parseEther('0.0')));

      // we now try to request funds again using account1 to our contract, it should exit with error
      const requestAgainFunds = async () => {
        try {
          await crowdFundContract.connect(addr1).requestFunds(fundsRequested);
        } catch(err) {
          console.log("requesting funds twice is not possible");
          console.log(err);
          error = err;
        }
        expect(error).to.be.an("Error");
      }

      // expect undefined value from calling requestAgainFunds
      let expectUndefined = await requestAgainFunds();
      expect(expectUndefined).to.be.a("undefined");

      // we now allow addr2 to request funds as well
      // get public key from addr2
      const account2 = await addr2.getAddress();
      // owner allows addr2 to request funds
      await crowdFundContract.connect(owner).makeCreatorElligible(account2);

      // update requested funds by addr2
      fundsRequested = ethers.utils.parseEther('1.5');
      
      // check that account2 is elligible
      accountIsElligibleBool = await crowdFundContract.isCreatorElligible(account2);
      assert(accountIsElligibleBool);

      // account2 requests funds to our smart contract
      await crowdFundContract.connect(account2).requestFunds(fundsRequested);

      // obtain creator data structure from our smart contract
      creator = await crowdFundContract.addressToCreatorMapping(account2);
      // assert that creator's requestFunds BigNumber value equals fundsRequested 
      assert(creator.requestedFunds.eq(fundsRequested));
      // assert that creator's totalFunds BigNumber equals 0 for the time being
      assert(creator.totalFunds.eq(ethers.utils.parseEther('0.0')));

      // we now test that addr3 user cannot request funds, given that it is not authorized by owner of smart contract
      
      // get addr3 public key
      const account3 = await addr3.getAddress();
      const notElligibleRequestFunds = async () => {
        try {
          await crowdFundContract.connect(account3);
        } catch(error) {
          console.log("creator is not allowed to request funds by smart contract owner");
          console.log(error);
        }
        expect.apply(error).to.be.an("Error");
      }
      
      expectUndefined = await notElligibleRequestFunds();
      expect(expectUndefined).to.be.an("undefined");


      // we now test if request funds is not possible after request funds period
      // get current block timestamp

      currentBlockTimestamp = await getCurrentBlockTimestamp();
      increaseTimeInSeconds = endTimeRequestFunds - currentBlockTimestamp + 1;

      // increase timestamp in block by increaseTimeInSeconds
      await ethers.provider.send("evm_increaseTime", [increaseTimeInSeconds]);
      // mine new block
      await ethers.provider.send("evm_mine");


    });
  });
  