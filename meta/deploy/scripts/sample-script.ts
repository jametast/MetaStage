import hre = require("hardhat");
import { ethers } from "hardhat";
import { ContractFactory, Contract } from "ethers";


async function main() {
  await hre.run('compile');

  // We get the contract to deploy
  const CrowdFundContract: ContractFactory = await hre.ethers.getContractFactory("CrowdFoundContract");
  const crowdFundContract: Contract = await CrowdFundContract.deploy("Hello, Hardhat!");

  await crowdFundContract.deployed();

  console.log("CrowdFundContract deployed to:", crowdFundContract.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
