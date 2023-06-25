import { mineBlocks, expandTo18Decimals} from "./utilities/utilities";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { Admin, Admin__factory, Blacklist, Blacklist__factory, Factory, Factory__factory, LiquidityProvider, LiquidityProvider__factory, OwnedUpgradeabilityProxy, OwnedUpgradeabilityProxy__factory, Receipt, Receipt__factory, UniswapV2Router02, UniswapV2Router02__factory, UpgradeableProxy__factory, WETH9, WETH9__factory, WhiteList, WhiteList__factory, YSL, YSL__factory } from "../typechain";

describe("swap",async () =>{
    let ysl: YSL;
    let busd: Receipt;
    let admin: Admin;
    let proxy1: OwnedUpgradeabilityProxy;
    let proxy2: OwnedUpgradeabilityProxy;
    let proxy3: OwnedUpgradeabilityProxy;
    let proxy4: OwnedUpgradeabilityProxy;
    let owner: SignerWithAddress;
    let signers: SignerWithAddress[];
    let router: UniswapV2Router02;
    let factory1: Factory;
    let weth: WETH9;
    let whitelist:WhiteList;
    let blacklist: Blacklist;
    let adminProxy: Admin;
    let yslProxy:YSL;
    let liquidityProvider: LiquidityProvider;
    let lpProxy : LiquidityProvider;

    beforeEach(async () => {
        signers = await ethers.getSigners();
        owner = signers[0];
        admin = await new Admin__factory(owner).deploy();
        proxy1 = await new OwnedUpgradeabilityProxy__factory(owner).deploy();
        await proxy1.upgradeTo(admin.address);
        adminProxy = await new Admin__factory(owner).attach(proxy1.address);
        await adminProxy.initialize(owner.address,owner.address);
        ysl = await new YSL__factory(owner).deploy();
        proxy2 = await new OwnedUpgradeabilityProxy__factory(owner).deploy();
        await proxy2.upgradeTo(ysl.address);
        yslProxy = await new YSL__factory(owner).attach(proxy2.address);
        await yslProxy.initialise(adminProxy.address);
        await adminProxy.setYSL(yslProxy.address);
        busd = await new Receipt__factory(owner).deploy();
        await busd.initialize(adminProxy.address,owner.address,"BUSD","BUSD");
        await adminProxy.setBUSD(busd.address);
        whitelist = await new WhiteList__factory(owner).deploy();
        await adminProxy.setWhitelist(whitelist.address);
        await whitelist.initialize(adminProxy.address);
        blacklist = await new Blacklist__factory(owner).deploy();
        await adminProxy.setBlacklist(blacklist.address);
        await blacklist.initialize(adminProxy.address);
        liquidityProvider = await new LiquidityProvider__factory(owner).deploy();
        proxy3 = await new OwnedUpgradeabilityProxy__factory(owner).deploy();
        await proxy3.upgradeTo(liquidityProvider.address);
        lpProxy = await new LiquidityProvider__factory(owner).attach(proxy3.address);

        weth = await new WETH9__factory(owner).deploy();
        factory1 = await new Factory__factory(owner).deploy();
        router = await new UniswapV2Router02__factory(owner).deploy(factory1.address, weth.address);
        await adminProxy.setApeswapRouter(router.address);
        await lpProxy.initialize(router.address,adminProxy.address);
        await factory1.createPair(yslProxy.address, busd.address);
    })
    it("swap purchase",async() => {
        let pair = await factory1.getPair(yslProxy.address,busd.address); 
        await whitelist.addWhiteList([lpProxy.address,pair,yslProxy.address]);
        await whitelist.addWhiteListForSwap([lpProxy.address,pair,yslProxy.address]);
        await yslProxy.setOperator(owner.address);
        await yslProxy.mint(owner.address,expandTo18Decimals(10000000));
        await busd.setOperator(owner.address);
        await busd.mint(owner.address,expandTo18Decimals(100000000));
        await yslProxy.approve(lpProxy.address,expandTo18Decimals(10000000000000))
        await busd.approve(lpProxy.address,expandTo18Decimals(10000000000000))
        await lpProxy.addLiquidity(yslProxy.address,busd.address,expandTo18Decimals(100000),expandTo18Decimals(100000),expandTo18Decimals(1),expandTo18Decimals(1),owner.address);
        await busd.approve(router.address,expandTo18Decimals(10000000000000))
        await router.swapExactTokensForTokens(expandTo18Decimals(100),expandTo18Decimals(1),[busd.address,yslProxy.address],owner.address,1673708081);
    })
    it("swap sell",async() => {
        let pair = await factory1.getPair(yslProxy.address,busd.address); 
        await whitelist.addWhiteList([lpProxy.address,pair,yslProxy.address]);
        await whitelist.addWhiteListForSwap([lpProxy.address,pair,yslProxy.address]);
        await yslProxy.setOperator(owner.address);
        await yslProxy.mint(owner.address,expandTo18Decimals(10000000));
        await busd.setOperator(owner.address);
        await busd.mint(owner.address,expandTo18Decimals(100000000));
        await yslProxy.approve(lpProxy.address,expandTo18Decimals(10000000000000))
        await busd.approve(lpProxy.address,expandTo18Decimals(10000000000000))
        await lpProxy.addLiquidity(yslProxy.address,busd.address,expandTo18Decimals(100000),expandTo18Decimals(100000),expandTo18Decimals(1),expandTo18Decimals(1),owner.address);
        await yslProxy.approve(router.address,expandTo18Decimals(10000000000000))
        await router.swapExactTokensForTokens(expandTo18Decimals(100),expandTo18Decimals(1),[yslProxy.address,busd.address],owner.address,1673708081);
    })

})