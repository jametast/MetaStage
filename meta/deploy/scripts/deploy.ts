import "hardhat";
import { ethers } from "hardhat";
import { BigNumber, Contract, ContractFactory, providers, Signer } from "ethers";
import { getContractFactory } from "hardhat/types";
import { getCrowdFundContract } from "../test/deployTest";
import * as dotenv from "dotenv";


async function deploy(
    minFundValue: BigNumber,
    allowedFundingTokens: string[], 
    startRequestFunds: number, 
    endRequestFunds: number, 
    startCrowdFund: number, 
    endCrowdFund: number,
) {
    const privateKey: string | undefined = process.env.RINKEY_PRIVATE_KEY;
    const provider: providers = ;
    const CrowdFundContract: ContractFactory = await ethers.getContractFactory("CrowdFundContract");
    const owner: Signer = new ethers.Wallet(privateKey, provider);
    const crowdFundContract: Contract = await CrowdFundContract.deploy(
        minFundValue,
        allowedFundingTokens,
        startRequestFunds,
        endRequestFunds,
        startCrowdFund,
        endCrowdFund,
    );

    await crowdFundContract.deployed();
}

// refactor this function
async function getDeployedContract(crowdFundContract: Contract): Promise<Contract> {
    return crowdFundContract;
}