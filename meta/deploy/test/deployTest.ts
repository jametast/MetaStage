import { expect, assert } from "chai";
import { ethers } from "hardhat";
import { BigNumber, ContractFactory, Contract, providers } from "ethers";


const getCrowdFundContract = async (): Promise<Contract> => {
    const CrowdFundContract: ContractFactory = await ethers.getContractFactory("CrowdFundContract");
    
    // get current block number
    let blockNumber: number = ethers.provider.blockNumber;
    // get current block data
    let currentBlockData: providers.Block = await ethers.provider.getBlock(blockNumber);
    // get current block timestamp
    let currentBlockTimestamp: number = currentBlockData["timestamp"];
    
    // get current timestamp in seconds 
    const nowInSeconds: number = currentBlockTimestamp + 1; // prior, we were testing it with date now method:  Math.floor(Date.now() / 1000);
    // starts in 2 minutes
    const startRequestFunds: number = nowInSeconds + 60 * 2;
    // requesting funds will have a duration of 5 minutes
    const endRequestFunds: number = nowInSeconds + 60 * (2 + 5);
    // crowd funding starts 1 minute laters
    const startCrowdFund: number = nowInSeconds + 60 * (2 + 5 + 1);
    // crow fundings lasts for 10 minutes
    const endCrowdFund: number = nowInSeconds + 60 * (2 + 5 + 1 + 10);
    // 0.001 ETH = 1e15 Wei
    const minFundValue: BigNumber = ethers.utils.parseEther('0.01'); 
    // for the moment we only allow funding in ETH
    const allowedFundingTokens: any[] = [];
    
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


const getCurrentBlockTimestamp = async (): Promise<number> => {
    const blockNumber: number = ethers.provider.blockNumber;
    const currentBlockData: providers.Block = await ethers.provider.getBlock(blockNumber);
    const currentTimestamp: number = currentBlockData["timestamp"];
    return currentTimestamp;
}

export { getCrowdFundContract, getCurrentBlockTimestamp };
