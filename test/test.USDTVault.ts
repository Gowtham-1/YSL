import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";
import { mineBlocks, expandTo18Decimals } from "./utilities/utilities";
import { expect } from "chai";
import 
{ Admin, Admin__factory, 
    Blacklist, Blacklist__factory, 
    BSHAREBUSDVault, BSHAREBUSDVault__factory, 
    BSHARE,BSHARE__factory, 
    CalHash, CalHash__factory, 
    DAIVault, DAIVault__factory, 
    Factory, Factory__factory, 
    LiquidityProvider, LiquidityProvider__factory, 
    Receipt, Receipt__factory, 
    UniswapV2Pair, UniswapV2Pair__factory, 
    UniswapV2Router02, UniswapV2Router02__factory, 
    USDyBUSDVault, USDyBUSDVault__factory, 
    USDyVault, USDyVault__factory, 
    USDy, USDy__factory, 
    WETH9, WETH9__factory, 
    WhiteList, WhiteList__factory, 
    XYSLBUSDVault, XYSLBUSDVault__factory, 
    XYSL, XYSL__factory, 
    YSLBUSDVault, YSLBUSDVault__factory, 
    YSL, YSL__factory, BUSDVault, BUSDVault__factory, USDCVault, USDCVault__factory, USDTVault, USDTVault__factory } 
    from "../typechain";

    import exp from "constants";

