import { ethers } from "hardhat";
import { Signer } from "ethers";

import { getCrowdFundContract, getCurrentBlockTimestamp } from "./deployTest";



describe("CrowdFundRefundUsers", function () {
    it("Refuding users that voted for creators which didn't get enough funds", async function () {
    
        let accounts: Signer[] = await ethers.getSigners();
        let owner: Signer = accounts[0];
        let creator1: Signer = accounts[1];
        let creator2: Signer = accounts[2];
        let user1: Signer = accounts[3];
        let user2: Signer = accounts[4];
        let user3: Signer = accounts[5];
    });
});