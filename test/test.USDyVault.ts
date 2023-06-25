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
  YSLVault__factory,
  XYSLVault__factory,
  YSLVault,
  XYSLVault
} from "../typechain";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";
import { mineBlocks, expandTo18Decimals } from "./utilities/utilities";
import { expect } from "chai";
import exp, { SIGABRT } from "constants";
import { sign } from "crypto";


describe("USDyVault", async () => {
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
  let BUSD: ERC20;
  let token: Receipt;
  let bshareBUSD : BSHAREBUSDVault;
  let ysl : YSL;
  let usdy : USDy;
  let usdyBUSD : USDyBUSDVault;
  let liquidityProvider : LiquidityProvider;
  let blacklist: Blacklist;
  let USDyVault: USDyVault;
  let xYSLBUSD: XYSLBUSDVault;
  let YSLBUSD: YSLBUSDVault;
  let yslVault: YSLVault;
  let xyslVault: XYSLVault;
  let xYSL : XYSL;
  beforeEach(async () => {
    signers = await ethers.getSigners();
    owner = signers[0];
    admin= await new Admin__factory(owner).deploy();
    factory1 = await new Factory__factory(owner).deploy();
    weth = await new WETH9__factory(owner).deploy();
    token = await new Receipt__factory(owner).deploy();
    liquidityProvider = await new LiquidityProvider__factory(owner).deploy();
    router = await new UniswapV2Router02__factory(owner).deploy(factory1.address, weth.address);    
    
    await admin.initialize(owner.address, owner.address);
    calHash = await new CalHash__factory(owner).deploy();
    factory1 = await new Factory__factory(owner).deploy();
    whitelist = await new WhiteList__factory(owner).deploy();
    blacklist = await new Blacklist__factory(owner).deploy();
    await whitelist.initialize(admin.address);
    await blacklist.initialize(admin.address);
    treasury= await new Treasury__factory(owner).deploy();
    pol= await new ProtocolOwnedLiquidity__factory(owner).deploy();
    router = await new UniswapV2Router02__factory(owner).deploy(factory1.address, weth.address);
    bshareBUSD = await new BSHAREBUSDVault__factory(owner).deploy();
    usdyBUSD = await new USDyBUSDVault__factory(owner).deploy();
    xYSLBUSD = await new XYSLBUSDVault__factory(owner).deploy();
    YSLBUSD = await new YSLBUSDVault__factory(owner).deploy();
    yslVault = await new YSLVault__factory(owner).deploy();
    xyslVault = await new XYSLVault__factory(owner).deploy();
    await admin.setxYSLBUSDVault(xYSLBUSD.address);
    await admin.setYSLBUSDVault(YSLBUSD.address);
    await admin.setBShareBUSD(bshareBUSD.address);
    await admin.setUSDyBUSDVault(usdyBUSD.address);
    await admin.setWBNB(weth.address) ;
    await admin.setWhitelist(whitelist.address);
    await admin.setBlacklist(blacklist.address);
    await admin.setPOL(pol.address) ; 
    await admin.setTreasury(treasury.address); 
    
    await admin.setApeswapRouter(router.address);  
    await admin.setLiquidityProvider(liquidityProvider.address);
    await admin.setmasterNTT(token.address);
    await admin.setUSDs(token.address);
    await admin.setYSLVault(yslVault.address);
    await admin.setxYSLVault(xyslVault.address);
    BUSD = await new ERC20__factory(owner).deploy(expandTo18Decimals(100000000000)); 
    await BUSD.transfer(treasury.address, expandTo18Decimals(50000));
    await BUSD.transfer(pol.address, expandTo18Decimals(50000));
    await admin.setBUSD(BUSD.address);

    bshare = await new BSHARE__factory(owner).deploy();
    await bshare.initialise(admin.address);
    ysl = await new YSL__factory(owner).deploy();
    xYSL =await new XYSL__factory(owner).deploy();
    await ysl.initialise(admin.address);
    await xYSL.initialise(admin.address,token.address)
    await admin.setYSL(ysl.address);
    await admin.setxYSL(xYSL.address);
    await admin.setBShare(bshare.address);
    await token.connect(owner).initialize(admin.address, owner.address, "ReceiptToken", "Token");
    usdy = await new USDy__factory(owner).deploy();
    await usdy.initialise(admin.address);
    await admin.setUSDy(usdy.address);
    USDyVault = await new USDyVault__factory(owner).deploy();
    await admin.setUSDyVault(USDyVault.address);
    await USDyVault.initialize(admin.address);
    await yslVault.initialize(admin.address,owner.address);
    await xyslVault.initialize(admin.address);
    await ysl.mint(owner.address,expandTo18Decimals(100000000));
    await xYSL.mint(owner.address,expandTo18Decimals(100000000));
    await usdy.mint(owner.address,expandTo18Decimals(100000000));
    await bshare.mint(owner.address,expandTo18Decimals(100000000));
    await liquidityProvider.initialize(router.address, admin.address);
    await USDyVault.setEpochTime(10);


  });
  describe("USDyVault: Deposit", async () => {
      it("USDyVault: Deposit function", async ()=> {
        await ysl.connect(owner).approve(liquidityProvider.address,expandTo18Decimals(10000));
        await xYSL.connect(owner).approve(liquidityProvider.address,expandTo18Decimals(10000));
        await usdy.connect(owner).approve(liquidityProvider.address,expandTo18Decimals(10000));
        await bshare.connect(owner).approve(liquidityProvider.address,expandTo18Decimals(10000));
        await BUSD.connect(owner).approve(liquidityProvider.address,expandTo18Decimals(100000000));
        await factory1.createPair(xYSL.address, BUSD.address);
        await factory1.createPair(ysl.address, BUSD.address);
        await factory1.createPair(usdy.address, BUSD.address);
        await factory1.createPair(bshare.address, BUSD.address);
        let pair1 = await factory1.getPair(xYSL.address, BUSD.address);
        let pair2 = await factory1.getPair(ysl.address, BUSD.address);
        let pair3 = await factory1.getPair(usdy.address, BUSD.address);
        let pair4 = await factory1.getPair(bshare.address, BUSD.address);
        await YSLBUSD.initialize(admin.address,pair2);
        await xYSLBUSD.initialize(admin.address,pair1);
        await usdyBUSD.initialize(admin.address);
        await bshareBUSD.initialize(admin.address,pair4);
        await whitelist.addWhiteList([USDyVault.address, owner.address,signers[1].address,signers[2].address,signers[3].address, usdy.address,ysl.address,xYSL.address,bshare.address, yslVault.address,xyslVault.address,xYSLBUSD.address,YSLBUSD.address,bshareBUSD.address,usdyBUSD.address,liquidityProvider.address,pair1,pair2,pair3,pair4]);
        await whitelist.addWhiteListForSwap([USDyVault.address,owner.address, signers[1].address,signers[2].address,signers[3].address, usdy.address,ysl.address,xYSL.address,bshare.address,yslVault.address,xyslVault.address,xYSLBUSD.address,YSLBUSD.address,bshareBUSD.address,usdyBUSD.address,liquidityProvider.address,pair1,pair2,pair3,pair4]);
        await liquidityProvider.connect(owner).addLiquidity(ysl.address,BUSD.address,expandTo18Decimals(100),expandTo18Decimals(100),1,1,owner.address);
        await liquidityProvider.connect(owner).addLiquidity(xYSL.address,BUSD.address,expandTo18Decimals(100),expandTo18Decimals(100),1,1,owner.address);
        await liquidityProvider.connect(owner).addLiquidity(usdy.address,BUSD.address,expandTo18Decimals(100),expandTo18Decimals(100),1,1,owner.address);
        await liquidityProvider.connect(owner).addLiquidity(bshare.address,BUSD.address,expandTo18Decimals(100),expandTo18Decimals(100),1,1,owner.address);


        await token.connect(owner).setOperator(USDyVault.address);
        await usdy.connect(owner).setOperator(USDyVault.address);
        await usdy.connect(owner).mint(signers[1].address, expandTo18Decimals(1000000));
        await usdy.connect(owner).mint(signers[2].address, expandTo18Decimals(1000000));
        await usdy.connect(owner).mint(signers[3].address, expandTo18Decimals(1000000));
        await usdy.connect(signers[1]).approve(USDyVault.address, expandTo18Decimals(10000000));
        await usdy.connect(signers[2]).approve(USDyVault.address, expandTo18Decimals(10000000));
        await usdy.connect(signers[3]).approve(USDyVault.address, expandTo18Decimals(10000000));
        await USDyVault.connect(signers[1]).deposit(signers[1].address, expandTo18Decimals(100000), false);
        await USDyVault.connect(signers[2]).deposit(signers[2].address, expandTo18Decimals(100000), false);
        await USDyVault.connect(signers[3]).deposit(signers[3].address, expandTo18Decimals(100000), false);
        expect(await USDyVault.connect(signers[1]).UserDeposit(signers[1].address)).to.be.eq(expandTo18Decimals(90000));

      });
      it("USDyVault: Deposit by User multiple Times",  async ()=> { 
        await whitelist.addWhiteList([USDyVault.address, signers[1].address, usdy.address]);
        await whitelist.addWhiteListForSwap([USDyVault.address, signers[1].address, usdy.address]);
        await token.connect(owner).setOperator(USDyVault.address);
        await usdy.connect(owner).mint(signers[1].address, expandTo18Decimals(1000000));
        await usdy.connect(signers[1]).approve(USDyVault.address, expandTo18Decimals(10000000));
        await USDyVault.connect(signers[1]).deposit(signers[1].address, expandTo18Decimals(100000), false);
        expect(await USDyVault.connect(signers[1]).UserDeposit(signers[1].address)).to.be.eq(expandTo18Decimals(90000));
        await USDyVault.connect(signers[1]).deposit(signers[1].address, expandTo18Decimals(100000) , false);
      });
      it("USDyVault:  User Deposit 0 USDy token", async ()=> {
        await whitelist.addWhiteList([USDyVault.address, signers[1].address, usdy.address]);
        await whitelist.addWhiteListForSwap([USDyVault.address, signers[1].address, usdy.address]);
        await token.connect(owner).setOperator(USDyVault.address);
        await usdy.connect(owner).mint(signers[1].address, expandTo18Decimals(1000000));
        await usdy.connect(signers[1]).approve(USDyVault.address, expandTo18Decimals(10000000));
        await expect(USDyVault.connect(signers[1]).deposit(signers[1].address, expandTo18Decimals(0),false)).to.be.revertedWith("USDyVault: Deposit amount can't be zero");
      });
  });
  describe("USdyVault: Withdraw Function", async ()=> { 
    it("USDyVault: Withdraw function", async ()=> { 
      await whitelist.addWhiteList([USDyVault.address, signers[1].address, usdy.address]);
      await whitelist.addWhiteListForSwap([USDyVault.address, signers[1].address, usdy.address]);
      await token.connect(owner).setOperator(USDyVault.address);
      await usdy.connect(owner).mint(signers[1].address, expandTo18Decimals(10000));
      await usdy.connect(signers[1]).approve(USDyVault.address, expandTo18Decimals(10000000));
      await USDyVault.connect(signers[1]).deposit(signers[1].address, expandTo18Decimals(10000), false);
      expect(await USDyVault.connect(signers[1]).UserDeposit(signers[1].address)).to.be.eq(expandTo18Decimals(9000));
      await usdy.connect(owner).setOperator(usdyBUSD.address);
      await token.setOperator(USDyVault.address);
      await usdy.connect(owner).mint(signers[1].address, expandTo18Decimals(1000000000000));
      await USDyVault.connect(signers[1]).withdraw(signers[1].address, expandTo18Decimals(9000), signers[1].address);
      expect(await USDyVault.connect(signers[1]).UserDeposit(signers[1].address)).to.be.eq(expandTo18Decimals(0));
    });
    it("USDyVault: Withdraw multiple times", async ()=> { 
      await whitelist.addWhiteList([USDyVault.address, signers[1].address, usdy.address]);
      await whitelist.addWhiteListForSwap([USDyVault.address, signers[1].address, usdy.address]);
      await token.connect(owner).setOperator(USDyVault.address);
      await usdy.connect(owner).mint(signers[1].address, expandTo18Decimals(1000000));
      await usdy.connect(signers[1]).approve(USDyVault.address, expandTo18Decimals(10000000));
      await USDyVault.connect(signers[1]).deposit(signers[1].address, expandTo18Decimals(10000),false);
      expect(await USDyVault.connect(signers[1]).UserDeposit(signers[1].address)).to.be.eq(expandTo18Decimals(9000));
      await usdy.connect(owner).setOperator(usdyBUSD.address);
      await token.setOperator(USDyVault.address);
      await usdy.connect(owner).mint(signers[1].address, expandTo18Decimals(1000000000000));     
      await USDyVault.connect(signers[1]).withdraw(signers[1].address, expandTo18Decimals(9000), signers[1].address);
      expect(await USDyVault.connect(signers[1]).UserDeposit(signers[1].address)).to.be.eq(expandTo18Decimals(0));
      await USDyVault.connect(signers[1]).deposit(signers[1].address, expandTo18Decimals(90000),false);
      await USDyVault.connect(signers[1]).deposit(signers[1].address, expandTo18Decimals(90000),false);
      expect(await USDyVault.connect(signers[1]).UserDeposit(signers[1].address)).to.be.eq("137789010989010989042737");
      await USDyVault.connect(signers[1]).withdraw(signers[1].address, expandTo18Decimals(10000), signers[1].address);
      expect(await USDyVault.connect(signers[1]).UserDeposit(signers[1].address)).to.be.eq("127789010989010989042737");
      await USDyVault.connect(signers[1]).withdraw(signers[1].address, expandTo18Decimals(10000), signers[1].address);
      expect(await USDyVault.connect(signers[1]).UserDeposit(signers[1].address)).to.be.eq("117789010989010989042737");
    });
  });
  });
