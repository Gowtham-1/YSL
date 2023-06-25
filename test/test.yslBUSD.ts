import {
    UniswapV2Router02,
    UniswapV2Router02__factory,
    IPancakeRouter02,
    IPancakeRouter02__factory,
    UniswapV2Factory,
    UniswapV2Factory__factory,
    Factory,
    Factory__factory,
    CalHash,
    CalHash__factory,
    WETH9,
    WETH9__factory,
    ERC20,
    ERC20__factory,
    UniswapV2Pair,
    UniswapV2Pair__factory,
    YSL,
    YSL__factory,
    WhiteList,
    WhiteList__factory,
    XYSL,
    XYSL__factory,
  
    My20__factory,
    My20,
    BSHARE,
    BSHARE__factory,
    Admin,
    Admin__factory,
    Treasury,
    Treasury__factory,
    ProtocolOwnedLiquidity,
    ProtocolOwnedLiquidity__factory,
    USDy,
    USDy__factory,
    USDyBUSDVault, 
    USDyBUSDVault__factory,
    BSHAREBUSDVault,
    Receipt,
    BSHAREBUSDVault__factory,
    Receipt__factory, 
    LiquidityProvider, 
    LiquidityProvider__factory,
    Blacklist,
    Blacklist__factory, 
    USDyVault,
    USDyVault__factory, 
    XYSLBUSDVault, 
    XYSLBUSDVault__factory,
    YSLBUSDVault,
    YSLBUSDVault__factory,
    Referral__factory,
    Referral,
    USDyRebalancer__factory,
    BUSDVault__factory,
    USDyRebalancer,
    BUSDVault,
    BYSL,
    BYSL__factory,
    DAIVault,
    USDCVault,
    USDTVault,
    DAIVault__factory,
    USDTVault__factory,
    USDCVault__factory
  } from "../typechain";
  
  import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
  import { ethers } from "hardhat";
  import { mineBlocks, expandTo18Decimals } from "./utilities/utilities";
  import { expect } from "chai";
  import exp, { SIGABRT } from "constants";
  import { sign } from "crypto";
import { Console } from "console";
  
  
  describe("YSLBUSDVault", async () => {
    let router: UniswapV2Router02;
    let factory1: Factory;
    let admin: Admin;
    let treasury: Treasury;
    let pol: ProtocolOwnedLiquidity;
    let weth: WETH9;
    let calHash: CalHash;
    let whitelist: WhiteList;
    let bshare: BSHARE;
    let owner: SignerWithAddress;
    let signers: SignerWithAddress[];
    let BUSD: Receipt;
    let token: Receipt;
    let bshareBUSD : BSHAREBUSDVault;
    let ysl : YSL;
    let xysl : XYSL;
    let usdy : USDy;
    let usdyBUSD : USDyBUSDVault;
    let liquidityProvider : LiquidityProvider;
    let blacklist: Blacklist;
    let USDyVault: USDyVault;
    let xYSLBUSD: XYSLBUSDVault;
    let YSLBUSD: YSLBUSDVault;
    let referer: Referral;
    let USDyBUSDRebalancer:USDyRebalancer;
    let BUSDVault: BUSDVault;
    let bysl: BYSL;
    let daivault: DAIVault
    let usdcvault: USDCVault
    let usdtvault: USDTVault

    beforeEach(async () => {
      signers = await ethers.getSigners();
      owner = signers[0];
      admin= await new Admin__factory(owner).deploy();
      factory1 = await new Factory__factory(owner).deploy();
      weth = await new WETH9__factory(owner).deploy();
      token = await new Receipt__factory(owner).deploy();
      liquidityProvider = await new LiquidityProvider__factory(owner).deploy();
      router = await new UniswapV2Router02__factory(owner).deploy(factory1.address, weth.address);    
      bshare = await new BSHARE__factory(owner).deploy();
      await admin.initialize(owner.address, owner.address);
      await bshare.initialise(admin.address);
      await bshare.setOperator(signers[1].address);
      calHash = await new CalHash__factory(owner).deploy();
      factory1 = await new Factory__factory(owner).deploy();
      whitelist = await new WhiteList__factory(owner).deploy();
      blacklist = await new Blacklist__factory(owner).deploy();
      await whitelist.initialize(admin.address)
      await blacklist.initialize(admin.address);
      treasury= await new Treasury__factory(owner).deploy();
      pol= await new ProtocolOwnedLiquidity__factory(owner).deploy();
      router = await new UniswapV2Router02__factory(owner).deploy(factory1.address, weth.address);
      bshareBUSD = await new BSHAREBUSDVault__factory(owner).deploy();
      usdyBUSD = await new USDyBUSDVault__factory(owner).deploy();
      xYSLBUSD = await new XYSLBUSDVault__factory(owner).deploy();
      referer = await new Referral__factory(owner).deploy();
      await admin.setxYSLBUSDVault(xYSLBUSD.address);
      await admin.setLpDeposit(true);
      await admin.setBShareBUSD(bshareBUSD.address);
      await admin.setWBNB(weth.address) ;
      await admin.setWhitelist(whitelist.address);
      await admin.setBlacklist(blacklist.address);
      await admin.setPOL(pol.address) ; 
      await admin.setTreasury(treasury.address); 
      await admin.setApeswapRouter(router.address);  
      await admin.setLiquidityProvider(liquidityProvider.address);
      await admin.setBShare(bshare.address);
      await admin.setmasterNTT(token.address);
      await admin.setUSDs(token.address);
      await admin.setRefferal(referer.address);
      await admin.setTeamAddress(owner.address);
      await liquidityProvider.initialize(router.address, admin.address);
      BUSD = await new Receipt__factory(owner).deploy();
      await BUSD.initialize(admin.address,owner.address,"BUSD","BUSD");
      await BUSD.mint(owner.address,expandTo18Decimals(10000000000000));
      await BUSD.transfer(signers[1].address,expandTo18Decimals(100000000));
      await referer.initialize(BUSD.address,admin.address);
      await BUSD.connect(signers[1]).transfer(signers[2].address,expandTo18Decimals(10000));
      await BUSD.transfer(treasury.address, expandTo18Decimals(50000));
      await BUSD.transfer(pol.address, expandTo18Decimals(50000)); 
      await token.initialize(admin.address, owner.address, "ReceiptToken", "Token");
      await admin.setBUSD(BUSD.address);
      usdy = await new USDy__factory(owner).deploy();
      await usdy.initialise(admin.address);
      await usdy.setOperator(signers[1].address);
      await admin.setUSDy(usdy.address);
      USDyVault = await new USDyVault__factory(owner).deploy();
      await admin.setUSDyVault(USDyVault.address);
      ysl = await new YSL__factory(owner).deploy();
      await ysl.initialise(admin.address);
      await ysl.setOperator(signers[1].address);
      xysl = await new XYSL__factory(owner).deploy();
      await xysl.initialise(admin.address,BUSD.address);
      await xysl.setOperator(signers[1].address);
      await admin.setYSL(ysl.address);
      YSLBUSD = await new YSLBUSDVault__factory(owner).deploy();
      await referer.grantRole(await referer.REWARD_ROLE(),YSLBUSD.address);
      await admin.setYSLBUSDVault(YSLBUSD.address);
      await USDyVault.initialize(admin.address);
      await usdy.connect(owner).mint(signers[1].address, expandTo18Decimals(500000000000)); 
      await usdy.connect(signers[1]).approve(liquidityProvider.address, expandTo18Decimals(4000000000));
      await BUSD.connect(signers[1]).approve(liquidityProvider.address, expandTo18Decimals(4000000000));
      USDyBUSDRebalancer = await new USDyRebalancer__factory(owner).deploy();
        await USDyBUSDRebalancer.initialize(admin.address, router.address, liquidityProvider.address);
        await admin.setUSDyBUSDRebalancer(USDyBUSDRebalancer.address);
        await usdy.setOperator(USDyBUSDRebalancer.address);
        await usdy.setOperator(liquidityProvider.address);
        BUSDVault = await new BUSDVault__factory(owner).deploy();
        daivault = await new DAIVault__factory(owner).deploy();
        usdtvault = await new USDTVault__factory(owner).deploy();
        usdcvault = await new USDCVault__factory(owner).deploy();
        await BUSDVault.initialize(admin.address);
        await admin.setBUSDVault(BUSDVault.address);
        await usdy.setOperator(BUSDVault.address);
        await admin.setOperator(BUSDVault.address);
        await treasury.initialize(owner.address,admin.address);
        await treasury.setRebalancerRole(BUSDVault.address);
        await treasury.setRebalancerRole(USDyBUSDRebalancer.address);
        bysl = await new BYSL__factory(owner).deploy(admin.address);
        await admin.setbYSL(bysl.address);

    });
      describe("YSLBUSDVault", async () => {
          it("YSLBUSDVault: entire flow without affect on peg of usdy", async () => {
            await whitelist.addWhiteList([USDyVault.address, signers[1].address, usdy.address]);
            await whitelist.addWhiteListForSwap([USDyVault.address, signers[1].address, usdy.address]);
            await token.connect(owner).setOperator(USDyVault.address);
            await usdy.connect(owner).mint(signers[1].address, expandTo18Decimals(1000000));
            await usdy.connect(owner).mint(owner.address, expandTo18Decimals(1000000));
            await usdy.connect(signers[1]).approve(USDyVault.address, expandTo18Decimals(10000000));
            await USDyVault.connect(signers[1]).deposit(signers[1].address,expandTo18Decimals(100000),false);
  
            await factory1.createPair(ysl.address, BUSD.address);
            await factory1.createPair(xysl.address, BUSD.address);
            await factory1.createPair(bshare.address, BUSD.address);
            await factory1.createPair(usdy.address, BUSD.address);
            let pair = await factory1.getPair(ysl.address, BUSD.address);
            let pair1 = await factory1.getPair(xysl.address, BUSD.address);
            let pair2 = await factory1.getPair(bshare.address, BUSD.address);
            let Pair = await factory1.getPair(usdy.address, BUSD.address);

            let pair_instance = await new UniswapV2Pair__factory(owner).attach(pair);
            await whitelist.addWhiteList([pair,Pair,signers[1].address,ysl.address, bshareBUSD.address, liquidityProvider.address,
              xYSLBUSD.address, YSLBUSD.address]);
            await whitelist.addWhiteList([pair1,pair2]);
            await whitelist.addWhiteListForSwap([pair, Pair,pair1, signers[1].address, ysl.address, bshareBUSD.address, 
              liquidityProvider.address, xYSLBUSD.address, YSLBUSD.address]);
            await admin.setYSLBUSDVault(YSLBUSD.address);
            await admin.setxYSLBUSDVault(xYSLBUSD.address);
            await admin.setBShareBUSD(bshareBUSD.address);
            await admin.setUSDyBUSDVault(usdyBUSD.address);
            await admin.setUSDyBUSD(Pair);
            await admin.setDAIVault(daivault.address);
            await admin.setUSDTVault(usdtvault.address);
            await admin.setUSDCVault(usdcvault.address);
            await admin.setBuyBackActivationRole(YSLBUSD.address);
            await admin.setBuyBackActivationRole(xYSLBUSD.address);
            await admin.setBuyBackActivationRole(usdyBUSD.address);
            await admin.setBuyBackActivationRole(bshareBUSD.address);
            await admin.setBuyBackActivationRole(USDyVault.address);

            await bshareBUSD.initialize(admin.address, pair2);
            await xYSLBUSD.initialize(admin.address,  pair1);
            await YSLBUSD.initialize(admin.address, pair);
            await daivault.initialize(admin.address,BUSD.address);
            await usdcvault.initialize(admin.address,BUSD.address);
            await usdtvault.initialize(admin.address,BUSD.address);
            await usdyBUSD.initialize(admin.address);
            await factory1.createPair(ysl.address, weth.address);
            await ysl.connect(signers[1]).mint(signers[1].address, expandTo18Decimals(500000000000));
            await ysl.connect(signers[1]).approve(liquidityProvider.address, expandTo18Decimals(4000000000));
            await xysl.connect(signers[1]).mint(signers[1].address, expandTo18Decimals(500000000000));
            await xysl.connect(signers[1]).approve(liquidityProvider.address, expandTo18Decimals(4000000000));
            await BUSD.connect(signers[1]).approve(liquidityProvider.address, expandTo18Decimals(4000000000));
            await bshare.connect(signers[1]).mint(signers[1].address, expandTo18Decimals(500000000000));
            await bshare.connect(signers[1]).approve(liquidityProvider.address, expandTo18Decimals(4000000000));
            await whitelist.addWhiteList([pair,Pair,signers[1].address,ysl.address,xysl.address, YSLBUSD.address,xYSLBUSD.address,usdyBUSD.address,bshareBUSD.address, liquidityProvider.address,USDyVault.address,USDyBUSDRebalancer.address,BUSDVault.address,usdcvault.address,usdtvault.address,daivault.address]);
            await whitelist.addWhiteListForSwap([pair, signers[1].address, ysl.address, YSLBUSD.address, liquidityProvider.address,router.address,USDyBUSDRebalancer.address,BUSDVault.address,usdcvault.address,usdtvault.address,daivault.address]);
            await liquidityProvider.connect(signers[1]).addLiquidity(ysl.address,   BUSD.address, expandTo18Decimals(10000), expandTo18Decimals(10000),expandTo18Decimals(1),expandTo18Decimals(1),treasury.address);
            await liquidityProvider.connect(signers[1]).addLiquidity(xysl.address,  BUSD.address, expandTo18Decimals(10000), expandTo18Decimals(10000),expandTo18Decimals(1),expandTo18Decimals(1),treasury.address);
            await liquidityProvider.connect(signers[1]).addLiquidity(bshare.address,BUSD.address, expandTo18Decimals(10000), expandTo18Decimals(10000),expandTo18Decimals(1),expandTo18Decimals(1),treasury.address);
            await liquidityProvider.connect(signers[1]).addLiquidity(usdy.address,  BUSD.address, expandTo18Decimals(10000), expandTo18Decimals(10000),expandTo18Decimals(1),expandTo18Decimals(1),treasury.address);
            await BUSD.connect(signers[1]).approve(YSLBUSD.address, expandTo18Decimals(100000000));
            await BUSD.connect(signers[2]).approve(YSLBUSD.address, expandTo18Decimals(100000000));
            await usdy.connect(owner).setOperator(YSLBUSD.address);
            await usdy.connect(owner).setOperator(USDyVault.address);
            await ysl.connect(owner).setOperator(YSLBUSD.address);
            await mineBlocks(ethers.provider, 1000);
            await YSLBUSD.connect(signers[1]).deposit(signers[1].address, expandTo18Decimals(100),true);
            await USDyVault.setEpochTime(100);
            await mineBlocks(ethers.provider, 100);
            await USDyVault.connect(owner).rewards();
            await YSLBUSD.connect(signers[1]).deposit(signers[1].address, expandTo18Decimals(100),true);
            await BUSD.connect(signers[1]).approve(BUSDVault.address, expandTo18Decimals(10000));
            await BUSDVault.connect(signers[1]).deposit(signers[1].address,expandTo18Decimals(100),true);
            let path = [usdy.address,BUSD.address];
            await usdy.approve(router.address,expandTo18Decimals(100));
            await USDyBUSDRebalancer.defenderRebalancer();

        });
        it("YSLBUSDVault: below peg", async () => {
          await whitelist.addWhiteList([USDyVault.address, signers[1].address, usdy.address]);
          await whitelist.addWhiteListForSwap([USDyVault.address, signers[1].address, usdy.address]);
          await token.connect(owner).setOperator(USDyVault.address);
          await usdy.connect(owner).mint(signers[1].address, expandTo18Decimals(1000000));
          await usdy.connect(owner).mint(owner.address, expandTo18Decimals(1000000));
          await usdy.connect(signers[1]).approve(USDyVault.address, expandTo18Decimals(10000000));
          await USDyVault.connect(signers[1]).deposit(signers[1].address,expandTo18Decimals(100000),false);

          await factory1.createPair(ysl.address, BUSD.address);
          await factory1.createPair(xysl.address, BUSD.address);
          await factory1.createPair(bshare.address, BUSD.address);
          await factory1.createPair(usdy.address, BUSD.address);
          let pair = await factory1.getPair(ysl.address, BUSD.address);
          let pair1 = await factory1.getPair(xysl.address, BUSD.address);
          let pair2 = await factory1.getPair(bshare.address, BUSD.address);
          let Pair = await factory1.getPair(usdy.address, BUSD.address);

          let pair_instance = await new UniswapV2Pair__factory(owner).attach(pair);
          await whitelist.addWhiteList([pair,Pair,signers[1].address,ysl.address, bshareBUSD.address, liquidityProvider.address,
            xYSLBUSD.address, YSLBUSD.address,BUSDVault.address,usdcvault.address,usdtvault.address,daivault.address]);
          await whitelist.addWhiteList([pair1,pair2]);
          await whitelist.addWhiteListForSwap([pair, Pair,pair1, signers[1].address, ysl.address, bshareBUSD.address, 
            liquidityProvider.address, xYSLBUSD.address, YSLBUSD.address,BUSDVault.address,usdcvault.address,usdtvault.address,daivault.address]);
          await admin.setYSLBUSDVault(YSLBUSD.address);
          await admin.setxYSLBUSDVault(xYSLBUSD.address);
          await admin.setBShareBUSD(bshareBUSD.address);
          await admin.setUSDyBUSDVault(usdyBUSD.address);
          await admin.setUSDyBUSD(Pair);
          await admin.setDAIVault(daivault.address);
          await admin.setUSDTVault(usdtvault.address);
          await admin.setUSDCVault(usdcvault.address);
          await admin.setBuyBackActivationRole(YSLBUSD.address);
          await admin.setBuyBackActivationRole(xYSLBUSD.address);
          await admin.setBuyBackActivationRole(usdyBUSD.address);
          await admin.setBuyBackActivationRole(bshareBUSD.address);
          await admin.setBuyBackActivationRole(USDyVault.address);
          
          await bshareBUSD.initialize(admin.address, pair2);
          await xYSLBUSD.initialize(admin.address,  pair1);
          await YSLBUSD.initialize(admin.address, pair);
          await usdyBUSD.initialize(admin.address);
          await daivault.initialize(admin.address,BUSD.address);
          await usdcvault.initialize(admin.address,BUSD.address);
          await usdtvault.initialize(admin.address,BUSD.address);
          await factory1.createPair(ysl.address, weth.address);
          await ysl.connect(signers[1]).mint(signers[1].address, expandTo18Decimals(500000000000));
          await ysl.connect(signers[1]).approve(liquidityProvider.address, expandTo18Decimals(4000000000));
          await xysl.connect(signers[1]).mint(signers[1].address, expandTo18Decimals(500000000000));
          await xysl.connect(signers[1]).approve(liquidityProvider.address, expandTo18Decimals(4000000000));
          await BUSD.connect(signers[1]).approve(liquidityProvider.address, expandTo18Decimals(4000000000));
          await bshare.connect(signers[1]).mint(signers[1].address, expandTo18Decimals(500000000000));
          await bshare.connect(signers[1]).approve(liquidityProvider.address, expandTo18Decimals(4000000000));
          await whitelist.addWhiteList([pair,Pair,signers[1].address,ysl.address,xysl.address, YSLBUSD.address,xYSLBUSD.address,usdyBUSD.address,bshareBUSD.address, liquidityProvider.address,USDyVault.address,USDyBUSDRebalancer.address,BUSDVault.address]);
          await whitelist.addWhiteListForSwap([pair, signers[1].address, ysl.address, YSLBUSD.address, liquidityProvider.address,router.address,USDyBUSDRebalancer.address,BUSDVault.address]);
          await liquidityProvider.connect(signers[1]).addLiquidity(ysl.address,   BUSD.address, expandTo18Decimals(10000), expandTo18Decimals(10000),expandTo18Decimals(1),expandTo18Decimals(1),treasury.address);
          await liquidityProvider.connect(signers[1]).addLiquidity(xysl.address,  BUSD.address, expandTo18Decimals(10000), expandTo18Decimals(10000),expandTo18Decimals(1),expandTo18Decimals(1),treasury.address);
          await liquidityProvider.connect(signers[1]).addLiquidity(bshare.address,BUSD.address, expandTo18Decimals(10000), expandTo18Decimals(10000),expandTo18Decimals(1),expandTo18Decimals(1),treasury.address);
          await liquidityProvider.connect(signers[1]).addLiquidity(usdy.address,  BUSD.address, expandTo18Decimals(10000), expandTo18Decimals(10000),expandTo18Decimals(1),expandTo18Decimals(1),treasury.address);
          await BUSD.connect(signers[1]).approve(YSLBUSD.address, expandTo18Decimals(100000000));
          await BUSD.connect(signers[2]).approve(YSLBUSD.address, expandTo18Decimals(100000000));
          await usdy.connect(owner).setOperator(YSLBUSD.address);
          await usdy.connect(owner).setOperator(USDyVault.address);
          await ysl.connect(owner).setOperator(YSLBUSD.address);
          await mineBlocks(ethers.provider, 1000);
          await YSLBUSD.connect(signers[1]).deposit(signers[1].address, expandTo18Decimals(100),true);
          await USDyVault.setEpochTime(10)
          await mineBlocks(ethers.provider, 90);
          await USDyVault.connect(owner).rewards();
          await YSLBUSD.connect(signers[1]).deposit(signers[1].address, expandTo18Decimals(100),true);
          await BUSD.connect(signers[1]).approve(BUSDVault.address, expandTo18Decimals(10000));
          await BUSDVault.connect(signers[1]).deposit(signers[1].address,expandTo18Decimals(100),true);
          let path = [usdy.address,BUSD.address];
          await usdy.approve(router.address,expandTo18Decimals(100));
          await router.swapExactTokensForTokens(expandTo18Decimals(100),expandTo18Decimals(1),path,owner.address,1699619244);
          await USDyBUSDRebalancer.defenderRebalancer();

      });
      it("YSLBUSDVault: above peg", async () => {
        await whitelist.addWhiteList([USDyVault.address, signers[1].address, usdy.address]);
        await whitelist.addWhiteListForSwap([USDyVault.address, signers[1].address, usdy.address]);
        await token.connect(owner).setOperator(USDyVault.address);
        await usdy.connect(owner).mint(signers[1].address, expandTo18Decimals(1000000));
        await usdy.connect(owner).mint(owner.address, expandTo18Decimals(1000000));
        await usdy.connect(signers[1]).approve(USDyVault.address, expandTo18Decimals(10000000));
        await USDyVault.connect(signers[1]).deposit(signers[1].address,expandTo18Decimals(100000),false);

        await factory1.createPair(ysl.address, BUSD.address);
        await factory1.createPair(xysl.address, BUSD.address);
        await factory1.createPair(bshare.address, BUSD.address);
        await factory1.createPair(usdy.address, BUSD.address);
        let pair = await factory1.getPair(ysl.address, BUSD.address);
        let pair1 = await factory1.getPair(xysl.address, BUSD.address);
        let pair2 = await factory1.getPair(bshare.address, BUSD.address);
        let Pair = await factory1.getPair(usdy.address, BUSD.address);

        let pair_instance = await new UniswapV2Pair__factory(owner).attach(pair);
        await whitelist.addWhiteList([pair,Pair,signers[1].address,ysl.address, bshareBUSD.address, liquidityProvider.address,
          xYSLBUSD.address, YSLBUSD.address]);
        await whitelist.addWhiteList([pair1,pair2]);
        await whitelist.addWhiteListForSwap([pair, Pair,pair1, signers[1].address, ysl.address, bshareBUSD.address, 
          liquidityProvider.address, xYSLBUSD.address, YSLBUSD.address]);
        await admin.setYSLBUSDVault(YSLBUSD.address);
        await admin.setxYSLBUSDVault(xYSLBUSD.address);
        await admin.setBShareBUSD(bshareBUSD.address);
        await admin.setUSDyBUSDVault(usdyBUSD.address);
        await admin.setUSDyBUSD(Pair);
        await admin.setDAIVault(daivault.address);
        await admin.setUSDTVault(usdtvault.address);
        await admin.setUSDCVault(usdcvault.address);
        await admin.setBuyBackActivationRole(YSLBUSD.address);
        await admin.setBuyBackActivationRole(xYSLBUSD.address);
        await admin.setBuyBackActivationRole(usdyBUSD.address);
        await admin.setBuyBackActivationRole(bshareBUSD.address);
        await admin.setBuyBackActivationRole(USDyVault.address);
        
        await bshareBUSD.initialize(admin.address, pair2);
        await xYSLBUSD.initialize(admin.address,  pair1);
        await YSLBUSD.initialize(admin.address, pair);
        await usdyBUSD.initialize(admin.address);
        await daivault.initialize(admin.address,BUSD.address);
        await usdcvault.initialize(admin.address,BUSD.address);
        await usdtvault.initialize(admin.address,BUSD.address);
        await factory1.createPair(ysl.address, weth.address);
        await ysl.connect(signers[1]).mint(signers[1].address, expandTo18Decimals(500000000000));
        await ysl.connect(signers[1]).approve(liquidityProvider.address, expandTo18Decimals(4000000000));
        await xysl.connect(signers[1]).mint(signers[1].address, expandTo18Decimals(500000000000));
        await xysl.connect(signers[1]).approve(liquidityProvider.address, expandTo18Decimals(4000000000));
        await BUSD.connect(signers[1]).approve(liquidityProvider.address, expandTo18Decimals(4000000000));
        await bshare.connect(signers[1]).mint(signers[1].address, expandTo18Decimals(500000000000));
        await bshare.connect(signers[1]).approve(liquidityProvider.address, expandTo18Decimals(4000000000));
        await whitelist.addWhiteList([pair,Pair,signers[1].address,ysl.address,xysl.address, YSLBUSD.address,xYSLBUSD.address,usdyBUSD.address,bshareBUSD.address, liquidityProvider.address,USDyVault.address,USDyBUSDRebalancer.address,BUSDVault.address,usdcvault.address,usdtvault.address,daivault.address]);
        await whitelist.addWhiteListForSwap([pair, signers[1].address, ysl.address, YSLBUSD.address, liquidityProvider.address,router.address,USDyBUSDRebalancer.address,BUSDVault.address,usdcvault.address,usdtvault.address,daivault.address]);
        await liquidityProvider.connect(signers[1]).addLiquidity(ysl.address,   BUSD.address, expandTo18Decimals(10000), expandTo18Decimals(10000),expandTo18Decimals(1),expandTo18Decimals(1),treasury.address);
        await liquidityProvider.connect(signers[1]).addLiquidity(xysl.address,  BUSD.address, expandTo18Decimals(10000), expandTo18Decimals(10000),expandTo18Decimals(1),expandTo18Decimals(1),treasury.address);
        await liquidityProvider.connect(signers[1]).addLiquidity(bshare.address,BUSD.address, expandTo18Decimals(10000), expandTo18Decimals(10000),expandTo18Decimals(1),expandTo18Decimals(1),treasury.address);
        await liquidityProvider.connect(signers[1]).addLiquidity(usdy.address,  BUSD.address, expandTo18Decimals(10000), expandTo18Decimals(10000),expandTo18Decimals(1),expandTo18Decimals(1),treasury.address);
        await BUSD.connect(signers[1]).approve(YSLBUSD.address, expandTo18Decimals(100000000));
        await BUSD.connect(signers[2]).approve(YSLBUSD.address, expandTo18Decimals(100000000));
        await usdy.connect(owner).setOperator(YSLBUSD.address);
        await usdy.connect(owner).setOperator(USDyVault.address);
        await ysl.connect(owner).setOperator(YSLBUSD.address);
        await mineBlocks(ethers.provider, 1000);
        await YSLBUSD.connect(signers[1]).deposit(signers[1].address, expandTo18Decimals(100),true);
        await USDyVault.setEpochTime(10)
        await mineBlocks(ethers.provider, 90);
        await USDyVault.connect(owner).rewards();
        await YSLBUSD.connect(signers[1]).deposit(signers[1].address, expandTo18Decimals(100),true);
        await BUSD.connect(signers[1]).approve(BUSDVault.address, expandTo18Decimals(10000));
        await BUSDVault.connect(signers[1]).deposit(signers[1].address,expandTo18Decimals(100),true);
        let path = [BUSD.address,usdy.address];
        await BUSD.connect(signers[1]).approve(router.address,expandTo18Decimals(100));
        await router.connect(signers[1]).swapExactTokensForTokens(expandTo18Decimals(100),expandTo18Decimals(1),path,owner.address,1699619244);
        await USDyBUSDRebalancer.defenderRebalancer();

    });
        })
      })
  
