const Hre = require("hardhat");
async function main() {
    // await Hre.run("verify:verify", {
    //   //Deployed contract Admin address
    //   address: "0xb2Dd9F5e00b0c8A8FE418dcEA71Ca8aBc9ef2387",
    //   //Path of your main contract.
    //   contract: "contracts/Admin.sol:Admin",
    // });
//     // await Hre.run("verify:verify", {
//     //     //Deployed contract optvault address
//     //     address: "0x3289144B8F88326c2B0612ae67Ae77109BBd5c88",
//     //     //Path of your main contract.
//     //     contract: "contracts/vaults/OptVault.sol:OptVault",
//     //   });
//     // await Hre.run("verify:verify", {
//     // //Deployed contract optvaultauto address
//     // address: "0x49E48Dd7132A36C7C8d834655177B43A7c95CD4A",
//     // //Path of your main contract.
//     // contract: "contracts/vaults/OptVaultAuto.sol:OptVaultAuto",
//     // });
//     // await Hre.run("verify:verify", {
//     //     //Deployed contract optvaultlp address
//     //     address: "0x0E81B2A4045e5b1a6777A9f0c88105772b2b7f26",
//     //     //Path of your main contract.
//     //     contract: "contracts/vaults/OptVaultLp.sol:OptVaultLp",
//     // });
//     await Hre.run("verify:verify", {
//         //Deployed contract BshareVault address
//         address: "0x8bc4A3Ea9bA6b4A6d317A9016a9e6985cd388a39",
//         //Path of your main contract.
//         contract: "contracts/vaults/BSHAREVault.sol:BshareVault",
//     });

    // await Hre.run("verify:verify", {
    //       //Deployed contract BshareBUSD address
    //       address: "0x6475d51Ee769e66c69BfB4EA596D5a776D464C05",
    //       //Path of your main contract.
    //       contract: "contracts/Vaults/BSHAREBUSDVault.sol:BSHAREBUSDVault",
    //   });

    // await Hre.run("verify:verify", {
    //     //Deployed contract USDyBUSD address
    //     address: "0xc782e4BD1d5E0280378351ccedbF11D679Bf5121",
    //     //Path of your main contract.
    //     contract: "contracts/Vaults/USDyBUSDVault.sol:USDyBUSDVault",
    // });
    // await Hre.run("verify:verify", {
    //     //Deployed contract USDyVault address
    //     address: "0x53ed79D0baEE548ba489a83a259f7BA4fd7a1741",
    //     //Path of your main contract.
    //     contract: "contracts/Vaults/USDyVault.sol:USDyVault",
    // });
    // await Hre.run("verify:verify", {
    //     //Deployed contract xYSLBUSDVault address
    //     address: "0x15F2cf7400aBb72cE1DC25eA16336BdeAB234e6E",
    //     //Path of your main contract.
    //     contract: "contracts/Vaults/xYSLBUSDVault.sol:xYSLBUSDVault",
    // });
//     await Hre.run("verify:verify", {
//         //Deployed contract xYSLVault address
//         address: "0x7F18328b122883fe90A93D196aaE361fb3ff4173",
//         //Path of your main contract.
//         contract: "contracts/vaults/xYSLVault.sol:xYSLVault",
//     });
    // await Hre.run("verify:verify", {
    //     //Deployed contract YSLBUSDVault address
    //     address: "0xC5CfB0E6A1f209fe6B86173f5517D87A5aC28DdC",
    //     //Path of your main contract.
    //     contract: "contracts/Vaults/YSLBUSDVault.sol:YSLBUSDVault",
    // });
//     await Hre.run("verify:verify", {
//         //Deployed contract YSLVault address
//         address: "0xFaa4C0cB9720a3FFEbf9Ac2302AEf4c53f92EBea",
//         //Path of your main contract.
//         contract: "contracts/Vaults/YSLVault.sol:YSLVault",
//     });
//     // await Hre.run("verify:verify", {
//     //     //Deployed contract OptVaultFactory address
//     //     address: "0xEBD2344c1F61baD73931F3F39F97759e587DA34F",
//     //     //Path of your main contract.
//     //     contract: "contracts/optVaultFactory.sol:OptVaultFactory",
//     // });

//   //   await Hre.run("verify:verify", {
//   //     //Deployed contract PhoenixNFT address
//   //     address: "0x1a3936Be048Ed0601f608AdD795cA400d163c33E",
//   //     //Path of your main contract.
//   //     contract: "contracts/nft/PhoenixNft.sol:PhoenixNft",
//   // });

//   // await Hre.run("verify:verify", {
//   //   //Deployed contract TemporaryHolding address
//   //   address: "0x0e0cd1EE354A9C06C764dA8E916dD8d734a9a478",
//   //   //Path of your main contract.
//   //   contract: "contracts/TemporaryHolding.sol:TemporaryHolding",
//   // });

//   await Hre.run("verify:verify", {
//     //Deployed contract POl address
//     address: "0xe99024724b52F73e10655B4A2fDc69Ed6e089719",
//     //Path of your main contract.
//     contract: "contracts/BUSDProtocol/ProtocolOwnedLiquidity.sol:ProtocolOwnedLiquidity",
//   });

  await Hre.run("verify:verify", {
    //Deployed contract treasury address
    address: "0x0959cD53b4Db91fE19F186957De0570dd36516F9",
    //Path of your main contract.
    contract: "contracts/Treasury/Treasury.sol:Treasury",
  });

  // await Hre.run("verify:verify", {
  //   //Deployed contract transfer address
  //   address: "0x2A904b96dAe01AFd7539b3E04Fdd24E881D9A477",
  //   //Path of your main contract.
  //   contract: "contracts/transfer.sol:transfer",
  // });

//   await Hre.run("verify:verify", {
//     //Deployed contract whitelist address
//     address: "0x4ba5872DBD8ACD76b9956a8c5F9E95b696130c46",
//     //Path of your main contract.
//     contract: "contracts/Whitelist.sol:WhiteList",
//   });

//   // await Hre.run("verify:verify", {
//   //   //Deployed contract opt1155 address
//   //   address: "0xA3D00b2B0e28CA104C08546606578004a6BF26ad",
//   //   //Path of your main contract.
//   //   contract: "contracts/nft/Opt1155.sol:Opt1155",
//   // });
//     await Hre.run("verify:verify", {
//         //Deployed contract MasterNTT address
//         address: "0x25EeF652eaf6A1FfEAA1991bCAEC3FE59dD65A9F",
//         //Path of your main contract.
//         contract: "contracts/tokens/NTT.sol:NTT",
//     });

    // await Hre.run("verify:verify", {
    //     //Deployed contract LiquidityProvider address
    //     address: "0x12A5FADb20FFDFd4E360a1e0Ef7530a8E72b1676",
    //     //Path of your main contract.
    //     contract: "contracts/LiquidityProvider.sol:liquidityProvider",
    // });

//   //   await Hre.run("verify:verify", {
//   //     //Deployed contract Referer address
//   //     address: "0x9A8306b5A9078966048e05c3407BfFD3678a813B",
//   //     //constructor arguments.
//   //     constructorArguments:["0x590Bf291FF56F92aC5a3fC6938bF896f5872529b"],
//   //     //Path of your main contract.
//   //     contract: "contracts/nft/RefererNft.sol:RefererNft",
//   // });
//   await Hre.run("verify:verify", {
//       //Deployed contract Referer address
//       address: "0x9A8306b5A9078966048e05c3407BfFD3678a813B",
//       //Path of your main contract.
//     // constructorArguments:["0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56","0xb2AC76EaeD0317B1da51361F131F85b5a328c5aB"],
//       contract: "contracts/NFTs/Referral.sol:Referral",
//       });

//     // await Hre.run("verify:verify", {
//     //   //Deployed contract Cake address
//     //     address: "0xce2d76D26B281EF63e31dA4a00b47D987E1cD907",
//     //      //Path of your main contract.
//     //     contract: "contracts/Masterchef/CakeToken.sol:CakeToken",
//     // });

//     // await Hre.run("verify:verify", {
//     //   //Deployed contract Syrup address
//     //     address: "0x48477Fd30eB40b75198Ce79CA00138b841eEA49f",
//     //      //Path of your main contract.
//     //     contract: "contracts/Masterchef/SyrupBar.sol:SyrupBar",
//     // });

//     // await Hre.run("verify:verify", {
//     //   //Deployed contract Master Chef address
//     //     address: "0x05f9B9f9438f1056F2557c08613d32883F6570fa",
//     //     constructorArguments:["0xce2d76D26B281EF63e31dA4a00b47D987E1cD907","0x48477Fd30eB40b75198Ce79CA00138b841eEA49f",
//     //     "0xF3CF8B7B952377557d8DB8f111a277AD67a3Dbff",50,18779824],
//     //      //Path of your main contract.
//     //     contract: "contracts/Masterchef/MasterChef.sol:MasterChef",
//     // });

//   //   await Hre.run("verify:verify", {
//   //     //Deployed contract Banana address
//   //     address: "0xF6C56A9c17eb42D1f00C4DcE275e28E49D8bb0FE",
//   //     //Path of your main contract.
//   //     contract: "contracts/tokens/NTT.sol:NTT",
//   // });
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });