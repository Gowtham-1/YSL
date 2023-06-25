import { ethers } from "hardhat";
import { expect } from "chai";
import { mineBlocks, expandTo18Decimals, expandTo15Decimals, expandTo6Decimals } from "./utilities/utilities";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
    ERC20,
    ERC20__factory,
    BYSL,
    BYSL__factory,
    Treasury,
    Treasury__factory,
    ProtocolOwnedLiquidity,
    ProtocolOwnedLiquidity__factory,
    WhiteList,
    WhiteList__factory,
    WETH9,
    WETH9__factory,
    SwapPage,
    SwapPage__factory, 
    UniswapV2Router02,
    UniswapV2Router02__factory,
    UniswapV2Factory,
    UniswapV2Factory__factory,
    Factory,
    Factory__factory,
    CalHash,
    CalHash__factory,
    Admin,
    Admin__factory,
    EarlyAccess,
    EarlyAccess__factory,
    Referral,
    Referral__factory,
    USDy,
    USDy__factory,
    Blacklist,
    Blacklist__factory,
    Trigger__factory,
    Trigger,
    LiquidityProvider,
    LiquidityProvider__factory,
} from "../typechain";
import { Console } from "console";
describe("SwapPage", async () => {
    let Weth: WETH9;
    let bYSL: BYSL;
    let whitelist: WhiteList;
    let BlackList: Blacklist;
    let owner: SignerWithAddress;
    let signers: SignerWithAddress[];
    let BUSD: ERC20;
    let treasury: Treasury;
    let pol: ProtocolOwnedLiquidity;
    let swappage: SwapPage;
    let router: UniswapV2Router02;
    let factory: UniswapV2Factory;
    let factory1: Factory;
    let calHash: CalHash;
    let admin: Admin;
    let EAT: EarlyAccess;
    let referer: Referral;
    let usdy: USDy;
    let trigger : Trigger;
    let liquidityprovider: LiquidityProvider;
    beforeEach(async () => {
        signers = await ethers.getSigners();
        owner = signers[0];
        admin = await new Admin__factory(owner).deploy();
        await admin.initialize(owner.address,owner.address);
        await admin.setTeamAddress(signers[1].address);
        Weth = await new WETH9__factory(owner).deploy();
        whitelist = await new WhiteList__factory(owner).deploy();
        BlackList = await new Blacklist__factory(owner).deploy();
        calHash = await new CalHash__factory(owner).deploy();
        factory1 = await new Factory__factory(owner).deploy();
        router = await new UniswapV2Router02__factory(owner).deploy(factory1.address, Weth.address);
        await admin.setApeswapRouter(router.address);
        treasury = await new Treasury__factory(owner).deploy();
        trigger = await new Trigger__factory(owner).deploy();
        await admin.setTreasury(treasury.address);
        await admin.setTrigger(trigger.address);
        pol = await new ProtocolOwnedLiquidity__factory(owner).deploy();
        await admin.setPOL(pol.address);
        BUSD = await new ERC20__factory(owner).deploy(expandTo18Decimals(10000000000));
        await admin.setBUSD(BUSD.address);
        await treasury.connect(owner).initialize(owner.address,admin.address);
        await trigger.connect(owner).initialize(owner.address,admin.address,3600);
        bYSL = await new BYSL__factory(owner).deploy(admin.address);
        await admin.setbYSL(bYSL.address);
        swappage = await new SwapPage__factory(owner).deploy();
        await admin.setSwapPage(swappage.address);
        await admin.setWhitelist(whitelist.address);
        await admin.setBlacklist(BlackList.address);
        await whitelist.connect(owner).initialize(admin.address);
        await BlackList.connect(owner).initialize(admin.address);
        await pol.connect(owner).initialize(admin.address);
        await swappage.connect(owner).initialize(admin.address);
        EAT = await new EarlyAccess__factory(owner).deploy();
        await EAT.initialize(admin.address, 16000000);
        await admin.setEarlyAccess(EAT.address);
        usdy = await new USDy__factory(owner).deploy();
        await usdy.initialise(admin.address)
        await admin.setUSDy(usdy.address);
        referer = await new Referral__factory(owner).deploy();
        await referer.initialize(BUSD.address,admin.address);
        await admin.setRefferal(referer.address);
        await swappage.setStartTime(16000000);
        liquidityprovider = await new LiquidityProvider__factory(owner).deploy();
        await liquidityprovider.connect(owner).initialize(router.address,admin.address);
        await factory1.createPair(usdy.address,BUSD.address);
        await usdy.mint(owner.address,expandTo18Decimals(100000000));
        let pair = await factory1.getPair(usdy.address,BUSD.address);
        await whitelist.connect(owner).addWhiteList([pol.address,pair,liquidityprovider.address]);
        await BUSD.approve(liquidityprovider.address,expandTo18Decimals(1000000000));
        await usdy.approve(liquidityprovider.address,expandTo18Decimals(1000000000));
        await liquidityprovider.addLiquidity(usdy.address,BUSD.address,expandTo18Decimals(10000),expandTo18Decimals(10000),expandTo18Decimals(1),expandTo6Decimals(1),treasury.address)
        await bYSL.setBurner(pol.address);
        await bYSL.setMinter(swappage.address);
    });
    describe("SwapPage: ", async () => {
        it("purchase BYSL",async () =>{
        
            await BUSD.connect(owner).transfer(signers[1].address,expandTo18Decimals(1000000));
            await BUSD.connect(signers[1]).approve(swappage.address,expandTo18Decimals(1000000));
            await trigger.connect(owner).reBalancePool();
            await bYSL.connect(signers[1]).approve(pol.address,expandTo18Decimals(10));
            await mineBlocks(ethers.provider, 3600 * 2);
            await swappage.connect(signers[1]).purchaseBYSL(BUSD.address,expandTo18Decimals(1000000));
        });
        it("SELL BYSL ATTACK FUNCTIONALITY ", async () =>{
            await whitelist.connect(owner).addWhiteList([pol.address]);
            await BUSD.connect(owner).transfer(signers[1].address,expandTo18Decimals(10000));
            await BUSD.connect(owner).transfer(pol.address,expandTo18Decimals(10000));
    
            await BUSD.connect(signers[1]).approve(swappage.address,expandTo18Decimals(100));
            await swappage.connect(signers[1]).purchaseBYSL(BUSD.address,expandTo18Decimals(100));
            await trigger.connect(owner).reBalancePool();
            await bYSL.setLockTransactionTime(60);
            await bYSL.mint(owner.address,expandTo18Decimals(1000));
            await mineBlocks(ethers.provider,60);
            await bYSL.connect(signers[1]).approve(pol.address,expandTo18Decimals(10));
            expect(await swappage.connect(signers[1]).sellBYSLviaSWAP(BUSD.address,expandTo18Decimals(10)));
            await expect(swappage.connect(signers[1]).sellBYSLviaSWAP(BUSD.address,expandTo18Decimals(10))).to.be.revertedWith("Pausable: paused");
        })
        it("Purchase with earlyAccess integrated", async () => { 
            await referer.connect(owner).setReferrer(await admin.TeamAddress());
            await referer.connect(signers[2]).setReferrer(owner.address);
            await referer.connect(signers[3]).setReferrer(signers[2].address);
            await referer.connect(owner).setPercentage(10);
            await bYSL.connect(owner).setMinter(owner.address);
            await whitelist.connect(owner).addWhiteList([bYSL.address, pol.address, BUSD.address]);            
            await bYSL.connect(owner).mint(swappage.address, expandTo18Decimals(100000));
            await bYSL.connect(owner).mint(pol.address, expandTo18Decimals(1));
            await BUSD.connect(owner).approve(swappage.address,expandTo18Decimals(1000000000));
            await bYSL.setMinter(swappage.address);
            await BUSD.connect(owner).transfer(referer.address,expandTo18Decimals(1000000));
            await BUSD.connect(owner).transfer(signers[3].address,expandTo18Decimals(100000));
            await BUSD.connect(signers[3]).approve(swappage.address,expandTo18Decimals(1000000000));
            await swappage.connect(signers[3]).purchaseBYSL(BUSD.address, expandTo18Decimals(100000));
            await referer.connect(signers[2]).claimReward();
            
        });

        it("last bidder purchasing at wrong",async () =>{
            await referer.connect(owner).setReferrer(await admin.TeamAddress());
            await referer.connect(signers[2]).setReferrer(owner.address);
            await bYSL.setMinter(swappage.address);
            await BUSD.connect(owner).transfer(signers[2].address,expandTo18Decimals(1000000));
            await BUSD.connect(owner).transfer(signers[3].address,expandTo18Decimals(1000000));
            await BUSD.connect(owner).transfer(signers[4].address,expandTo18Decimals(1000000));
            await BUSD.connect(owner).transfer(signers[5].address,expandTo18Decimals(1000000));
            await whitelist.connect(owner).addWhiteList([bYSL.address, pol.address, BUSD.address,signers[5].address]); 
            await EAT.setDuration(1);
            await mineBlocks(ethers.provider,3600);
            await EAT.endTheAuction();           
            await BUSD.connect(signers[5]).approve(swappage.address,expandTo18Decimals(1000000000));
            await swappage.connect(signers[5]).purchaseBYSL(BUSD.address, expandTo18Decimals(30000));
            await bYSL.connect(signers[5]).transfer(signers[2].address,expandTo18Decimals(1))
        })
        it("exchangeBYSLForBUSD for BackedPrice", async () => {
            await referer.connect(owner).setReferrer(await admin.TeamAddress());
            await bYSL.connect(owner).setMinter(owner.address);
            await whitelist.connect(owner).addWhiteList([bYSL.address, pol.address, BUSD.address]);            
            await bYSL.connect(owner).mint(swappage.address, expandTo18Decimals(100000));
            await bYSL.connect(owner).mint(pol.address, expandTo18Decimals(100000));
            await BUSD.connect(owner).approve(swappage.address,expandTo18Decimals(1000000000));
            await bYSL.setMinter(swappage.address);
            await swappage.connect(owner).purchaseBYSL(BUSD.address, expandTo18Decimals(100000));
        });
        it("sellBYSLviaSwap",async () =>{
            await referer.connect(owner).setReferrer(await admin.TeamAddress());
            await referer.connect(signers[2]).setReferrer(owner.address);
            await referer.connect(signers[3]).setReferrer(signers[2].address);
            await referer.connect(owner).setPercentage(10);
            await bYSL.connect(owner).setMinter(owner.address);
            await whitelist.connect(owner).addWhiteList([bYSL.address, pol.address, BUSD.address]);    
            await BUSD.transfer(signers[3].address, expandTo18Decimals(10000000));
      
            await BUSD.connect(signers[3]).approve(swappage.address,expandTo18Decimals(1000000000));
            await bYSL.setMinter(swappage.address);
            await bYSL.setMinter(pol.address);
            await swappage.connect(signers[3]).purchaseBYSL(BUSD.address, expandTo18Decimals(1000000));
            await trigger.reBalancePool();
            await bYSL.connect(signers[3]).approve(pol.address,await bYSL.balanceOf(signers[3].address));
            await bYSL.connect(owner).setLockTransactionTime(3600);
            await mineBlocks(ethers.provider,3600);
            
            await bYSL.setBackPriceRatio(25);
            await swappage.connect(signers[3]).sellBYSLviaSWAP(BUSD.address,expandTo18Decimals(400));
            
        })

        it("sellBYSLviaSwap protocol price",async () =>{
            await referer.connect(owner).setReferrer(await admin.TeamAddress());
            await referer.connect(signers[2]).setReferrer(owner.address);
            await referer.connect(signers[3]).setReferrer(signers[2].address);
            await referer.connect(owner).setPercentage(10);
            await bYSL.connect(owner).setMinter(owner.address);
            await whitelist.connect(owner).addWhiteList([bYSL.address, pol.address, BUSD.address]);    
            await BUSD.transfer(signers[3].address, expandTo18Decimals(10000000));
            await BUSD.connect(signers[3]).approve(swappage.address,expandTo18Decimals(1000000000));
            await bYSL.setMinter(swappage.address);
            await bYSL.setMinter(pol.address);
            await swappage.connect(signers[3]).purchaseBYSL(BUSD.address, expandTo18Decimals(1000000));
            await trigger.reBalancePool();
            await bYSL.connect(signers[3]).approve(pol.address,await bYSL.balanceOf(signers[3].address));
            await bYSL.connect(owner).setLockTransactionTime(3600);
            await mineBlocks(ethers.provider,3600);

            await bYSL.setBackPriceRatio(25);
            await swappage.connect(signers[3]).sellBYSLviaSWAP(BUSD.address,expandTo18Decimals(40));

        })
    });
});
