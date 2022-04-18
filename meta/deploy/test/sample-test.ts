import { expect } from "chai";
import { ethers } from "hardhat";
import { ContractFactory, Contract, Transaction } from "ethers";


describe("Greeter", function () {
  it("Should return the new greeting once it's changed", async function () {
    const Greeter: ContractFactory = await ethers.getContractFactory("Greeter");
    const greeter: Contract = await Greeter.deploy("Hello, world!");
    await greeter.deployed();

    expect(await greeter.greet()).to.equal("Hello, world!");

    const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    await setGreetingTx.wait();

    expect(await greeter.greet()).to.equal("Hola, mundo!");
  });
});
