import "hardhat";
import { ethers } from "hardhat";
import { BigNumber, Contract, ContractFactory, providers, Signer, utils } from "ethers";
import { getContractFactory } from "hardhat/types";
import { getCrowdFundContract } from "../test/deployTest";
import * as dotenv from "dotenv";
import { start } from "repl";


async function deploy(
    minFundValue: BigNumber,
    allowedFundingTokens: string[], 
    startRequestFunds: number, 
    endRequestFunds: number, 
    startCrowdFund: number, 
    endCrowdFund: number,
    network? : string | undefined
): Promise<[Contract, Signer]> {

    var privateKey: utils.BytesLike = "";   // need to declare var to be able to pass between outer/inner scopes
    var provider: providers.Provider;       // need to declare var to be able to pass between outer/inner scopes
    var wallet: Signer;                     // need to declare var to be able to pass between outer/inner scopes

    if (network == "rinkeby") {
        privateKey = process.env.RINKEBY_PRIVATE_KEY ? process.env.RINKEBY_PRIVATE_KEY: "0x0/";
        provider = ethers.providers.getDefaultProvider("rinkeby", process.env.RINKEBY_URL);
        wallet = new ethers.Wallet(privateKey, provider)
    } else if (network == "ropsten") {
        privateKey = process.env.ROPSTEIN_PRIVATE_KEY ? process.env.ROPSTEIN_PRIVATE_KEY: "0x0";
        provider = ethers.providers.getDefaultProvider("ropsten", process.env.ROPSTEN_URL);
        wallet  = new ethers.Wallet(privateKey, provider);
    } else if (network == "maticmum") {
        privateKey = process.env.POLYGON_MUMBAI_PRIVATE_KEY ? process.env.POLYGON_MUMBAI_PRIVATE_KEY: "0x0";
        // const signKey: utils.SigningKey = new ethers.utils.SigningKey(privateKey);
        provider = new ethers.providers.JsonRpcProvider(process.env.POLYGON_MUMBAI_URL);
        wallet = new ethers.Wallet(privateKey, provider);
    } else {
        [ wallet ] = await ethers.getSigners();
        provider= ethers.providers.getDefaultProvider();
    } 

    if (privateKey === "0x0") {
        throw Error("private key not provided");
    }
    
    const CrowdFundContract: ContractFactory = await ethers.getContractFactory("CrowdFundContract", wallet);
    const crowdFundContract: Contract = await CrowdFundContract.deploy(
        minFundValue,
        allowedFundingTokens,
        startRequestFunds,
        endRequestFunds,
        startCrowdFund,
        endCrowdFund,
    );

    await crowdFundContract.deployed();
    console.log("Crowd fund contract deployed at: ", crowdFundContract.address);

    return [ crowdFundContract, wallet ];
}


async function main() {
    const minFundValue: BigNumber = ethers.utils.parseEther("0.1");
    const allowedFundingTokens: string[] = [];
    const startRequestFunds: number = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
    const endRequestFunds: number = startRequestFunds + 60 * 60 * 24 * 2; // 2 days total of request funds period
    const startCrowdFund: number = endRequestFunds + 60 * 60 * 24 * 1;    // 1 day total of pause between request funds period
    const endCrowdFund: number = startCrowdFund + 60 * 60 * 24 * 2;       // w days total of crowd fund period

    const [ crowdFundContract, wallet ]: [ Contract, Signer ] = await  deploy(minFundValue, allowedFundingTokens, startRequestFunds, 
                                                                              endRequestFunds, startCrowdFund, endCrowdFund, "maticmum");
}


main()
  .then(() => process.exit(0))
  .catch((error) => {
      console.log(error);
      process.exit(1);
  });
