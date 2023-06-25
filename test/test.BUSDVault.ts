import { mineBlocks, expandTo18Decimals} from "./utilities/utilities";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { Admin, Admin__factory, UniswapV2Router02, UniswapV2Router02__factory, UniswapV2Factory, UniswapV2Factory__factory, Receipt, Receipt__factory, USDy, USDy__factory,USDyRebalancer,USDyRebalancer__factory, WETH9, WETH9__factory, UniswapV2Pair, UniswapV2Pair__factory, ERC20, ERC20__factory, WhiteList, WhiteList__factory, LiquidityProvider, LiquidityProvider__factory, Blacklist, Blacklist__factory, Treasury, Treasury__factory, BUSDVault, BUSDVault__factory, BYSL__factory, BYSL } from "../typechain";

describe("BUSDVault", async() => {
    let router: UniswapV2Router02;
    let factory: UniswapV2Factory;
    let pair: UniswapV2Pair;
    let treasury: Treasury;
    let admin: Admin;
    let WETH: WETH9;
    let USDY: USDy;
    let BUSD: Receipt;
    let token: Receipt; 
    let USDyBUSDRebalancer:USDyRebalancer;
    let owner: SignerWithAddress;
    let user: SignerWithAddress;
    let signers: SignerWithAddress[];
    let whitelist: WhiteList;
    let lprovider : LiquidityProvider;
    let blacklist: Blacklist;
    let BUSDVault: BUSDVault;
    let bysl: BYSL

    beforeEach("BUSDVault", async() => {
        signers = await ethers.getSigners();
        owner = signers[0];
        user = signers[1];
        admin = await new Admin__factory(owner).deploy();
        await admin.initialize(owner.address, owner.address);
        token = await new Receipt__factory(owner).deploy();
        await admin.setmasterNTT(token.address);
        whitelist = await new WhiteList__factory(owner).deploy();
        await whitelist.initialize(admin.address);
        blacklist = await new Blacklist__factory(owner).deploy();
        await admin.setBlacklist(blacklist.address);
        await blacklist.initialize(admin.address);
        factory = await new UniswapV2Factory__factory(owner).deploy(owner.address);
        WETH = await new WETH9__factory(owner).deploy();
        router = await new UniswapV2Router02__factory(owner).deploy(factory.address, WETH.address);
        await admin.setApeswapRouter(router.address);
        treasury = await new Treasury__factory(owner).deploy();
        await admin.setTreasury(treasury.address);   
        pair = await new UniswapV2Pair__factory(owner).deploy();
        lprovider = await new LiquidityProvider__factory(owner).deploy();
        await lprovider.initialize(router.address,admin.address);
        await admin.setLiquidityProvider(lprovider.address);
        await admin.setWhitelist(whitelist.address);
        BUSD = await new Receipt__factory(owner).deploy();
        await BUSD.initialize(admin.address, owner.address, "BUSD","BUSD")
        await admin.setBUSD(BUSD.address);
        await treasury.initialize(owner.address,admin.address);
        USDY = await new USDy__factory(owner).deploy();
        await USDY.initialise(admin.address);
        await admin.setUSDy(USDY.address);
        USDyBUSDRebalancer = await new USDyRebalancer__factory(owner).deploy();
        await USDyBUSDRebalancer.initialize(admin.address, router.address, lprovider.address);
        await admin.setUSDyBUSDRebalancer(USDyBUSDRebalancer.address);
        await USDY.setOperator(USDyBUSDRebalancer.address);
        await USDY.setOperator(lprovider.address);
        await factory.createPair(USDY.address, BUSD.address);
        BUSDVault = await new BUSDVault__factory(owner).deploy();
        await BUSDVault.initialize(admin.address);
        admin.setBUSDVault(BUSDVault.address);
        await USDY.setOperator(BUSDVault.address);
        await admin.setOperator(BUSDVault.address);
        await treasury.setRebalancerRole(BUSDVault.address);
        bysl = await new BYSL__factory(owner).deploy(admin.address);
        await admin.setbYSL(bysl.address);
        await BUSDVault.setEpoch(1);
    });

    it("BUSDVault: deposit BUSD when price = $1.00", async() => {
        let tokenPair = await factory.getPair(USDY.address, BUSD.address);
        const pair_instance = await new UniswapV2Pair__factory(owner).attach(tokenPair); 
        
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address, BUSDVault.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address,router.address, BUSDVault.address]);

        await BUSD.mint(owner.address, expandTo18Decimals(500));

        await USDY.approve(router.address, expandTo18Decimals(1000));
        await BUSD.approve(router.address, expandTo18Decimals(1000));
        await USDY.approve(lprovider.address, expandTo18Decimals(1000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(1000));

        await BUSD.connect(owner).approve(BUSDVault.address, expandTo18Decimals(1000));
        let oldBalance = await BUSD.balanceOf(owner.address);
        await BUSDVault.deposit(owner.address, expandTo18Decimals(100), true);
        let newBalance = await BUSD.balanceOf(owner.address);
        await expect(Number(oldBalance) - 100000000000000000000).to.be.equal(Number(newBalance));
        await BUSDVault.deposit(owner.address, expandTo18Decimals(100), true);

    });

    it("BUSDVault: deposit BUSD when price != $1.00", async() => {
        let tokenPair = await factory.getPair(USDY.address, BUSD.address);
        
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address, BUSDVault.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address,router.address, BUSDVault.address]);

        await USDY.mint(owner.address, expandTo18Decimals(500));
        await BUSD.mint(owner.address, expandTo18Decimals(500));

        await USDY.approve(router.address, expandTo18Decimals(1000));
        await BUSD.approve(router.address, expandTo18Decimals(1000));
        await USDY.approve(lprovider.address, expandTo18Decimals(100));
        await BUSD.approve(lprovider.address, expandTo18Decimals(120));

        await lprovider.connect(owner).addLiquidity(USDY.address, BUSD.address, expandTo18Decimals(100), expandTo18Decimals(100), 1, 1, treasury.address);
 
        let path = [BUSD.address, USDY.address];
        await router.connect(owner).swapExactTokensForTokens(expandTo18Decimals(20), expandTo18Decimals(1), path, owner.address, 1692771516);

        await BUSD.connect(owner).approve(BUSDVault.address, expandTo18Decimals(1000));
        let oldBalance = await BUSD.balanceOf(owner.address);
        await BUSDVault.deposit(owner.address, expandTo18Decimals(100), true);
        let newBalance = await BUSD.balanceOf(owner.address);

        await expect(Number(oldBalance) - 100000000000000000000).to.be.equal(Number(newBalance));
    });

    it("BUSDVault: withdraw BUSD when price = $1.00", async() => {
        let tokenPair = await factory.getPair(USDY.address, BUSD.address);
        
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address, BUSDVault.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address,router.address, BUSDVault.address]);

        await USDY.mint(owner.address, expandTo18Decimals(500));
        await BUSD.mint(owner.address, expandTo18Decimals(500));

        await USDY.approve(router.address, expandTo18Decimals(1000));
        await BUSD.approve(router.address, expandTo18Decimals(1000));
        await USDY.approve(lprovider.address, expandTo18Decimals(1000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(1000));
        await BUSD.approve(BUSDVault.address,expandTo18Decimals(120));
        let busds = await BUSDVault.receiptToken();
        let BUSDs = await new Receipt__factory(owner).attach(busds);
        await BUSDs.approve(BUSDVault.address,expandTo18Decimals(200));

        await lprovider.connect(owner).addLiquidity(USDY.address, BUSD.address, expandTo18Decimals(150), expandTo18Decimals(150), 1, 1, treasury.address);
        await mineBlocks(ethers.provider,3600);
        await BUSDVault.deposit(owner.address, expandTo18Decimals(120), true);
        await mineBlocks(ethers.provider,3600);

        await BUSD.connect(owner).approve(BUSDVault.address, expandTo18Decimals(1000));
        let oldBalance = await BUSD.balanceOf(owner.address);
        await BUSDVault.withdraw(owner.address, expandTo18Decimals(100), owner.address);
 
        let newBalance = await BUSD.balanceOf(owner.address);

        await expect(Number(oldBalance) + 100000000000000000000).to.be.equal(Number(newBalance));
    });

    it("BUSDVault: withdraw BUSD when price != $1.00", async() => {
        let tokenPair = await factory.getPair(USDY.address, BUSD.address);
        
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address, BUSDVault.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address,router.address, BUSDVault.address]);

        await USDY.mint(owner.address, expandTo18Decimals(500));
        await BUSD.mint(owner.address, expandTo18Decimals(500));

        await USDY.approve(router.address, expandTo18Decimals(1000));
        await BUSD.approve(router.address, expandTo18Decimals(1000));
        await USDY.approve(lprovider.address, expandTo18Decimals(1000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(1000));
        await BUSD.approve(BUSDVault.address,expandTo18Decimals(120));

        let busds = await BUSDVault.receiptToken();
        let BUSDs = await new Receipt__factory(owner).attach(busds);
        await BUSDs.approve(BUSDVault.address,expandTo18Decimals(200));

        await lprovider.connect(owner).addLiquidity(USDY.address, BUSD.address, expandTo18Decimals(150), expandTo18Decimals(150), 1, 1, treasury.address);
        let path = [BUSD.address, USDY.address];
        
        await BUSDVault.deposit(owner.address, expandTo18Decimals(120), true);
        await mineBlocks(ethers.provider,3600);
        await router.connect(owner).swapExactTokensForTokens(expandTo18Decimals(20), expandTo18Decimals(1), path, owner.address, 1692771516);
        
        await BUSD.connect(owner).approve(BUSDVault.address, expandTo18Decimals(1000));
        let oldBalance = await BUSD.balanceOf(owner.address);
        await BUSDVault.withdraw(owner.address, expandTo18Decimals(100), owner.address);
    
        let newBalance = await BUSD.balanceOf(owner.address);
   
    });
});