describe('USDT_Vault',async() =>{
    let owner: SignerWithAddress;
    let signers: SignerWithAddress[];
    let admin: Admin;
    let uniswapV2Pair: UniswapV2Pair;
    let router: UniswapV2Router02;
    let factory: Factory;
    let WETH: WETH9;
    let calHash: CalHash;
    let whitelist: WhiteList;
    let blacklist: Blacklist;
    let daiVault: DAIVault;
    let busd: Receipt;
    let dai: Receipt;
    let usdy: USDy;
    let usdc: Receipt;
    let usdt: Receipt;
    let ntt: Receipt;
    let usdcvault: USDCVault;
    let usdtvault: USDTVault;
    let liquidityProvider: LiquidityProvider;
    let usdyVault: USDyVault;
    let xysl: XYSL;
    let ysl: YSL;
    let bShare: BSHARE;
    let busdVault: BUSDVault;
    let xYslBusdVault: XYSLBUSDVault;
    let yslBusdVault: YSLBUSDVault;
    let bShareBusdVault: BSHAREBUSDVault;
    let usdyBusdVault: USDyBUSDVault;


    beforeEach(async () => {
        signers = await ethers.getSigners();
        owner = signers[0];
        admin= await new Admin__factory(owner).deploy();
        await admin.initialize(owner.address,owner.address);
        ntt = await new Receipt__factory(owner).deploy();
        await admin.setmasterNTT(ntt.address);
        uniswapV2Pair = await new UniswapV2Pair__factory(owner).deploy();
        calHash = await new CalHash__factory(owner).deploy();
        factory = await new Factory__factory(owner).deploy();
        WETH = await new WETH9__factory(owner).deploy();
        router = await new UniswapV2Router02__factory(owner).deploy(factory.address,WETH.address);
        await admin.setApeswapRouter(router.address);
        busd = await new Receipt__factory(owner).deploy();
        await busd.initialize(admin.address,owner.address,"BUSD","TKN");
        await admin.setBUSD(busd.address);
        usdt = await new Receipt__factory(owner).deploy();
        await usdt.initialize(admin.address,owner.address,"USDT","TKN");
        await admin.setUSDT(usdt.address);
        usdc = await new Receipt__factory(owner).deploy();
        await usdc.initialize(admin.address,owner.address,"USDC","TKN");
        await admin.setUSDC(usdc.address);
        dai = await new Receipt__factory(owner).deploy();
        await dai.initialize(admin.address,owner.address,"DAI","TKN");
        await admin.setDAI(dai.address);
        usdy = await new USDy__factory(owner).deploy();
        xysl = await new XYSL__factory(owner).deploy();
        ysl = await new YSL__factory(owner).deploy();
        bShare = await new BSHARE__factory(owner).deploy();
        await admin.connect(owner).setUSDy(usdy.address);
        await admin.connect(owner).setxYSL(xysl.address);
        await admin.connect(owner).setYSL(ysl.address);
        await admin.connect(owner).setBShare(bShare.address);

        busdVault = await new BUSDVault__factory(owner).deploy();
        await admin.setBUSDVault(busdVault.address);
        const BUSDs = await new Receipt__factory(owner).attach(await busdVault.BUSDs());
        await busdVault.initialize(admin.address);

        usdyVault = await new USDyVault__factory(owner).deploy();
        await admin.connect(owner).setUSDyVault(usdyVault.address);
        await usdyVault.initialize(admin.address);

        usdcvault = await new USDCVault__factory(owner).deploy();
        await admin.connect(owner).setUSDCVault(usdcvault.address);
        await usdcvault.initialize(admin.address,usdc.address);

        usdtvault = await new USDTVault__factory(owner).deploy();
        await admin.connect(owner).setUSDTVault(usdtvault.address);
        await usdtvault.initialize(admin.address,usdt.address)

        await usdy.initialise(admin.address);
        await xysl.initialise(admin.address,busd.address);
        await ysl.initialise(admin.address);
        await bShare.initialise(admin.address);

        whitelist = await new WhiteList__factory(owner).deploy();
        await whitelist.initialize(admin.address);
        await admin.connect(owner).setWhitelist(whitelist.address);
        blacklist = await new Blacklist__factory(owner).deploy();
        await blacklist.initialize(admin.address);
        await admin.connect(owner).setBlacklist(blacklist.address);
        liquidityProvider = await new LiquidityProvider__factory(owner).deploy();
        await admin.setLiquidityProvider(liquidityProvider.address);
        await liquidityProvider.initialize(router.address,admin.address);

        xYslBusdVault = await new XYSLBUSDVault__factory(owner).deploy();
        await admin.connect(owner).setxYSLBUSDVault( xYslBusdVault.address);
        let xysl_busd = await factory.connect(owner).getPair(xysl.address,busd.address);
        await  xYslBusdVault.initialize(admin.address,xysl_busd);
        
        yslBusdVault = await new YSLBUSDVault__factory(owner).deploy();
        await admin.connect(owner).setYSLBUSDVault(yslBusdVault.address);
        await factory.connect(owner).createPair(xysl.address,busd.address);
        let ysl_busd = await factory.connect(owner).getPair(ysl.address,busd.address);
        await yslBusdVault.initialize(admin.address,ysl_busd);
        
        bShareBusdVault = await new BSHAREBUSDVault__factory(owner).deploy();
        await admin.connect(owner).setBShareBUSD(bShareBusdVault.address);
        await factory.connect(owner).createPair(bShare.address,busd.address);
        let bShare_busd = await factory.connect(owner).getPair(bShare.address,busd.address);
        await bShareBusdVault.initialize(admin.address,bShare_busd);
        
        usdyBusdVault = await new USDyBUSDVault__factory(owner).deploy();
        await admin.connect(owner).setUSDyBUSDVault(usdyBusdVault.address);
          await factory.connect(owner).createPair(usdy.address,busd.address);
          let usdy_busd = await factory.connect(owner).getPair(usdy.address,busd.address);
        await usdyBusdVault.initialize(admin.address);

        daiVault = await new DAIVault__factory(owner).deploy();
        await daiVault.initialize(admin.address,dai.address);
        await admin.setDAIVault(daiVault.address);
        await admin.setTreasury(signers[1].address);
        await usdy.connect(owner).setOperator(usdtvault.address);
    })

    describe("USDTVault: Deposit And Withdraw ",async () => {

    it("Deposit in USDTVault",async()=>{
        let tokenPair = await factory.getPair(usdy.address, busd.address);
        await admin.setUSDyBUSD(tokenPair);

        const pair_instance = await new UniswapV2Pair__factory(owner).attach(tokenPair); 

        const USDTs = await new Receipt__factory(owner).attach(await usdtvault.USDTs());

        await whitelist.connect(owner).addWhiteList([owner.address,usdtvault.address,liquidityProvider.address,tokenPair]);
        await whitelist.connect(owner).addWhiteListForSwap([owner.address,daiVault.address,tokenPair,router.address,liquidityProvider.address]);

        await usdy.connect(owner).mint(owner.address,expandTo18Decimals(100000));
        await busd.connect(owner).mint(owner.address,expandTo18Decimals(100000));
        await usdt.connect(owner).mint(owner.address,expandTo18Decimals(100000));

        await usdy.connect(owner).approve(liquidityProvider.address,expandTo18Decimals(100000));
        await busd.connect(owner).approve(liquidityProvider.address,expandTo18Decimals(100000));
        await usdt.connect(owner).approve(liquidityProvider.address,expandTo18Decimals(100000));

        await liquidityProvider.connect(owner).addLiquidity(usdy.address,busd.address,expandTo18Decimals(10000),expandTo18Decimals(10000),expandTo18Decimals(1),expandTo18Decimals(1),owner.address);
        await liquidityProvider.connect(owner).addLiquidity(busd.address,usdt.address,expandTo18Decimals(10000),expandTo18Decimals(10000),expandTo18Decimals(1),expandTo18Decimals(1),owner.address);
        await usdt.connect(owner).approve(usdtvault.address,expandTo18Decimals(10000));

        await usdtvault.connect(owner).deposit(owner.address, expandTo18Decimals(1000), false);
        expect (await USDTs.balanceOf(usdtvault.address)).to.equal(expandTo18Decimals(1000));
        

    })
    it("Withdraw in USDTVault", async()=>{
        let tokenPair = await factory.getPair(usdy.address, busd.address);
        await admin.setUSDyBUSD(tokenPair);
        const pair_instance = await new UniswapV2Pair__factory(owner).attach(tokenPair); 
        const USDTs = await new Receipt__factory(owner).attach(await usdtvault.USDTs());

        await whitelist.connect(owner).addWhiteList([owner.address,usdtvault.address,liquidityProvider.address,tokenPair]);
        await whitelist.connect(owner).addWhiteListForSwap([owner.address,daiVault.address,tokenPair,router.address,liquidityProvider.address]);

        await usdy.connect(owner).mint(owner.address,expandTo18Decimals(100000));
        await busd.connect(owner).mint(owner.address,expandTo18Decimals(100000));
        await usdt.connect(owner).mint(owner.address,expandTo18Decimals(100000));

        await usdy.connect(owner).approve(liquidityProvider.address,expandTo18Decimals(100000));
        await busd.connect(owner).approve(liquidityProvider.address,expandTo18Decimals(100000));
        await usdt.connect(owner).approve(liquidityProvider.address,expandTo18Decimals(100000));


        await liquidityProvider.connect(owner).addLiquidity(usdy.address,busd.address,expandTo18Decimals(10000),expandTo18Decimals(10000),expandTo18Decimals(1),expandTo18Decimals(1),owner.address);
        await liquidityProvider.connect(owner).addLiquidity(busd.address,usdt.address,expandTo18Decimals(10000),expandTo18Decimals(10000),expandTo18Decimals(1),expandTo18Decimals(1),owner.address);
       
        await usdt.connect(owner).approve(usdtvault.address,expandTo18Decimals(10000));
        await usdtvault.connect(owner).setEpoch(10);
        await usdtvault.connect(owner).deposit(owner.address, expandTo18Decimals(1000), false);
        await mineBlocks(ethers.provider,90);
        await usdtvault.connect(owner).withdraw(owner.address,expandTo18Decimals(200),owner.address);

        

        })
    
    })

    describe("USDTVault : ClaimReobaseReward", async()=> {
        it("ClaimReobaseReward in USDTVault", async () => {
            let tokenPair = await factory.getPair(usdy.address, busd.address);
        await admin.setUSDyBUSD(tokenPair);

        const pair_instance = await new UniswapV2Pair__factory(owner).attach(tokenPair); 

        const USDTs = await new Receipt__factory(owner).attach(await usdtvault.USDTs());


        await whitelist.connect(owner).addWhiteList([owner.address,liquidityProvider.address,tokenPair,usdyVault.address,yslBusdVault.address,xYslBusdVault.address,usdyBusdVault.address,bShareBusdVault.address,busdVault.address,usdcvault.address,usdtvault.address,daiVault.address]);
        await whitelist.connect(owner).addWhiteListForSwap([owner.address,daiVault.address,tokenPair,router.address,liquidityProvider.address,usdyVault.address]);

        await usdy.connect(owner).mint(owner.address,expandTo18Decimals(100000));
        await busd.connect(owner).mint(owner.address,expandTo18Decimals(100000));
        await usdt.connect(owner).mint(owner.address,expandTo18Decimals(100000));

        await usdy.connect(owner).approve(liquidityProvider.address,expandTo18Decimals(100000));
        await busd.connect(owner).approve(liquidityProvider.address,expandTo18Decimals(100000));
        await usdt.connect(owner).approve(liquidityProvider.address,expandTo18Decimals(100000));
        await usdy.connect(owner).approve(usdyVault.address,expandTo18Decimals(100000));
        await usdy.connect(owner).approve(usdyBusdVault.address,expandTo18Decimals(100000));
        await busd.connect(owner).approve(usdyBusdVault.address,expandTo18Decimals(100000));
        
        await usdyVault.connect(owner).deposit(owner.address,expandTo18Decimals(1000),false);
        await liquidityProvider.connect(owner).addLiquidity(usdy.address,busd.address,expandTo18Decimals(10000),expandTo18Decimals(10000),expandTo18Decimals(1),expandTo18Decimals(1),owner.address);
        await liquidityProvider.connect(owner).addLiquidity(busd.address,usdt.address,expandTo18Decimals(10000),expandTo18Decimals(10000),expandTo18Decimals(1),expandTo18Decimals(1),owner.address);
        await usdt.connect(owner).approve(usdtvault.address,expandTo18Decimals(10000));

        
        
    
        
        await admin.setBuyBackActivationRole(yslBusdVault.address);
        await admin.setBuyBackActivationRole(xYslBusdVault.address);
        await admin.setBuyBackActivationRole(bShareBusdVault.address);
        await admin.setBuyBackActivationRole(usdyBusdVault.address);
        await admin.setBuyBackActivationRole(usdyVault.address);
        
        await ysl.connect(owner).mint(signers[1].address, expandTo18Decimals(500000000000));
        await usdyVault.setEpochTime(100);
        await mineBlocks(ethers.provider, 100);
        await usdy.connect(owner).setOperator(usdyVault.address);
        await usdy.connect(owner).setOperator(usdyBusdVault.address);
        
        await usdtvault.connect(owner).deposit(owner.address, expandTo18Decimals(1000), false);       
        await usdyVault.connect(owner).rewards();
        let x = await usdtvault.connect(owner).rewards(owner.address);
        await usdtvault.connect(owner).claimReward(owner.address);
        })
    })

})