import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";
import { mineBlocks, expandTo18Decimals, expandTo16Decimals,expandTo15Decimals,expandTo17Decimals } from "./utilities/utilities";
import { expect } from "chai";
import { Admin, Admin__factory, Blacklist, Blacklist__factory, BSHARE, BSHAREBUSDVault, BSHAREBUSDVault__factory, BSHARE__factory, BYSL, BYSLVault__factory, BYSL__factory, ClaimStakeAll, ClaimStakeAll__factory, Factory, Factory__factory, LiquidityProvider, LiquidityProvider__factory, ProtocolOwnedLiquidity, ProtocolOwnedLiquidity__factory, Receipt, Receipt__factory, Referral, Referral__factory, SwapPage, SwapPage__factory, Treasury, Treasury__factory, Trigger, Trigger__factory, UniswapV2Pair__factory, UniswapV2Router02, UniswapV2Router02__factory, USDy, USDyBUSDVault, USDyBUSDVault__factory, USDyVault, USDyVault__factory, USDy__factory, WETH9, WETH9__factory, WhiteList, WhiteList__factory, XYSL, XYSLBUSDVault, XYSLBUSDVault__factory, XYSL__factory, YSL, YSLBUSDVault, YSLBUSDVault__factory, YSL__factory } from "../typechain";

