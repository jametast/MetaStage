import "hardhat";
import { ethers } from "hardhat";
import { BigNumber, Contract, ContractFactory, Signer } from "ethers";
import { getContractFactory } from "hardhat/types";


async function deploy(
    minFundValue: BigNumber,
    allowedFundingTokens: string[], 
    startRequestFunds: number, 
    endRequestFunds: number, 
    startCrowdFund: number, 
    endCrowdFund: number,
    deployedAt?: string
) {
    if (typeof(deployedAt) != "undefined") {
        const crowdFundContract: Contract = await ethers.getContractAt();
    } else {
        const CrowdFundContract: ContractFactory = await ethers.getContractFactory("CrowdFundContract");
        const owner: Signer = ethers.getSigners();
        const crowdFundContract: Contract = await CrowdFundContract.deploy(
            minFundValue,
            allowedFundingTokens,
            startRequestFunds,
            endRequestFunds,
            startCrowdFund,
            endCrowdFund,
        );
    }


}