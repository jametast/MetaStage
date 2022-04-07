import { expect, assert } from "chai";
import { ethers } from "hardhat";
import { BigNumber, ContractFactory, Contract, providers } from "ethers";


const getCrowdFundContract = async (): Promise<Contract> => {
    const CrowdFundContract: ContractFactory = await ethers.getContractFactory("CrowdFundContract");
    
    await ethers.provider.send("evm_mine", []); // mine a block

    // get current block data
    let currentBlockData: providers.Block = await ethers.provider.getBlock("latest");
    // get current block timestamp
    let currentBlockTimestamp: number = currentBlockData["timestamp"];
    
    // get current timestamp in seconds 
    const nowInSeconds: number = currentBlockTimestamp + 1; // prior, we were testing it with date now method:  Math.floor(Date.now() / 1000);
    // starts in 2 minutes
    const startRequestFunds: number = nowInSeconds + 1000 * 2;
    // requesting funds will have a duration of 5 minutes
    const endRequestFunds: number = nowInSeconds + 1000 * (2 + 5);
    // crowd funding starts 1 minute laters
    const startCrowdFund: number = nowInSeconds + 1000 * (2 + 5 + 1);
    // crow fundings lasts for 10 minutes
    const endCrowdFund: number = nowInSeconds + 1000 * (2 + 5 + 1 + 10);
    // 0.001 ETH = 1e15 Wei
    const minFundValue: BigNumber = ethers.utils.parseEther('0.01'); 
    // for the moment we only allow funding in ETH
    const allowedFundingTokens: string[] = [];
    
    // deploy Crowd Funding contract
    const crowdFundContract: Contract = await CrowdFundContract.deploy(
        minFundValue, 
        allowedFundingTokens, 
        startRequestFunds, 
        endRequestFunds, 
        startCrowdFund, 
        endCrowdFund
    );
    
    await crowdFundContract.deployed();
    
    return crowdFundContract;
}


const getCrowdFundFactoryContract = async (): Promise<Contract> => {
    const CrowdFundFactoryContract: ContractFactory = await ethers.getContractFactory("CrowdFundContractFactory");
    await ethers.provider.send("evm_mine", []);

    // get current block data
    let currentBlockData: providers.Block = await ethers.provider.getBlock("latest");
    // get current block timestamp
    let currentBlockTimestamp: number = currentBlockData["timestamp"];
    
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

    // deploy Crowd Fund Factory Contract
    const crowdFundFactoryContract: Contract = await CrowdFundFactoryContract.deploy(
        minFundValue,
        allowedFundingTokens,
        startTimeRequestFunds,
        endTimeRequestFunds,
        startCrowdFund,
        endCrowdFund,
    )

    await crowdFundFactoryContract.deploy();

    return crowdFundFactoryContract;
}

const getCurrentBlockTimestamp = async (): Promise<number> => {
    const currentBlockData: providers.Block = await ethers.provider.getBlock("latest");
    const currentTimestamp: number = currentBlockData["timestamp"];
    return currentTimestamp;
}

export { getCrowdFundContract, getCrowdFundFactoryContract, getCurrentBlockTimestamp };
