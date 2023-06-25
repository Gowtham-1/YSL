import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";
import { mineBlocks, expandTo18Decimals } from "./utilities/utilities";
import { expect } from "chai";
import { Admin, Admin__factory, Blacklist, Blacklist__factory, CalHash, CalHash__factory, ERC20, ERC20__factory, Factory, 
    Factory__factory, LiquidityProvider, LiquidityProvider__factory,
     UniswapV2Pair,
     UniswapV2Pair__factory, UniswapV2Router02, UniswapV2Router02__factory, 
     WETH9, WETH9__factory, WhiteList, WhiteList__factory, YSL, YSL__factory } from "../typechain";

describe("LiquidityProvider", async() => {
    let owner: SignerWithAddress;
    let signers: SignerWithAddress[];
    let calhash:CalHash;
    let factory:Factory;
    let admin:Admin;
    let router: UniswapV2Router02;
    let Pair : UniswapV2Pair
    let weth: WETH9;
    let busd: ERC20;
    let ysl: YSL;
    let liquidityprovider: LiquidityProvider;
    let whiteList:WhiteList;
    let blacklist: Blacklist;
    

    beforeEach(async ()=>{
        signers = await ethers.getSigners();
        owner = signers[0];
        admin= await new Admin__factory(owner).deploy();
        await admin.initialize(owner.address,owner.address);
        calhash = await new CalHash__factory(owner).deploy();
        whiteList = await new WhiteList__factory(owner).deploy();
        await whiteList.initialize(admin.address);
        blacklist = await new Blacklist__factory(owner).deploy();
        await blacklist.initialize(admin.address);
        Pair  = await new UniswapV2Pair__factory(owner).deploy();
        factory = await new Factory__factory(owner).deploy();
        weth = await new WETH9__factory(owner).deploy();
        router = await new UniswapV2Router02__factory(owner).deploy(factory.address, weth.address);
        busd = await new ERC20__factory(owner).deploy(expandTo18Decimals(1000000));
        liquidityprovider = await new LiquidityProvider__factory(owner).deploy();
        await liquidityprovider.initialize(router.address,admin.address);

        await admin.setAdmin(admin.address);
        await admin.setOperator(owner.address);
        await admin.setWhitelist(whiteList.address);
        await admin.setBlacklist(blacklist.address);
        await admin.setBUSD(busd.address);
        await admin.setWBNB(weth.address);
        await admin.setApeswapRouter(router.address);
        ysl = await new YSL__factory(owner).deploy();
        await ysl.initialise(admin.address);
        await admin.setYSL(ysl.address);
        await admin.setLiquidityProvider(liquidityprovider.address);

    });

    

    it("liquidityProvider: AddLiquidity",async()=>{
        await factory.createPair(ysl.address, busd.address);
        let pair = await factory.getPair(ysl.address, busd.address);
        let pair_instance = await new UniswapV2Pair__factory(owner).attach(pair);
        await whiteList.connect(owner).addWhiteList([ysl.address,busd.address,pair,owner.address,router.address,liquidityprovider.address]);
        await whiteList.connect(owner).addWhiteListForSwap([ysl.address,busd.address,pair,owner.address,router.address,liquidityprovider.address]);
        await ysl.connect(owner).mint(owner.address,expandTo18Decimals(1000000));
        await busd.connect(owner).approve(liquidityprovider.address,expandTo18Decimals(100000000));
        await ysl.connect(owner).approve(liquidityprovider.address,expandTo18Decimals(100000000));
        await liquidityprovider.connect(owner).addLiquidity(ysl.address,busd.address,expandTo18Decimals(1000),expandTo18Decimals(1000),1,1,owner.address);
    })

    it("liquidityProvider: RemoveLiquidity",async()=>{
        await factory.createPair(ysl.address, busd.address);
        let pair = await factory.getPair(ysl.address, busd.address);
        let pair_instance = await new UniswapV2Pair__factory(owner).attach(pair);
        await whiteList.connect(owner).addWhiteList([ysl.address,busd.address,pair,owner.address,router.address,liquidityprovider.address]);
        await whiteList.connect(owner).addWhiteListForSwap([ysl.address,busd.address,pair,owner.address,router.address,liquidityprovider.address]);
        await ysl.connect(owner).mint(owner.address,expandTo18Decimals(1000000));
        await busd.connect(owner).approve(liquidityprovider.address,expandTo18Decimals(100000000));
        await ysl.connect(owner).approve(liquidityprovider.address,expandTo18Decimals(100000000));
        await pair_instance.connect(owner).approve(liquidityprovider.address,expandTo18Decimals(100000));
        await liquidityprovider.connect(owner).addLiquidity(ysl.address,busd.address,expandTo18Decimals(1000),expandTo18Decimals(1000),1,1,owner.address);
        await liquidityprovider.connect(owner).removeLiquidity(pair_instance.address,expandTo18Decimals(100));
    })

    it("liquidityProvider: AddLiquidityETH",async() =>{
        await factory.createPair(busd.address, weth.address);
        let pair = await factory.getPair(busd.address, weth.address);
        let pair_instance = await new UniswapV2Pair__factory(owner).attach(pair);
        await whiteList.connect(owner).addWhiteList([busd.address,weth.address,pair,owner.address,router.address,liquidityprovider.address]);
        await whiteList.connect(owner).addWhiteListForSwap([busd.address,weth.address,pair,owner.address,router.address,liquidityprovider.address]);
        await busd.connect(owner).approve(liquidityprovider.address,expandTo18Decimals(100000000));
        await liquidityprovider.connect(owner).addLiquidityEth(busd.address,expandTo18Decimals(100),owner.address,{value:expandTo18Decimals(10)});
    })  

    it("liquidityProvider: RemoveLiquidityETH",async() =>{
        await factory.createPair(busd.address, weth.address);
        let pair = await factory.getPair(busd.address, weth.address);
        let pair_instance = await new UniswapV2Pair__factory(owner).attach(pair);
        await whiteList.connect(owner).addWhiteList([busd.address,weth.address,pair,owner.address,router.address,liquidityprovider.address]);
        await whiteList.connect(owner).addWhiteListForSwap([busd.address,weth.address,pair,owner.address,router.address,liquidityprovider.address]);
        await busd.connect(owner).approve(liquidityprovider.address,expandTo18Decimals(100000000));
        await liquidityprovider.connect(owner).addLiquidityEth(busd.address,expandTo18Decimals(100),owner.address,{value:expandTo18Decimals(10)});
        await pair_instance.connect(owner).approve(liquidityprovider.address,expandTo18Decimals(100));
        await liquidityprovider.connect(owner).removeLiquidityEth(busd.address,expandTo18Decimals(1));
    })  
})
