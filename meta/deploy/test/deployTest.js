const { expect, assert } = require("chai");
const { ethers } = require("hardhat");


export const getCrowdFundContract = async () => {
    const CrowdFundContract = await ethers.getContractFactory("CrowdFundContract");
        
    // get current block data
    let currentBlockData = await ethers.provider.getBlock();
    // get current block timestamp
    let currentBlockTimestamp = currentBlockData["timestamp"];
    
    // get current timestamp in seconds 
    const nowInSeconds = currentBlockTimestamp + 1; // prior, we were testing it with date now method:  Math.floor(Date.now() / 1000);
    // starts in 2 minutes
    const startRequestFunds = nowInSeconds + 60 * 2;
    // requesting funds will have a duration of 5 minutes
    const endRequestFunds = nowInSeconds + 60 * (2 + 5);
    // crowd funding starts 1 minute laters
    const startCrowdFund = nowInSeconds + 60 * (2 + 5 + 1);
    // crow fundings lasts for 10 minutes
    const endCrowdFund = nowInSeconds + 60 * (2 + 5 + 1 + 10);
    // 0.001 ETH = 1e15 Wei
    const minFundValue = ethers.utils.parseEther('0.01'); 
    // for the moment we only allow funding in ETH
    const allowedFundingTokens = [];
    
    // deploy Crowd Funding contract
    const crowdFundContract = await CrowdFundContract.deploy(
        minFundValue, 
        allowedFundingTokens, 
        startRequestFunds, 
        endRequestFunds, 
        startCrowdFund, 
        endCrowdFund
    );
    
    return crowdFundContract;
}


export const getCurrentBlockTimestamp = async () => {
    const currentBlockData = await ethers.provider.getBlock();
    const currentTimestamp = currentBlockData["timestamp"];
    return currentTimestamp;
}