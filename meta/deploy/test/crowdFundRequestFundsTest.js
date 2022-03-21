const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
import { getCrowdFundContract, getCurrentBlockTimestamp } from "./deployTest";

describe("CrowdFundRequestFunds", function () {
    it("Request funds", async function () {

      // get deployed crowd fund contract
      const crowdFundContract = await getCrowdFundContract();
      // get current block timestamp
      const currentBlockTimestamp = await getCurrentBlockTimestamp();

      // get start time of request funds period
      const startTimeRequestFunds = crowdFundContract.startTimeRequestFunds();
      // get end time of request funds period
      const endTimeRequestFunds = crowdFundContract.endTimeRequestFunds();

      // how many seconds to start request funds period
      const increaseTimeInSeconds = startTimeRequestFunds - currentBlockTimestamp + 1;
      
      // increase timestamp in block by increaseTimeInSeconds
      ethers.provider.send("evm_increaseTime", [increaseTimeInSeconds]);
      // mine new block
      ethers.provider.send("evm_mine");

      // get bool value determining if we are in request funds period
      const inRequestFundsPeriod = crowdFundContract.requestFundsEnded() && crowdFundContract.requestFundsEnded();
      // guarantee we are in request funds period
      assert(inRequestFundsPeriod);

      // get current accounts
      const  ethAccountsArray = await ethers.provider.send("eth_accounts");
      
      // loop over each account and request funds
      for (account of ethAccountsArray) {
        console.log(account);
        // get account balance
        const balanceOfAccount = await ethers.provider.getBalance(account);

        assert(balanceOfAccount > 10000000000000);
        
      }
    });
  });
  