import { task, HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import * as dotenv from "dotenv";

dotenv.config();



// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */


// module.exports = {
//   solidity: "0.8.4",
// }


module.exports = {
  solidity: "0.8.4",
  networks: {
    rinkeby: {
      url: process.env.RINKEBY_URL || '',
      accounts: process.env.RINKEBY_PRIVATE_KEY != undefined ? 
        [process.env.RINKEBY_PRIVATE_KEY]: [],
        //[process.env.PRIVATE_KEY]: [],
    },
    ropsten: {
      url: process.env.ROPSTEN_URL || '',
      accounts: process.env.ROPSTEIN_PRIVATE_KEY != undefined ?
        [process.env.ROPSTEIN_PRIVATE_KEY]: [],
    },
    // polygon_mumbai: {
    //   url: process.env.POLYGON_MUMBAI || '',
    //   accounts: process.env.POLYGON_MUMBAI_PRIVATE_KEY != undefined ?
    //     [process.env.PRIVATE_KEY]: [],
    // }
  }
};