describe("Stake_Claim_All",async () => {
    let owner: SignerWithAddress;
    let signers: SignerWithAddress[];
    let admin : Admin;
    let busd : Receipt;
    let receipt : Receipt;
    let factory : Factory;
    let weth : WETH9;
    let router : UniswapV2Router02;
    let whitelist : WhiteList;
    let blacklist : Blacklist;
    let liquidityProvider : LiquidityProvider;
    let usdy : USDy;
    let ysl : YSL;
    let bysl : BYSL;
    let pol : ProtocolOwnedLiquidity;
    let oldxysl : Receipt;
    let xysl : XYSL;
    let bshare : BSHARE;
    let trigger : Trigger;
    let treasury : Treasury;
    let swappage : SwapPage;
    let refferal : Referral;
    let usdyVault : USDyVault;
    let usdybusdVault : USDyBUSDVault;
    let yslbusdVault : YSLBUSDVault;
    let xyslbusdVault : XYSLBUSDVault;
    let bsharebusdVault :BSHAREBUSDVault;
    let stake_claimAll : ClaimStakeAll;


    beforeEach(async () => {
        signers = await ethers.getSigners();
        owner = signers[0];
        admin =await new Admin__factory(owner).deploy();
        await admin.initialize(owner.address, owner.address);
        busd = await new Receipt__factory(owner).deploy();
        await busd.initialize(admin.address,owner.address,"BUSD","TKN");
        whitelist = await new WhiteList__factory(owner).deploy();
        blacklist = await new Blacklist__factory(owner).deploy();
        await whitelist.initialize(admin.address);
        await blacklist.initialize(admin.address);
        factory = await new Factory__factory(owner).deploy();
        weth = await new WETH9__factory(owner).deploy();
        router = await new UniswapV2Router02__factory(owner).deploy(factory.address,weth.address);
        await admin.setBUSD(busd.address);
        await admin.setWBNB(weth.address) ;
        await admin.setApeswapRouter(router.address);
        receipt = await new Receipt__factory(owner).deploy();
        await receipt.initialize(admin.address,owner.address,"receipt","receipt");
        await admin.setmasterNTT(receipt.address);
        usdy = await new USDy__factory(owner).deploy();
        await admin.setUSDy(usdy.address);
        await usdy.initialise(admin.address);
        bshare = await new BSHARE__factory(owner).deploy();
        await admin.setBShare(bshare.address);
        await bshare.initialise(admin.address);
        ysl = await new YSL__factory(owner).deploy();
        await admin.setYSL(ysl.address);
        await ysl.initialise(admin.address);
        oldxysl = await new Receipt__factory(owner).deploy();
        await oldxysl.initialize(admin.address,owner.address,"abcd","abcd");
        xysl = await new XYSL__factory(owner).deploy();
        await admin.setxYSL(xysl.address);
        await xysl.initialise(admin.address,oldxysl.address);
        liquidityProvider = await new LiquidityProvider__factory(owner).deploy();
        await admin.setLiquidityProvider(liquidityProvider.address);
        await liquidityProvider.initialize(router.address,admin.address);
        trigger = await new Trigger__factory(owner).deploy();
        await admin.setTrigger(trigger.address);
        treasury= await new Treasury__factory(owner).deploy();
        await admin.setTreasury(treasury.address);
        pol= await new ProtocolOwnedLiquidity__factory(owner).deploy(); 
        await admin.setPOL(pol.address);
        await busd.connect(owner).mint(treasury.address,expandTo18Decimals(20000));
        await busd.connect(owner).mint(pol.address,expandTo18Decimals(10000));
        bysl = await new BYSL__factory(owner).deploy(admin.address);
        await admin.setbYSL(bysl.address);
        swappage = await new SwapPage__factory(owner).deploy();
        await admin.setSwapPage(swappage.address);
        refferal = await new Referral__factory(owner).deploy();
        await admin.setRefferal(refferal.address);
        usdyVault = await new USDyVault__factory(owner).deploy();
        await admin.setUSDyVault(usdyVault.address);
        await usdyVault.initialize(admin.address);
        yslbusdVault = await new YSLBUSDVault__factory(owner).deploy();
        await admin.setYSLBUSDVault(yslbusdVault.address);
        await factory.createPair(ysl.address, busd.address);
        let Pair1 = await factory.getPair(ysl.address, busd.address);
        await yslbusdVault.initialize(admin.address, Pair1);
        xyslbusdVault = await new XYSLBUSDVault__factory(owner).deploy();
        await admin.setxYSLBUSDVault(xyslbusdVault.address);
        await factory.createPair(xysl.address, busd.address);
        let Pair2 = await factory.getPair(xysl.address, busd.address);
        await xyslbusdVault.initialize(admin.address, Pair2);
        bsharebusdVault = await new BSHAREBUSDVault__factory(owner).deploy();
        await admin.setBShareBUSD(bsharebusdVault.address);
        await factory.createPair(bshare.address, busd.address);
        let Pair = await factory.getPair(bshare.address, busd.address);
        await bsharebusdVault.initialize(admin.address, Pair);
        usdybusdVault= await new USDyBUSDVault__factory(owner).deploy();
        await admin.setUSDyBUSDVault(usdybusdVault.address);
        await factory.createPair(usdy.address,busd.address);
        let pair = await factory.getPair(usdy.address,busd.address);
        await usdybusdVault.connect(owner).initialize(admin.address);
        await treasury.initialize(owner.address,admin.address);
        await trigger.initialize(owner.address,admin.address,30);
        await swappage.initialize(admin.address);
        await pol.initialize(admin.address);
        await refferal.initialize(busd.address,admin.address);
        await refferal.setRole(usdybusdVault.address);
        await admin.setTeamAddress(owner.address);
        await admin.setWhitelist(whitelist.address) ;
        await admin.setBlacklist(blacklist.address);
        stake_claimAll = await new ClaimStakeAll__factory(owner).deploy();
        await stake_claimAll.initialize(admin.address);
    })

    it("addSingleVault",async() => {
        await whitelist.connect(owner).addWhiteList([usdy.address,owner.address,stake_claimAll.address,usdyVault.address]);
        await usdy.connect(owner).mint(owner.address,expandTo18Decimals(10000));
        await stake_claimAll.connect(owner).addSingleVault([usdyVault.address],[usdy.address]);
    })

    it("removeSingleVault",async() => {
        await whitelist.connect(owner).addWhiteList([usdy.address,owner.address,stake_claimAll.address,usdyVault.address]);
        await usdy.connect(owner).mint(owner.address,expandTo18Decimals(10000));
        await stake_claimAll.connect(owner).addSingleVault([usdyVault.address],[usdy.address]);
        await stake_claimAll.connect(owner).removeSingleVault([usdyVault.address]);
    })

    it("addVault",async() => {
        await whitelist.connect(owner).addWhiteList([usdy.address,owner.address,stake_claimAll.address]);
        await usdy.connect(owner).mint(owner.address,expandTo18Decimals(10000));
        await stake_claimAll.connect(owner).addVault([usdybusdVault.address]);
    })

    it("removeVault",async() => {
        await whitelist.connect(owner).addWhiteList([usdy.address,owner.address,stake_claimAll.address]);
        await usdy.connect(owner).mint(owner.address,expandTo18Decimals(10000));
        await stake_claimAll.connect(owner).addVault([usdybusdVault.address]);
        await stake_claimAll.connect(owner).removeVault([usdybusdVault.address]);
    })

    it("stakeAll",async() => {
        await whitelist.connect(owner).addWhiteList([usdy.address,owner.address,stake_claimAll.address,usdyVault.address]);
        await usdy.connect(owner).mint(owner.address,expandTo18Decimals(1000));
        await usdy.connect(owner).approve(usdyVault.address,expandTo18Decimals(1000));
        expect(await usdy.connect(owner).balanceOf(owner.address)).to.be.eq(expandTo18Decimals(1000));
        await stake_claimAll.connect(owner).addSingleVault([usdyVault.address],[usdy.address]);
        await stake_claimAll.connect(owner).stakeAll();
    })

    it("stakeAll after staked once",async() => {
        await whitelist.connect(owner).addWhiteList([usdy.address,owner.address,stake_claimAll.address,usdyVault.address]);
        await usdy.connect(owner).mint(owner.address,expandTo18Decimals(1000));
        await usdy.connect(owner).approve(usdyVault.address,expandTo18Decimals(1000));
        expect(await usdy.connect(owner).balanceOf(owner.address)).to.be.eq(expandTo18Decimals(1000));
        await stake_claimAll.connect(owner).addSingleVault([usdyVault.address],[usdy.address]);
        await stake_claimAll.connect(owner).stakeAll();
        await stake_claimAll.connect(owner).stakeAll();
    })

})