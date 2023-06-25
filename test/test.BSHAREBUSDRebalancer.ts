import { mineBlocks, expandTo18Decimals} from "./utilities/utilities";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { Admin, Admin__factory, UniswapV2Router02, UniswapV2Router02__factory, UniswapV2Factory, UniswapV2Factory__factory, Receipt, Receipt__factory, BSHARERebalancer, BSHARERebalancer__factory, WETH9, WETH9__factory, UniswapV2Pair, UniswapV2Pair__factory, ERC20, ERC20__factory, WhiteList, WhiteList__factory, LiquidityProvider, LiquidityProvider__factory, Blacklist, Blacklist__factory, Treasury, Treasury__factory, BSHARE, BSHARE__factory } from "../typechain";

describe("BSHAREBUSDLiquidityRebalancer", async() => {
    let router: UniswapV2Router02;
    let factory: UniswapV2Factory;
    let pair: UniswapV2Pair;
    let treasury: Treasury;
    let admin: Admin;
    let WETH: WETH9;
    let BSHARE: BSHARE;
    let BUSD: Receipt;
    let BSHAREBUSDRebalancer: BSHARERebalancer;
    let owner: SignerWithAddress;
    let signers: SignerWithAddress[];
    let whitelist: WhiteList;
    let lprovider : LiquidityProvider;
    let blacklist: Blacklist;

    beforeEach("BSHAREBUSDRebalancer", async() => {
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
        BSHARE = await new  BSHARE__factory(owner).deploy();
        await BSHARE.initialise(admin.address);
        await admin.setBShare(BSHARE.address);
        await factory.createPair(BSHARE.address, BUSD.address);
        BSHAREBUSDRebalancer = await new BSHARERebalancer__factory(owner).deploy();
        await BSHAREBUSDRebalancer.initialize(admin.address, router.address, lprovider.address);
        await admin.setBSHAREBUSDRebalancer(BSHAREBUSDRebalancer.address);
        await BSHARE.setOperator(BSHAREBUSDRebalancer.address);
        await BSHARE.setOperator(lprovider.address);
        await BSHAREBUSDRebalancer.setEpoch(10);
    }) 

    // -----------------------TESTS FOR CASE 1 -> Price is above peg---------------------------------
    it("BSHARE-BUSD Liquidity Rebalancer: price > $1", async() => {
        let tokenPair = await factory.getPair(BSHARE.address, BUSD.address);
        const pair_instance = await new UniswapV2Pair__factory(owner).attach(tokenPair); 
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address,router.address]);

        await BSHARE.mint(owner.address, expandTo18Decimals(5000));
        await BUSD.mint(owner.address, expandTo18Decimals(5000));

        await BSHARE.approve(router.address, expandTo18Decimals(10000));
        await BUSD.approve(router.address, expandTo18Decimals(10000));
        await BSHARE.approve(lprovider.address, expandTo18Decimals(10000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(10000));

        await lprovider.connect(owner).addLiquidity(BSHARE.address, BUSD.address, expandTo18Decimals(100), expandTo18Decimals(100), 1, 1, treasury.address);
 
        let path = [BUSD.address, BSHARE.address];
        await router.connect(owner).swapExactTokensForTokens(expandTo18Decimals(20), expandTo18Decimals(1), path, owner.address, 1692771516);

        await BSHAREBUSDRebalancer.rebalance();

        let r2 = await BUSD.balanceOf(tokenPair);
        let BSHAREBalance = await BSHARE.balanceOf(BSHAREBUSDRebalancer.address);
        let BUSDBalance = await BUSD.balanceOf(BSHAREBUSDRebalancer.address);
        await expect(Number(BSHAREBalance)).to.equal(0); // BSHARE balance in rebalancer contract
        await expect(Number(BUSDBalance)).to.equal(0); // BUSD balance in rebalancer contract
        await expect(Number(r2)).to.equal(Number(120000000000000000000));
    });

    it("BSHARE-BUSD Liquidity Rebalancer: price > $1 for bigger pool", async() => {
        let tokenPair = await factory.getPair(BSHARE.address, BUSD.address); 
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address,router.address]);

        await BSHARE.mint(owner.address, expandTo18Decimals(5000));
        await BUSD.mint(owner.address, expandTo18Decimals(5000));

        await BSHARE.approve(router.address, expandTo18Decimals(10000));
        await BUSD.approve(router.address, expandTo18Decimals(10000));
        await BSHARE.approve(lprovider.address, expandTo18Decimals(10000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(10000));

        await lprovider.connect(owner).addLiquidity(BSHARE.address, BUSD.address, expandTo18Decimals(500), expandTo18Decimals(500), 1, 1, treasury.address);
 
        let path = [BUSD.address, BSHARE.address];
        await router.connect(owner).swapExactTokensForTokens(expandTo18Decimals(100), expandTo18Decimals(1), path, owner.address, 1692771516);
       
        await BSHAREBUSDRebalancer.rebalance();

        let r1 = await BSHARE.balanceOf(tokenPair);
        let r2 = await BUSD.balanceOf(tokenPair);

        let BSHAREBalance = await BSHARE.balanceOf(BSHAREBUSDRebalancer.address);
        let BUSDBalance = await BUSD.balanceOf(BSHAREBUSDRebalancer.address);
        await expect(Number(BSHAREBalance)).to.equal(0); // BSHARE balance in rebalancer contract
        await expect(Number(BUSDBalance)).to.equal(0); // BUSD balance in rebalancer contract
        await expect(Number(r2)- Number(r1)).to.lessThanOrEqual(Number(1000000000000000000));
    });

    it("BSHARE-BUSD Liquidity Rebalancer: price > $1 for 5000 denomination", async() => {
        let tokenPair = await factory.getPair(BSHARE.address, BUSD.address); 
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address,router.address]);

        await BSHARE.mint(owner.address, expandTo18Decimals(15000));
        await BUSD.mint(owner.address, expandTo18Decimals(15000));

        await BSHARE.approve(router.address, expandTo18Decimals(10000));
        await BUSD.approve(router.address, expandTo18Decimals(10000));
        await BSHARE.approve(lprovider.address, expandTo18Decimals(10000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(10000));

        await lprovider.connect(owner).addLiquidity(BSHARE.address, BUSD.address, expandTo18Decimals(5000), expandTo18Decimals(5000), 1, 1, treasury.address);
 
        let path = [BUSD.address, BSHARE.address];
        await router.connect(owner).swapExactTokensForTokens(expandTo18Decimals(300), expandTo18Decimals(1), path, owner.address, 1692771516);
       
        await BSHAREBUSDRebalancer.rebalance();

        let r1 = await BSHARE.balanceOf(tokenPair);
        let r2 = await BUSD.balanceOf(tokenPair);

        let BSHAREBalance = await BSHARE.balanceOf(BSHAREBUSDRebalancer.address);
        let BUSDBalance = await BUSD.balanceOf(BSHAREBUSDRebalancer.address);
        await expect(Number(BSHAREBalance)).to.equal(0); // BSHARE balance in rebalancer contract
        await expect(Number(BUSDBalance)).to.equal(0); // BUSD balance in rebalancer contract
        await expect(Number(r2)- Number(r1)).to.lessThanOrEqual(Number(1000000000000000000));
    });

    it("BSHARE-BUSD Liquidity Rebalancer: price > $1 for notion example", async() => {
        let tokenPair = await factory.getPair(BSHARE.address, BUSD.address); 
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address,router.address]);

        await BSHARE.mint(owner.address, expandTo18Decimals(110000));
        await BUSD.mint(owner.address, expandTo18Decimals(110000));

        await BSHARE.approve(router.address, expandTo18Decimals(110000));
        await BUSD.approve(router.address, expandTo18Decimals(110000));
        await BSHARE.approve(lprovider.address, expandTo18Decimals(110000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(110000));

        await lprovider.connect(owner).addLiquidity(BSHARE.address, BUSD.address, expandTo18Decimals(90000), expandTo18Decimals(90000), 1, 1, treasury.address);
 
        let path = [BUSD.address, BSHARE.address];
        await router.connect(owner).swapExactTokensForTokens(expandTo18Decimals(10000), expandTo18Decimals(1), path, owner.address, 1692771516);
       
        await BSHAREBUSDRebalancer.rebalance();
        
        let r1 = await BSHARE.balanceOf(tokenPair);
        let r2 = await BUSD.balanceOf(tokenPair);

        let BSHAREBalance = await BSHARE.balanceOf(BSHAREBUSDRebalancer.address);
        let BUSDBalance = await BUSD.balanceOf(BSHAREBUSDRebalancer.address);
        await expect(Number(BSHAREBalance)).to.equal(0); // BSHARE balance in rebalancer contract
        await expect(Number(BUSDBalance)).to.equal(0); // BUSD balance in rebalancer contract
        await expect(Number(r2)- Number(r1)).to.lessThanOrEqual(Number(1000000000000000000));
    });

    it("BSHARE-BUSD Liquidity Rebalancer: price > $1 for 1 million", async() => {
        let tokenPair = await factory.getPair(BSHARE.address, BUSD.address);
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address,router.address]);

        await BSHARE.mint(owner.address, expandTo18Decimals(1100000));
        await BUSD.mint(owner.address, expandTo18Decimals(1100000));

        await BSHARE.approve(router.address, expandTo18Decimals(1100000));
        await BUSD.approve(router.address, expandTo18Decimals(1100000));
        await BSHARE.approve(lprovider.address, expandTo18Decimals(1100000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(1100000));

        await lprovider.connect(owner).addLiquidity(BSHARE.address, BUSD.address, expandTo18Decimals(990000), expandTo18Decimals(990000), 1, 1, treasury.address);
 
        let path = [BUSD.address, BSHARE.address];
        await router.connect(owner).swapExactTokensForTokens(expandTo18Decimals(10000), expandTo18Decimals(1), path, owner.address, 1692771516);
       
        await BSHAREBUSDRebalancer.rebalance();

        let r1 = await BSHARE.balanceOf(tokenPair);
        let r2 = await BUSD.balanceOf(tokenPair);

        let BSHAREBalance = await BSHARE.balanceOf(BSHAREBUSDRebalancer.address);
        let BUSDBalance = await BUSD.balanceOf(BSHAREBUSDRebalancer.address);
        await expect(Number(BSHAREBalance)).to.equal(0); // BSHARE balance in rebalancer contract
        await expect(Number(BUSDBalance)).to.equal(0); // BUSD balance in rebalancer contract
        await expect(Number(r2)- Number(r1)).to.lessThanOrEqual(Number(1000000000000000000));
    });

    it("BSHARE-BUSD Liquidity Rebalancer: price > $1 for 100 million", async() => {
        let tokenPair = await factory.getPair(BSHARE.address, BUSD.address);
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address,router.address]);

        await BSHARE.mint(owner.address, expandTo18Decimals(110000000));
        await BUSD.mint(owner.address, expandTo18Decimals(110000000));

        await BSHARE.approve(router.address, expandTo18Decimals(110000000));
        await BUSD.approve(router.address, expandTo18Decimals(110000000));
        await BSHARE.approve(lprovider.address, expandTo18Decimals(110000000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(110000000));

        await lprovider.connect(owner).addLiquidity(BSHARE.address, BUSD.address, expandTo18Decimals(99000000), expandTo18Decimals(99000000), 1, 1, treasury.address);
 
        let path = [BUSD.address, BSHARE.address];
        await router.connect(owner).swapExactTokensForTokens(expandTo18Decimals(1000000), expandTo18Decimals(1), path, owner.address, 1692771516);
       
        await BSHAREBUSDRebalancer.rebalance();

        let r1 = await BSHARE.balanceOf(tokenPair);
        let r2 = await BUSD.balanceOf(tokenPair);

        let BSHAREBalance = await BSHARE.balanceOf(BSHAREBUSDRebalancer.address);
        let BUSDBalance = await BUSD.balanceOf(BSHAREBUSDRebalancer.address);
        await expect(Number(BSHAREBalance)).to.equal(0); // BSHARE balance in rebalancer contract
        await expect(Number(BUSDBalance)).to.equal(0); // BUSD balance in rebalancer contract
        await expect(Number(r2) - Number(r1)).to.lessThanOrEqual(Number(5000000000000000000));
    });

    // -----------------------TESTS FOR CASE 2 -> Price is below peg---------------------------------

    it("BSHARE-BUSD Liquidity Rebalancer: price < $1", async() => {
        let tokenPair = await factory.getPair(BSHARE.address, BUSD.address);
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address,router.address]);

        await BSHARE.mint(owner.address, expandTo18Decimals(5000));
        await BUSD.mint(owner.address, expandTo18Decimals(5000));

        await BSHARE.approve(router.address, expandTo18Decimals(10000));
        await BUSD.approve(router.address, expandTo18Decimals(10000));
        await BSHARE.approve(lprovider.address, expandTo18Decimals(10000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(10000));
        await lprovider.connect(owner).addLiquidity(BSHARE.address, BUSD.address, expandTo18Decimals(100), expandTo18Decimals(100), 1, 1, treasury.address);
        await router.getAmountOut(expandTo18Decimals(20), expandTo18Decimals(100), expandTo18Decimals(100)); 

        let path = [BSHARE.address, BUSD.address];
        await router.connect(owner).swapExactTokensForTokens(expandTo18Decimals(20), expandTo18Decimals(1), path, owner.address, 1692771516);
        await treasury.setRebalancerRole(BSHAREBUSDRebalancer.address);
        await BSHAREBUSDRebalancer.rebalance();

        let r1 = await BSHARE.balanceOf(tokenPair);
        let r2 = await BUSD.balanceOf(tokenPair);

        let finalBSHARE = await String(r1);
        let finalr1 = finalBSHARE.substring(0,3);
        let finalBUSD = await String(r2);
        let finalr2 = finalBUSD.substring(0,3);
    });

    it("BSHARE-BUSD Liquidity Rebalancer: price < $1 for bigger pool", async() => {
        let tokenPair = await factory.getPair(BSHARE.address, BUSD.address); 
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address,router.address]);

        await BSHARE.mint(owner.address, expandTo18Decimals(5000));
        await BUSD.mint(owner.address, expandTo18Decimals(5000));

        await BSHARE.approve(router.address, expandTo18Decimals(10000));
        await BUSD.approve(router.address, expandTo18Decimals(10000));
        await BSHARE.approve(lprovider.address, expandTo18Decimals(10000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(10000));
        await lprovider.connect(owner).addLiquidity(BSHARE.address, BUSD.address, expandTo18Decimals(500), expandTo18Decimals(500), 1, 1, treasury.address);

        let path = [BSHARE.address, BUSD.address];
        await router.connect(owner).swapExactTokensForTokens(expandTo18Decimals(100), expandTo18Decimals(1), path, owner.address, 1692771516);
        await treasury.setRebalancerRole(BSHAREBUSDRebalancer.address);
        await BSHAREBUSDRebalancer.rebalance();

        let r1 = await BSHARE.balanceOf(tokenPair);
        let r2 = await BUSD.balanceOf(tokenPair);

        let finalBSHARE = await String(r1);
        let finalr1 = finalBSHARE.substring(0,3);
        let finalBUSD = await String(r2);
        let finalr2 = finalBUSD.substring(0,3);
    });

    it("BSHARE-BUSD Liquidity Rebalancer: price < $1 for 5000 denomination", async() => {
        let tokenPair = await factory.getPair(BSHARE.address, BUSD.address);
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address,router.address]);

        await BSHARE.mint(owner.address, expandTo18Decimals(15000));
        await BUSD.mint(owner.address, expandTo18Decimals(15000));

        await BSHARE.approve(router.address, expandTo18Decimals(10000));
        await BUSD.approve(router.address, expandTo18Decimals(10000));
        await BSHARE.approve(lprovider.address, expandTo18Decimals(10000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(10000));
        await lprovider.connect(owner).addLiquidity(BSHARE.address, BUSD.address, expandTo18Decimals(5000), expandTo18Decimals(5000), 1, 1, treasury.address);

        let path = [BSHARE.address, BUSD.address];
        await router.connect(owner).swapExactTokensForTokens(expandTo18Decimals(300), expandTo18Decimals(1), path, owner.address, 1692771516);
        await treasury.setRebalancerRole(BSHAREBUSDRebalancer.address);
        await BSHAREBUSDRebalancer.rebalance();

        let r1 = await BSHARE.balanceOf(tokenPair);
        let r2 = await BUSD.balanceOf(tokenPair);

        let finalBSHARE = await String(r1);
        let finalr1 = finalBSHARE.substring(0,3);
        let finalBUSD = await String(r2);
        let finalr2 = finalBUSD.substring(0,3);
        await expect(finalr1).to.equal(finalr2);
    });

    it("BSHARE-BUSD Liquidity Rebalancer: price < $1 for notion example", async() => {
        let tokenPair = await factory.getPair(BSHARE.address, BUSD.address); 
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address,router.address]);

        await BSHARE.mint(owner.address, expandTo18Decimals(110000));
        await BUSD.mint(owner.address, expandTo18Decimals(110000));

        await BSHARE.approve(router.address, expandTo18Decimals(110000));
        await BUSD.approve(router.address, expandTo18Decimals(110000));
        await BSHARE.approve(lprovider.address, expandTo18Decimals(110000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(110000));
        await lprovider.connect(owner).addLiquidity(BSHARE.address, BUSD.address, expandTo18Decimals(90000), expandTo18Decimals(90000), 1, 1, treasury.address);

        let path = [BSHARE.address, BUSD.address];
        await router.connect(owner).swapExactTokensForTokens(expandTo18Decimals(10000), expandTo18Decimals(1), path, owner.address, 1692771516);
        await treasury.setRebalancerRole(BSHAREBUSDRebalancer.address);
        await BSHAREBUSDRebalancer.rebalance();

        let r1 = await BSHARE.balanceOf(tokenPair);
        let r2 = await BUSD.balanceOf(tokenPair);

        let finalBSHARE = await String(r1);
        let finalr1 = finalBSHARE.substring(0,3);
        let finalBUSD = await String(r2);
        let finalr2 = finalBUSD.substring(0,3);
        await expect(finalr1).to.equal(finalr2);
    });

    it("BSHARE-BUSD Liquidity Rebalancer: price < $1 for 1 million denomination", async() => {
        let tokenPair = await factory.getPair(BSHARE.address, BUSD.address); 
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address,router.address]);

        await BSHARE.mint(owner.address, expandTo18Decimals(1100000));
        await BUSD.mint(owner.address, expandTo18Decimals(1100000));

        await BSHARE.approve(router.address, expandTo18Decimals(1100000));
        await BUSD.approve(router.address, expandTo18Decimals(1100000));
        await BSHARE.approve(lprovider.address, expandTo18Decimals(1100000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(1100000));
        await lprovider.connect(owner).addLiquidity(BSHARE.address, BUSD.address, expandTo18Decimals(990000), expandTo18Decimals(990000), 1, 1, treasury.address);

        let path = [BSHARE.address, BUSD.address];
        await router.connect(owner).swapExactTokensForTokens(expandTo18Decimals(10000), expandTo18Decimals(1), path, owner.address, 1692771516);
        await treasury.setRebalancerRole(BSHAREBUSDRebalancer.address);
        await BSHAREBUSDRebalancer.rebalance();

        let r1 = await BSHARE.balanceOf(tokenPair);
        let r2 = await BUSD.balanceOf(tokenPair);

        let finalBSHARE = await String(r1);
        let finalr1 = finalBSHARE.substring(0,3);
        let finalBUSD = await String(r2);
        let finalr2 = finalBUSD.substring(0,3);
        await expect(finalr1).to.equal(finalr2);
    });

    it("BSHARE-BUSD Liquidity Rebalancer: price < $1 for 100 million denomination", async() => {
        let tokenPair = await factory.getPair(BSHARE.address, BUSD.address); 
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address,router.address]);

        await BSHARE.mint(owner.address, expandTo18Decimals(110000000));
        await BUSD.mint(owner.address, expandTo18Decimals(110000000));

        await BSHARE.approve(router.address, expandTo18Decimals(110000000));
        await BUSD.approve(router.address, expandTo18Decimals(110000000));
        await BSHARE.approve(lprovider.address, expandTo18Decimals(110000000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(110000000));
        await lprovider.connect(owner).addLiquidity(BSHARE.address, BUSD.address, expandTo18Decimals(99000000), expandTo18Decimals(99000000), 1, 1, treasury.address);

        let path = [BSHARE.address, BUSD.address];
        await router.connect(owner).swapExactTokensForTokens(expandTo18Decimals(1000000), expandTo18Decimals(1), path, owner.address, 1692771516);
        await treasury.setRebalancerRole(BSHAREBUSDRebalancer.address);
        await BSHAREBUSDRebalancer.rebalance();

        let r1 = await BSHARE.balanceOf(tokenPair);
        let r2 = await BUSD.balanceOf(tokenPair);

        let finalBSHARE = await String(r1);
        let finalr1 = finalBSHARE.substring(0,3);
        let finalBUSD = await String(r2);
        let finalr2 = finalBUSD.substring(0,3);
        await expect(finalr1).to.equal(finalr2);
    });

    // ----------------------------- extra checks ----------------------------------

    it("BSHARE-BUSD Liquidity Rebalancer: call rebalancer only after epoch", async() => {
        let tokenPair = await factory.getPair(BSHARE.address, BUSD.address);
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address,router.address]);

        await BSHARE.mint(owner.address, expandTo18Decimals(5000));
        await BUSD.mint(owner.address, expandTo18Decimals(5000));

        await BSHARE.approve(router.address, expandTo18Decimals(10000));
        await BUSD.approve(router.address, expandTo18Decimals(10000));
        await BSHARE.approve(lprovider.address, expandTo18Decimals(10000));
        await BUSD.approve(lprovider.address, expandTo18Decimals(10000));

        await lprovider.connect(owner).addLiquidity(BSHARE.address, BUSD.address, expandTo18Decimals(100), expandTo18Decimals(100), 1, 1, treasury.address);

        let path = [BUSD.address, BSHARE.address];
        await router.connect(owner).swapExactTokensForTokens(expandTo18Decimals(20), expandTo18Decimals(1), path, owner.address, 1692771516);
        await BSHAREBUSDRebalancer.rebalance();
        await expect(BSHAREBUSDRebalancer.rebalance()).to.be.revertedWith("BSHAREBUSDRebalancer: insufficient time passed");
    });

    it("BSHARE-BUSD Liquidity Rebalancer: only admin can change rebalancer's state", async() => {
        let tokenPair = await factory.getPair(BSHARE.address, BUSD.address);
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address,router.address]);
        await expect(BSHAREBUSDRebalancer.connect(signers[1]).rebalancerState()).to.be.revertedWith("BSHAREBUSDRebalancer: caller is not admin");

    });

    it("BSHARE-BUSD Liquidity Rebalancer: only admin can set price impact percentage limit", async() => {
        let tokenPair = await factory.getPair(BSHARE.address, BUSD.address); 
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address,router.address]);
        await expect(BSHAREBUSDRebalancer.connect(signers[1]).setImpactPercentageLimit(10)).to.be.revertedWith("BSHAREBUSDRebalancer: caller is not admin");

    });

    it("BSHARE-BUSD Liquidity Rebalancer: only admin can set mode", async() => {
        let tokenPair = await factory.getPair(BSHARE.address, BUSD.address); 
        await whitelist.connect(owner).addWhiteList([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address]);
        await whitelist.addWhiteListForSwap([tokenPair,owner.address,BSHAREBUSDRebalancer.address,lprovider.address,router.address]);
        await expect(BSHAREBUSDRebalancer.connect(signers[1]).setMode(1)).to.be.revertedWith("BSHAREBUSDRebalancer: caller is not admin");

    });
})