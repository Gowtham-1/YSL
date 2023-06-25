const BN = require("ethers").BigNumber;
const { ethers } = require("hardhat");
const ether = require("@openzeppelin/test-helpers/src/ether");
// const { factory } = require("typescript");

function expandTo18Decimals(n) {
    return BN.from(n).mul(BN.from(10).pow(18));
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {

    const owner = "0xF3CF8B7B952377557d8DB8f111a277AD67a3Dbff";

    const mainnet = {
        admin: "0xb2AC76EaeD0317B1da51361F131F85b5a328c5aB",
        whitelist: "0x76f5cD747a0eAfB399792579A56D319c50604D88",
        blacklist: "0x14433Ef8A7D972dC14483Ded7F9FaCc92bFfc044",
        BUSD: "0x5eE3FEbC0cda96021265C13F13d4c014304430aC",
        Treasury: "0x0B1F15393EED419fc6286db9F1B3C7C3436C8f51",
        treasuryProxy: "0xD1a1Ee434582a010b0588131b2b33c77ffC07a4B",
        trigger: "0x0a06669F39Fd761495eaF48093bd629d69b32D42",
        triggerProxy: "0xF808adc92A5eef3866c83B9Cc523468a83B07046",
        pol: "0xbC8C68FdcB66771F79D2eF6df6e30027F92cA636",
        polProxy: "0x73847d0E426B4B1ef2f7989Bc90932EF197C2262",
        swappage: "0xAE1743E3bB29174afa433e4774f5f6EBA6d04b20",
        swappage_proxy: "0x9c88F321dC98ce6cf62Ca9EED09CA512e39aeAa5",
        earlyAccess: "0x3300a6Dd621879eEb8e23D40d2DE10cadE5de005",
        earlyAccessProxy: "0x5439BBF64B7803975229D0faC0e780e44802b544",
        referral: "0x248D77f794d46C349D28Bad9A1c06d6dcDE92dd5",
        referralProxy: "0x1c660A1eF9f3978F31c488340358f7505BCc77a9",
        bYSL: "0xb5D1fDcE50029dB8e6649D35cdDea433a80A2372",
        teamAddress: "0xfcAa08075c0f874fAC2A595A70D7BB7200cB2C02",
        operator: "0x75242f9958b31399f955af5f198ef26d49023ddb",
        oldxYSL: "0x9cB9f724da41050beDEE7A6D6918701F73fE8cA5",
        router: '0x4556995aF89A1A0fd0F040FADeEE89b22EF0111b',
        factory: "0x8244b55B2dC28a25e08E66ff0dCc48CEC3da97A7",

    }
    upgradeability = await ethers.getContractFactory("OwnedUpgradeabilityProxy")
    Admin = await ethers.getContractFactory("Admin");

    //===== Admin deploy =====
    console.log("=== Admin deploy ===")
    admin = await Admin.deploy();
    console.log("admin", admin.address);
    await sleep(6000);
    proxy = await upgradeability.deploy();
    console.log("adminProxy", proxy.address);
    await sleep(6000);
    await proxy.upgradeTo(admin.address);
    console.log("upgrade admin")
    await sleep(6000);
    adminProxy = await Admin.attach(proxy.address);
    await adminProxy.initialize(owner, mainnet.operator);
    console.log("initialized")
    await sleep(6000);
    console.log(" ");

    //=====Admin Attach=====
    // adminProxy = await Admin.attach(mainnet.admin);
    // console.log("AdminProxyAttach",adminProxy.address);
    // console.log(" ");

    //===== Admin setter =====
    console.log("=== Admin setter ===");
    await adminProxy.setTeamAddress(mainnet.teamAddress);
    console.log("set teamAddress");
    await sleep(6000);
    await adminProxy.setWhitelist(mainnet.whitelist);
    console.log("set setWhitelist");
    await sleep(6000);
    await adminProxy.setBlacklist(mainnet.blacklist);
    console.log("set setBlacklist");
    await sleep(6000);
    // await adminProxy.setbYSL(mainnet.bYSL);
    // console.log("set setbYSL");
    // await sleep(6000);
    BUSD = await ethers.getContractFactory("TestBUSD");
    busd = await BUSD.deploy(expandTo18Decimals(10000));
    console.log("BUSD", busd.address);
    await sleep(6000);
    await adminProxy.setBUSD(busd.address);
    console.log("set setBUSD");
    await sleep(6000);
    // await adminProxy.setTreasury(mainnet.treasuryProxy);
    // console.log("set setTreasury");
    // await sleep(6000);
    // await adminProxy.setTrigger(mainnet.triggerProxy);
    // console.log("set setTrigger");
    // await sleep(6000);
    // await adminProxy.setPOL(mainnet.polProxy);
    // console.log("set setPOL");
    // await sleep(6000);
    // await adminProxy.setSwapPage(mainnet.swappage_proxy);
    // console.log("set setSwapPage");
    // await sleep(6000);
    // await adminProxy.setEarlyAccess(mainnet.earlyAccessProxy);
    // console.log("set setEarlyAccess");
    // await sleep(6000);
    // await adminProxy.setRefferal(mainnet.referralProxy);
    // console.log("set setRefferal");
    // await sleep(6000);
    await adminProxy.setLastEpoch();
    console.log("set setLastEpoch");
    await sleep(6000);
    await adminProxy.setBuyBackActivationEpoch();
    console.log("set setBuyBackActivationEpoch");
    await sleep(6000);
    await adminProxy.setEpochDuration(600);
    console.log("set setEpochDuration");
    await sleep(6000);
    await adminProxy.setApeswapRouter(mainnet.router);
    console.log("set setApeswapRouter");
    await sleep(6000);
    console.log(" ");

    TemporaryHolding = await ethers.getContractFactory("TemporaryHolding");
    //===== TemporaryHolding deploy=====
    console.log("=== TemporaryHolding deploy ===")
    temporaryHolding = await TemporaryHolding.deploy();
    console.log("temporaryHolding", temporaryHolding.address);
    await sleep(6000);
    proxy = await upgradeability.deploy();
    console.log("temporaryHoldingProxy", proxy.address);
    await sleep(6000);
    await proxy.upgradeTo(temporaryHolding.address);
    console.log("upgrade temporaryHolding")
    await sleep(6000);
    temporaryHoldingProxy = await TemporaryHolding.attach(proxy.address);
    await temporaryHoldingProxy.initialize(owner, adminProxy.address);
    console.log("initialised")
    await sleep(6000);
    await adminProxy.setTemporaryHolding(temporaryHoldingProxy.address);
    console.log("setTemporaryHolding")
    await sleep(6000);
    console.log(" ");

    Treasury = await ethers.getContractFactory("Treasury");
    //===== Treasury deploy=====
    console.log("=== Treasury deploy ===")
    treasury = await Treasury.deploy();
    console.log("treasury", treasury.address);
    await sleep(6000);
    proxy = await upgradeability.deploy();
    console.log("treasuryProxy", proxy.address);
    await sleep(6000);
    await proxy.upgradeTo(treasury.address);
    console.log("upgrade treasury")
    await sleep(6000);
    treasuryProxy = await Treasury.attach(proxy.address);
    await treasuryProxy.initialize(owner, adminProxy.address);
    console.log("initialised")
    await sleep(6000);
    await adminProxy.setTreasury(treasuryProxy.address);
    console.log("setTreasury")
    await sleep(6000);
    console.log(" ");

    //=====UpgradeTreasury=====
    // console.log("=====UpgradeTreasury=====")
    // treasury = await Treasury.deploy();
    // console.log("Treasury", treasury.address);
    // await sleep(6000);
    // proxy = await upgradeability.attach(mainnet.treasuryProxy);
    // await proxy.upgradeTo(treasury.address);
    // console.log("Upgrade Treasury");
    // await sleep(6000);
    // treasuryProxy = await Treasury.attach(mainnet.treasuryProxy);
    // await treasuryProxy.setAdmin(adminProxy.address);
    // console.log("treasury updatae Admin");
    // await sleep(6000);
    // console.log(" ");

    Trigger = await ethers.getContractFactory("Trigger");
    //===== Trigger deploy=====
    console.log("=== Trigger deploy ===")
    trigger = await Trigger.deploy();
    console.log("trigger", trigger.address);
    await sleep(6000);
    proxy = await upgradeability.deploy();
    console.log("triggerProxy", proxy.address);
    await sleep(6000);
    await proxy.upgradeTo(trigger.address);
    console.log("upgrade trigger")
    await sleep(6000);
    triggerProxy = await Trigger.attach(proxy.address);
    await triggerProxy.initialize(owner,adminProxy.address,1);
    console.log("initialised")
    await sleep(6000);
    await adminProxy.setTrigger(triggerProxy.address);
    console.log("setTrigger")
    await sleep(6000);
    console.log(" ");



    await sleep(6000);
    await treasuryProxy.setwithdrawRole(triggerProxy.address);
    console.log("withdraw role set");

    //=====UpgradeTrigger=====
    // console.log("=====UpgradeTrigger=====")
    // trigger = await Trigger.deploy();
    // console.log("Trigger", trigger.address);
    // await sleep(6000);
    // proxy = await upgradeability.attach(mainnet.triggerProxy);
    // await proxy.upgradeTo(trigger.address);
    // console.log("Upgrade Trigger");
    // await sleep(6000);
    // triggerProxy = await Trigger.attach(mainnet.triggerProxy);
    // await triggerProxy.setAdmin(adminProxy.address);
    // console.log("trigger updatae Admin");
    // await sleep(6000);
    // console.log(" ");

    EarlyAccess = await ethers.getContractFactory("EarlyAccess");
    //==== earlyAccess deploy====
    console.log("==== earlyAccess deploy====")
    earlyAccess = await EarlyAccess.deploy();
    console.log(earlyAccess.address,"earlyAccess");
    await sleep(6000);
    await adminProxy.setEarlyAccess(earlyAccess.address);
    console.log("set in admin");
    await sleep(6000);
    await earlyAccess.initialize(admin.address,1666158304);
    console.log("initialized");
    await sleep(6000);
    await earlyAccess.setDuration(10);
    console.log("duration set");


    SwapPage = await ethers.getContractFactory("SwapPage");
    // ===== SwapPage deploy=====
    console.log("=== SwapPage deploy ===")
    swappage = await SwapPage.deploy();
    console.log("swappage", swappage.address);
    await sleep(6000);
    proxy = await upgradeability.deploy();
    console.log("swappageProxy", proxy.address);
    await sleep(6000);
    await proxy.upgradeTo(swappage.address);
    console.log("upgrade swappage")
    await sleep(6000);
    swappageProxy = await SwapPage.attach(proxy.address);
    await swappageProxy.initialize(adminProxy.address);
    console.log("initialised")
    await sleep(6000);
    await adminProxy.setSwapPage(swappageProxy.address);
    console.log("setSwapPage")
    await sleep(6000);
    console.log(" ");

    //=====UpgradeSwappage=====
    // console.log("=====UpgradeSwappage=====")
    // swappage = await SwapPage.deploy();
    // console.log("SwapPage", swappage.address);
    // await sleep(6000);
    // proxy = await upgradeability.attach(mainnet.swappage_proxy);
    // await proxy.upgradeTo(swappage.address);
    // console.log("Upgrade SwapPage");
    // await sleep(6000);
    // swappage_proxy = await SwapPage.attach(mainnet.swappage_proxy);
    // await swappage_proxy.setAdmin(adminProxy.address);
    // console.log("swappage updatae Admin");
    // await sleep(6000);
    // console.log(" ");


    POL = await ethers.getContractFactory("ProtocolOwnedLiquidity");
    // ===== POL deploy=====
    console.log("=== POL deploy ===")
    pol = await POL.deploy();
    console.log("pol", pol.address);
    await sleep(6000);
    proxy = await upgradeability.deploy();
    console.log("polProxy", proxy.address);
    await sleep(6000);
    await proxy.upgradeTo(pol.address);
    console.log("upgrade pol")
    await sleep(6000);
    polProxy = await POL.attach(proxy.address);
    await polProxy.initialize(adminProxy.address);
    console.log("initialised")
    await sleep(6000);
    await adminProxy.setPOL(polProxy.address);
    console.log("setPOL")
    await sleep(6000);
    console.log(" ");


    await sleep(6000);
    await triggerProxy.grantRole(await triggerProxy.POL_ROLE() , polProxy.address);
    
    //=====UpgradePOL=====
    // console.log("=====UpgradePOL=====")
    // pol = await POL.deploy();
    // console.log("POL", pol.address);
    // await sleep(6000);
    // proxy = await upgradeability.attach(mainnet.polProxy);
    // await proxy.upgradeTo(pol.address);
    // console.log("Upgrade POL");
    // await sleep(6000);
    // polProxy = await POL.attach(mainnet.polProxy);
    // await polProxy.setAdmin(adminProxy.address);
    // console.log("pol updatae Admin");
    // await sleep(6000);
    // console.log(" ");


    

    Referral = await ethers.getContractFactory("Referral");
    //===== Referral deploy=====
    console.log("=== Referral deploy ===")
    referral = await Referral.deploy();
    console.log("referral", referral.address);
    await sleep(6000);
    proxy = await upgradeability.deploy();
    console.log("referralProxy", proxy.address);
    await sleep(6000);
    await proxy.upgradeTo(referral.address);
    console.log("upgrade referral")
    await sleep(6000);
    referralProxy = await Referral.attach(proxy.address);
    await referralProxy.initialize(busd.address, adminProxy.address);
    console.log("initialised")
    await sleep(6000);
    await adminProxy.setRefferal(referralProxy.address);
    console.log("setRefferal")
    await sleep(6000);
    console.log(" ");

    //=====UpgradeReferral=====
    // console.log("=====UpgradeReferral=====")
    // referral = await Referral.deploy();
    // console.log("Referral", referral.address);
    // await sleep(6000);
    // proxy = await upgradeability.attach(mainnet.referralProxy);
    // await proxy.upgradeTo(referral.address);
    // console.log("Upgrade Referral");
    // await sleep(6000);
    // referralProxy = await Referral.attach(mainnet.referralProxy);
    // await referralProxy.setAdmin(adminProxy.address);
    // console.log("referral updatae Admin");
    // await sleep(6000);
    // console.log(" ");

    //=====Phase1 contracts=====
    // referralProxy = await Referral.attach(mainnet.referralProxy);
    // swappage_proxy = await SwapPage.attach(mainnet.swappage_proxy);
    // polProxy = await POL.attach(mainnet.polProxy);
    // triggerProxy = await Trigger.attach(mainnet.triggerProxy);
    // treasuryProxy = await Treasury.attach(mainnet.treasuryProxy);

    BYSL = await ethers.getContractFactory("bYSL");
    //==== bYSL deploy=====
    bysl = await BYSL.deploy(adminProxy.address);
    console.log("bYSL", bysl.address);

    YSL = await ethers.getContractFactory("YSL");
    //===== YSL deploy=====
    console.log("=== YSL deploy ===")
    ysl = await YSL.deploy();
    console.log("ysl", ysl.address);
    await sleep(6000);
    proxy = await upgradeability.deploy();
    console.log("YSLProxy", proxy.address);
    await sleep(6000);
    await proxy.upgradeTo(ysl.address);
    console.log("upgrade ysl")
    await sleep(6000);
    YSLProxy = await YSL.attach(proxy.address);
    await YSLProxy.initialise(adminProxy.address);
    console.log("initialised")
    await sleep(6000);
    await adminProxy.setYSL(YSLProxy.address);
    console.log("setYSL")
    await sleep(6000);
    console.log(" ");



    await sleep(6000);
    await swappageProxy.setBYSL(bysl.address);

    //=====YSL Attach=====
    // YSLProxy = await YSL.attach(mainnet.ysl);
    // console.log("AdminProxyAttach",YSLProxy.address);
    // console.log(" ");

    xYSL = await ethers.getContractFactory("xYSL");
    //===== xYSL deploy=====
    console.log("=== xYSL deploy ===")
    xysl = await xYSL.deploy();
    console.log("xysl", xysl.address);
    await sleep(6000);
    proxy = await upgradeability.deploy();
    console.log("xYSLProxy", proxy.address);
    await sleep(6000);
    await proxy.upgradeTo(xysl.address);
    console.log("upgrade xysl")
    await sleep(6000);
    xYSLProxy = await xYSL.attach(proxy.address);
    await xYSLProxy.initialise(adminProxy.address, mainnet.oldxYSL);
    console.log("initialised")
    await sleep(6000);
    await adminProxy.setxYSL(xYSLProxy.address);
    console.log("setxYSL")
    await sleep(6000);
    console.log(" ");

    //=====xYSL Attach=====
    // xYSLProxy = await xYSL.attach(mainnet.xysl);
    // console.log("AdminProxyAttach",xYSLProxy.address);
    // console.log(" ");

    USDy = await ethers.getContractFactory("USDy");
    //===== USDy deploy=====
    console.log("=== USDy deploy ===")
    usdy = await USDy.deploy();
    console.log("usdy", usdy.address);
    await sleep(6000);
    proxy = await upgradeability.deploy();
    console.log("usdyProxy", proxy.address);
    await sleep(6000);
    await proxy.upgradeTo(usdy.address);
    console.log("upgrade usdy")
    await sleep(6000);
    usdyProxy = await USDy.attach(proxy.address);
    await usdyProxy.initialise(adminProxy.address);
    console.log("initialised")
    await sleep(6000);
    await adminProxy.setUSDy(usdyProxy.address);
    console.log("setUSDy")
    await sleep(6000);
    console.log(" ");

    //=====USDy Attach=====
    // usdyProxy = await USDy.attach(mainnet.usdy);
    // console.log("AdminProxyAttach",usdyProxy.address);
    // console.log(" ");

    BShare = await ethers.getContractFactory("BShare");
    //===== BShare deploy=====
    console.log("=== BShare deploy ===")
    bshare = await BShare.deploy();
    console.log("bshare", bshare.address);
    await sleep(6000);
    proxy = await upgradeability.deploy();
    console.log("BShareProxy", proxy.address);
    await sleep(6000);
    await proxy.upgradeTo(bshare.address);
    console.log("upgrade bshare")
    await sleep(6000);
    BShareProxy = await BShare.attach(proxy.address);
    await BShareProxy.initialise(adminProxy.address);
    console.log("initialised")
    await sleep(6000);
    await adminProxy.setBShare(BShareProxy.address);
    console.log("setBShare")
    await sleep(6000);
    console.log(" ");


    DAI = await ethers.getContractFactory("Receipt");
    //===== DAI deploy=====
    console.log("=== DAI deploy ===")
    dai = await DAI.deploy();
    console.log("dai", dai.address);
    await sleep(6000);
    proxy = await upgradeability.deploy();
    console.log("daiProxy", proxy.address);
    await sleep(6000);
    await proxy.upgradeTo(dai.address);
    console.log("upgrade dai")
    await sleep(6000);
    daiProxy = await DAI.attach(proxy.address);
    await daiProxy.initialize(adminProxy.address , owner,"DAI","DAI");
    console.log("initialised")
    await sleep(6000);
    await adminProxy.setDAI(daiProxy.address);
    console.log("setDAI")
    await sleep(6000);
    console.log(" ");


    USDC = await ethers.getContractFactory("Receipt");
    //===== USDC deploy=====
    console.log("=== USDC deploy ===")
    usdc = await USDC.deploy();
    console.log("usdc", usdc.address);
    await sleep(6000);
    proxy = await upgradeability.deploy();
    console.log("usdcProxy", proxy.address);
    await sleep(6000);
    await proxy.upgradeTo(usdc.address);
    console.log("upgrade usdc")
    await sleep(6000);
    usdcProxy = await USDC.attach(proxy.address);
    await usdcProxy.initialize(adminProxy.address , owner,"USDC","USDC");
    console.log("initialised")
    await sleep(6000);
    await adminProxy.setUSDC(usdcProxy.address);
    console.log("setUSDC")
    await sleep(6000);
    console.log(" ");


    USDT = await ethers.getContractFactory("Receipt");
    //===== USDT deploy=====
    console.log("=== USDT deploy ===")
    usdt = await USDT.deploy();
    console.log("usdt", usdt.address);
    await sleep(6000);
    proxy = await upgradeability.deploy();
    console.log("usdtProxy", proxy.address);
    await sleep(6000);
    await proxy.upgradeTo(usdt.address);
    console.log("upgrade usdt")
    await sleep(6000);
    usdtProxy = await USDT.attach(proxy.address);
    await usdtProxy.initialize(adminProxy.address , owner,"USDT","USDT");
    console.log("initialised")
    await sleep(6000);
    await adminProxy.setUSDT(usdtProxy.address);
    console.log("setUSDT")
    await sleep(6000);
    console.log(" ");

    //=====BShare Attach=====
    // BShareProxy = await BShare.attach(mainnet.bshare);
    // console.log("AdminProxyAttach",BShareProxy.address);
    // console.log(" ");

    LiquidityProvider = await ethers.getContractFactory("liquidityProvider");
    //===== LiquidityProvider deploy=====
    console.log("=== LiquidityProvider deploy ===")
    liquidityProvider = await LiquidityProvider.deploy();
    console.log("liquidityProvider", liquidityProvider.address);
    await sleep(6000);
    proxy = await upgradeability.deploy();
    console.log("liquidityProviderProxy", proxy.address);
    await sleep(6000);
    await proxy.upgradeTo(liquidityProvider.address);
    console.log("upgrade liquidityProvider")
    await sleep(6000);
    liquidityProviderProxy = await LiquidityProvider.attach(proxy.address);
    await liquidityProviderProxy.initialize(mainnet.router,adminProxy.address);
    console.log("initialised")
    await sleep(6000);
    await adminProxy.setLiquidityProvider(liquidityProviderProxy.address);
    console.log("setLiquidityProvider")
    await sleep(6000);
    await usdyProxy.setOperator(liquidityProviderProxy.address);
    console.log("set operator USDy");
    await sleep(6000);
    console.log(" ");

    //=====LiquidityProvider Attach=====
    // liquidityProviderProxy = await LiquidityProvider.attach(mainnet.liquidityProvider);
    // console.log("AdminProxyAttach",liquidityProviderProxy.address);
    // console.log(" ");

    Transfer = await ethers.getContractFactory("transfer");
    //===== Transfer deploy=====
    console.log("=== Transfer deploy ===")
    transfer = await Transfer.deploy();
    console.log("transfer", transfer.address);
    await sleep(6000);
    proxy = await upgradeability.deploy();
    console.log("transferProxy", proxy.address);
    await sleep(6000);
    await proxy.upgradeTo(transfer.address);
    console.log("upgrade transfer")
    await sleep(6000);
    transferProxy = await Transfer.attach(proxy.address);
    await transferProxy.initialize(adminProxy.address);
    console.log("initialised")
    await sleep(6000);
    console.log(" ");

    //=====Transfer Attach=====
    // transferProxy = await Transfer.attach(mainnet.transfer);
    // console.log("AdminProxyAttach",transferProxy.address);
    // console.log(" ");

    MasterNTT = await ethers.getContractFactory("Receipt");
    //=====masterNTT deploy=====
    console.log("===== MasterNTT deploy=====")
    ntt = await MasterNTT.deploy();
    console.log("masterNTT", ntt.address);
    await sleep(6000);
    await adminProxy.setmasterNTT(ntt.address);
    console.log("setmasterNTT")
    await sleep(6000);
    console.log(" ");

    //=====masterNTT Attach=====
    // masterNTTProxy = await masterNTT.attach(mainnet.masterNTT);
    // console.log("AdminProxyAttach",masterNTTProxy.address);
    // console.log(" ");

    Factory = await ethers.getContractFactory("UniswapV2Factory");
    //=====CreatePair=====
    console.log("=====CreatePair=====")
    factory = await Factory.attach(mainnet.factory);

    await factory.createPair(YSLProxy.address,busd.address);
    console.log("create pair YSL-BUSD")
    await sleep(6000);
    YSL_BUSD = await factory.getPair(YSLProxy.address,busd.address);
    console.log("YSL_BUSD",YSL_BUSD)
    await sleep(6000);
    await YSLProxy.setLiquidityPool(YSL_BUSD,true);
    console.log("setLiquidityPool")
    await sleep(6000);

    await factory.createPair(xYSLProxy.address,busd.address);
    console.log("create pair xYSL-BUSD")
    await sleep(6000);
    xYSL_BUSD = await factory.getPair(xYSLProxy.address,busd.address);
    console.log("xYSL_BUSD",xYSL_BUSD)
    await sleep(6000);
    await xYSLProxy.setLiquidityPool(xYSL_BUSD,true);
    console.log("setLiquidityPool")
    await sleep(6000);

    await factory.createPair(usdyProxy.address,busd.address);
    console.log("create pair usdy-BUSD")
    await sleep(6000);
    USDy_BUSD = await factory.getPair(usdyProxy.address,busd.address);
    console.log("USDy_BUSD",USDy_BUSD)
    await sleep(6000);
    await adminProxy.setUSDyBUSD(USDy_BUSD);
    console.log("setUSDyBUSD")
    await sleep(6000);
    await usdyProxy.setLiquidityPool(USDy_BUSD,true);
    console.log("setLiquidityPool")
    await sleep(6000);

    await factory.createPair(BShareProxy.address,busd.address);
    console.log("create pair BShare-BUSD")
    await sleep(6000);
    BShare_BUSD = await factory.getPair(BShareProxy.address,busd.address);
    console.log("BShare_BUSD",BShare_BUSD)
    await sleep(6000);
    await BShareProxy.setLiquidityPool(BShare_BUSD,true);
    console.log("setLiquidityPool")
    await sleep(6000);
    console.log(" ")

    await factory.createPair(daiProxy.address,busd.address);
    console.log("create pair dai-BUSD")
    await sleep(6000);
    DAI_BUSD = await factory.getPair(daiProxy.address,busd.address);
    console.log("DAI_BUSD",DAI_BUSD)
    await sleep(6000);
    // await BShareProxy.setLiquidityPool(DAI_BUSD,true);
    // console.log("setLiquidityPool")
    await sleep(6000);
    console.log(" ")

    await factory.createPair(usdtProxy.address,busd.address);
    console.log("create pair dai-BUSD")
    await sleep(6000);
    USDT_BUSD = await factory.getPair(usdtProxy.address,busd.address);
    console.log("USDT_BUSD",USDT_BUSD)
    await sleep(6000);
    // await BShareProxy.setLiquidityPool(DAI_BUSD,true);
    // console.log("setLiquidityPool")
    await sleep(6000);
    console.log(" ")

    await factory.createPair(usdcProxy.address,busd.address);
    console.log("create pair dai-BUSD")
    await sleep(6000);
    USDC_BUSD = await factory.getPair(usdcProxy.address,busd.address);
    console.log("USDC_BUSD",USDC_BUSD)
    await sleep(6000);
    // await BShareProxy.setLiquidityPool(DAI_BUSD,true);
    // console.log("setLiquidityPool")
    await sleep(6000);
    console.log(" ")


    USDyVault = await ethers.getContractFactory("USDyVault");
    //===== USDyVault deploy=====
    console.log("=== USDyVault deploy ===")
    usdyVault = await USDyVault.deploy();
    console.log("usdyVault", usdyVault.address);
    await sleep(6000);
    proxy = await upgradeability.deploy();
    console.log("USDyVaultProxy", proxy.address);
    await sleep(6000);
    await proxy.upgradeTo(usdyVault.address);
    console.log("upgrade usdyVault")
    await sleep(6000);
    USDyVaultProxy = await USDyVault.attach(proxy.address);
    await USDyVaultProxy.initialize(adminProxy.address);
    console.log("initialised")
    await sleep(6000);
    await adminProxy.setUSDyVault(USDyVaultProxy.address);
    console.log("setUSDyVault")
    await sleep(6000);
    await usdyProxy.setOperator(USDyVaultProxy.address);
    console.log("set operator USDy");
    await sleep(6000);
    console.log(" ");

    //=====USDyVault Attach=====
    // USDyVaultProxy = await USDyVault.attach(mainnet.usdyVault);
    // console.log("AdminProxyAttach",USDyVaultProxy.address);
    // console.log(" ");

    YSLBUSDVault = await ethers.getContractFactory("YSLBUSDVault");
    //===== YSLBUSDVault deploy=====
    console.log("=== YSLBUSDVault deploy ===")
    yslbusdVault = await YSLBUSDVault.deploy();
    console.log("yslbusdVault", yslbusdVault.address);
    await sleep(6000);
    proxy = await upgradeability.deploy();
    console.log("yslbusdVaultProxy", proxy.address);
    await sleep(6000);
    await proxy.upgradeTo(yslbusdVault.address);
    console.log("upgrade yslbusdVault")
    await sleep(6000);
    yslbusdVaultProxy = await YSLBUSDVault.attach(proxy.address);
    await yslbusdVaultProxy.initialize(adminProxy.address,YSL_BUSD);
    console.log("initialised")
    await sleep(6000);
    await adminProxy.setYSLBUSDVault(yslbusdVaultProxy.address);
    console.log("setYSLBUSDVault")
    await sleep(6000);
    await usdyProxy.setOperator(yslbusdVaultProxy.address);
    console.log("set operator USDy");
    await sleep(6000);
    await YSLProxy.setOperator(yslbusdVaultProxy.address);
    console.log("set operator YSL");
    await sleep(6000);
    console.log(" ");

    //=====YSLBUSDVault Attach=====
    // yslbusdVaultProxy = await YSLBUSDVault.attach(mainnet.yslbusdVault);
    // console.log("AdminProxyAttach",yslbusdVaultProxy.address);
    // console.log(" ");

    xYSLBUSDVault = await ethers.getContractFactory("xYSLBUSDVault");
    //===== xYSLBUSDVault deploy=====
    console.log("=== xYSLBUSDVault deploy ===")
    xyslbusdVault = await xYSLBUSDVault.deploy();
    console.log("xyslbusdVault", xyslbusdVault.address);
    await sleep(6000);
    proxy = await upgradeability.deploy();
    console.log("xyslbusdVaultProxy", proxy.address);
    await sleep(6000);
    await proxy.upgradeTo(xyslbusdVault.address);
    console.log("upgrade xyslbusdVault")
    await sleep(6000);
    xyslbusdVaultProxy = await xYSLBUSDVault.attach(proxy.address);
    await xyslbusdVaultProxy.initialize(adminProxy.address,xYSL_BUSD);
    console.log("initialised")
    await sleep(6000);
    await adminProxy.setxYSLBUSDVault(xyslbusdVaultProxy.address);
    console.log("setxYSLBUSDVault")
    await sleep(6000);
    await usdyProxy.setOperator(xyslbusdVaultProxy.address);
    console.log("set operator USDy");
    await sleep(6000);
    await xYSLProxy.setOperator(xyslbusdVaultProxy.address);
    console.log("set operator xYSL");
    await sleep(6000);
    console.log(" ");

    //=====xYSLBUSDVault Attach=====
    // xyslbusdVaultProxy = await xYSLBUSDVault.attach(mainnet.xyslbusdVault);
    // console.log("AdminProxyAttach",xyslbusdVaultProxy.address);
    // console.log(" ");

    USDyBUSDVault = await ethers.getContractFactory("USDyBUSDVault");
    //===== USDyBUSDVault deploy=====
    console.log("=== USDyBUSDVault deploy ===")
    usdyBUSDVault = await USDyBUSDVault.deploy();
    console.log("usdyBUSDVault", usdyBUSDVault.address);
    await sleep(6000);
    proxy = await upgradeability.deploy();
    console.log("usdybusdVaultProxy", proxy.address);
    await sleep(6000);
    await proxy.upgradeTo(usdyBUSDVault.address);
    console.log("upgrade usdyBUSDVault")
    await sleep(6000);
    usdybusdVaultProxy = await USDyBUSDVault.attach(proxy.address);
    await usdybusdVaultProxy.initialize(adminProxy.address);
    console.log("initialised")
    await sleep(6000);
    await adminProxy.setUSDyBUSDVault(usdybusdVaultProxy.address);
    console.log("setUSDyBUSDVault")
    await sleep(6000);
    await usdyProxy.setOperator(usdybusdVaultProxy.address);
    console.log("set operator USDy");
    await sleep(6000);
    console.log(" ");

    //=====USDyBUSDVault Attach=====
    // usdybusdVaultProxy = await USDyBUSDVault.attach(mainnet.usdyBUSDVault);
    // console.log("AdminProxyAttach",usdybusdVaultProxy.address);
    // console.log(" ");

    BSHAREBUSDVault = await ethers.getContractFactory("BSHAREBUSDVault");
    //===== BSHAREBUSDVault deploy=====
    console.log("=== BSHAREBUSDVault deploy ===")
    bshareBUSDVault = await BSHAREBUSDVault.deploy();
    console.log("bshareBUSDVault", bshareBUSDVault.address);
    await sleep(6000);
    proxy = await upgradeability.deploy();
    console.log("bsharebusdVaultProxy", proxy.address);
    await sleep(6000);
    await proxy.upgradeTo(bshareBUSDVault.address);
    console.log("upgrade bshareBUSDVault")
    await sleep(6000);
    bsharebusdVaultProxy = await BSHAREBUSDVault.attach(proxy.address);
    await bsharebusdVaultProxy.initialize(adminProxy.address, BShare_BUSD);
    console.log("initialised")
    await sleep(6000);
    await adminProxy.setBShareBUSD(bsharebusdVaultProxy.address);
    console.log("setBShareBUSD")
    await sleep(6000);
    await usdyProxy.setOperator(bsharebusdVaultProxy.address);
    console.log("set operator USDy");
    await sleep(6000);
    await BShareProxy.setOperator(bsharebusdVaultProxy.address);
    console.log("set operator USDy");
    await sleep(6000);
    console.log(" ");

    //=====BSHAREBUSDVault Attach=====
    // bsharebusdVaultProxy = await BSHAREBUSDVault.attach(mainnet.bshareBUSDVault);
    // console.log("AdminProxyAttach",bsharebusdVaultProxy.address);
    // console.log(" ");

    BUSDVault = await ethers.getContractFactory("BUSDVault");
    //===== BUSDVault deploy =====
    console.log("=== BUSDVault deploy ===")
    busdVault = await BUSDVault.deploy();
    console.log("busdVault", busdVault.address);
    await sleep(6000);
    proxy = await upgradeability.deploy();
    console.log("busdVaultProxy", proxy.address);
    await sleep(6000);
    await proxy.upgradeTo(busdVault.address);
    console.log("upgrade busdVault")
    await sleep(6000);
    busdVaultProxy = await BUSDVault.attach(proxy.address);
    await busdVaultProxy.initialize(adminProxy.address);
    console.log("initialised")
    await sleep(6000);
    await adminProxy.setBUSDVault(busdVaultProxy.address);
    console.log("setBUSDVault")
    await sleep(6000);
    await usdyProxy.setOperator(busdVaultProxy.address);
    console.log("set operator USDy");
    await sleep(6000);
    await adminProxy.setOperator(busdVaultProxy.address);
    console.log("set operator busdVault in admin");
    await sleep(6000);
    console.log(" ");

    //=====BUSDVault Attach=====
    // busdVaultProxy = await BUSDVault.attach(mainnet.busdVault);
    // console.log("AdminProxyAttach",busdVaultProxy.address);
    // console.log(" ");


    DAIVault = await ethers.getContractFactory("DAIVault");
    //===== DAIVault deploy =====
    console.log("=== DAIVault deploy ===")
    daiVault = await DAIVault.deploy();
    console.log("daiVault", daiVault.address);
    await sleep(6000);
    proxy = await upgradeability.deploy();
    console.log("daiVaultProxy", proxy.address);
    await sleep(6000);
    await proxy.upgradeTo(daiVault.address);
    console.log("upgrade daiVault")
    await sleep(6000);
    daiVaultProxy = await DAIVault.attach(proxy.address);
    await daiVaultProxy.initialize(adminProxy.address,daiProxy.address);
    console.log("initialised")
    await sleep(6000);
    await adminProxy.setDAIVault(daiVaultProxy.address);
    console.log("setDAIVault")
    await sleep(6000);
    await usdyProxy.setOperator(daiVaultProxy.address);
    console.log("set operator USDy");
    await sleep(6000);
    await adminProxy.setOperator(daiVaultProxy.address);
    console.log("set operator daiVault in admin");
    await sleep(6000);
    console.log(" ");

    //=====DAIVault Attach=====
    // daiVaultProxy = await DAIVault.attach(mainnet.daiVault);
    // console.log("AdminProxyAttach",daiVaultProxy.address);
    // console.log(" ");



    USDCVault = await ethers.getContractFactory("USDCVault");
    //===== USDCVault deploy =====
    console.log("=== USDCVault deploy ===")
    usdcVault = await USDCVault.deploy();
    console.log("usdcVault", usdcVault.address);
    await sleep(6000);
    proxy = await upgradeability.deploy();
    console.log("daiVaultProxy", proxy.address);
    await sleep(6000);
    await proxy.upgradeTo(usdcVault.address);
    console.log("upgrade usdcVault")
    await sleep(6000);
    usdcVaultProxy = await USDCVault.attach(proxy.address);
    await usdcVaultProxy.initialize(adminProxy.address, usdcProxy.address);
    console.log("initialised")
    await sleep(6000);
    await adminProxy.setUSDCVault(usdcVaultProxy.address);
    console.log("setUSDCVault")
    await sleep(6000);
    await usdyProxy.setOperator(usdcVaultProxy.address);
    console.log("set operator USDy");
    await sleep(6000);
    await adminProxy.setOperator(usdcVaultProxy.address);
    console.log("set operator usdcVault in admin");
    await sleep(6000);
    console.log(" ");

    //=====USDCVault Attach=====
    // usdcVaultProxy = await USDCVault.attach(mainnet.usdcVault);
    // console.log("AdminProxyAttach",usdcVaultProxy.address);
    // console.log(" ");

    USDTVault = await ethers.getContractFactory("USDTVault");
    //===== USDTVault deploy =====
    console.log("=== USDTVault deploy ===")
    usdtVault = await USDTVault.deploy();
    console.log("usdtVault", usdtVault.address);
    await sleep(6000);
    proxy = await upgradeability.deploy();
    console.log("daiVaultProxy", proxy.address);
    await sleep(6000);
    await proxy.upgradeTo(usdtVault.address);
    console.log("upgrade usdtVault")
    await sleep(6000);
    usdtVaultProxy = await USDTVault.attach(proxy.address);
    await usdtVaultProxy.initialize(adminProxy.address, usdtProxy.address);
    console.log("initialised")
    await sleep(6000);
    await adminProxy.setUSDTVault(usdtVaultProxy.address);
    console.log("setUSDTVault")
    await sleep(6000);
    await usdyProxy.setOperator(usdtVaultProxy.address);
    console.log("set operator USDy");
    await sleep(6000);
    await adminProxy.setOperator(usdtVaultProxy.address);
    console.log("set operator usdtVault in admin");
    await sleep(6000);
    console.log(" ");

    //=====USDTVault Attach=====
    // usdtVaultProxy = await USDTVault.attach(mainnet.usdtVault);
    // console.log("AdminProxyAttach",usdtVaultProxy.address);
    // console.log(" ");

    ClaimStakeAll = await ethers.getContractFactory("ClaimStakeAll");
    //===== ClaimStakeAll deploy =====
    console.log("=== ClaimStakeAll deploy ===")
    claimstakeAll = await ClaimStakeAll.deploy();
    console.log("claimstakeAll", claimstakeAll.address);
    await sleep(6000);
    proxy = await upgradeability.deploy();
    console.log("claimStakeAllProxy", proxy.address);
    await sleep(6000);
    await proxy.upgradeTo(claimstakeAll.address);
    console.log("upgrade claimstakeAll")
    await sleep(6000);
    claimStakeAllProxy = await ClaimStakeAll.attach(proxy.address);
    await claimStakeAllProxy.initialize(adminProxy.address);
    console.log("initialised")
    await sleep(6000);
    await adminProxy.setClaimStakeAll(claimStakeAllProxy.address);
    console.log("setClaimStakeAll")
    await sleep(6000);
    await claimStakeAllProxy.addSingleVault([USDyVaultProxy.address],[usdyProxy.address]);
    console.log("added single vault");
    await sleep(6000);
    await claimStakeAllProxy.addVault([yslbusdVaultProxy.address, xyslbusdVaultProxy.address, usdybusdVaultProxy.address,
                                    bsharebusdVaultProxy.address, busdVaultProxy.address , daiVaultProxy.address , usdcVaultProxy.address , usdtVaultProxy.address]);
    console.log("added vault");
    await sleep(6000);
    console.log(" ");




    MintContract = await ethers.getContractFactory("MintContract");
    // ==== MintContract Deploy ========
    console.log("======MintContract Deploy======")
    mintContract = await MintContract.deploy();
    console.log("mintContract", mintContract.address);
    await sleep(6000);
    await mintContract.initialize(busd.address , daiProxy.address , usdcProxy.address , usdtProxy.address);
    console.log("initilaized");
    await sleep(6000);
    await busd.mint();
    await sleep(6000);
    await transfer(mintContract.address,await busd.balanceOf(owner));
    await sleep(6000);
    await daiProxy.setOperator(mintContract.address);
    console.log("setOperator");
    await sleep(6000);
    await usdcProxy.setOperator(mintContract.address);
    console.log("setOperator");
    await sleep(6000);
    await usdtProxy.setOperator(mintContract.address);
    console.log("setOperator");

    //=====ClaimStakeAll Attach=====
    // claimStakeAllProxy = await ClaimStakeAll.attach(mainnet.claimstakeAll);
    // console.log("AdminProxyAttach",claimStakeAllProxy.address);
    // console.log(" ");

    USDyBUSDRebalancer = await ethers.getContractFactory("USDyBUSDRebalancer");
    //===== USDyBUSDRebalancer deploy =====
    console.log("=== USDyBUSDRebalancer deploy ===")
    usdyBUSDRebalancer = await USDyBUSDRebalancer.deploy();
    console.log("usdyBUSDRebalancer", usdyBUSDRebalancer.address);
    await sleep(6000);
    proxy = await upgradeability.deploy();
    console.log("USDyBUSDRebalancerProxy", proxy.address);
    await sleep(6000);
    await proxy.upgradeTo(usdyBUSDRebalancer.address);
    console.log("upgrade usdyBUSDRebalancer")
    await sleep(6000);
    USDyBUSDRebalancerProxy = await USDyBUSDRebalancer.attach(proxy.address);
    await USDyBUSDRebalancerProxy.initialize(adminProxy.address, mainnet.router, liquidityProviderProxy.address);
    console.log("initialised")
    await sleep(6000);
    await adminProxy.setUSDyBUSDRebalancer(USDyBUSDRebalancerProxy.address);
    console.log("setUSDyBUSDRebalancer")
    await sleep(6000);
    await usdyProxy.setOperator(USDyBUSDRebalancerProxy.address);
    console.log("set operator USDy");
    await sleep(6000);
    console.log(" ");

    //=====USDyBUSDRebalancer Attach=====
    // USDyBUSDRebalancerProxy = await USDyBUSDRebalancer.attach(mainnet.usdyBUSDRebalancer);
    // console.log("AdminProxyAttach",USDyBUSDRebalancerProxy.address);
    // console.log(" ");

    Whitelist = await ethers.getContractFactory("WhiteList");
    //=====Whitelist addresses=====
    console.log("=====Whitelist addresses=====")
    whitelist = await Whitelist.attach(mainnet.whitelist);
    await whitelist.addWhiteList([YSLProxy.address, xYSLProxy.address, usdyProxy.address, BShareProxy.address,
                                yslbusdVaultProxy.address, xyslbusdVaultProxy.address, usdybusdVaultProxy.address, bsharebusdVaultProxy.address,
                                busdVaultProxy.address, USDyVaultProxy.address, USDyBUSDRebalancerProxy.address, claimStakeAllProxy.address,
                                liquidityProviderProxy.address, transferProxy.address, YSL_BUSD, xYSL_BUSD, BShare_BUSD, USDy_BUSD, DAI_BUSD, USDT_BUSD, USDC_BUSD,
                                temporaryHoldingProxy.address, daiProxy.address , usdcProxy.address , usdtProxy.address , daiVaultProxy.address , usdcVaultProxy.address , usdtVaultProxy.address]); 
    console.log("whitelist done");
    await sleep(6000);
    await whitelist.addWhiteListForSwap([YSLProxy.address, xYSLProxy.address, usdyProxy.address, BShareProxy.address,
                                yslbusdVaultProxy.address, xyslbusdVaultProxy.address, usdybusdVaultProxy.address, bsharebusdVaultProxy.address,
                                busdVaultProxy.address, USDyVaultProxy.address, USDyBUSDRebalancerProxy.address, claimStakeAllProxy.address,
                                liquidityProviderProxy.address, transferProxy.address, YSL_BUSD, xYSL_BUSD, BShare_BUSD, USDy_BUSD, DAI_BUSD, USDT_BUSD, USDC_BUSD,
                                temporaryHoldingProxy.address , daiProxy.address , usdcProxy.address , usdtProxy.address , daiVaultProxy.address , usdcVaultProxy.address , usdtVaultProxy.address]); 
    console.log("whitelist for swap done");
    await sleep(6000);
    console.log(" ");

    //=====setBuyBackActivationRole=====
    console.log("=====setBuyBackActivationRole=====");
    await adminProxy.setBuyBackActivationRole(USDyVaultProxy.address);
    console.log("setBuyBackActivationRole(USDyVaultProxy.address)")
    await sleep(6000)
    await adminProxy.setBuyBackActivationRole(yslbusdVaultProxy.address);
    console.log("setBuyBackActivationRole(yslbusdVaultProxy.address)")
    await sleep(6000)
    await adminProxy.setBuyBackActivationRole(xyslbusdVaultProxy.address);
    console.log("setBuyBackActivationRole(xyslbusdVaultProxy.address)")
    await sleep(6000)
    await adminProxy.setBuyBackActivationRole(usdybusdVaultProxy.address);
    console.log("setBuyBackActivationRole(usdybusdVaultProxy.address)")
    await sleep(6000)
    await adminProxy.setBuyBackActivationRole(bsharebusdVaultProxy.address);
    console.log("setBuyBackActivationRole(bsharebusdVaultProxy.address)")
    await sleep(6000)
    console.log(" ")

    Treasury = await ethers.getContractFactory("Treasury");
    //=====Treasury role=====
    console.log("=====Treasury role=====")
    treasury = await Treasury.attach(treasuryProxy.address);
    await treasury.setRebalancerRole(busdVaultProxy.address);
    console.log("setRebalancerRole(busdVaultProxy.address)");
    await sleep(6000);
    await treasury.setRebalancerRole(USDyBUSDRebalancerProxy.address);
    console.log("setRebalancerRole(USDyBUSDRebalancerProxy.address)");
    await sleep(6000);
    console.log(" ")

    Refferal = await ethers.getContractFactory("Referral");
    //=====Referral reward role =====
    console.log("=====Referral reward role =====")
    referral = await Refferal.attach(referralProxy.address);
    await referral.setRole(yslbusdVaultProxy.address);
    console.log("setRole(yslbusdVaultProxy.address)")
    await sleep(6000);
    await referral.setRole(xyslbusdVaultProxy.address);
    console.log("setRole(xyslbusdVaultProxy.address)")
    await sleep(6000);
    await referral.setRole(usdybusdVaultProxy.address);
    console.log("setRole(usdybusdVaultProxy.address)")
    await sleep(6000);
    await referral.setRole(bsharebusdVaultProxy.address);
    console.log("setRole(bsharebusdVaultProxy.address)")
    await sleep(6000);


    //=====only for testing=====
    Busd = await ethers.getContractFactory("Receipt");
    // busd = await Busd.attach(busd.address);
    await YSLProxy.mint(owner,expandTo18Decimals(1000000000));
    console.log("YSLProxy minted");
    await sleep(6000);
    await xYSLProxy.mint(owner,expandTo18Decimals(1000000000));
    console.log("xYSLProxy minted");
    await sleep(6000);
    await usdyProxy.mint(owner,expandTo18Decimals(1000000000));
    console.log("usdyProxy minted");
    await sleep(6000);
    await BShareProxy.mint(owner,expandTo18Decimals(1000000000));
    console.log("BShareProxy minted");
    await sleep(6000);
    await busd.mint();
    console.log("busd minted");
    await sleep(6000);
    await daiProxy.mint(owner,expandTo18Decimals(1000000000));
    console.log("daiProxy minted");
    await sleep(6000);
    await usdcProxy.mint(owner,expandTo18Decimals(1000000000));
    console.log("usdcProxy minted");
    await sleep(6000);
    await usdtProxy.mint(owner,expandTo18Decimals(1000000000));
    console.log("usdtProxy minted");
    await sleep(6000);
    await YSLProxy.approve(liquidityProviderProxy.address,expandTo18Decimals(1000000000));
    console.log("YSLProxy approved to lp")
    await sleep(6000);
    await xYSLProxy.approve(liquidityProviderProxy.address,expandTo18Decimals(1000000000));
    console.log("xYSLProxy approved to lp")
    await sleep(6000);
    await usdyProxy.approve(liquidityProviderProxy.address,expandTo18Decimals(1000000000));
    console.log("usdyProxy approved to lp")
    await sleep(6000);
    await BShareProxy.approve(liquidityProviderProxy.address,expandTo18Decimals(1000000000));
    console.log("BShareProxy approved to lp")
    await sleep(6000);
    await daiProxy.approve(liquidityProviderProxy.address,expandTo18Decimals(1000000000));
    console.log("daiProxy approved to lp")
    await sleep(6000);
    await usdcProxy.approve(liquidityProviderProxy.address,expandTo18Decimals(1000000000));
    console.log("usdcProxy approved to lp")
    await sleep(6000);
    await usdtProxy.approve(liquidityProviderProxy.address,expandTo18Decimals(1000000000));
    console.log("usdtProxy approved to lp")
    await sleep(6000);
    await busd.approve(liquidityProviderProxy.address,expandTo18Decimals(100000000000));
    console.log("busd approved to lp")
    await sleep(6000);
    await liquidityProviderProxy.addLiquidity(YSLProxy.address,busd.address,expandTo18Decimals(100000),expandTo18Decimals(500000),expandTo18Decimals(1),expandTo18Decimals(1),treasuryProxy.address);
    console.log("add liq for YSLProxy and busd");
    await sleep(6000);
    await liquidityProviderProxy.addLiquidity(xYSLProxy.address,busd.address,expandTo18Decimals(10000),expandTo18Decimals(1200000),expandTo18Decimals(1),expandTo18Decimals(1),treasuryProxy.address);
    console.log("add liq for xYSLProxy and busd");
    await sleep(6000);
    await liquidityProviderProxy.addLiquidity(usdyProxy.address,busd.address,expandTo18Decimals(100000),expandTo18Decimals(100000),expandTo18Decimals(1),expandTo18Decimals(1),treasuryProxy.address);
    console.log("add liq for usdyProxy and busd");
    await sleep(6000);
    await liquidityProviderProxy.addLiquidity(BShareProxy.address,busd.address,expandTo18Decimals(100000),expandTo18Decimals(500000),expandTo18Decimals(1),expandTo18Decimals(1),treasuryProxy.address);
    console.log("add liq for BShareProxy and busd");
    await sleep(6000);
    await liquidityProviderProxy.addLiquidity(daiProxy.address,busd.address,expandTo18Decimals(100000),expandTo18Decimals(100000),expandTo18Decimals(1),expandTo18Decimals(1),treasuryProxy.address);
    console.log("add liq for daiProxy and busd");
    await sleep(6000);
    await liquidityProviderProxy.addLiquidity(usdcProxy.address,busd.address,expandTo18Decimals(100000),expandTo18Decimals(100000),expandTo18Decimals(1),expandTo18Decimals(1),treasuryProxy.address);
    console.log("add liq for usdcProxy and busd");
    await sleep(6000);
    await liquidityProviderProxy.addLiquidity(usdtProxy.address,busd.address,expandTo18Decimals(100000),expandTo18Decimals(100000),expandTo18Decimals(1),expandTo18Decimals(1),treasuryProxy.address);
    console.log("add liq for usdtProxy and busd");
    await sleep(6000);

    console.log("{");
    console.log("name: YSL-BUSD");
    console.log("address:",yslbusdVaultProxy.address);
    console.log("token:",YSLProxy.address);
    console.log("receipt:",await yslbusdVaultProxy.receiptToken());
    console.log("}");

    console.log("{");
    console.log("name: xYSL-BUSD");
    console.log("address:",xyslbusdVaultProxy.address);
    console.log("token:",xYSLProxy.address);
    console.log("receipt:",await xyslbusdVaultProxy.receiptToken());
    console.log("}");

    console.log("{");
    console.log("name: BSHARE-BUSD");
    console.log("address:",bsharebusdVaultProxy.address);
    console.log("token:",BShareProxy.address);
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
    console.log("address:",USDyVaultProxy.address);
    console.log("token:",usdyProxy.address);
    console.log("receipt:",await USDyVaultProxy.receiptToken());
    console.log("}");

    console.log("{");
    console.log("name: BUSD");
    console.log("address:",busdVaultProxy.address);
    console.log("token:",busd.address);
    console.log("receipt:",await busdVaultProxy.receiptToken());
    console.log("}");

    console.log("{");
    console.log("name: DAI Vault");
    console.log("address:",daiVaultProxy.address);
    console.log("token:",daiProxy.address);
    console.log("receipt:",await daiVaultProxy.DAIs());
    console.log("}");

    console.log("{");
    console.log("name: USDC Vault");
    console.log("address:",usdcVaultProxy.address);
    console.log("token:",usdcProxy.address);
    console.log("receipt:",await usdcVaultProxy.USDCs());
    console.log("}");

    console.log("{");
    console.log("name: USDT Vault");
    console.log("address:",usdtVaultProxy.address);
    console.log("token:",usdtProxy.address);
    console.log("receipt:",await usdtVaultProxy.USDTs());
    console.log("}");



    console.log("REACT_APP_URL_NODE_ENV=development");
    console.log("REACT_APP_URL_CHAINID=97")
    console.log("REACT_APP_URL_NAME=BSCTESTNET")
    console.log("REACT_APP_URL_RPC=https://rpc.ankr.com/bsc_testnet_chapel/08aae125759ccdf4d57691956d32d5f5585800da99ad888c22f8822d6b2e9743")
    console.log("REACT_APP_URL_BSCSCAN=https://testnet.bscscan.com/address/")
    console.log("REACT_APP_URL_BSCTXN=https://testnet.bscscan.com/tx/")
    console.log("REACT_APP_URL_BLOCKEXPLORERURL=https://testnet.bscscan.com")

    console.log("# contract")
    console.log("");
    console.log("REACT_APP_URL_ADDRESS_SWAP=", await swappageProxy.address);
    console.log("REACT_APP_URL_ADDRESS_REFFERRAL=", await referralProxy.address);
    console.log("REACT_APP_URL_ADDRESS_ADMIN=", await adminProxy.address);
    console.log("REACT_APP_URL_ADDRESS_POL=",await polProxy.address);
    console.log("REACT_APP_URL_ADDRESS_TREASURY=", await treasuryProxy.address);
    console.log("REACT_APP_URL_ADDRESS_EARLYACCESSNFT=", await earlyAccess.address);
    console.log("REACT_APP_URL_ADDRESS_TRANSFER=", await transferProxy.address);
    console.log("REACT_APP_URL_ADDRESS_CLAIMSTAKEEARN=", await claimStakeAllProxy.adddress);
    console.log("REACT_APP_URL_ADDRESS_ROUTER=","0x4556995aF89A1A0fd0F040FADeEE89b22EF0111b")
    console.log("REACT_APP_URL_ADDRESS_HEADERCLAIM=",await busd.address);
    console.log("REACT_APP_URL_ADDRESS_MINT=",await mintContract.address);


    console.log("# vaults")
    console.log("");
    console.log("REACT_APP_URL_ADDRESS_VAULT_YSLBUSD=", await yslbusdVaultProxy.address);
    console.log("REACT_APP_URL_ADDRESS_VAULT_XYSLBUSD=", await xyslbusdVaultProxy.address);
    console.log("REACT_APP_URL_ADDRESS_VAULT_USDYBUSD=", await usdybusdVaultProxy.address);
    console.log("REACT_APP_URL_ADDRESS_VAULT_BSHAREBUSD=",await bsharebusdVaultProxy.address);
    console.log("REACT_APP_URL_ADDRESS_VAULT_USDY=", await USDyVaultProxy.address);
    console.log("REACT_APP_URL_ADDRESS_VAULT_BUSD==", await busdVaultProxy.address);
    console.log("REACT_APP_URL_ADDRESS_VAULT_DAI=", await daiVaultProxy.address);
    console.log("REACT_APP_URL_ADDRESS_VAULT_USDC=", await usdcVaultProxy.adddress);
    console.log("REACT_APP_URL_ADDRESS_VAULT_USDT=",await usdtVaultProxy.address);


    console.log("# token")
    console.log("")
    console.log("REACT_APP_URL_ADDRESS_BYSL=",await bysl.address);
    console.log("REACT_APP_URL_ADDRESS_BUSD=",await busd.address);
    console.log("REACT_APP_URL_ADDRESS_YSL=",await YSLProxy.address);
    console.log("REACT_APP_URL_ADDRESS_XYSL=",await xYSLProxy.address);
    console.log("REACT_APP_URL_ADDRESS_USDY=",await usdyProxy.address);
    console.log("REACT_APP_URL_ADDRESS_BSHARE=",await BShareProxy.address);
    console.log("REACT_APP_URL_ADDRESS_DAI=",await daiProxy.address);
    console.log("REACT_APP_URL_ADDRESS_USDC=",await usdcProxy.address);
    console.log("REACT_APP_URL_ADDRESS_USDT=",await usdtProxy.address);



    console.log("#S-tokens")
    console.log("")
    console.log("REACT_APP_URL_ADDRESS_BUSDS=",await busdVaultProxy.receiptToken() )
    console.log("REACT_APP_URL_ADDRESS_YSLS=",await yslbusdVaultProxy.receiptToken())
    console.log("REACT_APP_URL_ADDRESS_XYSLS=",await xyslbusdVaultProxy.receiptToken())
    console.log("REACT_APP_URL_ADDRESS_USDYS=",await USDyVaultProxy.receiptToken())
    console.log("REACT_APP_URL_ADDRESS_BSHARES=",await bsharebusdVaultProxy.receiptToken())
    console.log("REACT_APP_URL_ADDRESS_DAIS=",await daiVaultProxy.DAIs())
    console.log("REACT_APP_URL_ADDRESS_USDCS=",await usdcVaultProxy.USDCs())
    console.log("REACT_APP_URL_ADDRESS_USDTS=",await usdtVaultProxy.USDTs())



}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });