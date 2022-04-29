import { ethers, upgrades } from "hardhat";
import { BigNumber, Contract, ContractFactory, providers, Signer, utils } from "ethers";
import "@typechain/hardhat"; 


const crowdFundContractFactoryAddress: string = "";

async function getNetworkSyncData(network?: string | undefined): Promise<[Signer, providers.Provider]> {
  // declare all necessary variables
  var privateKey: utils.BytesLike = "";   // need to declare var to be able to pass between outer/inner scopes
  var provider: providers.Provider;       // need to declare var to be able to pass between outer/inner scopes
  var wallet: Signer;                     // need to declare var to be able to pass between outer/inner scopes

  // rinkeby network
  if (network == "rinkeby") {
    // get private key
    privateKey = process.env.RINKEBY_PRIVATE_KEY ? process.env.RINKEBY_PRIVATE_KEY: "0x0/";
    // get provider
    provider = ethers.providers.getDefaultProvider("rinkeby", process.env.RINKEBY_URL);
    // get the signer
    wallet = new ethers.Wallet(privateKey, provider)
  } else if (network == "ropsten") {
    // get private key
    privateKey = process.env.ROPSTEIN_PRIVATE_KEY ? process.env.ROPSTEIN_PRIVATE_KEY: "0x0";
    // get provider
    provider = ethers.providers.getDefaultProvider("ropsten", process.env.ROPSTEN_URL);
    // get the signer
    wallet  = new ethers.Wallet(privateKey, provider);
  } else if (network == "maticmum") {
    // get private key
    privateKey = process.env.POLYGON_MUMBAI_PRIVATE_KEY ? process.env.POLYGON_MUMBAI_PRIVATE_KEY: "0x0";
    // get the provider
    provider = new ethers.providers.JsonRpcProvider(process.env.POLYGON_MUMBAI_URL);
    // get the signer
    wallet = new ethers.Wallet(privateKey, provider);
  } else {
    // otherwise, we deploy our contract at the default network (usually, localhost network)
    // get the wallet
    [ wallet ] = await ethers.getSigners();
    // get our defaultProvider
    provider= ethers.providers.getDefaultProvider();
  } 

  // if private key was not specified at .env, throw error
  if (privateKey === "0x0") {
    throw Error("private key not provided");
  }

  // return wallet and provider
  return [ wallet, provider ];
}

async function getCrowdFundContractAddress(roundId: number): Promise<string> {
  return "";
}

async function deployMetaNFTMintingContract(
  creatorAddress: string, 
  roundId: number, 
  uri: string,
  network?: string | undefined
): Promise<[Contract, Signer]> 
{
  // get both signer and provider for our network choice
  const [ signer, provider ]: [ Signer, providers.Provider ] = await getNetworkSyncData(network);
  // get crowd fund contract address
  const crowdFundContractAddress: string = await getCrowdFundContractAddress(roundId);
  // get crowd fund contract at the address obtained above
  const crowdFundContract: Contract = await ethers.getContractAt("CrowdFundContract", crowdFundContractAddress, signer);
  // encapsulate the arguments to the nft minting contract into a tuple
  const args: [ string, string, string ] = [creatorAddress, crowdFundContractAddress, uri];
  // get nft minting contract factory, using ethers
  const metaNFTMintingContractFactory: ContractFactory = await ethers.getContractFactory("MetaNFTMinting", signer);
  // deploy our proxy using deployProxy using hardhat upgrades library, passing the args obtained above
  const metaNFTMintingContract: Contract = await upgrades.deployProxy(metaNFTMintingContractFactory, args);
  // await until contract is deployed
  await metaNFTMintingContract.deployed();
  // return contract + signer
  return [ metaNFTMintingContract, signer ];
}

async function getMetaNFTMintingContract(
  creatorAddress: string, 
  roundId: number,
  network?: string | undefined
): Promise<Contract> {
  // get nft minting round contract from round id and network
  const nftMintRoundContract: Contract = await getNFTMintRoundContract(roundId, network);
  // get meta nft minting contract from creator address
  const metaNFTMintingContract: Contract = await nftMintRoundContract.creatorAddressToNFTMintingMapping(creatorAddress);
  // return meta nft minting contract
  return metaNFTMintingContract;
}

async function getNFTMintRoundContractAddress(roundId: number, network?: string | undefined): Promise<string> {
  // TODO: implement this function correctly
  const nftMintRoundAddress: string = "";
  // return nft minting round address
  return nftMintRoundAddress;
}

async function getNFTMintRoundContract(roundId: number, network?: string | undefined): Promise<Contract> {
  // get nft minting round contract address 
  const nftMintingRoundContractAddress: string = await getNFTMintRoundContractAddress(roundId, network);
  // get nft minting round contract
  const nftMintingRoundContract = await ethers.getContractAt("NFTMintingRoundContract", nftMintingRoundContractAddress);
  // return nft minting round contract
  return nftMintingRoundContract;
}

async function deployNFTMintRoundContract(roundId: number, network?: string | undefined): Promise<[Contract, Signer]> {
  // get both signer and provider for our network
  const [ signer, provider ]: [ Signer, providers.Provider ] = await getNetworkSyncData(network);
  // get crowd fund address
  const crowdFundContractAddress: string = await getCrowdFundContractAddress(roundId);
  // get nft minting round contract factory
  const nftMintingRoundContractFactory: ContractFactory = await ethers.getContractFactory("NFTMintingRoundContract", signer);
  // encapsulate nft minting round contract into args constant
  const args: [ string ] = [ crowdFundContractAddress ];
  // get nft minting round contract
  const nftMintingRoundContract = await upgrades.deployProxy(nftMintingRoundContractFactory, args);
  // await until contract is deployed
  await nftMintingRoundContract.deployed();
  // return contract + signer
  return [ nftMintingRoundContract, signer ];
}



async function main() {}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
