const Hre = require("hardhat");
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function main() {

    // await Hre.run("verify:verify", {
    //   //Deployed contract Admin address
    //   address: "0x497c8F899C507bc8C8077993fF927e9c56d6f52f",
    //   //Path of your main contract.
    //   contract: "contracts/Admin.sol:Admin",
    // });
    // await sleep(3000);

    // await Hre.run("verify:verify", {
    //   //Deployed contract BUSD address
    // address: "0xd27414Fa90E67DdFC6e5850fce5255455B9FDbc9",
    //   //Path of your main contract.
    // contract: "contracts/Tokens/Receipt.sol:Receipt",
    // });
    // await sleep(3000);

    // await Hre.run("verify:verify", {
    //   //Deployed contract WETH9 address
    // address: "0x9C86d4dBDB376528476cB1e5bc45c637edB9ca21",
    //   //Path of your main contract.
    // contract: "contracts/MockRouter/test/WETH9.sol:WETH9",
    //   });

    // await Hre.run("verify:verify", {
    //   //Deployed contract factory address
    // address: "0xf4FEc260f6A5f625446aB62eAC6D64D67cbAe587",
    //   //Pass arguments as string and comma seprated values
    // constructorArguments:["0xF3CF8B7B952377557d8DB8f111a277AD67a3Dbff"],
    //   //Path of your main contract.
    // contract: "contracts/MockRouter/UniswapV2Factory.sol:UniswapV2Factory",
    // });

    // await Hre.run("verify:verify", {
    //   //Deployed contract router address
    // address: "0x611557D53C57158e5c84150Ebe120168908DdA7c",
    //   //Pass arguments as string and comma seprated values
    // constructorArguments:["0xf4FEc260f6A5f625446aB62eAC6D64D67cbAe587", "0x9C86d4dBDB376528476cB1e5bc45c637edB9ca21"],
    //   //Path of your main contract.
    // contract: "contracts/MockRouter/UniswapV2Router01.sol:UniswapV2Router01",
    // });

    // await Hre.run("verify:verify", {
    //   //Deployed contract whitelist address
    // address: "0xd619AE778320198E82c54fBb5f60844f4565C751",
    //   //Path of your main contract.
    // contract: "contracts/Whitelist.sol:WhiteList",
    // });

    // await Hre.run("verify:verify", {
    //   //Deployed contract Blacklist address
    // address: "0x3fF64203202A4C7305B547E530CDa920e6e1375F",
    //   //Path of your main contract.
    // contract: "contracts/Blacklist.sol:Blacklist",
    // });

    // await Hre.run("verify:verify", {
    //   //Deployed contract YSL address
    // address: "0x2395b7F67C47Bdb2067D846D9375EE013396a83d",
    //   //Pass arguments as string and comma seprated values
    // constructorArguments:["0xB7a65f0D3E5fFB61121B5068fF1e84eA968E8B87"],
    //   //Path of your main contract.
    // contract: "contracts/Tokens/YSL.sol:YSL",
    // });

    // await Hre.run("verify:verify", {
    //     //Deployed contract liquidity Provider address
    // address: "0x84997B7015bd3863eb91979B71a07e15E8F2268F",
    //     //Path of your main contract.
    // contract: "contracts/LiquidityProvider.sol:liquidityProvider",
    // });

    // await Hre.run("verify:verify", {
    //     //Deployed contract pol address
    // address: "0x4dd7f5867fb5232E28b1a537Fbd24A3B499ABFFb",
    //     //Path of your main contract.
    // contract: "contracts/Treasury/ProtocolOwnedLiquidity.sol:ProtocolOwnedLiquidity",
    // });
    // await sleep(3000);

    // await Hre.run("verify:verify", {
    //   //Deployed contract POL Proxy address
    //   address: "0x73847d0E426B4B1ef2f7989Bc90932EF197C2262",
    //   //Path of your main contract.
    //   contract: "contracts/Upgradability/OwnedUpgradeabilityProxy.sol:OwnedUpgradeabilityProxy",
    //   });

    // await Hre.run("verify:verify", {
    //     //Deployed contract swappage address
    // address: "0x7165176C601ec23679016A42386D989452ff5170",
    //     //Path of your main contract.
    // contract: "contracts/Swap/SwapPage.sol:SwapPage",
    // });
    // await sleep(3000);

    // await Hre.run("verify:verify", {
    //   //Deployed contract swappage Proxy address
    //   address: "0x9c88F321dC98ce6cf62Ca9EED09CA512e39aeAa5",
    //   //Path of your main contract.
    //   contract: "contracts/Upgradability/OwnedUpgradeabilityProxy.sol:OwnedUpgradeabilityProxy",
    //   });

  //   await Hre.run("verify:verify", {
  //     //Deployed contract YSLBUSDVault address
  // address: "0x2F2ada4976BcAae40ffb27D8086F8fC977c59C41",
  //     //Path of your main contract.
  // contract: "contracts/Vaults/YSLBUSDVault.sol:YSLBUSDVault",
  // });

  // await Hre.run("verify:verify", {
  //   //Deployed contract optVault address
  // address: "0x28b6AE7326c62D6695B5A646ae5479cb535adA16",
  //   //Path of your main contract.
  // contract: "contracts/Vaults/OptVault.sol:OptVault",
  // });

  // await Hre.run("verify:verify", {
  // //Deployed contract optVaultlp address
  // address: "0x09deB9B5bF1378ae03655200B83b9f3C23Db4E63",
  // //Path of your main contract.
  // contract: "contracts/Vaults/OptVaultLP.sol:OptVaultLp",
  // });

  // await Hre.run("verify:verify", {
  // //Deployed contract optVaultAuto address
  // address: "0x1b9565e53a92b2a6375B332CE358D753d2F06EB8",
  // //Path of your main contract.
  // contract: "contracts/Vaults/OptVaultAuto.sol:OptVaultAuto",
  // });

  // await Hre.run("verify:verify", {
  // //Deployed contract optVaultFactory address
  // address: "0x8c2a00e4EE2127874Aa085675E3CDEA979e8E114",
  // //Path of your main contract.
  // contract: "contracts/optVaultFactory.sol:OptVaultFactory",
  // });

  // await Hre.run("verify:verify", {
  //   //Deployed contract oldxysl address
  // address: "0x03833cc347cb5c578693AdecB004BE3FA39200E7",
  //   //Path of your main contract.
  // contract: "contracts/Tokens/My20.sol:My20",
  // });

//   await Hre.run("verify:verify", {
//     //Deployed contract xysl address
//   address: "0x66F55bcBD79c0E312E44fDF8dD2560A41b37D7C6",
//     //Path of your main contract.
//   constructorArguments:["0x69325f47DE9C0A70f7a26825E7d12D51C673D2Ea","0x03833cc347cb5c578693AdecB004BE3FA39200E7"],
//   contract: "contracts/Tokens/xYSL.sol:xYSL",
// });

  // await Hre.run("verify:verify", {
  // //Deployed contract bysl address
  // address: "0x832F5a5208318908D795A5a1b7753d9fe0a010A7",
  // //Path of your main contract.
  // constructorArguments:["0x497c8F899C507bc8C8077993fF927e9c56d6f52f"],
  // contract: "contracts/Tokens/bYSL.sol:bYSL",
  // });

  // await Hre.run("verify:verify", {
  // //Deployed contract Bshare address
  // address: "0xE9ED55e214a95895084C177E291631C2DcB8fda1",
  // //Path of your main contract.
  // constructorArguments:["0x69325f47DE9C0A70f7a26825E7d12D51C673D2Ea"],
  // contract: "contracts/Tokens/BSHARE.sol:BShare",
  // });

  // await Hre.run("verify:verify", {
  //   //Deployed contract Treasury address
  //   address: "0x31F0Ed009a4e318125A8e7b4f68b22643858e075",
  //   //Path of your main contract.
  //   contract: "contracts/Treasury/Treasury.sol:Treasury",
  // });

  // await Hre.run("verify:verify", {
  //   //Deployed contract Treasury Proxy address
  //   address: "0x78e2C2FCaBa7dC64321236A4030B23aAd8c936df",
  //   //Path of your main contract.
  //   contract: "contracts/Upgradability/OwnedUpgradeabilityProxy.sol:OwnedUpgradeabilityProxy",
  //   });

  await Hre.run("verify:verify", {
    //Deployed contract Referer address
    address: "0x228cbe7E225bF8cECe50d04B57559be7258064b2",
    //Path of your main contract.
  // constructorArguments:["0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56","0xb2AC76EaeD0317B1da51361F131F85b5a328c5aB"],
    contract: "contracts/NFTs/Referral.sol:Referral",
    });
  //   await sleep(3000);

    // await Hre.run("verify:verify", {
    //   //Deployed contract Refferal Proxy address
    //   address: "0xD2c2E6a489A7479f1494401b46693fE03CcFc97F",
    //   //Path of your main contract.
    //   contract: "contracts/Upgradability/OwnedUpgradeabilityProxy.sol:OwnedUpgradeabilityProxy",
    //   });

    // await Hre.run("verify:verify", {
    // //Deployed contract Trigger  address
    //   address: "0xdBEf75355909d1565bbbAB8BF39E2C3B4C9Bb964",
    //    //Path of your main contract.
    //   contract: "contracts/Treasury/Trigger.sol:Trigger",
    // });

      // await Hre.run("verify:verify", {
      // //Deployed contract Trigger Proxy address
      //   address: "0x8a106aF8175d8749C0A99004eD6495572fC713cf",
      //    //Path of your main contract.
      //   contract: "contracts/Upgradability/OwnedUpgradeabilityProxy.sol:OwnedUpgradeabilityProxy",
      // });

  // await Hre.run("verify:verify", {
  //     //Deployed contract Cake address
  //       address: "0x43FD13e8eF8106011E7D0Fe7232B47929d90CEd0",
  //        //Path of your main contract.
  //       contract: "contracts/Masterchef/CakeToken.sol:CakeToken",
  //   });


    //   await Hre.run("verify:verify", {
    //         //Deployed contract YSL-BUSD PAIR address
    //           address: "0x6F3f6a106168A7ecad0960d1434dB3D00dFEF363",
    //           //Path of your main contract.
    //           contract: "contracts/MockRouter/UniswapV2Pair.sol:UniswapV2Pair",
    //   });

    //   await Hre.run("verify:verify", {
    // //Deployed contract YSLVault address
    //   address: "0xc9286074CB4b1A40Ba3e756f863B7eFDcC3883Df",
    //   //Path of your main contract.
    //   contract: "contracts/Vaults/YSLVault.sol:YSLVault",
    //   });

    // await Hre.run("verify:verify", {
    // //Deployed contract opt1155 address
    // address: "0xE6dB2bd1343718ab0cdC4B2ce1884573E061Ada1",],
    // contract: "contracts/NFTs/ReferralNFT.sol:RefererNft",
  // });

  // await hre.run("verify:verify", {
  //   //Deployed contract Cake address
  //     address: "0x43FD13e8eF8106011E7D0Fe7232B47929d90CEd0",
  //      //Path of your main contract.
  //     contract: "contracts/Masterchef/CakeToken.sol:CakeToken",
  // });


  //   await Hre.run("verify:verify", {
  //         //Deployed contract YSL-BUSD PAIR address
  //           address: "0x6F3f6a106168A7ecad0960d1434dB3D00dFEF363",
  //           //Path of your main contract.
  //           contract: "contracts/MockRouter/UniswapV2Pair.sol:UniswapV2Pair",
  //   });

  //   await Hre.run("verify:verify", {
  // //Deployed contract YSLVault address
  //   address: "0xc9286074CB4b1A40Ba3e756f863B7eFDcC3883Df",
  //   //Path of your main contract.
  //   contract: "contracts/Vaults/YSLVault.sol:YSLVault",
  //   });

  // await Hre.run("verify:verify", {
  // //Deployed contract opt1155 address
  // address: "0xE6dB2bd1343718ab0cdC4B2ce1884573E061Ada1",
  // //Path of your main contract.
  // constructorArguments:["0x69325f47DE9C0A70f7a26825E7d12D51C673D2Ea"],
  // contract: "contracts/NFTs/Opt1155.sol:Opt1155",
  // });

  // await Hre.run("verify:verify", {
  //   //Deployed contract usdy address
  //   address: "0x879E5884773e949f5433860b79A992a27f0241fE",
  //   //Pass arguments as string and comma seprated values
  //   constructorArguments:["0x99225bf5536737743D6d56eDA941Fa4E6f90D011"],
  //   //Path of your main contract.
  //   contract: "contracts/Tokens/USDy.sol:USDy",
  // });

  // await Hre.run("verify:verify", {
  //   //Deployed contract Early Access address
  //   address: "0xf85C5450315Dc47C29676D01a6A147b13e2130c2",
  //   //Pass arguments as string and comma seprated values
  //   // constructorArguments:["0xa0Bbc014C054693497cBdB11D202Cdcf201E6c96"],
  //   //Path of your main contract.
  //   contract: "contracts/NFTs/EarlyAccess.sol:EarlyAccess",
  // });

  // await Hre.run("verify:verify", {
  //   //Deployed contract earlyAccess Proxy address
  //   address: "0x5439BBF64B7803975229D0faC0e780e44802b544",
  //   //Path of your main contract.
  //   contract: "contracts/Upgradability/OwnedUpgradeabilityProxy.sol:OwnedUpgradeabilityProxy",
  //   });

};

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});
    

    

