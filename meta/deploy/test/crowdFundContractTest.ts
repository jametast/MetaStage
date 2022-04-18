import { expect, assert } from "chai";
import { ethers } from "hardhat";
import { getCrowdFundContract, getCrowdFundFactoryContract, getCurrentBlockTimestamp } from "./deployTest";
import { BigNumber, Contract, Signer } from "ethers";


describe("CrowdFundFactory", function() {
    it("Factory for Crowd Fund Contract", async function() {
        // get deployed crowd fund factory contract
        const crowdFundFactoryContract: Contract = await getCrowdFundFactoryContract();
        // get current block timestamp
        let currentBlockTimestamp: number = await getCurrentBlockTimestamp();
        
        // get users accounts
        const [ owner, account1, account2, account3 ]: Signer[] = await ethers.getSigners();

        // get master contract address
        const masterCrowdFundContractAddress: string = await crowdFundFactoryContract.getCrowdFundMasterAddress();
        const masterCrowdFundContract: Contract = await crowdFundFactoryContract.roundIdToCrowdFundContractAddressMapping(0);
        
        // assert master crowd fund contract address is well defined
        assert(masterCrowdFundContractAddress == masterCrowdFundContract.address);

        // try to deploy a new clone crowd fund contract from other user which is not owner
        // get round id first
        let roundId: number = await crowdFundFactoryContract.getRoundId();

         // get current timestamp in seconds
        const nowInSeconds: number = currentBlockTimestamp + 1;
        // start request in 2000 seconds 
        const startTimeRequestFunds: number = nowInSeconds + 1000 * 2;
        // requesting funds will have a duration of 5 minutes
        const endTimeRequestFunds: number = nowInSeconds + 1000 * (2 + 5);
        // crowd fund start in 1 minute later
        const startCrowdFund: number = nowInSeconds + 1000 * (2 + 5 + 1);
        // crowd fund lasts for 10 minutes
        const endCrowdFund: number = nowInSeconds + 1000 * (2 + 5 + 1 + 10);
        // 0.001 ETH = 1e15 Wei
        const minFundValue: BigNumber = ethers.utils.parseEther("0.001");
        // for the moment we only allow funding in ETH
        const allowedFundingTokens: string[] = [];

        try {
            await crowdFundFactoryContract.connect(account1).createCrowdFundContract(
                minFundValue,
                allowedFundingTokens,
                startTimeRequestFunds,
                endTimeRequestFunds,
                startCrowdFund,
                endCrowdFund
            );
        } catch(error) {
            console.log("non owner address cannot deploy contract");
            console.log(error);
        }

        // deploy a new clone contract 
        await crowdFundFactoryContract.connect(owner).createCrowdFundContract(
            minFundValue,
            allowedFundingTokens,
            startTimeRequestFunds,
            endTimeRequestFunds,
            startCrowdFund,
            endCrowdFund
        );

        // get new cloned crowd fund contract address
        let cloneCrowdFundContractAddress: string = await crowdFundFactoryContract.roundIdToCrowdFundContractAddressMapping(1);
        
        // get logic from this smart contract
        let cloneCrowdFundContract: Contract = await ethers.getContractAt("CrowdFundContract", cloneCrowdFundContractAddress);

    });
});