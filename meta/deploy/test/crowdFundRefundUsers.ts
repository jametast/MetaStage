import { ethers } from "hardhat";
import { Signer } from "ethers";

import { getCrowdFundContract, getCurrentBlockTimestamp } from "./deployTest";



describe("CrowdFundRefundUsers", function () {
    it("Refuding users that voted for creators which didn't get enough funds", async function () {
    
        let { owner, creator1, creator2, user1, user2, user3, user4 }: Signer = ethers.getSigners();
    });
});