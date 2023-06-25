const BN = require("ethers").BigNumber;
const { ethers } = require("hardhat");
const {
    time, // time
    constants,
  } = require("@openzeppelin/test-helpers");
const { factory } = require("typescript");
const ether = require("@openzeppelin/test-helpers/src/ether");

function expandTo18Decimals(n) {
  return BN.from(n).mul(BN.from(10).pow(18));
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function main () {
    const [deployer] = await ethers.getSigners();
    const { chainId } = await ethers.provider.getNetwork();


    const owner = "0xF3CF8B7B952377557d8DB8f111a277AD67a3Dbff";

    const mainnet = {
      busd: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
      team: "0xfcAa08075c0f874fAC2A595A70D7BB7200cB2C02",
      operator: "0xaa97EfD61F545BEe917625b3cFA94C485A4Bf2b6",
      admin: "0xb2AC76EaeD0317B1da51361F131F85b5a328c5aB",
      whitelist: "0x25E5D4D5A34ce3d1ce607362fb5F04350F8bc11c",
      Blacklist: "0x9eA19e67c0c1f6Bfb6F1cC79221D3F165d2bbC11",
      treasury: "0x78e2C2FCaBa7dC64321236A4030B23aAd8c936df",
      trigger: "0x8a106aF8175d8749C0A99004eD6495572fC713cf",
      pol: "0x73847d0E426B4B1ef2f7989Bc90932EF197C2262",
      bysl: "0xb5D1fDcE50029dB8e6649D35cdDea433a80A2372",
      swappage: "0xAE1743E3bB29174afa433e4774f5f6EBA6d04b20",
      earlyAccess: "0x5439BBF64B7803975229D0faC0e780e44802b544",
      refferal: "0xD2c2E6a489A7479f1494401b46693fE03CcFc97F"

    }

    const testnet = {
        admin: "0x4e31F35BC49eD7F45B6ACA46E789a7BD201fcF31",
        busd: "0x9F8b3Adb0B5b1a9FD2ceBca8f94279fdf80C1558",
        weth: "0xD8c9cED95a83659141C9E9c0816ca7a6bad8c7B6",
        factory: "0x518B01d2f6CB13f78bcF60e738280AC9734675a5", 
        router: "0x135Aab565D616B73F549B83dc370541468C43755",
        whitelist: "0x563f4A3bb8bBbCBCF7Ba6ad13D93C04593B5bf77",
        Blacklist: "0x5DE86CCB0a2bb02FDeA22A60dC1b8D61453FFd32",
        ysl: "0x1e46553Ca650F05df4D4D44f22de0Adfa0856377",
        liquidityProvider: "0x84997B7015bd3863eb91979B71a07e15E8F2268F",
        yslbusdvault : "0x2F2ada4976BcAae40ffb27D8086F8fC977c59C41",
        xysl:"0x66F55bcBD79c0E312E44fDF8dD2560A41b37D7C6",
        oldxysl:"0x03833cc347cb5c578693AdecB004BE3FA39200E7",
        bysl:"0xf22b3B72Ee2B4F47195a639107a7c9226fd47956",
        bshare:"0xE9ED55e214a95895084C177E291631C2DcB8fda1",
        refferal: "0xe2526C44782B86DCdEf3bd82AbAa1eaF545DFFab",
        referralProxy: "0x776F010D807041B40FB5f65D52C549AD82260254", 
        treasury:"0x02882c17FaD72cd0E3b0Af3700d502462CFa628D",
        treasuryproxy: "0xF9D9d36EBf4232E0e7d2fc413427c3F4F4e553F9",
        pol:"0xed3a4B1Dd70E27c00cFBAB6689223427A89c8668",
        pol: "0x89996721de464692eF40d8A471574226EadCF1C2",
        swappage:"0xe7E91E1F8AD5D53Aff8590af3824aDdFb5E21668",
        swappage: "0x758Abc6f5963e476B0d752FD9B9452A02317B2B7",
        optvaultfactory:"0x8c2a00e4EE2127874Aa085675E3CDEA979e8E114",
        optvault:"0x28b6AE7326c62D6695B5A646ae5479cb535adA16",
        optvaultlp:"0x09deB9B5bF1378ae03655200B83b9f3C23Db4E63",
        optvaultauto:"0x1b9565e53a92b2a6375B332CE358D753d2F06EB8",
        receipt:"0x43B52784Bc5a259d39Ce48BE76fbEcefE5d3f02c",
        yslvault:"0xc9286074CB4b1A40Ba3e756f863B7eFDcC3883Df",
        cakeToken:"0x43FD13e8eF8106011E7D0Fe7232B47929d90CEd0",
        // SmartChefFactory:"0x5A9d5Cc082D4d671FaBF6cC953a861A24dc948C7",
        opt1155:"0xE6dB2bd1343718ab0cdC4B2ce1884573E061Ada1",
        usdy:"0x05852AeF2Cbf6dcb7277F1D3bB8369942AB5Aaac",
        earlyAccess:"0x41647741789527c3f51927aeeE410A99788d2211",
        trigger:"0xDaab4E0Fcff2fbe29038913373d1B2268Fa63E8b",
        triggerProxy: "0x649Ff9a801bC72B89033C0e3b19D03209d0BcB61",
    }

    Admin = await ethers.getContractFactory("Admin");
    Busd = await ethers.getContractFactory("Receipt");
    Receipt = await ethers.getContractFactory("Receipt");
    Weth = await ethers.getContractFactory("WETH9");
    Factory = await ethers.getContractFactory("UniswapV2Factory");
    Router = await ethers.getContractFactory("UniswapV2Router01");
    Whitelist = await ethers.getContractFactory("WhiteList");
    Blacklist = await ethers.getContractFactory("Blacklist");
    Ysl = await ethers.getContractFactory("YSL");
    liquidityProvider = await ethers.getContractFactory("liquidityProvider");
    YSLBUSDvault = await ethers.getContractFactory("YSLBUSDVault"),
    Bysl = await ethers.getContractFactory("bYSL");
    Bshare = await ethers.getContractFactory("BShare");
    Oldxysl = await ethers.getContractFactory("My20");
    xYSL = await ethers.getContractFactory("xYSL");
    Refferal = await ethers.getContractFactory("Referral");
    Treasury = await ethers.getContractFactory("Treasury");
    Pol = await ethers.getContractFactory("ProtocolOwnedLiquidity");
    Swappage = await ethers.getContractFactory("SwapPage"); 
    OptvaultFactory = await ethers.getContractFactory("OptVaultFactory");
    Optvault = await ethers.getContractFactory("OptVault");
    OptvaultLp = await ethers.getContractFactory("OptVaultLp");
    OptvaultAuto = await ethers.getContractFactory("OptVaultAuto");
    YSLVault = await ethers.getContractFactory("YSLVault");
    CakeToken = await ethers.getContractFactory("CakeToken");
    SmartChefFactory = await ethers.getContractFactory("SmartChefFactory");
    Opt1155 = await ethers.getContractFactory("Opt1155");
    USDy = await ethers.getContractFactory("USDy");
    EarlyAccess = await ethers.getContractFactory("EarlyAccess");
    upgradeability = await ethers.getContractFactory("OwnedUpgradeabilityProxy");
    Trigger = await ethers.getContractFactory("Trigger");
    
    // admin = await Admin.deploy();
    // // admin = await Admin.attach(mainnet.admin);
    // console.log(admin.address, "Admin Address");
    // await sleep(15000);
    // await admin.initialize(owner, owner);
    // console.log("initialize");
    // await sleep(15000);
    // // await admin.setOperator(owner);
    // await sleep(15000);
    // console.log("hasRole", await admin.hasRole(await admin.DEFAULT_ADMIN_ROLE(),owner));
    // await sleep(15000);
    // await admin.setTeamAddress(owner);
    // console.log("setTeamAddress");
    // await sleep(15000);

    
    // whitelist = await Whitelist.deploy();
    // // whitelist = await Whitelist.attach(mainnet.whitelist);
    // console.log(whitelist.address, "WhiteList address");
    // await whitelist.initialize(admin.address);
    // console.log("hasRole", await admin.hasRole(await admin.DEFAULT_ADMIN_ROLE(),owner));
    // await admin.setWhitelist(whitelist.address);


    // Blacklist = await Blacklist.deploy();
    // // Blacklist = await Blacklist.attach(mainnet.Blacklist);
    // console.log(Blacklist.address, "Blacklist address");
    // await Blacklist.initialize(admin.address);
    // await admin.setBlacklist(Blacklist.address);
    // await sleep(15000);


    // busd = await Busd.deploy();
    // // busd = await Busd.attach(mainnet.busd);
    // console.log(busd.address, "BUSD address");
    // await busd.initialize(admin.address, owner, "BUSDTOKEN", "BUSD");
    // // await admin.setBUSD(mainnet.busd);
    // await admin.setBUSD(busd.address);
    // await sleep(15000);
    
    // treasury = await Treasury.deploy();
    // // treasury = await Treasury.attach(mainnet.treasury);
    // console.log("treasury", treasury.address);
    // await sleep(15000);
    // proxy3 = await upgradeability.deploy();
    // console.log("proxy3", proxy3.address);
    // await sleep(15000);
    // await proxy3.upgradeTo(treasury.address);
    // console.log("upgradeTo done")
    // await sleep(15000);
    // treasuryProxy = Treasury.attach(proxy3.address);
    // await admin.setTreasury(treasuryProxy.address);
    // // await admin.setTreasury(treasury.address);
    // console.log("setTreasury");
    // await sleep(15000);


    // trigger = await Trigger.deploy();
    // // trigger = await Trigger.attach(mainnet.trigger);
    // console.log("trigger", trigger.address);
    // await sleep(15000);
    // proxy2 = await upgradeability.deploy();
    // console.log("proxy2",proxy2.address);
    // await sleep(15000);
    // await proxy2.upgradeTo(trigger.address);
    // console.log("upgrateTo Done")
    // await sleep(15000);
    // TriggerProxy = Trigger.attach(proxy2.address);
    // await admin.setTrigger(TriggerProxy.address);
    // // await admin.setTrigger(trigger.address);
    // console.log("setTrigger");
    // await sleep(15000);
    // // tri = await Trigger.attach(testnet.triggerProxy);


    // await treasuryProxy.initialize(owner,admin.address);
    // await sleep(15000);
    // console.log("initialize treasury");
    // await sleep(15000);
    // await TriggerProxy.initialize(owner,admin.address,3600);
    // await sleep(15000);
    // console.log("Trigger initialize");
    // await sleep(15000);

    pol = await Pol.deploy();
    // // pol = await Pol.attach(mainnet.pol);
    console.log("POL",pol.address);
    // await sleep(15000);
    // proxy4 = await upgradeability.deploy();
    // console.log("proxy4",proxy4.address);
    // await sleep(15000);
    // await proxy4.upgradeTo(pol.address);
    // console.log("upgradeTo Done");
    // await sleep(15000);
    // pol = Pol.attach(proxy4.address);
    // await admin.setPOL(pol.address);
    // // await admin.setPOL(pol.address);
    // console.log("setPOL");
    // await sleep(15000);
    // await TriggerProxy.grantRole(await TriggerProxy.POL_ROLE(),pol.address);
    // await sleep(15000);
    // // protocol = await Pol.attach(testnet.pol);
    // await sleep(15000);

    // // // await busd.mint(treasury.address,BN.from(100000).mul(BN.from(10).pow(18)));
    // // // console.log("transfer to treasury");
    // // // await sleep(15000);
    // // // await busd.mint(pol.address,BN.from(10000).mul(BN.from(10).pow(18)));
    // // // await sleep(15000);
    // // // console.log("transfer POL");

    
    // bysl = await Bysl.deploy(admin.address);
    // // bysl = await Bysl.attach(mainnet.bysl)
    // await sleep(15000);
    // console.log(bysl.address,"bysl address");
    // await admin.setbYSL(bysl.address);
    // await sleep(15000);
    // console.log("set bYSL");
    // // await bysl.setLockTransactionTime(180);
    // await bysl.setBackPriceRatio(25);
    // await sleep(15000);
    // bysl = await Bysl.attach(testnet.bysl);
    
    
    // swappage = await Swappage.deploy();
    // // swappage = await Swappage.attach(mainnet.swappage)
    // console.log("swapPage", swappage.address);
    // await sleep(15000);
    // proxy5 = await upgradeability.deploy();
    // console.log("proxy5", proxy5.address);
    // await sleep(15000);
    // await proxy5.upgradeTo(swappage.address);
    // console.log("upgradeTo Done");
    // await sleep(15000);
    // swappage = Swappage.attach(proxy5.address);
    // await admin.setSwapPage(swappage.address);
    // // await admin.setSwapPage(swappage.address);
    // console.log("setSwapPage");
    // await sleep(15000);
    // await swappage.initialize(admin.address);
    // console.log("initialize");
    // await sleep(15000);
    

    // await pol.initialize(admin.address);
    // await sleep(15000);
    // console.log("POL initialize");

    // await sleep(15000);
    // earlyAccess = await EarlyAccess.deploy();
    // // earlyAccess = await EarlyAccess.attach(mainnet.earlyAccess);
    // console.log(earlyAccess.address, "EarlyAccess");
    // await sleep(15000);
    // proxy6 = await upgradeability.deploy();
    // console.log(proxy6.address, "proxy6");
    // await sleep(15000);
    // await proxy6.upgradeTo(earlyAccess.address);
    // console.log("upgradeTo Done");
    // await sleep(15000);
    // earlyAccessProxy = await earlyAccess.attach(proxy6.address);
    // await sleep(15000);
    // await admin.setEarlyAccess(earlyAccessProxy.address);
    // console.log("setEarlyAccess");
    // await sleep(15000);
    // await earlyAccessProxy.initialize(admin.address,"1659441300");
    // console.log("initialize");
    // await sleep(15000)
    // earlyAccess = await EarlyAccess.attach(testnet.earlyAccess);

    
    // usdy = await USDy.deploy(admin.address);
    // console.log(usdy.address, "USdy Address");
    // await sleep(15000)
    // await admin.setUSDy(usdy.address);
    // await sleep(15000)
    // console.log("setUSDy");
    // // usdy = await USDy.attach(testnet.usdy);

    
    // refferal = await Refferal.deploy();
    // // refferal = await Refferal.attach(mainnet.refferal);
    // console.log("refferal",refferal.address);
    // await sleep(15000);
    // proxy1 = await upgradeability.deploy();
    // console.log("proxy1",proxy1.address);
    // await sleep(15000);
    // await proxy1.upgradeTo(refferal.address);
    // console.log("upgradeTo Done");
    // await sleep(15000);
    // refferal = Refferal.attach(proxy1.address);
    // await admin.setRefferal(refferal.address);
    // await admin.setRefferal(refferal.address);
    // console.log("setRefferal");
    // await sleep(3000);
    // await refferal.initialize(busd.address,admin.address);
    // await sleep(3000);
    // console.log("initialize");
    // await sleep(3000);

    // console.log("hasRole", await admin.hasRole(await admin.OPERATOR_ROLE(),owner));
    // // await admin.
    // await sleep(15000);

    // await whitelist.addWhiteList([bysl.address,pol.address,busd.address]); // todo 
    // console.log("addwhitelist");
    // await sleep(15000);
    // await bysl.setMinter(swappage.address);
    // await sleep(15000);
    // await bysl.setMinter(pol.address);
    // await sleep(15000);
    // await bysl.setBurner(pol.address);
    // console.log("setMinter");
    // await sleep(15000);


    // //await tri.grantRole(await tri.POL_ROLE(),protocol);
    // proxy1 = await upgradeability.attach("0x766C3c61b1Fc8b62fdF3C40AaC78B950789F7e16");
    // console.log(proxy1.address,"Refferal Proxy");
    // initializeDATA = Refferal.interface.encodeFunctionData("initialize",[busd.address,admin.address]);
    // await sleep(15000);
    // await proxy1.upgradeTo(refferal.address);
    // await sleep(15000);
    //  refferal = await Refferal.attach(testnet.refferal);
    // console.log(refferal.address,"refferalNFT");


    // proxy5 = await upgradeability.attach("0x1379d5a2E829c2CA87625b7C7CDaBD8540FBecEa");
    // console.log(proxy5.address,"Swappage Proxy");
    // // initializeDATA = Swappage.interface.encodeFunctionData("initialize",[admin.address]);
    // await sleep(15000);
    // swappage = await Swappage.attach(testnet.swappage);
    // console.log(swappage.address, "Swappage address");

    // proxy4 = await upgradeability.attach("0x3a964257B2a0ea540C9b2d1d4ecD7C10e4A2A75c");
    // console.log(proxy4.address,"Pol Proxy")
    // // initializeDATA = Pol.interface.encodeFunctionData("initialize",[admin.address]);
    // await proxy4.upgradeTo(pol.address);
    // await sleep(15000);
    // pol = await Pol.attach(testnet.pol);
    // await pol.initialize(admin.address);
    // console.log(pol.address, "pol address");
    // proxy2 = await upgradeability.attach("0xD7c9F749B071419988544d5C404fA7bB6D899c47");
    // console.log(proxy2.address,"Trigger Proxy")
    // // initializeDATA = Trigger.interface.encodeFunctionData("initialize",[owner,admin.address,3600]);
    // await sleep(15000);
    // console.log(trigger.address,"Trigger");


    // proxy3 = await upgradeability.attach("0x833a8eb7a91D2F5484A10E38a73684DF34db3b7a");//
    // await proxy3.upgradeTo(treasury.address);//
    // console.log(proxy3.address,"Treasury Proxy")
    // // initializeDATA = Treasury.interface.encodeFunctionData("initialize",[owner,admin.address]);
    // await sleep(15000);
    // await sleep(15000);
    // treasury = await Treasury.attach(testnet.treasury);
    // await treasury.initialize(owner, admin.address);
    // console.log(treasury.address, "treasury address");


    // receipt = await Receipt.deploy();
    // receipt = await Receipt.attach(testnet.receipt);
    // console.log(receipt.address, "receipt address");
    // // await receipt.initialize(admin.address, owner, "BUSDTOKEN", "BUSD");
    // await admin.setmasterNTT(receipt.address);
      
    // weth = await Weth.deploy();
    // // weth = await Weth.attach(testnet.weth);
    // console.log(weth.address, "Weth address");
    // await admin.setWBNB(weth.address);

    // facTory = await Factory.deploy(owner);
    // // facTory = await Factory.attach(testnet.factory);
    // console.log(facTory.address, "factory address");

    // router = await Router.deploy(facTory.address, weth.address);
    // // router = await Router.attach(testnet.router);
    // console.log(router.address, "Router address");
    // await admin.setApeswapRouter(router.address);

    // // await admin.setTreasury("0x833a8eb7a91D2F5484A10E38a73684DF34db3b7a");





    // await admin.setTeamAddress(owner);
   
    // // ysl = await Ysl.deploy(admin.address);
    // ysl = await Ysl.attach(testnet.ysl);
    // console.log(ysl.address, "ysl address");
    // await admin.setYSL(ysl.address);

    // // oldxysl = await Oldxysl.deploy();
    // oldxysl = await Oldxysl.attach(testnet.oldxysl);
    // console.log(oldxysl.address,"oldxysl address");
    
    // // xysl = await xYSL.deploy(admin.address, oldxysl.address);
    // xysl = await xYSL.attach(testnet.xysl);
    // console.log(xysl.address, "xysl address");
    // await admin.setxYSL(xysl.address);

    
    // // bshare = await Bshare.deploy(admin.address);
    // bshare = await Bshare.attach(testnet.bshare);
    // console.log(bshare.address,"Bshare address");
    // await admin.setBShare(bshare.address);

    // // liquidityProvider = await liquidityProvider.deploy();
    // liquidityProvider = await liquidityProvider.attach(testnet.liquidityProvider);
    // console.log(liquidityProvider.address,"liquidityProvider Address");
    // // await liquidityProvider.initialize(router.address, admin.address);
    // await admin.setLiquidityProvider(liquidityProvider.address);

    // yslbusdvault = await YSLBUSDvault.deploy();
    // yslbusdvault = await YSLBUSDvault.attach(testnet.yslbusdvault);
    // console.log(yslbusdvault.address, "yslbusdvault");

    // await facTory.createPair(ysl.address,busd.address);
    // let YSL_BUSD = await facTory.getPair(ysl.address,busd.address);
    // console.log(YSL_BUSD,"YSL_BUSD");
    // await yslbusdvault.initialize(admin.address,"0xb7DC6a620bf7Bd20960F54F6200bbD163ec3a23c");
    // await admin.setYSLBUSDVault(yslbusdvault.address);


    // await admin.setOperator(owner);


    

   // // await swappage.initialize(admin.address);
   // // await pol.initialize(admin.address);

    // // yslvault = await YSLVault.deploy();
    // yslvault = await YSLVault.attach(testnet.yslvault);
    // console.log(yslvault.address, "yslvault");
    // await yslvault.initialize(admin.address,owner)





    // optvault= await Optvault.deploy();
    // optvault = await Optvault.attach(testnet.optvault);
    // console.log(optvault.address,"optvault address");
    
    // optvaultlp = await OptvaultLp.deploy();
    // optvaultlp = await OptvaultLp.attach(testnet.optvaultlp);
    // console.log(optvaultlp.address,"optvaultlp address");

    // optvaultauto = await OptvaultAuto.deploy();
    // optvaultauto = await OptvaultAuto.attach(testnet.optvaultauto);
    // console.log(optvaultauto.address,"optvaultauto address");

    // optvaultfactory = await OptvaultFactory.deploy();
    // optvaultfactory = await OptvaultFactory.attach(testnet.optvaultfactory);
    // console.log(optvaultfactory.address,"optvaultfactory address");
    // await optvaultfactory.initialize(owner, admin.address,optvault.address,optvaultlp.address,optvaultauto.address,3600);
    // await admin.setOptVaultFactory(optvaultfactory.address);
    // await busd.mint(treasury.address,expandTo18Decimals(10000000));
    // await busd.mint(pol.address,expandTo18Decimals(100000));

    //  cakeToken = await CakeToken.deploy();
    // cakeToken = await CakeToken.attach(testnet.cakeToken);
    // console.log(cakeToken.address, "CAKETOKEN");

    // opt1155 = await Opt1155.deploy(admin.address);
    // opt1155 = await Opt1155.attach(testnet.opt1155);
    // console.log(opt1155.address, "opt1155");
    // await admin.setOpt1155(opt1155.address);

    // smartChefInitialize = await SmartChefInitialize.deploy();
    // smartChefInitialize = await SmartChefInitialize.attach(testnet.smartChefInitialize);
    // console.log(smartChefInitialize.address,"smartChefInitialize Address");
    

    // smartChefFactory = await SmartChefFactory.deploy();
    // smartChefFactory = await SmartChefFactory.attach(testnet.smartChefFactory);
    // console.log(smartChefFactory.address,"smartchefFactory address");
    // await smartChefFactory.deployPool(cakeToken,cakeToken,expandTo18Decimals(1000),19952733,29952733,1,1,"0xC18dFed60c2Bc06FD38377579Ce7970a39ba3aA0",false,100000,admin.address);

    // initializeDATA3 = Treasury.interface.encodeFunctionData("initialize",[owner,admin.address]);
    // initializeDATA4 = Pol.interface.encodeFunctionData("initialize",[admin.address]);
    // initializeDATA5 = Swappage.interface.encodeFunctionData("initialize",[admin.address]);
    // initializeDATA1 = Refferal.interface.encodeFunctionData("initialize",[busd.address,admin.address]);
    // initializeDATA2 = Trigger.interface.encodeFunctionData("initialize",[owner,admin.address,3600]);
    // await refferal.initialize(busd.address,admin.address);
    // await swappage.initialize(admin.address);
    // await pol.initialize(admin.address);
    // await TriggerProxy.initialize(owner,admin.address,3600);
    // await treasuryProxy.initialize(owner,admin.address);






/**
    all Custom vaults have YSL Vault address
 */
    // await admin.setxYSLVault(yslvault.address);
    // await admin.setYSLVault(yslvault.address);
    // await admin.setUSDyVault(yslvault.address);
    // await admin.setBShareVault(yslvault.address);
    // await admin.setBShareBUSD(yslbusdvault.address);
    // await admin.setUSDyBUSDVault(yslbusdvault.address);
    // await admin.setxYSLBUSDVault(yslbusdvault.address);

}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });