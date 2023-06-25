const BN = require("ethers").BigNumber;
const { ethers } = require("hardhat");
const {
    time, // time
    constants,
  } = require("@openzeppelin/test-helpers");
const { factory } = require("typescript");
const { SOL_EXP_HEADER_PREFIX } = require("@poanet/solidity-flattener/helpers/constants");
const { nextTick } = require("process");

function sleep(ms)
 {
  return new Promise(resolve => setTimeout(resolve, ms));
} 

async function main () {
    const [deployer] = await ethers.getSigners();
    const { chainId } = await ethers.provider.getNetwork();

    const owner = "0xF3CF8B7B952377557d8DB8f111a277AD67a3Dbff";
    const signer = "0x1C98356a26Fe0b15889CA9816C350dF696bb05aC";
    const testnet = {
      admin: "0x01430CB758CB8fF87a40C2E77436934E1a1acB7f",
      Router: "0xe11B971f6f980276967292AF3b817a836F1a0dD5",
      factory: "0xb314FC5BB5D7ca117F24D7FF98266FC2cB006A44",
      cakeToken : "0xce2d76D26B281EF63e31dA4a00b47D987E1cD907",
      syrupBar : "0x48477Fd30eB40b75198Ce79CA00138b841eEA49f",
      masterChef : "0x05f9B9f9438f1056F2557c08613d32883F6570fa",
      optvault : "0x3289144B8F88326c2B0612ae67Ae77109BBd5c88",
      optvaultauto : "0x49E48Dd7132A36C7C8d834655177B43A7c95CD4A",
      optvaultlp : "0x0E81B2A4045e5b1a6777A9f0c88105772b2b7f26",
      BshareBUSDVault: "0xfB922f2F7D822fa5b60F0a843CB73cb5C1E687b2",
      bsharevault : "0xfC885D57849Dbc432f9034a7D5B40A6546Ff272d",
      usdybusd : "0xA01Cb0B465B7c32E0fc841E429604A014894D3dF",
      usdyvault : "0x28D65d28E5e4165f26f326bEE02712EB9AA27fa7",
      xyslbusdvault : "0xaC90495101dd8416588B90eE8a170193889A0A97",
      xyslvault : "0x88138c42a3216f22950F6584EBC093459B67ab20",
      yslbusdvault : "0x95ee3b30bf54c35fD80eEfcE8F8f8843b3e6Bc3f",
      yslvault : "0xd379bf08A7F5BFeAe5F07651e7Ee63066F7f5C3c",
      optvaultfactory : "0xEBD2344c1F61baD73931F3F39F97759e587DA34F",
      BShare: "0xbb193C7DdBE66acf32613Eb21620bdD7Cc5582f9",
      USDy: "0xD701CedBd6E3590F44820a8D379c50B416b64865",
      xysl: "0x338B43058a6929E301df5BfBFd2554Bee9325F36",
      ysl: "0xB35eEb775f7fc9BD50f7460E99654A6aB826226C",
      bysl: "0xcCcc7d7B98E126a36d28dcb8cf42d1A7c73559Fc",
      usds: "0x3cA40976489dfa4f1C2bD032e3575E596Cb947Bd",
      BUSD: "0x590Bf291FF56F92aC5a3fC6938bF896f5872529b",
      masterNtt:"0xDec62DE08Be9ac5487BF8ECBb7aBD0d29dA000bC",
      opt1155: "0xA3D00b2B0e28CA104C08546606578004a6BF26ad",
      whitelist: "0x3220042303d2fD3943f5e1Fc66b07FAf82cbEF67",
      treasury:"0xCe3AFF289004e21f426D2D108Fb9c06C0E67fA28",
      POl:"0xcf501506811a6e5469829023742f7680aa630E52",
      tempholding:"0x0e0cd1EE354A9C06C764dA8E916dD8d734a9a478",
      PhoenixNFT:"0x1a3936Be048Ed0601f608AdD795cA400d163c33E",
      referer: "0x769b0A86dA5d68FB871D2c48260f7555a308dB91",
      banana:"0xF6C56A9c17eb42D1f00C4DcE275e28E49D8bb0FE",
    }

    Admin = await ethers.getContractFactory("Admin");
    Router = await ethers.getContractFactory("UniswapV2Router01");
    Factory = await ethers.getContractFactory("UniswapV2Factory");
    Busd = await ethers.getContractFactory("NTT");
    CakeToken = await ethers.getContractFactory("CakeToken");
    SyrupBar = await ethers.getContractFactory("SyrupBar");
    MasterChef = await ethers.getContractFactory("MasterChef");
    Optvault = await ethers.getContractFactory("OptVault");
    OptvaultAuto = await ethers.getContractFactory("OptVaultAuto");
    OptvaultLp = await ethers.getContractFactory("OptVaultLp");
    BshareBUSDVault = await ethers.getContractFactory("BShareBUSDVault");
    Bsharevault = await ethers.getContractFactory("BshareVault");
    USDyBUSDVault = await ethers.getContractFactory("USDyBUSDVault");
    USDyVault = await ethers.getContractFactory("USDyVault");
    xYSLBUSDVault = await ethers.getContractFactory("xYSLBUSDVault");
    xYSLVault = await ethers.getContractFactory("xYSLVault");
    YSLBUSDVault = await ethers.getContractFactory("YSLBUSDVault");
    YSLVault = await ethers.getContractFactory("YSLVault");
    OptVaultFactory = await ethers.getContractFactory("OptVaultFactory");
    USDy = await ethers.getContractFactory("USDy");
    USDs = await ethers.getContractFactory("USDs");
    xYSL = await ethers.getContractFactory("xYSL");
    Ysl = await ethers.getContractFactory("YSL");
    Bshare = await ethers.getContractFactory("BShare");
    bYSL = await ethers.getContractFactory("bYSL");
    masterNTT= await ethers.getContractFactory("NTT");
    opt1155 = await ethers.getContractFactory("Opt1155");
    whitelist= await ethers.getContractFactory("WhiteList");
    treasury = await ethers.getContractFactory("Treasury");
    POl = await ethers.getContractFactory("ProtocolOwnedLiquidity");
    tempholding = await ethers.getContractFactory("TemporaryHolding");
    PhoenixNFT = await ethers.getContractFactory("PhoenixNft");
    teamAddress = signer;
    referer= await ethers.getContractFactory("RefererNft");
    Banana = await ethers.getContractFactory("NTT");

    admin = await Admin.attach(testnet.admin);
    console.log(admin.address, "Admin Address");

    router = await Router.attach(testnet.Router);
    console.log(router.address, "Router address");

    facTory = await Factory.attach(testnet.factory);
    console.log(facTory.address, "factory address");

    router = await Router.deploy()

    // busd = await Busd.deploy();
    // busd = await Busd.attach(testnet.BUSD);
    // console.log(busd.address, "BUSD address");

    // usdy = await USDy.attach(testnet.USDy);
    // console.log(usdy.address, "USdy Address");
    
    // xysl = await xYSL.deploy(admin.address, oldXYSL.address, router.address);
    // xysl = await xYSL.attach(testnet.xysl);
    // console.log(xysl.address, "xysl address");

    // ysl = await Ysl.deploy(admin.address);
    // ysl = await Ysl.attach(testnet.ysl);
    // console.log(ysl.address, "ysl address");

    // bshare = await Bshare.deploy(admin.address);
    // bshare = await Bshare.attach(testnet.BShare);
    // console.log(bshare.address, "BShare address");

    // banana = await Banana.deploy();
    banana = await Banana.attach(testnet.banana);
    console.log(banana.address,"Banana");

    // console.log(await admin.hasRole(await admin.DEFAULT_ADMIN_ROLE(),owner));

    // await admin.initialize(owner);
    // console.log("admin initialize");
    // await admin.setTreasury(treasury.address);

    // await admin.setBUSD(busd.address);
    // bysl = await bYSL.deploy(admin.address);
    // bysl = await bYSL.attach(testnet.bysl);
    // console.log(bysl.address, "bYSL address");
    
    // usds = await USDs.deploy(admin.address);
    // usds = await USDs.attach(testnet.usds);
    // console.log(usds.address, "USDs address");
    

    // cakeToken = await CakeToken.deploy();
    // cakeToken = await CakeToken.attach(testnet.cakeToken);
    // console.log(cakeToken.address, "CAKETOKEN");
 
    // syrupBar = await SyrupBar.deploy(cakeToken.address);
    // syrupBar = await SyrupBar.attach(testnet.syrupBar);
    // console.log(syrupBar.address, "SYRUPBAR");
 
    // blocknumber = await ethers.provider.getBlockNumber();
    // console.log(blocknumber, "blocknumber");
 
    // masterChef = await MasterChef.deploy(cakeToken.address, syrupBar.address, "0xF3CF8B7B952377557d8DB8f111a277AD67a3Dbff",
    //     50, 18779824);
    // masterChef = await MasterChef.attach(testnet.masterChef);
    // console.log(masterChef.address, "masterChef");

    // optvault = await Optvault.deploy();
    optvault = await Optvault.attach(testnet.optvault);
    console.log(optvault.address, "optvault");

    // optvaultauto = await OptvaultAuto.deploy();
    optvaultauto =  await OptvaultAuto.attach(testnet.optvaultauto);
    console.log(optvaultauto.address, "OptvaultAuto");

    // optvaultlp = await OptvaultLp.deploy();
    optvaultlp = await OptvaultLp.attach(testnet.optvaultlp);
    console.log( optvaultlp.address, "optvualtlp");

    // BshareBUSDVault = await BshareBUSDVault.deploy();
    // BshareBUSDVault = await BshareBUSDVault.attach(testnet.BshareBUSDVault);
    // console.log(BshareBUSDVault.address, "BShareBUSDVault address");

    // bsharevault = await Bsharevault.deploy();
    // bsharevault = await Bsharevault.attach(testnet.bsharevault);
    // console.log(bsharevault.address, "BshareVault");

    // usdybusd = await USDyBUSDVault.deploy();
    // usdybusd = await USDyBUSDVault.attach(testnet.usdybusd);
    // console.log(usdybusd.address, "usdybusd");

    // usdyvault = await USDyVault.deploy();
    // usdyvault = await USDyVault.attach(testnet.usdyvault);
    // console.log(usdyvault.address, "usdyvault");

    // xyslbusdvault = await xYSLBUSDVault.deploy();
    // xyslbusdvault = await xYSLBUSDVault.attach(testnet.xyslbusdvault);
    // console.log(xyslbusdvault.address, "xyslbusdvault");

    // xyslvault = await xYSLVault.deploy();
    // xyslvault = await xYSLVault.attach(testnet.xyslvault);
    // console.log(xyslvault.address, "xyslvault");

    // yslbusdvault = await YSLBUSDVault.deploy();
    // yslbusdvault = await YSLBUSDVault.attach(testnet.yslbusdvault);
    // console.log(yslbusdvault.address, "yslbusdvault");

    // yslvault = await YSLVault.deploy();
    // yslvault = await YSLVault.attach(testnet.yslvault);
    // console.log(yslvault.address, "yslvault");

    // masterNtt = await masterNTT.deploy();
    masterNtt = await masterNTT.attach(testnet.masterNtt);
    console.log(masterNtt.address, "masterNtt");

    // await admin.setmasterNTT(masterNtt.address);

    // optvaultfactory = await OptVaultFactory.deploy();
    optvaultfactory = await OptVaultFactory.attach(testnet.optvaultfactory);
    console.log(optvaultfactory.address, "optvaultfactory");

    // opt1155 = await opt1155.deploy(admin.address);
    opt1155 = await opt1155.attach(testnet.opt1155);
    console.log(opt1155.address, "opt1155");
    await admin.setOpt1155(opt1155.address);
    // whitelist = await whitelist.deploy();
    // whitelist = await whitelist.attach(testnet.whitelist);
    // console.log(whitelist.address, "whitelist");
    // await whitelist.initialize(owner);

    // treasury= await treasury.deploy();
    // treasury = await treasury.attach(testnet.treasury);
    // console.log(treasury.address, "treasury");
    // await treasury.initialize(owner,admin.address);

    // POl = await POl.deploy();
    // POl = await POl.attach(testnet.POl);
    // console.log(POl.address, "POl");
    // await POl.initialize(owner,admin.address);

    // tempholding = await tempholding.deploy();
    // tempholding = await tempholding.attach(testnet.tempholding);
    // console.log(tempholding.address, "tempholding");
    // await tempholding.initialize(owner,admin.address);

    
    // PhoenixNFT = await PhoenixNFT.deploy(admin.address,"ABC");
    // PhoenixNFT = await PhoenixNFT.attach(testnet.PhoenixNFT);
    // console.log(PhoenixNFT.address, "PhoenixNFT");

    // Referer = await referer.deploy(busd.address);
    // Referer = await referer.attach(testnet.referer);
    // console.log(Referer.address,"RefererNFT");

    // let Bshare_BUSD = await facTory.getPair(bshare.address,busd.address);
    // console.log(Bshare_BUSD,"Bshare_BUSD");
    // await BshareBUSDVault.initialize("0xF3CF8B7B952377557d8DB8f111a277AD67a3Dbff", "0x01430CB758CB8fF87a40C2E77436934E1a1acB7f",
    //     "0x1934d09Eb2CAeec7001385F2237D166Aa6440aB5"); 

    // await bsharevault.initialize(admin.address,owner,router.address);

    // let USDy_BUSD = await facTory.getPair(usdy.address,busd.address);
    // console.log(USDy_BUSD,"USDy_BUSD");
    // await usdybusd.initialize("0x01430CB758CB8fF87a40C2E77436934E1a1acB7f","0xF3CF8B7B952377557d8DB8f111a277AD67a3Dbff",
    //     "0x40c038679A3973046Fe59Ba25e7c455Ef591a98b", "0xe11B971f6f980276967292AF3b817a836F1a0dD5" );

    // await usdyvault.initialize(admin.address, owner);

    // let xYSL_BUSD = await facTory.getPair(xysl.address,busd.address);
    // console.log(xYSL_BUSD,"xYSL_BUSD");
    // await xyslbusdvault.initialize("0x01430CB758CB8fF87a40C2E77436934E1a1acB7f","0xF3CF8B7B952377557d8DB8f111a277AD67a3Dbff",
    //     "0x81EF34E059c4E83F380C5c95Bb46342d01827a8E", "0xe11B971f6f980276967292AF3b817a836F1a0dD5" );

    // await xyslvault.initialize(owner, admin.address, router.address);

    // let YSL_BUSD = await facTory.getPair(ysl.address,busd.address);
    // console.log(YSL_BUSD,"YSL_BUSD");
    // await yslbusdvault.initialize("0x01430CB758CB8fF87a40C2E77436934E1a1acB7f","0xF3CF8B7B952377557d8DB8f111a277AD67a3Dbff",
    //     "0xd4dFecab0A62cF2D0e23417B55748474500e4fdB", "0xe11B971f6f980276967292AF3b817a836F1a0dD5" );
    
    // await yslvault.initialize(owner,admin.address, router.address);

    // await optvaultfactory.initialize("0xF3CF8B7B952377557d8DB8f111a277AD67a3Dbff","0x01430CB758CB8fF87a40C2E77436934E1a1acB7f",
    //     "0x3289144B8F88326c2B0612ae67Ae77109BBd5c88", "0x0E81B2A4045e5b1a6777A9f0c88105772b2b7f26",
    //     "0x49E48Dd7132A36C7C8d834655177B43A7c95CD4A");
    // await admin.setOptVaultFactory(optvaultfactory.address);
    // await admin.setYSLVault(yslvault.address);
    // await admin.setYSLBUSDVault(yslbusdvault.address);
    // await admin.setxYSLVault(xyslvault.address);
    // await admin.setxYSLBUSDVault(xyslbusdvault.address);
    // await admin.fSDyVault(usdyvault.address);
    // await admin.setUSDyBUSDVault(usdybusd.address);
    // await admin.setBShareBUSD(BShareBUSDvault.address);
    // await admin.setBShareVault(bsharevault.address);
    // await admin.setYSL(ysl.address);
    // await admin.setBShare(bshare.address);
    // await admin.setUSDy(usdy.address);
    // await admin.setUSDs(usds.address);
    // await admin.setxYSL(xysl.address);
    // await admin.setbYSL(bysl.address);
    // await admin.setTeamAddress(signer);
    // await admin.setPOL(POl.address);
    console.log("5");
    // await admin.set
    
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });