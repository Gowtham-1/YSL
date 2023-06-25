import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { expect } from "chai";
import { ethers } from "hardhat";
import { Admin, Admin__factory, Blacklist, Blacklist__factory, BYSL, BYSL__factory, CalHash, CalHash__factory, EarlyAccess, EarlyAccess__factory, ERC20, ERC20__factory, Factory, Factory__factory, LiquidityProvider, LiquidityProvider__factory, ProtocolOwnedLiquidity, ProtocolOwnedLiquidity__factory, Referral, Referral__factory, SwapPage, SwapPage__factory, TemporaryHolding, TemporaryHolding__factory, Treasury, Treasury__factory, Trigger, Trigger__factory, UniswapV2Factory, UniswapV2Pair__factory, UniswapV2Router02, UniswapV2Router02__factory, USDy, USDy__factory, WETH9, WETH9__factory, WhiteList, WhiteList__factory, YSL, YSL__factory } from "../typechain";
import { expandTo18Decimals, expandTo6Decimals, mineBlocks } from "./utilities/utilities";

describe("POL", async ()=>{
    let signers : SignerWithAddress[];
    let owner : SignerWithAddress;
    let pol : ProtocolOwnedLiquidity;
    let busd : ERC20;
    let refferalToken : ERC20;
    let weth : WETH9;
    let Factory : Factory; 
    let router : UniswapV2Router02;
    let bysl : BYSL;
    let treasury : Treasury;
    let Admin : Admin;
    let swapPage : SwapPage;
    let trigger : Trigger;
    let refferal : Referral;
    let whitelist : WhiteList;
    let blackList : Blacklist;
    let liquidityprovider: LiquidityProvider;
    let ysl: YSL;
    let calhash: CalHash;
    let usdy : USDy;
    let earlyAccess: EarlyAccess;
    let TemporaryHolding: TemporaryHolding;

    beforeEach("POL", async () => {
        signers = await ethers.getSigners();
        owner = signers[0];
        Admin = await new Admin__factory(owner).deploy();
        await Admin.initialize(owner.address,owner.address);
        weth = await new WETH9__factory(owner).deploy();
        await Admin.setWBNB(weth.address);
        Factory = await new Factory__factory(owner).deploy();
        router = await new UniswapV2Router02__factory(owner).deploy(Factory.address,weth.address);
        await Admin.setApeswapRouter(router.address);
        whitelist = await new WhiteList__factory(owner).deploy();
        await whitelist.initialize(Admin.address);
        await Admin.setWhitelist(whitelist.address);
        blackList  = await new Blacklist__factory(owner).deploy();
        await blackList.initialize(Admin.address);
        await Admin.setBlacklist(blackList.address);
        calhash = await new CalHash__factory(owner).deploy();
        busd = await new ERC20__factory(owner).deploy(expandTo18Decimals(1000000000000));
        await Admin.setBUSD(busd.address);
        trigger = await new Trigger__factory(owner).deploy();
        await Admin.setTrigger(trigger.address);
        treasury =  await new Treasury__factory(owner).deploy();
        await Admin.setTreasury(treasury.address);
        pol = await new ProtocolOwnedLiquidity__factory(owner).deploy();
        await Admin.setPOL(pol.address);
        bysl = await new BYSL__factory(owner).deploy(Admin.address);
        await Admin.setbYSL(bysl.address);
        earlyAccess = await new EarlyAccess__factory(owner).deploy();
        await earlyAccess.initialize(Admin.address,16000000);
        await Admin.setEarlyAccess(earlyAccess.address);
        swapPage = await new SwapPage__factory(owner).deploy();
        await Admin.setSwapPage(swapPage.address);
        await busd.connect(owner).transfer(treasury.address,expandTo18Decimals(10000));
        await busd.connect(owner).transfer(pol.address,expandTo18Decimals(10000));
        refferalToken = await new ERC20__factory(owner).deploy(expandTo18Decimals(10000000)); 
        usdy = await new USDy__factory(owner).deploy();
        await usdy.initialise(Admin.address);
        await Admin.setUSDy(usdy.address);    
        refferal = await new Referral__factory(owner).deploy();
        await refferal.initialize(refferalToken.address,Admin.address);
        await Admin.setRefferal(refferal.address);
        liquidityprovider = await new LiquidityProvider__factory(owner).deploy();
        await liquidityprovider.connect(owner).initialize(router.address,Admin.address);
        await Admin.setBUSD(busd.address);
        await Admin.setApeswapRouter(router.address);
        ysl = await new YSL__factory(owner).deploy();
        await ysl.initialise(Admin.address);
        await swapPage.connect(owner).initialize(Admin.address);
        await pol.connect(owner).initialize(Admin.address);
        await trigger.connect(owner).initialize(owner.address,Admin.address,24);
        await treasury.connect(owner).initialize(owner.address,Admin.address);  
        await Admin.setYSL(ysl.address);
        await Admin.setLiquidityProvider(liquidityprovider.address);
        await Admin.setTeamAddress(signers[6].address);
        await bysl.setLockTransactionTime(3600);
        await Admin.setOperator(owner.address);
        await bysl.connect(owner).setMinter(owner.address);
        await bysl.connect(owner).setMinter(swapPage.address);
        await bysl.connect(owner).setMinter(pol.address);
        usdy = await new USDy__factory(owner).deploy();
        await usdy.initialise(Admin.address);
        await Admin.setUSDy(usdy.address);
        await swapPage.setStartTime(16000000);
        await Factory.createPair(usdy.address,busd.address);
        await usdy.mint(owner.address,expandTo18Decimals(100000000));
        let pair = await Factory.getPair(usdy.address,busd.address);
        TemporaryHolding = await new TemporaryHolding__factory(owner).deploy();
        await TemporaryHolding.initialize(owner.address,Admin.address);
        await whitelist.connect(owner).addWhiteList([pol.address,pair,liquidityprovider.address,TemporaryHolding.address]);
        await busd.approve(liquidityprovider.address,expandTo18Decimals(1000000000));
        await usdy.approve(liquidityprovider.address,expandTo18Decimals(1000000000));
        await liquidityprovider.addLiquidity(usdy.address,busd.address,expandTo18Decimals(10000),expandTo18Decimals(10000),expandTo18Decimals(1),expandTo6Decimals(1),treasury.address)
        
    })

    it(" Treasury EmergencyWithdraw",async () =>{
        await whitelist.connect(owner).addWhiteList([pol.address]);
        await busd.connect(owner).transfer(signers[1].address,expandTo18Decimals(10000000));
        await busd.connect(signers[1]).approve(swapPage.address,expandTo18Decimals(10000000));
        await swapPage.connect(signers[1]).purchaseBYSL(busd.address,expandTo18Decimals(10000000));
        await treasury.connect(owner).emergencyWithdraw();
    });
    it(" Trigger Rebalancer",async () =>{
        await whitelist.connect(owner).addWhiteList([pol.address]);
        await busd.connect(owner).transfer(signers[1].address,expandTo18Decimals(10000000));
        await busd.connect(signers[1]).approve(swapPage.address,expandTo18Decimals(10000000));
        await swapPage.connect(signers[1]).purchaseBYSL(busd.address,expandTo18Decimals(10000000));
        await trigger.connect(owner).reBalancePool();
    });

    describe("Treasury", async()=>{
            it("Treasuty: Remove Liquidity",async()=>{
                await Factory.createPair(ysl.address, busd.address);
                let pair = await Factory.getPair(ysl.address, busd.address);
                let pair_instance = await new UniswapV2Pair__factory(owner).attach(pair);
                await whitelist.connect(owner).addWhiteList([ysl.address,busd.address,pair,owner.address,router.address,liquidityprovider.address, signers[6].address]);
                await whitelist.connect(owner).addWhiteListForSwap([ysl.address,busd.address,pair,owner.address,router.address,liquidityprovider.address, signers[6].address]);
                await ysl.connect(owner).mint(owner.address,expandTo18Decimals(1000000));
                await busd.connect(owner).approve(liquidityprovider.address,expandTo18Decimals(100000000));
                await ysl.connect(owner).approve(liquidityprovider.address,expandTo18Decimals(100000000));
                await pair_instance.connect(owner).approve(liquidityprovider.address,expandTo18Decimals(100000));
                await liquidityprovider.addLiquidity(ysl.address,busd.address,expandTo18Decimals(1000),expandTo18Decimals(1000),expandTo18Decimals(1),expandTo18Decimals(1),treasury.address);
                await mineBlocks(ethers.provider, 3600);
                await treasury.connect(owner).removeLiquidity(pair_instance.address,router.address);
            })
        })
        
        describe("Treasury: SwapLiquidity", async()=>{
            it("Treasuty: Swap Liquidity",async()=>{
                await Factory.createPair(ysl.address, busd.address);
                let pair = await Factory.getPair(ysl.address, busd.address);
                let pair_instance = await new UniswapV2Pair__factory(owner).attach(pair);
                await whitelist.connect(owner).addWhiteList([ysl.address,busd.address,pair,owner.address,router.address,liquidityprovider.address, treasury.address]);
                await whitelist.connect(owner).addWhiteListForSwap([ysl.address,busd.address,pair,owner.address,router.address,liquidityprovider.address, treasury.address]);
                await ysl.connect(owner).mint(owner.address,expandTo18Decimals(1000000));
                await busd.connect(owner).approve(liquidityprovider.address,expandTo18Decimals(100000000));
                await ysl.connect(owner).approve(liquidityprovider.address,expandTo18Decimals(100000000));
                await pair_instance.connect(owner).approve(liquidityprovider.address,expandTo18Decimals(100000));
                await liquidityprovider.connect(owner).addLiquidity(ysl.address,busd.address,expandTo18Decimals(1000),expandTo18Decimals(1000),expandTo18Decimals(1),expandTo18Decimals(1),treasury.address);
                await mineBlocks(ethers.provider, 3600);
                await treasury.connect(owner).swapLiquidity(pair_instance.address,router.address, router.address);
            })
        })


        describe("TemporaryHolding: withdraw USDY", async()=>{
            it("Withdraw USDy",async()=>{
                await usdy.connect(owner).setOperator(owner.address);
                await usdy.connect(owner).mint(TemporaryHolding.address, expandTo18Decimals(13));
                await TemporaryHolding.withdrawUSDy(owner.address);
            })
        })
    
   
});
