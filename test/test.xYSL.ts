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
  Admin,
  Admin__factory,
  BYSL__factory,
  Receipt,
  Receipt__factory,
  LiquidityProvider,
  LiquidityProvider__factory,
  Blacklist,
  Blacklist__factory,
  USDy,
  USDy__factory,

} from "../typechain";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";
import { mineBlocks, expandTo18Decimals ,expandTo16Decimals} from "./utilities/utilities";
import { expect } from "chai";
import { SIGABRT } from "constants";

describe("xYSL", async () => {
  let router: UniswapV2Router02;
  let factory1: Factory;
  let WETH: WETH9;
  let calHash: CalHash;
  let whitelist: WhiteList;
  let xysl: XYSL
  let owner: SignerWithAddress;
  let signers: SignerWithAddress[];
  let BUSD: ERC20;
  let oldxysl: Receipt;
  let token: Receipt;
  let admin:Admin;
  let lprovider: LiquidityProvider;
  let blacklist: Blacklist;
  let usdy : USDy;

  beforeEach(async () => {
    signers = await ethers.getSigners();
    owner = signers[0];
    admin= await new Admin__factory(owner).deploy();
    await admin.initialize(owner.address,owner.address);
    factory1 = await new Factory__factory(owner).deploy();
    WETH = await new WETH9__factory(owner).deploy();
    whitelist = await new WhiteList__factory(owner).deploy();
    blacklist = await new Blacklist__factory(owner).deploy();
    await admin.setWhitelist(whitelist.address) ;
    await admin.setBlacklist(blacklist.address) ;
    await whitelist.initialize(admin.address);
    await blacklist.initialize(admin.address);
    router = await new UniswapV2Router02__factory(owner).deploy(factory1.address, WETH.address);
    await admin.setApeswapRouter(router.address);
    BUSD = await new ERC20__factory(owner).deploy(expandTo18Decimals(1000000000000));
    await admin.setBUSD(BUSD.address) ;
    oldxysl = await new Receipt__factory(owner).deploy();
    await admin.setmasterNTT(oldxysl.address);
    await oldxysl.initialize(admin.address,owner.address,"abcd","abcd");
    await oldxysl.connect(owner).mint(owner.address,expandTo18Decimals(1000000000000000));

    await oldxysl.connect(owner).mint(signers[1].address,expandTo18Decimals(1000000));
    await oldxysl.connect(owner).burn(signers[1].address,expandTo18Decimals(1000000));
    usdy = await new USDy__factory(owner).deploy();
    await usdy.initialise(admin.address);
    xysl = await new XYSL__factory(owner).deploy();
    await xysl.initialise(admin.address,oldxysl.address);
    lprovider = await new LiquidityProvider__factory(owner).deploy();
    await admin.setLiquidityProvider(lprovider.address);
    await lprovider.initialize(router.address,admin.address);

    await admin.setWBNB(WETH.address) ;
    await admin.setxYSL(xysl.address);  
    await admin.setUSDy(usdy.address); 
});

  it("retrieve returns a value previously initialized", async function () {
    let token1 = await new ERC20__factory(owner).deploy(expandTo18Decimals(1000));
    let token2 = await new ERC20__factory(owner).deploy(expandTo18Decimals(1000));

    await token1.approve(router.address, expandTo18Decimals(1000));
    await token2.approve(router.address, expandTo18Decimals(1000));

    await router.connect(owner).addLiquidity(token1.address, token2.address,
      expandTo18Decimals(10), expandTo18Decimals(10),
      expandTo18Decimals(1), expandTo18Decimals(1), owner.address, 1678948210);
  });

  describe('xYSL Contract', async () => {

    describe('xYSL: Seter functions', async () => {
      it('xYSL: Tax', async () => {
        expect(await xysl.xYSL_Tax()).to.be.eq(1500);
        await xysl.connect(owner).setxYSLAndAllocationTax(3000, [1000, 1000, 1000])
        expect(await xysl.xYSL_Tax()).to.be.eq(3000);
      });

      it('xYSL Fails: Tax', async () => {
        await expect(xysl.connect(owner).setxYSLAndAllocationTax(0, [0])).to.be.revertedWith('xYSL: Tax should be greater than zero');
      });

      it('xYSL: Allocation Taxes', async () => {

        expect(await xysl.xYSL_Tax_Allocation(0)).to.be.eq(500);
        expect(await xysl.xYSL_Tax_Allocation(1)).to.be.eq(500);
        expect(await xysl.xYSL_Tax_Allocation(2)).to.be.eq(500);
        await xysl.connect(owner).setxYSLAndAllocationTax(4500, [1500, 1500, 1500])
        expect(await xysl.xYSL_Tax()).to.be.eq(4500);
        expect(await xysl.xYSL_Tax_Allocation(0)).to.be.eq(1500);
        expect(await xysl.xYSL_Tax_Allocation(1)).to.be.eq(1500);
        expect(await xysl.xYSL_Tax_Allocation(2)).to.be.eq(1500);
      });

      it('xYSL Fails: Allocation Tax', async () => {
        await expect(xysl.connect(owner).setxYSLAndAllocationTax(10, [])).to.be.revertedWith('xYSL: AllocationTax should not be empty');
      });

      it('xYSL Fails: Tax is equals to sum of Allocation Taxes', async () => {
        await expect(xysl.connect(owner).setxYSLAndAllocationTax(10, [1, 1, 1])).to.be.revertedWith('xYSL: Tax not equal to sum of allocation tax');
      });

    });

    describe('xYSL: Token functionality', async () => {
      it('xYSL: Mint functionality', async () => {
        await xysl.connect(owner).setOperator(signers[1].address);
        await xysl.connect(signers[1]).mint(signers[3].address, expandTo18Decimals(13));
        expect(await xysl.connect(signers[3]).balanceOf(signers[3].address)).to.be.eq(expandTo18Decimals(13));
      })

      it('xYSL: Burn functionality', async () => {
        await xysl.connect(owner).setOperator(owner.address);
        await xysl.connect(owner).mint(signers[3].address, expandTo18Decimals(3000));
        expect(await xysl.connect(owner).balanceOf(signers[3].address)).to.be.eq(expandTo18Decimals(3000));
        await xysl.connect(owner).burn(signers[3].address, expandTo18Decimals(3000));
        expect(await xysl.connect(owner).balanceOf(signers[3].address)).to.be.eq(0);
      })
      it('xYSL: migrate functionality', async () => {
        await xysl.connect(owner).mint(owner.address,expandTo18Decimals(10000000));
        await oldxysl.connect(owner).transfer(signers[2].address, expandTo18Decimals(20000));
        await oldxysl.connect(signers[2]).approve(xysl.address, expandTo18Decimals(200000));
        let a = await oldxysl.connect(signers[2]).balanceOf(signers[2].address);
        await xysl.connect(signers[2]).migrate();
        expect(Number(await xysl.connect(signers[2]).balanceOf(signers[2].address))).to.be.eq(Number(a));
      })

      it("xYSL: migrate: MINTING LIMIT EXCEEDED", async () => {
        await oldxysl.connect(owner).mint(signers[2].address, expandTo18Decimals(4000000));
        await oldxysl.connect(owner).mint(signers[3].address, expandTo18Decimals(4000000));
        await xysl.connect(owner).mint(owner.address, expandTo18Decimals(5000000000000000));
        await oldxysl.connect(signers[2]).approve(xysl.address, expandTo18Decimals(4000000));
        let a = await oldxysl.connect(signers[2]).balanceOf(signers[2].address);
        await expect(xysl.connect(signers[2]).migrate()).to.be.revertedWith("xYSL: migrate: MINTING LIMIT EXCEEDED");
      })
      it("xYSL: Days threshold not reached yet", async () => {
        
        await oldxysl.connect(owner).mint(signers[2].address, expandTo18Decimals(500000000));
        await oldxysl.connect(owner).mint(signers[3].address, expandTo18Decimals(200000000));
        await oldxysl.connect(owner).burn(signers[2].address, expandTo18Decimals(200000000));
        await oldxysl.connect(owner).mint(owner.address, expandTo18Decimals(600000000));
        let array = [oldxysl.address, BUSD.address];
        await oldxysl.connect(signers[2]).approve(xysl.address, expandTo18Decimals(2000000000));
        await factory1.createPair(oldxysl.address, BUSD.address);
        let pair = await factory1.getPair(oldxysl.address, BUSD.address);
        await oldxysl.connect(owner).mint(signers[1].address, expandTo18Decimals(500000000000));
        await oldxysl.connect(signers[1]).approve(router.address, expandTo18Decimals(3000000000));
        await BUSD.connect(signers[1]).approve(router.address, expandTo18Decimals(300000000000));
        await BUSD.connect(owner).transfer(signers[1].address, expandTo18Decimals(30000));

        await router.connect(signers[1]).addLiquidity(oldxysl.address, BUSD.address, expandTo18Decimals(3000), expandTo18Decimals(3000), 
        expandTo18Decimals(1), expandTo18Decimals(1), signers[1].address, 1692405733);        

        let AmountIn = await router.connect(signers[1]).getAmountsOut(expandTo18Decimals(3000), array);
        let a1 = Number(AmountIn[1]);
        let a = await oldxysl.connect(signers[2]).balanceOf(signers[2].address);
        await mineBlocks(ethers.provider, 2000);
        await xysl.connect(signers[2]).migrate();
        await mineBlocks(ethers.provider, 2000);
        await expect(xysl.connect(owner).swapOldXYSL()).to.be.revertedWith("xYSL: Days threshold not reached yet");
      })
    });
    it("xYSL: Blacklist",async()=>{
      await factory1.createPair(xysl.address, BUSD.address);
      let pair = await factory1.getPair(xysl.address, BUSD.address);
      let Pair_instance = await new UniswapV2Factory__factory(owner).attach(pair);
      await blacklist.addBlacklist([signers[1].address]);
      await expect(xysl.connect(owner).transfer(signers[1].address,expandTo18Decimals(10))).revertedWith("xYSL: address is Blacklisted");

    })
   
   
    describe("xYSL: Price Impact Protection",async()=>{
          it("Price Impact : transferred 1% of the liquidity",async()=>{
              await factory1.createPair(xysl.address, BUSD.address);
              let pair = await factory1.getPair(xysl.address, BUSD.address);
              let Pair_instance = await new UniswapV2Factory__factory(owner).attach(pair);
              await whitelist.connect(owner).addWhiteList([pair,xysl.address]);
              await whitelist.addWhiteListForSwap([pair,signers[1].address,xysl.address]);
              await xysl.connect(owner).mint(signers[1].address, expandTo18Decimals(500000000000));
              await BUSD.connect(owner).transfer(signers[1].address,expandTo18Decimals(4000000000));
              await xysl.connect(signers[1]).approve(router.address, expandTo18Decimals(4000000000));
              await BUSD.connect(signers[1]).approve(router.address, expandTo18Decimals(4000000000));
              await router.connect(signers[1]).addLiquidity(xysl.address, BUSD.address, expandTo18Decimals(1000), expandTo18Decimals(1000), 
              expandTo18Decimals(1), expandTo18Decimals(1), signers[1].address, 1692405733);
              await whitelist.revokeWhiteListOfSwap([signers[1].address]);
              await mineBlocks(ethers.provider, 900);
              await xysl.connect(signers[1]).transfer(pair, expandTo18Decimals(10));
              expect(await xysl.connect(signers[1]).balanceOf(Pair_instance.address)).to.be.eq(expandTo18Decimals(1010));
              
            });
        })

    })
  });