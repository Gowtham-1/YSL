import { mineBlocks, expandTo18Decimals} from "./utilities/utilities";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { Admin, Admin__factory, UniswapV2Router02, UniswapV2Router02__factory, UniswapV2Factory, UniswapV2Factory__factory, Receipt, Receipt__factory, USDy, USDy__factory,USDyRebalancer,USDyRebalancer__factory, WETH9, WETH9__factory, UniswapV2Pair, UniswapV2Pair__factory, ERC20, ERC20__factory, WhiteList, WhiteList__factory, LiquidityProvider, LiquidityProvider__factory, Blacklist, Blacklist__factory, Treasury, Treasury__factory, BYSL__factory, BYSL } from "../typechain";

describe("USDyBUSDLiquidityRebalancer", async() => {
    let router: UniswapV2Router02;
    let factory: UniswapV2Factory;
    let pair: UniswapV2Pair;
    let treasury: Treasury;
    let admin: Admin;
    let WETH: WETH9;
    let USDY: USDy;
    let BUSD: Receipt;
    let USDyBUSDRebalancer:USDyRebalancer;
    let owner: SignerWithAddress;
    let signers: SignerWithAddress[];
    let whitelist: WhiteList;
    let lprovider : LiquidityProvider;
    let blacklist: Blacklist;
    let bysl: BYSL;

    beforeEach("USDyBUSDRebalancer", async() => {
        signers = await ethers.getSigners();
        owner = signers[0];
        admin = await new Admin__factory(owner).deploy();
        await admin.initialize(owner.address, owner.address);
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
        await admin.setWhitelist(whitelist.address);
        await admin.setLiquidityProvider(lprovider.address);
        BUSD = await new Receipt__factory(owner).deploy();
        await BUSD.initialize(admin.address, owner.address, "BUSD","BUSD")
        await admin.setBUSD(BUSD.address);
        await treasury.initialize(owner.address,admin.address);
        USDY = await new USDy__factory(owner).deploy();
        await USDY.initialise(admin.address);
        await admin.setUSDy(USDY.address);
        await factory.createPair(USDY.address, BUSD.address);
        USDyBUSDRebalancer = await new USDyRebalancer__factory(owner).deploy();
        await USDyBUSDRebalancer.initialize(admin.address, router.address, lprovider.address);
        await admin.setUSDyBUSDRebalancer(USDyBUSDRebalancer.address);
        await USDY.setOperator(USDyBUSDRebalancer.address);
        await USDY.setOperator(lprovider.address);
        bysl = await new BYSL__factory(owner).deploy(admin.address);
        await admin.setbYSL(bysl.address);
    }) 

    // -----------------------TESTS FOR CASE 1 -> Price is above peg---------------------------------
    it("USDy-BUSD Liquidity Rebalancer: price > $1", async() => {
        let tokenPair = await factory.getPair(USDY.address, BUSD.address);
        const pair_instance = await new UniswapV2Pair__factory(owner).attach(tokenPair); 
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address,router.address]);

        await USDY.mint(owner.address, expandTo18Decimals(5000));
        await BUSD.mint(owner.address, expandTo18Decimals(5000));

        await USDY.approve(router.address, expandTo18Decimals(10000));
        await BUSD.approve(router.address, expandTo18Decimals(10000));
        await USDY.approve(lprovider.address, expandTo18Decimals(10000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(10000));

        await lprovider.connect(owner).addLiquidity(USDY.address, BUSD.address, expandTo18Decimals(100), expandTo18Decimals(100),1,1, treasury.address);
 
        let path = [BUSD.address, USDY.address];
        await router.connect(owner).swapExactTokensForTokens(expandTo18Decimals(20), expandTo18Decimals(1), path, owner.address, 1692771516);

        await USDyBUSDRebalancer.rebalance();

        let r2 = await BUSD.balanceOf(tokenPair);
        let USDYBalance = await USDY.balanceOf(lprovider.address);
        let BUSDBalance = await BUSD.balanceOf(lprovider.address);
        let USDYInRebalancer = await USDY.balanceOf(USDyBUSDRebalancer.address);
        let BUSDInRebalancer = await BUSD.balanceOf(USDyBUSDRebalancer.address);
       
        await expect(Number(USDYBalance)).to.equal(0); // USDY balance in liquidity provider contract
        await expect(Number(BUSDBalance)).to.equal(0); // BUSD balance in liquidity provider contract
        await expect(Number(USDYInRebalancer)).to.equal(0); // USDY balance in rebalancer contract
        await expect(Number(BUSDInRebalancer)).to.equal(0); // BUSD balance in rebalancer contract
    });

    it("USDy-BUSD Liquidity Rebalancer: price > $1 for 500 denomination", async() => {
        let tokenPair = await factory.getPair(USDY.address, BUSD.address);
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address,router.address]);

        await USDY.mint(owner.address, expandTo18Decimals(5000));
        await BUSD.mint(owner.address, expandTo18Decimals(5000));

        await USDY.approve(router.address, expandTo18Decimals(10000));
        await BUSD.approve(router.address, expandTo18Decimals(10000));
        await USDY.approve(lprovider.address, expandTo18Decimals(10000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(10000));

        await lprovider.connect(owner).addLiquidity(USDY.address, BUSD.address, expandTo18Decimals(500), expandTo18Decimals(500), 1, 1, treasury.address);
 
        let path = [BUSD.address, USDY.address];
        await router.connect(owner).swapExactTokensForTokens(expandTo18Decimals(100), expandTo18Decimals(1), path, owner.address, 1692771516);
       
        await USDyBUSDRebalancer.rebalance();

        let r1 = await USDY.balanceOf(tokenPair);
        let r2 = await BUSD.balanceOf(tokenPair);

        let USDYBalance = await USDY.balanceOf(lprovider.address);
        let BUSDBalance = await BUSD.balanceOf(lprovider.address);
        let USDYInRebalancer = await USDY.balanceOf(USDyBUSDRebalancer.address);
        let BUSDInRebalancer = await BUSD.balanceOf(USDyBUSDRebalancer.address);
        await expect(Number(USDYBalance)).to.equal(0); // USDY balance in liquidity provider contract
        await expect(Number(BUSDBalance)).to.equal(0); // BUSD balance in liquidity provider contract
        await expect(Number(USDYInRebalancer)).to.equal(0); // USDY balance in rebalancer contract
        await expect(Number(BUSDInRebalancer)).to.equal(0); // BUSD balance in rebalancer contract
        await expect(Number(r2)- Number(r1)).to.lessThanOrEqual(Number(1000000000000000000));
    });

    it("USDy-BUSD Liquidity Rebalancer: price > $1 for 1000 denomination", async() => {
        let tokenPair = await factory.getPair(USDY.address, BUSD.address);
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address,router.address]);

        await USDY.mint(owner.address, expandTo18Decimals(5000));
        await BUSD.mint(owner.address, expandTo18Decimals(5000));

        await USDY.approve(router.address, expandTo18Decimals(10000));
        await BUSD.approve(router.address, expandTo18Decimals(10000));
        await USDY.approve(lprovider.address, expandTo18Decimals(10000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(10000));

        await lprovider.connect(owner).addLiquidity(USDY.address, BUSD.address, expandTo18Decimals(1000), expandTo18Decimals(1000), 1, 1, treasury.address);
 
        let path = [BUSD.address, USDY.address];
        await router.connect(owner).swapExactTokensForTokens(expandTo18Decimals(300), expandTo18Decimals(1), path, owner.address, 1692771516);
       
        await USDyBUSDRebalancer.rebalance();

        let r1 = await USDY.balanceOf(tokenPair);
        let r2 = await BUSD.balanceOf(tokenPair);

        let USDYBalance = await USDY.balanceOf(lprovider.address);
        let BUSDBalance = await BUSD.balanceOf(lprovider.address);
        let USDYInRebalancer = await USDY.balanceOf(USDyBUSDRebalancer.address);
        let BUSDInRebalancer = await BUSD.balanceOf(USDyBUSDRebalancer.address);
        await expect(Number(USDYBalance)).to.equal(0); // USDY balance in liquidity provider contract
        await expect(Number(BUSDBalance)).to.equal(0); // BUSD balance in liquidity provider contract
        await expect(Number(USDYInRebalancer)).to.equal(0); // USDY balance in rebalancer contract
        await expect(Number(BUSDInRebalancer)).to.equal(0); // BUSD balance in rebalancer contract
        await expect(Number(r2)- Number(r1)).to.lessThanOrEqual(Number(1000000000000000000));
    });

    it("USDy-BUSD Liquidity Rebalancer: price > $1 for 90000 denomination", async() => {
        let tokenPair = await factory.getPair(USDY.address, BUSD.address);
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address,router.address]);

        await USDY.mint(owner.address, expandTo18Decimals(110000));
        await BUSD.mint(owner.address, expandTo18Decimals(110000));

        await USDY.approve(router.address, expandTo18Decimals(110000));
        await BUSD.approve(router.address, expandTo18Decimals(110000));
        await USDY.approve(lprovider.address, expandTo18Decimals(110000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(110000));

        await lprovider.connect(owner).addLiquidity(USDY.address, BUSD.address, expandTo18Decimals(90000), expandTo18Decimals(90000), 1, 1, treasury.address);
 
        let path = [BUSD.address, USDY.address];
        await router.connect(owner).swapExactTokensForTokens(expandTo18Decimals(10000), expandTo18Decimals(1), path, owner.address, 1692771516);
       
        await USDyBUSDRebalancer.rebalance();

        let r1 = await USDY.balanceOf(tokenPair);
        let r2 = await BUSD.balanceOf(tokenPair);

        let USDYBalance = await USDY.balanceOf(lprovider.address);
        let BUSDBalance = await BUSD.balanceOf(lprovider.address);
        let USDYInRebalancer = await USDY.balanceOf(USDyBUSDRebalancer.address);
        let BUSDInRebalancer = await BUSD.balanceOf(USDyBUSDRebalancer.address);
        await expect(Number(USDYBalance)).to.equal(0); // USDY balance in liquidity provider contract
        await expect(Number(BUSDBalance)).to.equal(0); // BUSD balance in liquidity provider contract
        await expect(Number(USDYInRebalancer)).to.equal(0); // USDY balance in rebalancer contract
        await expect(Number(BUSDInRebalancer)).to.equal(0); // BUSD balance in rebalancer contract
        await expect(Number(r2)- Number(r1)).to.lessThanOrEqual(Number(1000000000000000000));
    });

    it("USDY-BUSD Liquidity Rebalancer: price > $1 for 1 million", async() => {
        let tokenPair = await factory.getPair(USDY.address, BUSD.address);      
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address,router.address]);

        await USDY.mint(owner.address, expandTo18Decimals(1100000));
        await BUSD.mint(owner.address, expandTo18Decimals(1100000));

        await USDY.approve(router.address, expandTo18Decimals(1100000));
        await BUSD.approve(router.address, expandTo18Decimals(1100000));
        await USDY.approve(lprovider.address, expandTo18Decimals(1100000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(1100000));

        await lprovider.connect(owner).addLiquidity(USDY.address, BUSD.address, expandTo18Decimals(990000), expandTo18Decimals(990000), 1, 1, treasury.address);
 
        let path = [BUSD.address, USDY.address];
        await router.connect(owner).swapExactTokensForTokens(expandTo18Decimals(10000), expandTo18Decimals(1), path, owner.address, 1692771516);
       
        await USDyBUSDRebalancer.rebalance();

        let r1 = await USDY.balanceOf(tokenPair);
        let r2 = await BUSD.balanceOf(tokenPair);

        let USDYBalance = await USDY.balanceOf(lprovider.address);
        let BUSDBalance = await BUSD.balanceOf(lprovider.address);
        let USDYInRebalancer = await USDY.balanceOf(USDyBUSDRebalancer.address);
        let BUSDInRebalancer = await BUSD.balanceOf(USDyBUSDRebalancer.address);
        await expect(Number(USDYBalance)).to.equal(0); // USDY balance in liquidity provider contract
        await expect(Number(BUSDBalance)).to.equal(0); // BUSD balance in liquidity provider contract
        await expect(Number(USDYInRebalancer)).to.equal(0); // USDY balance in rebalancer contract
        await expect(Number(BUSDInRebalancer)).to.equal(0); // BUSD balance in rebalancer contract
        await expect(Number(r2)- Number(r1)).to.lessThanOrEqual(Number(1000000000000000000));
    });

    it("USDY-BUSD Liquidity Rebalancer: price > $1 for 100 million", async() => {
        let tokenPair = await factory.getPair(USDY.address, BUSD.address);
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address,router.address]);

        await USDY.mint(owner.address, expandTo18Decimals(110000000));
        await BUSD.mint(owner.address, expandTo18Decimals(110000000));

        await USDY.approve(router.address, expandTo18Decimals(110000000));
        await BUSD.approve(router.address, expandTo18Decimals(110000000));
        await USDY.approve(lprovider.address, expandTo18Decimals(110000000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(110000000));

        await lprovider.connect(owner).addLiquidity(USDY.address, BUSD.address, expandTo18Decimals(99000000), expandTo18Decimals(99000000), 1, 1, treasury.address);
 
        let path = [BUSD.address, USDY.address];
        await router.connect(owner).swapExactTokensForTokens(expandTo18Decimals(1000000), expandTo18Decimals(1), path, owner.address, 1692771516);
       
        await USDyBUSDRebalancer.rebalance();

        let r1 = await USDY.balanceOf(tokenPair);
        let r2 = await BUSD.balanceOf(tokenPair);

        let USDYBalance = await USDY.balanceOf(lprovider.address);
        let BUSDBalance = await BUSD.balanceOf(lprovider.address);
        let USDYInRebalancer = await USDY.balanceOf(USDyBUSDRebalancer.address);
        let BUSDInRebalancer = await BUSD.balanceOf(USDyBUSDRebalancer.address);
        await expect(Number(USDYBalance)).to.equal(0); // USDY balance in liquidity provider contract
        await expect(Number(BUSDBalance)).to.equal(0); // BUSD balance in liquidity provider contract
        await expect(Number(USDYInRebalancer)).to.equal(0); // USDY balance in rebalancer contract
        await expect(Number(BUSDInRebalancer)).to.equal(0); // BUSD balance in rebalancer contract
        await expect(Number(r2) - Number(r1)).to.lessThanOrEqual(Number(5000000000000000000));
    });

    // -----------------------TESTS FOR CASE 2 -> Price is below peg---------------------------------

    it("USDy-BUSD Liquidity Rebalancer: price < $1", async() => {
        let tokenPair = await factory.getPair(USDY.address, BUSD.address);
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address,router.address]);

        await USDY.mint(owner.address, expandTo18Decimals(5000));
        await BUSD.mint(owner.address, expandTo18Decimals(5000));

        await USDY.approve(router.address, expandTo18Decimals(10000));
        await BUSD.approve(router.address, expandTo18Decimals(10000));
        await USDY.approve(lprovider.address, expandTo18Decimals(10000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(10000));
        await lprovider.connect(owner).addLiquidity(USDY.address, BUSD.address, expandTo18Decimals(100), expandTo18Decimals(100), 1, 1, treasury.address);

        let path = [USDY.address, BUSD.address];
        await router.connect(owner).swapExactTokensForTokens(expandTo18Decimals(20), expandTo18Decimals(1), path, owner.address, 1692771516);
        await treasury.setRebalancerRole(USDyBUSDRebalancer.address);
        await USDyBUSDRebalancer.rebalance();

        let r1 = await USDY.balanceOf(tokenPair);
        let r2 = await BUSD.balanceOf(tokenPair);

        let finalUSDy = await String(r1);
        let finalr1 = finalUSDy.substring(0,3);
        let finalBUSD = await String(r2);
        let finalr2 = finalBUSD.substring(0,3);

        
        let USDYBalance = await USDY.balanceOf(lprovider.address);
        let BUSDBalance = await BUSD.balanceOf(lprovider.address);
        let USDYInRebalancer = await USDY.balanceOf(USDyBUSDRebalancer.address);
        let BUSDInRebalancer = await BUSD.balanceOf(USDyBUSDRebalancer.address);
        await expect(Number(USDYBalance)).to.equal(0); // USDY balance in liquidity provider contract
        await expect(Number(BUSDBalance)).to.equal(0); // BUSD balance in liquidity provider contract
        await expect(Number(USDYInRebalancer)).to.equal(0); // USDY balance in rebalancer contract
        await expect(Number(BUSDInRebalancer)).to.equal(0); // BUSD balance in rebalancer contract
    });

    it("USDy-BUSD Liquidity Rebalancer: price < $1 for 500 denomination", async() => {
        let tokenPair = await factory.getPair(USDY.address, BUSD.address);
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address,router.address]);

        await USDY.mint(owner.address, expandTo18Decimals(5000));
        await BUSD.mint(owner.address, expandTo18Decimals(5000));

        await USDY.approve(router.address, expandTo18Decimals(10000));
        await BUSD.approve(router.address, expandTo18Decimals(10000));
        await USDY.approve(lprovider.address, expandTo18Decimals(10000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(10000));
        await lprovider.connect(owner).addLiquidity(USDY.address, BUSD.address, expandTo18Decimals(500), expandTo18Decimals(500), 1, 1, treasury.address);

        let path = [USDY.address, BUSD.address];
        await router.connect(owner).swapExactTokensForTokens(expandTo18Decimals(100), expandTo18Decimals(1), path, owner.address, 1692771516);
        await treasury.setRebalancerRole(USDyBUSDRebalancer.address);
        await USDyBUSDRebalancer.rebalance();

        let r1 = await USDY.balanceOf(tokenPair);
        let r2 = await BUSD.balanceOf(tokenPair);

        let finalUSDy = await String(r1);
        let finalr1 = finalUSDy.substring(0,3);
        let finalBUSD = await String(r2);
        let finalr2 = finalBUSD.substring(0,3);


        let USDYBalance = await USDY.balanceOf(lprovider.address);
        let BUSDBalance = await BUSD.balanceOf(lprovider.address);
        let USDYInRebalancer = await USDY.balanceOf(USDyBUSDRebalancer.address);
        let BUSDInRebalancer = await BUSD.balanceOf(USDyBUSDRebalancer.address);
        await expect(Number(USDYBalance)).to.equal(0); // USDY balance in liquidity provider contract
        await expect(Number(BUSDBalance)).to.equal(0); // BUSD balance in liquidity provider contract
        await expect(Number(USDYInRebalancer)).to.equal(0); // USDY balance in rebalancer contract
        await expect(Number(BUSDInRebalancer)).to.equal(0); // BUSD balance in rebalancer contract
    });

    it("USDy-BUSD Liquidity Rebalancer: price < $1 for 3000 denomination", async() => {
        let tokenPair = await factory.getPair(USDY.address, BUSD.address);        
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address,router.address]);

        await USDY.mint(owner.address, expandTo18Decimals(10000));
        await BUSD.mint(owner.address, expandTo18Decimals(10000));

        await USDY.approve(router.address, expandTo18Decimals(10000));
        await BUSD.approve(router.address, expandTo18Decimals(10000));
        await USDY.approve(lprovider.address, expandTo18Decimals(10000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(10000));
        await lprovider.connect(owner).addLiquidity(USDY.address, BUSD.address, expandTo18Decimals(3000), expandTo18Decimals(3000), 1, 1, treasury.address);

        let path = [USDY.address, BUSD.address];
        await router.connect(owner).swapExactTokensForTokens(expandTo18Decimals(300), expandTo18Decimals(1), path, owner.address, 1692771516);
        await treasury.setRebalancerRole(USDyBUSDRebalancer.address);
        await USDyBUSDRebalancer.rebalance();

        let r1 = await USDY.balanceOf(tokenPair);
        let r2 = await BUSD.balanceOf(tokenPair);

        let finalUSDy = await String(r1);
        let finalr1 = finalUSDy.substring(0,3);
        let finalBUSD = await String(r2);
        let finalr2 = finalBUSD.substring(0,3);
      

        let USDYBalance = await USDY.balanceOf(lprovider.address);
        let BUSDBalance = await BUSD.balanceOf(lprovider.address);
        let USDYInRebalancer = await USDY.balanceOf(USDyBUSDRebalancer.address);
        let BUSDInRebalancer = await BUSD.balanceOf(USDyBUSDRebalancer.address);
        await expect(Number(USDYBalance)).to.equal(0); // USDY balance in liquidity provider contract
        await expect(Number(BUSDBalance)).to.equal(0); // BUSD balance in liquidity provider contract
        await expect(Number(USDYInRebalancer)).to.equal(0); // USDY balance in rebalancer contract
        await expect(Number(BUSDInRebalancer)).to.equal(0); // BUSD balance in rebalancer contract
    });

    it("USDy-BUSD Liquidity Rebalancer: price < $1 for notion example", async() => {
        let tokenPair = await factory.getPair(USDY.address, BUSD.address);        
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address,router.address]);

        await USDY.mint(owner.address, expandTo18Decimals(110000));
        await BUSD.mint(owner.address, expandTo18Decimals(110000));

        await USDY.approve(router.address, expandTo18Decimals(110000));
        await BUSD.approve(router.address, expandTo18Decimals(110000));
        await USDY.approve(lprovider.address, expandTo18Decimals(110000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(110000));
        await lprovider.connect(owner).addLiquidity(USDY.address, BUSD.address, expandTo18Decimals(90000), expandTo18Decimals(90000), 1, 1, treasury.address);

        let path = [USDY.address, BUSD.address];
        await router.connect(owner).swapExactTokensForTokens(expandTo18Decimals(10000), expandTo18Decimals(1), path, owner.address, 1692771516);
        await treasury.setRebalancerRole(USDyBUSDRebalancer.address);
        await USDyBUSDRebalancer.rebalance();

        let r1 = await USDY.balanceOf(tokenPair);
        let r2 = await BUSD.balanceOf(tokenPair);

        let finalUSDy = await String(r1);
        let finalr1 = finalUSDy.substring(0,3);
        let finalBUSD = await String(r2);
        let finalr2 = finalBUSD.substring(0,3);

        let USDYBalance = await USDY.balanceOf(lprovider.address);
        let BUSDBalance = await BUSD.balanceOf(lprovider.address);
        let USDYInRebalancer = await USDY.balanceOf(USDyBUSDRebalancer.address);
        let BUSDInRebalancer = await BUSD.balanceOf(USDyBUSDRebalancer.address);
        await expect(Number(USDYBalance)).to.equal(0); // USDY balance in liquidity provider contract
        await expect(Number(BUSDBalance)).to.equal(0); // BUSD balance in liquidity provider contract
        await expect(Number(USDYInRebalancer)).to.equal(0); // USDY balance in rebalancer contract
        await expect(Number(BUSDInRebalancer)).to.equal(0); // BUSD balance in rebalancer contract
    });

    it("USDy-BUSD Liquidity Rebalancer: price < $1 for 1 million denomination", async() => {
        let tokenPair = await factory.getPair(USDY.address, BUSD.address);        
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address,router.address]);

        await USDY.mint(owner.address, expandTo18Decimals(1100000));
        await BUSD.mint(owner.address, expandTo18Decimals(1100000));

        await USDY.approve(router.address, expandTo18Decimals(1100000));
        await BUSD.approve(router.address, expandTo18Decimals(1100000));
        await USDY.approve(lprovider.address, expandTo18Decimals(1100000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(1100000));
        await lprovider.connect(owner).addLiquidity(USDY.address, BUSD.address, expandTo18Decimals(990000), expandTo18Decimals(990000), 1, 1, treasury.address);

        let path = [USDY.address, BUSD.address];
        await router.connect(owner).swapExactTokensForTokens(expandTo18Decimals(10000), expandTo18Decimals(1), path, owner.address, 1692771516);
        await treasury.setRebalancerRole(USDyBUSDRebalancer.address);
        await USDyBUSDRebalancer.rebalance();

        let r1 = await USDY.balanceOf(tokenPair);
        let r2 = await BUSD.balanceOf(tokenPair);

        let finalUSDy = await String(r1);
        let finalr1 = finalUSDy.substring(0,3);
        let finalBUSD = await String(r2);
        let finalr2 = finalBUSD.substring(0,3);

        let USDYBalance = await USDY.balanceOf(lprovider.address);
        let BUSDBalance = await BUSD.balanceOf(lprovider.address);
        let USDYInRebalancer = await USDY.balanceOf(USDyBUSDRebalancer.address);
        let BUSDInRebalancer = await BUSD.balanceOf(USDyBUSDRebalancer.address);
        await expect(Number(USDYBalance)).to.equal(0); // USDY balance in liquidity provider contract
        await expect(Number(BUSDBalance)).to.equal(0); // BUSD balance in liquidity provider contract
        await expect(Number(USDYInRebalancer)).to.equal(0); // USDY balance in rebalancer contract
        await expect(Number(BUSDInRebalancer)).to.equal(0); // BUSD balance in rebalancer contract
    });

    it("USDY-BUSD Liquidity Rebalancer: price < $1 for 100 million denomination", async() => {
        let tokenPair = await factory.getPair(USDY.address, BUSD.address);
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address,router.address]);

        await USDY.mint(owner.address, expandTo18Decimals(110000000));
        await BUSD.mint(owner.address, expandTo18Decimals(110000000));

        await USDY.approve(router.address, expandTo18Decimals(110000000));
        await BUSD.approve(router.address, expandTo18Decimals(110000000));
        await USDY.approve(lprovider.address, expandTo18Decimals(110000000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(110000000));
        await lprovider.connect(owner).addLiquidity(USDY.address, BUSD.address, expandTo18Decimals(99000000), expandTo18Decimals(99000000), 1, 1, treasury.address);

        let path = [USDY.address, BUSD.address];
        await router.connect(owner).swapExactTokensForTokens(expandTo18Decimals(1000000), expandTo18Decimals(1), path, owner.address, 1692771516);
        await treasury.setRebalancerRole(USDyBUSDRebalancer.address);
        USDyBUSDRebalancer.rebalance();

        let r1 = await USDY.balanceOf(tokenPair);
        let r2 = await BUSD.balanceOf(tokenPair);

        let finalUSDY = await String(r1);
        let finalr1 = finalUSDY.substring(0,3);
        let finalBUSD = await String(r2);
        let finalr2 = finalBUSD.substring(0,3);
 
        await expect(Number(finalr1)).to.lessThanOrEqual(Number(finalr2));

        let USDYBalance = await USDY.balanceOf(lprovider.address);
        let BUSDBalance = await BUSD.balanceOf(lprovider.address);
        let USDYInRebalancer = await USDY.balanceOf(USDyBUSDRebalancer.address);
        let BUSDInRebalancer = await BUSD.balanceOf(USDyBUSDRebalancer.address);
        await expect(Number(USDYBalance)).to.equal(0); // USDY balance in liquidity provider contract
        await expect(Number(BUSDBalance)).to.equal(0); // BUSD balance in liquidity provider contract
        await expect(Number(USDYInRebalancer)).to.equal(0); // USDY balance in rebalancer contract
        await expect(Number(BUSDInRebalancer)).to.equal(0); // BUSD balance in rebalancer contract
    });

    // ----------------------------- extra checks ----------------------------------

    it("USDY-BUSD Liquidity Rebalancer: call rebalancer only after epoch", async() => {
        let tokenPair = await factory.getPair(USDY.address, BUSD.address);        
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address,router.address]);

        await USDY.mint(owner.address, expandTo18Decimals(5000));
        await BUSD.mint(owner.address, expandTo18Decimals(5000));

        await USDY.approve(router.address, expandTo18Decimals(10000));
        await BUSD.approve(router.address, expandTo18Decimals(10000));
        await USDY.approve(lprovider.address, expandTo18Decimals(10000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(10000));

        await lprovider.connect(owner).addLiquidity(USDY.address, BUSD.address, expandTo18Decimals(100), expandTo18Decimals(100), 1, 1, treasury.address);

        let path = [BUSD.address, USDY.address];
        await router.connect(owner).swapExactTokensForTokens(expandTo18Decimals(20), expandTo18Decimals(1), path, owner.address, 1692771516);

        await USDyBUSDRebalancer.rebalance();
    });

    it("USDY-BUSD Liquidity Rebalancer: only admin can change rebalancer's state", async() => {
        let tokenPair = await factory.getPair(USDY.address, BUSD.address);
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address,router.address]);

        await expect(USDyBUSDRebalancer.connect(signers[1]).rebalancerState()).to.be.revertedWith("USDyBUSDRebalancer: caller is not admin");

    });

    it("USDY-BUSD Liquidity Rebalancer: only admin can set price impact percentage limit", async() => {
        let tokenPair = await factory.getPair(USDY.address, BUSD.address);   
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address,router.address]);

        await expect(USDyBUSDRebalancer.connect(signers[1]).setImpactPercentageLimit(10)).to.be.revertedWith("USDyBUSDRebalancer: caller is not admin");

    });

    it("USDY-BUSD Liquidity Rebalancer: only admin can set mode", async() => {
        let tokenPair = await factory.getPair(USDY.address, BUSD.address);        
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,USDyBUSDRebalancer.address,lprovider.address,router.address]);

        await expect(USDyBUSDRebalancer.connect(signers[1]).setMode(1)).to.be.revertedWith("USDyBUSDRebalancer: caller is not admin");

    });
})