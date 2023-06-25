import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "hardhat-typechain";
import "hardhat-gas-reporter";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-contract-sizer";
import dotenv from "dotenv";


dotenv.config();
task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
  }
});

export default {
  contractSizer: {
    alphaSort: false,
    disambiguatePaths: true,
    runOnCompile: true,
    strict: false,
    only: [':OptVaultLp',':SwapLogic',':OptVaultFactory',':YSL',':USDy',':OptVault',':Admin',':xYSL',':BShare',":BSHAREBUSDVault",":PhoenixNft"],
  },
  networks: {
    hardhat: {
      // gas: 10000000000,
      allowUnlimitedContractSize: true,
      
    },
    // mumbaitest: {
    //   url: "https://matic-mumbai.chainstacklabs.com",
    //   accounts: [`0x${process.env.PVTKEY}`],
    //   // gasPrice: 500000000
    // },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // ropsten:{
    //   url: 'https://ropsten.infura.io/v3/93c5f3de1f4543aa8033b576dabb48ae',
    //   accounts:[`0x${process.env.PVTKEY}`],
    // },
    // rinkeby: {
    //   url: `${process.env.ALCHEMY_API_KEY}`,
    //   accounts: {mnemonic: process.env.TESTNET_MNEMONIC},
    //   },
      // rinkebytest:{
      //   url: 'https://rinkeby.infura.io/v3/204c5bcab7764350a6a937923dc68847',
      //   accounts: [`0x${process.env.PVTKEY}`],
      // },
      bsctestnet: {
        url: 'https://data-seed-prebsc-2-s2.binance.org:8545/',
        // url: 'https://bsc.getblock.io/testnet/?api_key=d403c2b8-b4ec-4262-a3f6-dbf41ec3f7e8',
        // url: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
        // url: 'https://testnet:7565yFyAhq62txj7jz%y%JG2*6%n52@apis-sj.ankr.com/2182b395b1c942db86304c7729eb61d4/e3de1a44c64a0d87fe1b034d57f5061a/binance/full/test' ,
        accounts: [`0x${process.env.PVTKEY}`],
        // gasPrice: 500000000
      },
      milkomeda: {
        url: 'https://rpc-devnet-cardano-evm.c1.milkomeda.com/',
        accounts: [`0x${process.env.PVTKEY1}`],

      },
      
  // //     bscmainnet: {
  // //       url: 'https://bsc-dataseed1.defibit.io/',
  // //       accounts: [`0x${process.env.PVTKEY}`],
  // //     }
  },
  etherscan: {
    apiKey: process.env.BSCSCAN_API_FOR_TESTNET,
  },
  // polygonScan: {
  //   apikey:process.env.POLYAPI,
  // },
  
  solidity: {
    compilers: [
      // {
      //   version: "0.6.6",
      //   settings: {
      //     optimizer: {
      //       enabled: true,
      //       runs: 200,
      //     },
      //   },
      // },
      // {
      //   version: "0.8.13",
      //   settings: {
      //     optimizer: {
      //       enabled: true,
      //       runs: 200,
      //     },
      //   },
      // },
      // {
      //   version: "0.5.16",
      //   settings: {
      //     optimizer: {
      //       enabled: true,
      //       runs: 200,
      //     },
      //   },
      // },
      {
        version: "0.8.7",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ]
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },

  gasReporter: {
    enabled: false,
  },
};
