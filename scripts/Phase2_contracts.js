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
    Bshare = await ethers.getContractFactory("BShare");
    Bysl = await ethers.getContractFactory("bYSL");
    USDy = await ethers.getContractFactory("USDy");
    xYSL = await ethers.getContractFactory("xYSL");
    Oldxysl = await ethers.getContractFactory("My20");
    MasterNTT = await ethers.getContractFactory("Receipt");
    Refferal = await ethers.getContractFactory("Referral");
    Treasury = await ethers.getContractFactory("Treasury");
    Pol = await ethers.getContractFactory("ProtocolOwnedLiquidity");
    Swappage = await ethers.getContractFactory("SwapPage"); 
    liquidityProvider = await ethers.getContractFactory("liquidityProvider");
    transfer = await ethers.getContractFactory("transfer");
    // OptvaultFactory = await ethers.getContractFactory("OptVaultFactory");
    // Optvault = await ethers.getContractFactory("OptVault");
    // OptvaultLp = await ethers.getContractFactory("OptVaultLp");
    // OptvaultAuto = await ethers.getContractFactory("OptVaultAuto");
    YSLVault = await ethers.getContractFactory("YSLVault");
    YSLBUSDvault = await ethers.getContractFactory("YSLBUSDVault"),
    xYSLVault = await ethers.getContractFactory("xYSLVault");
    xYSLBUSDvault = await ethers.getContractFactory("xYSLBUSDVault"),
    USDyVault = await ethers.getContractFactory("USDyVault");
    USDyBUSDVault = await ethers.getContractFactory("USDyBUSDVault");                
    BSHAREVault = await ethers.getContractFactory("BshareVault");
    BSHAREBUSDVault = await ethers.getContractFactory("BSHAREBUSDVault");
    BUSDVault = await ethers.getContractFactory('BUSDVault');
    Stake_claimAll = await ethers.getContractFactory("ClaimStakeAll");
    USDyBUSDRebalancer = await ethers.getContractFactory('USDyBUSDRebalancer');

    CakeToken = await ethers.getContractFactory("CakeToken");
    SmartChefFactory = await ethers.getContractFactory("SmartChefFactory");
    Opt1155 = await ethers.getContractFactory("Opt1155");
    EarlyAccess = await ethers.getContractFactory("EarlyAccess");
    upgradeability = await ethers.getContractFactory("OwnedUpgradeabilityProxy");
    Trigger = await ethers.getContractFactory("Trigger");

    admin = await Admin.deploy();
    // admin = await Admin.attach(mainnet.admin);
    console.log(admin.address, "Admin Address");
    await sleep(6000);
    await admin.initialize(owner, owner);
    console.log("initialize");
    await sleep(6000);
    // await admin.setOperator(owner);
    await sleep(6000);
    console.log("hasRole", await admin.hasRole(await admin.DEFAULT_ADMIN_ROLE(),owner));
    await sleep(6000);
    await admin.setTeamAddress(owner);
    console.log("setTeamAddress");
    await sleep(6000);
    await admin.setLastEpoch();
    console.log("last epoch set");
    await sleep(6000);
    await admin.setBuyBackActivationEpoch();
    console.log("setBuyBackActivationEpoch");
    await sleep(6000);
    await admin.setEpochDuration(600);
    console.log("setEpochDuration");
    await sleep(6000);

    //defender relayer address
    await admin.setOperator('0x75242f9958b31399f955af5f198ef26d49023ddb');

    await sleep(6000);
    whitelist = await Whitelist.deploy();
    // whitelist = await Whitelist.attach(mainnet.whitelist);
    console.log(whitelist.address, "WhiteList address");
    await whitelist.initialize(admin.address);
    console.log("hasRole", await admin.hasRole(await admin.DEFAULT_ADMIN_ROLE(),owner));
    await admin.setWhitelist(whitelist.address);


    Blacklist = await Blacklist.deploy();
    // Blacklist = await Blacklist.attach(mainnet.Blacklist);
    console.log(Blacklist.address, "Blacklist address");
    await Blacklist.initialize(admin.address);
    await admin.setBlacklist(Blacklist.address);
    await sleep(6000);


    busd = await Busd.deploy();
    // busd = await Busd.attach(mainnet.busd);
    console.log(busd.address, "BUSD address");
    await busd.initialize(admin.address, owner, "BUSDTOKEN", "BUSD");
    // await admin.setBUSD(mainnet.busd);
    await admin.setBUSD(busd.address);
    await sleep(6000);
    
    treasury = await Treasury.deploy();
    // treasury = await Treasury.attach(mainnet.treasury);
    console.log("treasury", treasury.address);
    await sleep(6000);
    proxy1 = await upgradeability.deploy();
    console.log("proxy1", proxy1.address);
    await sleep(6000);
    await proxy1.upgradeTo(treasury.address);
    console.log("upgradeTo done")
    await sleep(6000);
    treasuryProxy = Treasury.attach(proxy1.address);
    await admin.setTreasury(treasuryProxy.address);
    // await admin.setTreasury(treasury.address);
    console.log("setTreasury");
    await sleep(6000);


    trigger = await Trigger.deploy();
    // trigger = await Trigger.attach(mainnet.trigger);
    console.log("trigger", trigger.address);
    await sleep(6000);
    proxy2 = await upgradeability.deploy();
    console.log("proxy2",proxy2.address);
    await sleep(6000);
    await proxy2.upgradeTo(trigger.address);
    console.log("upgrateTo Done")
    await sleep(6000);
    TriggerProxy = Trigger.attach(proxy2.address);
    await admin.setTrigger(TriggerProxy.address);
    // await admin.setTrigger(trigger.address);
    // console.log("setTrigger");
    // await sleep(6000);
    // tri = await Trigger.attach(testnet.triggerProxy);


    await treasuryProxy.initialize(owner,admin.address);
    await sleep(6000);
    console.log("initialize treasury");
    // await sleep(6000);
    await trigger.initialize(owner,admin.address,3600);
    // await sleep(6000);
    // console.log("Trigger initialize");
    // await sleep(6000);

    // pol = await Pol.deploy();
    // // // pol = await Pol.attach(mainnet.pol);
    // console.log("POL",pol.address);
    // // await sleep(6000);
    // proxy3 = await upgradeability.deploy();
    // console.log("proxy3",proxy3.address);
    // await sleep(6000);
    // await proxy3.upgradeTo(pol.address);
    // console.log("upgradeTo Done");
    // await sleep(6000);
    // polProxy = Pol.attach(proxy3.address);
    // await admin.setPOL(polProxy.address);
    // // await admin.setPOL(pol.address);
    // console.log("setPOL");
    // await sleep(6000);
    // await TriggerProxy.grantRole(await TriggerProxy.POL_ROLE(),pol.address);
    // await sleep(6000);
    // protocol = await Pol.attach(testnet.pol);
    // await sleep(6000);

    // // // await busd.mint(treasury.address,BN.from(100000).mul(BN.from(10).pow(18)));
    // // // console.log("transfer to treasury");
    // // // await sleep(6000);
    // // // await busd.mint(pol.address,BN.from(10000).mul(BN.from(10).pow(18)));
    // // // await sleep(6000);
    // // // console.log("transfer POL");

    
    // bysl = await Bysl.deploy(admin.address);
    // // bysl = await Bysl.attach(mainnet.bysl)
    // await sleep(6000);
    // console.log(bysl.address,"bysl address");
    // await admin.setbYSL(bysl.address);
    // await sleep(6000);
    // console.log("set bYSL");
    // // await bysl.setLockTransactionTime(180);
    // await bysl.setBackPriceRatio(25);
    // await sleep(6000);
    // // bysl = await Bysl.attach(testnet.bysl);
    
    
    // swappage = await Swappage.deploy();
    // // swappage = await Swappage.attach(mainnet.swappage)
    // console.log("swapPage", swappage.address);
    // await sleep(6000);
    // proxy5 = await upgradeability.deploy();
    // console.log("proxy5", proxy5.address);
    // await sleep(6000);
    // await proxy5.upgradeTo(swappage.address);
    // console.log("upgradeTo Done");
    // await sleep(6000);
    // swappage = Swappage.attach(proxy5.address);
    // await admin.setSwapPage(swappage.address);
    // // await admin.setSwapPage(swappage.address);
    // console.log("setSwapPage");
    // await sleep(6000);
    // await swappage.initialize(admin.address);
    // console.log("initialize");
    // await sleep(6000);
    

    // await polProxy.initialize(admin.address);
    // await sleep(6000);
    // console.log("POL initialize");

    // await sleep(6000);
    // earlyAccess = await EarlyAccess.deploy();
    // // earlyAccess = await EarlyAccess.attach(mainnet.earlyAccess);
    // console.log(earlyAccess.address, "EarlyAccess");
    // await sleep(6000);
    // proxy6 = await upgradeability.deploy();
    // console.log(proxy6.address, "proxy6");
    // await sleep(6000);
    // await proxy6.upgradeTo(earlyAccess.address);
    // console.log("upgradeTo Done");
    // await sleep(6000);
    // earlyAccessProxy = await earlyAccess.attach(proxy6.address);
    // await sleep(6000);
    // await admin.setEarlyAccess(earlyAccessProxy.address);
    // console.log("setEarlyAccess");
    // await sleep(6000);
    // await earlyAccessProxy.initialize(admin.address,"1659441300");
    // console.log("initialize");
    // await sleep(6000)
    // // earlyAccess = await EarlyAccess.attach(testnet.earlyAccess);

    
    // usdy = await USDy.deploy(admin.address);
    // console.log(usdy.address, "USdy Address");
    // await sleep(6000)
    // await admin.setUSDy(usdy.address);
    // await sleep(6000)
    // console.log("setUSDy");
    // // usdy = await USDy.attach(testnet.usdy);

    
    refferal = await Refferal.deploy();
    // // refferal = await Refferal.attach(mainnet.refferal);
    console.log("refferal",refferal.address);
    // await sleep(6000);
    proxy4 = await upgradeability.deploy();
    console.log("proxy4",proxy4.address);
    await sleep(6000);
    await proxy4.upgradeTo(refferal.address);
    console.log("upgradeTo Done");
    await sleep(6000);
    refferalProxy = Refferal.attach(proxy4.address);
    await admin.setRefferal(refferalProxy.address);
    // await admin.setRefferal(refferal.address);
    // console.log("setRefferal");
    await sleep(3000);
    await refferalProxy.initialize(busd.address,admin.address);
    // await sleep(3000);
    console.log("initialize");
    // await sleep(3000);

    // console.log("hasRole", await admin.hasRole(await admin.OPERATOR_ROLE(),owner));
    // // await admin.
    // await sleep(6000);

    // await whitelist.addWhiteList([bysl.address,pol.address,busd.address]); // todo 
    // console.log("addwhitelist");
    // await sleep(6000);
    // await bysl.setOperator(swappage.address);
    // await sleep(6000);
    // await bysl.setOperator(pol.address);
    // await sleep(6000);
    // await bysl.setBurner(pol.address);
    // console.log("setOperator");
    // await sleep(6000);

    weth = await Weth.deploy();
    await sleep(6000);
    // weth = await Weth.attach(testnet.weth);
    console.log(weth.address, "Weth address");
    await admin.setWBNB(weth.address);
    await sleep(6000);

    facTory = await Factory.deploy(owner);
    await sleep(6000);
    // facTory = await Factory.attach(testnet.factory);
    console.log(facTory.address, "factory address");

    router = await Router.deploy(facTory.address, weth.address);
    await sleep(6000);
    // router = await Router.attach(testnet.router);
    console.log(router.address, "Router address");
    await admin.setApeswapRouter(router.address);
    await sleep(6000);


    ysl = await Ysl.deploy();
    // ysl = await Ysl.attach(testnet.ysl);
    await sleep(6000);
    console.log(ysl.address, "ysl address");
    proxy5 = await upgradeability.deploy();
    console.log("proxy5",proxy5.address);
    await sleep(6000);
    await proxy5.upgradeTo(ysl.address);
    console.log("upgradeTo Done");
    await sleep(6000);
    yslProxy = Ysl.attach(proxy5.address);
    console.log("Proxy attached");
    await sleep(6000);
    await admin.setYSL(yslProxy.address);
    console.log("set in admin");
    await sleep(6000);
    await yslProxy.initialise(admin.address);
    console.log("Initialised");
    await sleep(6000);

    oldxysl = await Oldxysl.deploy();
    // oldxysl = await Oldxysl.attach(testnet.oldxysl);
    await sleep(6000);
    console.log(oldxysl.address,"oldxysl address");
    
    xysl = await xYSL.deploy();
    // xysl = await xYSL.attach(testnet.xysl);
    await sleep(6000);
    console.log(xysl.address, "xysl address");
    proxy6 = await upgradeability.deploy();
    console.log("proxy6",proxy6.address);
    await sleep(6000);
    await proxy6.upgradeTo(xysl.address);
    console.log("upgradeTo Done");
    await sleep(6000);
    xyslProxy = xYSL.attach(proxy6.address);
    console.log("Proxy attached");
    await sleep(6000);
    await admin.setxYSL(xyslProxy.address);
    console.log("set in admin");
    await sleep(6000);
    await xyslProxy.initialise(admin.address, oldxysl.address);
    console.log("Initialised");
    await sleep(6000);

    usdy = await USDy.deploy();
    // xyslProxy = await xYSL.attach(testnet.xyslProxy);
    await sleep(6000);
    console.log(usdy.address, "usdy address");
    proxy7 = await upgradeability.deploy();
    console.log("proxy7",proxy7.address);
    await sleep(6000);
    await proxy7.upgradeTo(usdy.address);
    console.log("upgradeTo Done");
    await sleep(6000);
    usdyProxy = USDy.attach(proxy7.address);
    console.log("Proxy attached");
    await sleep(6000);
    await admin.setUSDy(usdyProxy.address);
    console.log("set in admin");
    await sleep(6000);
    await usdyProxy.initialise(admin.address);
    console.log("Initialised");
    
    
    await sleep(6000);
    bshare = await Bshare.deploy();
    await sleep(6000);
    console.log(bshare.address,"Bshare address");
    proxy8 = await upgradeability.deploy();
    console.log("proxy8",proxy8.address);
    await sleep(6000);
    await proxy8.upgradeTo(bshare.address);
    console.log("upgradeTo Done");
    await sleep(6000);
    bshareProxy = Bshare.attach(proxy8.address);
    console.log("Proxy attached");
    await sleep(6000);
    await admin.setBShare(bshareProxy.address);
    console.log("set in admin");
    await sleep(6000);
    await bshareProxy.initialise(admin.address);
    console.log("Initialised");
    await sleep(6000);


    liquidityprovider = await liquidityProvider.deploy();
    // liquidityprovider = await liquidityProvider.attach(testnet.liquidityProvider);
    console.log(liquidityprovider.address,"liquidityProvider Address");
    proxy9 = await upgradeability.deploy();
    console.log("proxy9",proxy9.address);
    await sleep(6000);
    await proxy9.upgradeTo(liquidityprovider.address);
    console.log("upgradeTo Done");
    await sleep(6000);
    lpProxy = liquidityProvider.attach(proxy9.address);
    console.log("Proxy attached");
    await sleep(6000);
    await admin.setLiquidityProvider(lpProxy.address);
    console.log("set in admin");
    await sleep(6000);


    Transfer = await transfer.deploy();
    console.log(Transfer.address,"transfer contract");
    proxy10 = await upgradeability.deploy();
    console.log("proxy10",proxy10.address);
    await sleep(6000);
    await proxy10.upgradeTo(Transfer.address);
    console.log("upgradeTo Done");
    transferProxy = transfer.attach(proxy10.address);
    await sleep(6000);
    await transferProxy.initialize(admin.address);
    await sleep(6000);



    ntt = await MasterNTT.deploy();
    console.log(ntt.address,"ntt");
    await sleep(10000);
    await admin.setmasterNTT(ntt.address);
    await sleep(10000);

    // yslvault = await YSLVault.deploy();
    // // yslvault = await YSLVault.attach(testnet.yslvault);
    // await sleep(10000);
    // await admin.setYSLVault(yslvault.address);
    // await sleep(10000);
    // await yslvault.initialize(admin.address,owner);
    // await sleep(10000);

    // xyslvault = await xYSLVault.deploy();
    // // yslvault = await YSLVault.attach(testnet.yslvault);
    // await sleep(10000);
    // console.log(xyslvault.address, "xyslvault");
    // await admin.setxYSLVault(xyslvault.address);
    // await sleep(10000);
    // await xyslvault.initialize(admin.address);
    // await sleep(10000);

    usdyvault = await USDyVault.deploy();
    await sleep(10000);
    console.log(usdyvault.address, "usdyvault");
    proxy11 = await upgradeability.deploy();
    console.log("proxy11",proxy11.address);
    await sleep(6000);
    await proxy11.upgradeTo(usdyvault.address);
    console.log("upgradeTo Done");
    usdyVaultProxy = USDyVault.attach(proxy11.address);
    console.log("Proxy attached");
    await admin.setUSDyVault(usdyVaultProxy.address);
    console.log("set in admin");
    await sleep(10000);
    await usdyVaultProxy.initialize(admin.address);
    console.log("initialzed");
    await sleep(10000);

    // bsharevault = await BSHAREVault.deploy();
    // await sleep(10000);
    // console.log(bsharevault.address, "bsharevault");
    // await admin.setBShareVault(bsharevault.address);
    // await sleep(10000);
    // await bsharevault.initialize(admin.address);
    // await sleep(10000);

    
    yslbusdvault = await YSLBUSDvault.deploy();
    await sleep(6000);
    console.log(yslbusdvault.address, "yslbusdvault");
    proxy12 = await upgradeability.deploy();
    console.log("proxy12",proxy12.address);
    await sleep(6000);
    await proxy12.upgradeTo(yslbusdvault.address);
    console.log("upgradeTo Done");
    await sleep(6000);
    yslbusdVaultProxy = YSLBUSDvault.attach(proxy12.address);
    console.log("Proxy attached");

    await sleep(6000);
    xyslbusdvault = await xYSLBUSDvault.deploy();
    await sleep(6000);
    console.log(xyslbusdvault.address, "xyslbusdvault");
    proxy13 = await upgradeability.deploy();
    console.log("proxy13",proxy13.address);
    await sleep(6000);
    await proxy13.upgradeTo(xyslbusdvault.address);
    console.log("upgradeTo Done");
    await sleep(6000);
    xyslbusdVaultProxy = xYSLBUSDvault.attach(proxy13.address);
    console.log("Proxy attached");


    await sleep(6000);
    usdybusdvault = await USDyBUSDVault.deploy();
    await sleep(6000);
    console.log(usdybusdvault.address, "usdybusdvault");
    await sleep(6000);
    proxy14 = await upgradeability.deploy();
    console.log("proxy14",proxy14.address);
    await sleep(6000);
    await proxy14.upgradeTo(usdybusdvault.address);
    console.log("upgradeTo Done");
    await sleep(6000);
    usdybusdVaultProxy = USDyBUSDVault.attach(proxy14.address);
    console.log("Proxy attached");


    await sleep(6000);
    bsharebusdvault = await BSHAREBUSDVault.deploy();
    // yslbusdvault = await YSLBUSDvault.attach(testnet.yslbusdvault);
    await sleep(6000);
    console.log(bsharebusdvault.address, "bsharebusdvault");
    await sleep(6000);
    proxy15 = await upgradeability.deploy();
    console.log("proxy15",proxy15.address);
    await sleep(6000);
    await proxy15.upgradeTo(bsharebusdvault.address);
    console.log("upgradeTo Done");
    await sleep(6000);
    bsharebusdVaultProxy = BSHAREBUSDVault.attach(proxy15.address);
    console.log("Proxy attached");

    await sleep(6000);
    busdvault = await BUSDVault.deploy();
    await sleep(6000);
    console.log(busdvault.address, "busdvault");
    await sleep(6000);
    proxy15_1 = await upgradeability.deploy();
    console.log("proxy15_1",proxy15_1.address);
    await sleep(6000);
    await proxy15_1.upgradeTo(busdvault.address);
    console.log("upgradeTo Done");
    await sleep(6000);
    busdVaultProxy = BUSDVault.attach(proxy15_1.address);
    console.log("Proxy attached");


    
    await facTory.createPair(yslProxy.address,busd.address);
    await sleep(6000);
    let YSL_BUSD = await facTory.getPair(yslProxy.address,busd.address);
    console.log(YSL_BUSD,"YSL_BUSD");
    await sleep(6000);
    await facTory.createPair(usdyProxy.address,busd.address);
    await sleep(6000);
    let USDy_BUSD = await facTory.getPair(usdyProxy.address,busd.address);
    await sleep(6000);
    await admin.setUSDyBUSD(USDy_BUSD);
    console.log(USDy_BUSD,"USDy_BUSD");

    await facTory.createPair(xyslProxy.address,busd.address);
    await sleep(6000);
    let xYSL_BUSD = await facTory.getPair(xyslProxy.address,busd.address);
    await sleep(6000);
    console.log(xYSL_BUSD,"xYSL_BUSD");

    await facTory.createPair(bshareProxy.address,busd.address);
    await sleep(6000);
    let BSHARE_BUSD = await facTory.getPair(bshareProxy.address,busd.address);
    await sleep(6000);
    console.log(BSHARE_BUSD,"BSHARE_BUSD");


    await yslbusdVaultProxy.initialize(admin.address,YSL_BUSD);
    console.log("intialized");
    await sleep(6000);
    await admin.setYSLBUSDVault(yslbusdVaultProxy.address);
    console.log("set YSLBUSD");
    await sleep(6000);

    
    await xyslbusdVaultProxy.initialize(admin.address,xYSL_BUSD);
    console.log("intialized");
    await sleep(6000);
    await admin.setxYSLBUSDVault(xyslbusdVaultProxy.address);
    console.log("set xYSLBUSD");
    await sleep(6000);

    await usdybusdVaultProxy.initialize(admin.address);
    console.log("intialized");
    await sleep(6000);
    await admin.setUSDyBUSDVault(usdybusdVaultProxy.address);
    console.log("set USDyBUSD");
    await sleep(6000);

    await bsharebusdVaultProxy.initialize(admin.address,BSHARE_BUSD);
    console.log("intialized");
    await sleep(6000);
    await admin.setBShareBUSD(bsharebusdVaultProxy.address);
    console.log("set BSHAREBUSD");
    await sleep(6000);

    await busdVaultProxy.initialize(admin.address);
    console.log("intialized");
    await sleep(6000);
    await admin.setBUSDVault(busdVaultProxy.address);
    console.log("set BUSD vault");
    await sleep(6000);


    stake_claimAll = await Stake_claimAll.deploy();
    await sleep(6000);
    console.log(stake_claimAll.address, "stake_claimAll");
    proxy16 = await upgradeability.deploy();
    console.log("proxy16",proxy16.address);
    await sleep(6000);
    await proxy16.upgradeTo(stake_claimAll.address);
    console.log("upgradeTo Done");
    stake_caimAllProxy = Stake_claimAll.attach(proxy16.address);
    console.log("Proxy attached");
    await sleep(6000);
    await admin.setClaimStakeAll(stake_caimAllProxy.address);
    console.log("set in admin");
    await sleep(6000);
    await stake_caimAllProxy.initialize(admin.address);
    console.log("stake_caimAllProxy initialised");
    await sleep(6000);

    usdybusdRebalancer = await USDyBUSDRebalancer.deploy();
    console.log(usdybusdRebalancer.address,'usdybusdRebalancer');
    await sleep(6000);
    proxy16_1 = await upgradeability.deploy();
    console.log(proxy16_1.address,"proxy16-1");
    await sleep(6000);
    await proxy16_1.upgradeTo(usdybusdRebalancer.address);
    console.log("upgrade to done");
    await sleep(6000);
    usdybusdRebalancerProxy = await USDyBUSDRebalancer.attach(proxy16_1.address);
    console.log("Proxy attached");
    await sleep(6000);
    await admin.setUSDyBUSDRebalancer(usdybusdRebalancerProxy.address);
    console.log("set in admin");

    await sleep(6000);
    await usdybusdRebalancerProxy.initialize(admin.address,router.address,lpProxy.address);
    console.log("rebalancer usdybusd initialized");
    await sleep(6000);
    await usdyProxy.setOperator(usdybusdRebalancerProxy.address);
    console.log("set operator");
    await sleep(6000);
    await usdyProxy.setOperator(lpProxy.address);
    console.log("set operator");


    await stake_caimAllProxy.addSingleVault([usdyVaultProxy.address],[usdyProxy.address]);
    console.log("added single vault");
    await sleep(6000);

    await stake_caimAllProxy.addVault([yslbusdVaultProxy.address]);
    console.log("added lp vault");
    await sleep(6000);

    await stake_caimAllProxy.addVault([xyslbusdVaultProxy.address]);
    console.log("added lp vault");
    await sleep(6000);

    await stake_caimAllProxy.addVault([usdybusdVaultProxy.address]);
    console.log("added lp vault");
    await sleep(6000);

    await stake_caimAllProxy.addVault([bsharebusdVaultProxy.address]);
    console.log("added lp vault");
    await sleep(6000);

    await stake_caimAllProxy.addVault([busdVaultProxy.address]);
    console.log("added lp vault");
    await sleep(6000);


    await whitelist.addWhiteList([yslProxy.address,xyslProxy.address,usdyProxy.address,YSL_BUSD,xYSL_BUSD,USDy_BUSD,BSHARE_BUSD,lpProxy.address,transferProxy.address,usdybusdRebalancerProxy.address,busdVaultProxy.address]); // todo 
    console.log("whitelist done");
    await sleep(6000);

    await whitelist.addWhiteList([yslbusdVaultProxy.address,xyslbusdVaultProxy.address,usdybusdVaultProxy.address,bsharebusdVaultProxy.address,usdyVaultProxy.address,stake_caimAllProxy.address]); // todo 
    console.log("whitelist done");
    await sleep(6000);
     
    await whitelist.addWhiteListForSwap([yslProxy.address,xyslProxy.address,usdyProxy.address,YSL_BUSD,xYSL_BUSD,USDy_BUSD,BSHARE_BUSD,lpProxy.address]); // todo 
    console.log("whitelist for swap done");
    await sleep(6000);

    await whitelist.addWhiteListForSwap([yslbusdVaultProxy.address,xyslbusdVaultProxy.address,usdybusdVaultProxy.address,bsharebusdVaultProxy.address,usdyVaultProxy.address,router.address,stake_caimAllProxy.address,usdybusdRebalancerProxy.address,busdVaultProxy.address]);
    console.log("whitelist for swap done");
    await sleep(6000);

    await lpProxy.initialize(router.address, admin.address);
    console.log("liquidity provider initialised");
    await sleep(6000);

    await admin.setBuyBackActivationRole(usdyVaultProxy.address);
    console.log("setBuyBackActivationRole");
    await sleep(6000);

    await admin.setBuyBackActivationRole(yslbusdVaultProxy.address);
    console.log("setBuyBackActivationRole");
    await sleep(6000);

    await admin.setBuyBackActivationRole(xyslbusdVaultProxy.address);
    console.log("setBuyBackActivationRole");
    await sleep(6000);

    await admin.setBuyBackActivationRole(usdybusdVaultProxy.address);
    console.log("setBuyBackActivationRole");
    await sleep(6000);

    await admin.setBuyBackActivationRole(bsharebusdVaultProxy.address);
    console.log("setBuyBackActivationRole");
    await sleep(6000);
    

    await usdyProxy.setOperator(usdyVaultProxy.address);
    console.log("usdyProxy set minter");
    await sleep(6000);

    await usdyProxy.setOperator(yslbusdVaultProxy.address);
    console.log("usdyProxy set minter");
    await sleep(6000);

    await usdyProxy.setOperator(xyslbusdVaultProxy.address);
    console.log("usdyProxy set minter");
    await sleep(6000);

    await usdyProxy.setOperator(usdybusdVaultProxy.address);
    console.log("usdyProxy set minter");
    await sleep(6000);

    await usdyProxy.setOperator(bsharebusdVaultProxy.address);
    console.log("usdyProxy set minter");
    await sleep(6000);

    await usdyProxy.setOperator(busdVaultProxy.address);
    console.log("usdyProxy set minter");
    await sleep(6000);
    await admin.setOperator(busdVaultProxy.address);
    console.log("set operator busdVault in admin");
    await sleep(6000);
    await treasuryProxy.setRebalancerRole(busdVaultProxy.address);
    console.log("set rebalancer Role to busdVault from treasury");
    await sleep(6000);

    await treasuryProxy.setRebalancerRole(usdybusdRebalancerProxy.address);
    console.log("set rebalancer Role to usdybusdRebalancerProxy from treasury");
    await sleep(6000);

    await yslProxy.setOperator(yslbusdVaultProxy.address);
    console.log("yslProxy set minter");
    await sleep(6000);
    
    await xyslProxy.setOperator(xyslbusdVaultProxy.address);
    console.log("xyslProxy set minter");
    await sleep(6000);

    await bshareProxy.setOperator(bsharebusdVaultProxy.address);
    console.log("bshareProxy set minter");
    await sleep(6000);

    await yslProxy.mint(owner,expandTo18Decimals(1000000000));
    console.log("yslProxy minted");
    await sleep(6000);
    await xyslProxy.mint(owner,expandTo18Decimals(1000000000));
    console.log("xyslProxy minted");
    await sleep(6000);
    await usdyProxy.mint(owner,expandTo18Decimals(1000000000));
    console.log("usdyProxy minted");
    await sleep(6000);
    await bshareProxy.mint(owner,expandTo18Decimals(1000000000));
    console.log("bshareProxy minted");
    await sleep(6000);
    await busd.mint(owner, expandTo18Decimals(100000000000));
    console.log("busd minted");
    await sleep(6000);
    await yslProxy.approve(lpProxy.address,expandTo18Decimals(1000000000));
    console.log("yslProxy approved to lp")
    await sleep(6000);
    await xyslProxy.approve(lpProxy.address,expandTo18Decimals(1000000000));
    console.log("xyslProxy approved to lp")
    await sleep(6000);
    await usdyProxy.approve(lpProxy.address,expandTo18Decimals(1000000000));
    console.log("usdyProxy approved to lp")
    await sleep(6000);
    await bshareProxy.approve(lpProxy.address,expandTo18Decimals(1000000000));
    console.log("bshareProxy approved to lp")
    await sleep(6000);
    await busd.approve(lpProxy.address,expandTo18Decimals(100000000000));
    console.log("busd approved to lp")
    await sleep(6000);
    await lpProxy.addLiquidity(yslProxy.address,busd.address,expandTo18Decimals(100000),expandTo18Decimals(100000),expandTo18Decimals(1),expandTo18Decimals(1),treasury.address);
    console.log("add liq for yslProxy and busd");
    await sleep(6000);
    await lpProxy.addLiquidity(xyslProxy.address,busd.address,expandTo18Decimals(100000),expandTo18Decimals(100000),expandTo18Decimals(1),expandTo18Decimals(1),treasury.address);
    console.log("add liq for xyslProxy and busd");
    await sleep(6000);
    await lpProxy.addLiquidity(usdyProxy.address,busd.address,expandTo18Decimals(100000),expandTo18Decimals(100000),expandTo18Decimals(1),expandTo18Decimals(1),treasury.address);
    console.log("add liq for usdyProxy and busd");
    await sleep(6000);
    await lpProxy.addLiquidity(bshareProxy.address,busd.address,expandTo18Decimals(100000),expandTo18Decimals(100000),expandTo18Decimals(1),expandTo18Decimals(1),treasury.address);
    console.log("add liq for bshareProxy and busd");
    await sleep(6000);

    await refferalProxy.grantRole(await refferalProxy.REWARD_ROLE(),yslbusdVaultProxy.address);
    console.log("reward role done");
    await sleep(6000);

    await refferalProxy.grantRole(await refferalProxy.REWARD_ROLE(),xyslbusdVaultProxy.address);
    console.log("reward role done");
    await sleep(6000);

    await refferalProxy.grantRole(await refferalProxy.REWARD_ROLE(),usdybusdVaultProxy.address);
    console.log("reward role done");
    await sleep(6000);

    await refferalProxy.grantRole(await refferalProxy.REWARD_ROLE(),bsharebusdVaultProxy.address);
    console.log("reward role done");
    await sleep(6000);


    console.log("{");
    console.log("name: YSL-BUSD");
    console.log("address:",yslbusdVaultProxy.address);
    console.log("token:",yslProxy.address);
    console.log("receipt:",await yslbusdVaultProxy.receiptToken());
    console.log("}");

    console.log("{");
    console.log("name: xYSL-BUSD");
    console.log("address:",xyslbusdVaultProxy.address);
    console.log("token:",xyslProxy.address);
    console.log("receipt:",await xyslbusdVaultProxy.receiptToken());
    console.log("}");

    console.log("{");
    console.log("name: BSHARE-BUSD");
    console.log("address:",bsharebusdVaultProxy.address);
    console.log("token:",bshareProxy.address);
    console.log("receipt:",await bsharebusdVaultProxy.receiptToken());
    console.log("}");

    console.log("{");
    console.log("name: USDY-BUSD");
    console.log("address:",usdybusdVaultProxy.address);
    console.log("token:",usdyProxy.address);
    console.log("receipt:",await usdybusdVaultProxy.receiptToken());
    console.log("}");

    console.log("{");
    console.log("name: USDY");
    console.log("address:",usdyVaultProxy.address);
    console.log("token:",usdyProxy.address);
    console.log("receipt:",await usdyVaultProxy.receiptToken());
    console.log("}");

    console.log("{");
    console.log("name: BUSD");
    console.log("address:",busdVaultProxy.address);
    console.log("token:",busd.address);
    console.log("receipt:",await busdVaultProxy.receiptToken());
    console.log("}");


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







}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });