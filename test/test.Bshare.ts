import {
  UniswapV2Router02,
  UniswapV2Router02__factory,
  UniswapV2Factory__factory,
  Factory,
  Factory__factory,
  CalHash,
  CalHash__factory,
  WETH9,
  WETH9__factory,
  ERC20,
  ERC20__factory,
  YSL,
  YSL__factory,
  WhiteList,
  WhiteList__factory,
  BSHARE,
  BSHARE__factory,
  Admin,
  Admin__factory,
  Treasury,
  Treasury__factory,
  ProtocolOwnedLiquidity,
  ProtocolOwnedLiquidity__factory,
  USDy,
  USDyBUSDVault, 
  BSHAREBUSDVault,
  Receipt,
  BSHAREBUSDVault__factory,
  Receipt__factory, 
  LiquidityProvider, 
  LiquidityProvider__factory,
  Blacklist,
  Blacklist__factory,
  UniswapV2Pair__factory,
  USDy__factory,
  BshareVault,
  BshareVault__factory
} from "../typechain";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";
import { mineBlocks, expandTo18Decimals, expandTo16Decimals } from "./utilities/utilities";
import { expect } from "chai";
import exp, { SIGABRT } from "constants";


describe("BShare", async () => {
  let router: UniswapV2Router02;
  let factory1: Factory;
  let admin: Admin;
  let treasury: Treasury;
  let pol: ProtocolOwnedLiquidity;
  let weth: WETH9;
  let calHash: CalHash;
  let whitelist: WhiteList;
  let bshare: BSHARE;
  let owner: SignerWithAddress;
  let signers: SignerWithAddress[];
  let BUSD: ERC20;
  let token: Receipt;
  let bshareBUSD : BSHAREBUSDVault;
  let bshareVault : BshareVault;
  let ysl : YSL;
  let usdy : USDy;
  let usdyBUSD : USDyBUSDVault;
  let liquidityProvider : LiquidityProvider;
  let blacklist: Blacklist;
  let bshare_instance : Receipt;
  beforeEach(async () => {
    signers = await ethers.getSigners();
    owner = signers[0];
    admin= await new Admin__factory(owner).deploy();
    factory1 = await new Factory__factory(owner).deploy();
    weth = await new WETH9__factory(owner).deploy();
    token = await new Receipt__factory(owner).deploy();
    router = await new UniswapV2Router02__factory(owner).deploy(factory1.address, weth.address);    
    liquidityProvider = await new LiquidityProvider__factory(owner).deploy();
    usdy = await new USDy__factory(owner).deploy()
    await usdy.initialise(admin.address);
    bshare = await new BSHARE__factory(owner).deploy();
    await bshare.initialise(admin.address);
    ysl = await new YSL__factory(owner).deploy();
    await ysl.initialise(admin.address)
    await admin.initialize(owner.address, owner.address);
    whitelist = await new WhiteList__factory(owner).deploy();
    blacklist = await new Blacklist__factory(owner).deploy();
    await whitelist.initialize(admin.address)
    await blacklist.initialize(admin.address);
    treasury= await new Treasury__factory(owner).deploy();
    pol= await new ProtocolOwnedLiquidity__factory(owner).deploy();
    bshareBUSD = await new BSHAREBUSDVault__factory(owner).deploy();
    await admin.setBShareBUSD(bshareBUSD.address);
    await admin.setWBNB(weth.address) ;
    await admin.setWhitelist(whitelist.address);
    await admin.setBlacklist(blacklist.address);
    await admin.setPOL(pol.address) ; 
    await admin.setTreasury(treasury.address); 
    await admin.setYSL(ysl.address);
    await admin.setApeswapRouter(router.address); 
    await admin.setLiquidityProvider(liquidityProvider.address);
    await admin.setBShare(bshare.address);
    await admin.setmasterNTT(token.address);
    await admin.setUSDy(usdy.address);
    await liquidityProvider.initialize(router.address, admin.address);
    BUSD = await new ERC20__factory(owner).deploy(expandTo18Decimals(10000000000000));
    await admin.setBUSD(BUSD.address) ;
    bshareVault = await new BshareVault__factory(owner).deploy();
    await admin.setBShareVault(bshareVault.address);
    await bshareVault.initialize(admin.address);
    bshare_instance = await new Receipt__factory(owner).attach(await bshareVault.BshareS());

  });
    describe("BShare", async () => {
        it("BShare: retrieve returns a value previously initialized ", async () => {
        let token1 = await new ERC20__factory(owner).deploy(expandTo18Decimals(1000));
        let token2 = await new ERC20__factory(owner).deploy(expandTo18Decimals(1000));

        await token1.approve(router.address, expandTo18Decimals(1000));
        await token2.approve(router.address, expandTo18Decimals(1000));

        await router.connect(owner).addLiquidity(token1.address, token2.address,
          expandTo18Decimals(10), expandTo18Decimals(10),
          expandTo18Decimals(1), expandTo18Decimals(1), owner.address, 1678948210);
      });   
    });
    describe('bshare: Role', async () => {
        it('bshare: Set minter role', async () => {
            await bshare.connect(owner).setOperator(signers[2].address);
        });
    });
    describe('Bshare: Setter functions', async () => {
      it('BShare: Tax', async () => {
        expect(await bshare.BShare_Tax()).to.be.eq(1500);
        await bshare.connect(owner).setBShareAndAllocationTax(3000, [1000, 1000, 1000])
        expect(await bshare.BShare_Tax()).to.be.eq(3000);
      });

      it('BShare Fails: Tax', async () => {
        await expect(bshare.connect(owner).setBShareAndAllocationTax(0, [0])).to.be.revertedWith('BShare: Tax should be greater than zero');
      });

      it('BShare: Allocation Taxes', async () => {

        expect(await bshare.BShare_Tax_Allocation(0)).to.be.eq(1000);
        expect(await bshare.BShare_Tax_Allocation(1)).to.be.eq(500);
        await bshare.connect(owner).setBShareAndAllocationTax(3000, [1500, 1500])
        expect(await bshare.BShare_Tax()).to.be.eq(3000);
        expect(await bshare.BShare_Tax_Allocation(0)).to.be.eq(1500);
        expect(await bshare.BShare_Tax_Allocation(1)).to.be.eq(1500);
      });

      it('BShare Fails: Allocation Tax', async () => {
        await expect(bshare.connect(owner).setBShareAndAllocationTax(10, [])).to.be.revertedWith('BShare: AllocationTax should not be empty');
      });

      it('BShare Fails: Tax is equals to sum of Allocation Taxes', async () => {
        await expect(bshare.connect(owner).setBShareAndAllocationTax(10, [1, 1, 1])).to.be.revertedWith('BShare: Tax not equal to sum of allocation tax');
      });

    });
    describe('bshare: Token functionality', async () => {
        it('bshare: Mint functionality', async () => {
            await bshare.connect(owner).mint(signers[3].address, expandTo18Decimals(13));
            expect(await bshare.connect(owner).balanceOf(signers[3].address)).to.be.eq(expandTo18Decimals(13));
        });
        it('bshare: Burn functionality', async () => {
            await bshare.connect(owner).mint(signers[3].address, expandTo18Decimals(13));
            expect(await bshare.connect(owner).balanceOf(signers[3].address)).to.be.eq(expandTo18Decimals(13));
            await bshare.connect(owner).burn(signers[3].address, expandTo18Decimals(13));
            expect(await bshare.connect(owner).balanceOf(signers[3].address)).to.be.eq(0);
        });
    });
    describe("bshare: _transfer functionality", async () => {
      it("bshare: Blacklist",async()=>{
        await factory1.createPair(bshare.address, BUSD.address);
        let pair = await factory1.getPair(
          bshare.address, BUSD.address);
        let Pair_instance = await new UniswapV2Factory__factory(owner).attach(pair);
        await blacklist.addBlacklist([signers[1].address]);
        await expect(bshare.connect(owner).transfer(signers[1].address,expandTo18Decimals(10))).revertedWith("BShare: address is Blacklisted");
  
      })
        it('bshare: Token transfer', async () => {
            await factory1.createPair(bshare.address, BUSD.address);
            let pair = await factory1.getPair(bshare.address, BUSD.address);
            await whitelist.addWhiteList([pair,owner.address,bshare.address]);
            await whitelist.addWhiteListForSwap([pair,owner.address,bshare.address]);
           
            await bshare.connect(owner).mint(owner.address, expandTo18Decimals(500000000000));
            await bshare.connect(owner).approve(router.address, expandTo18Decimals(4000000000));
            await BUSD.connect(owner).approve(router.address, expandTo18Decimals(4000000000));
            await router.connect(owner).addLiquidity(bshare.address,BUSD.address,expandTo18Decimals(100),expandTo18Decimals(100),
                       1,1,signers[1].address,1678948210);
            await mineBlocks(ethers.provider, 900);
            await blacklist.addBlacklist([signers[2].address]);
            await (expect(bshare.connect(owner).transfer(signers[2].address,expandTo18Decimals(1)))).revertedWith("BShare: address is Blacklisted");
            await (expect(bshare.connect(signers[2]).transfer(signers[1].address,expandTo18Decimals(1)))).revertedWith("BShare: address is Blacklisted");
            await(expect(bshare.connect(owner).transfer("0x0000000000000000000000000000000000000000",  expandTo18Decimals(10))).revertedWith("ERC20: transfer to the zero address"));
            await bshare.connect(owner).transfer(signers[1].address,  expandTo18Decimals(10));
            expect(await bshare.connect(owner).balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(10));    
        });

    it('Bshare: Token Transfer if sender and recipient are not pair but one of them is whitelisted ', async () => {
      await factory1.createPair(bshare.address, BUSD.address);
      let pair = await factory1.getPair(bshare.address, BUSD.address);

      let Pair_instance = await new UniswapV2Factory__factory(owner).attach(pair);
      await whitelist.addWhiteList([pair,owner.address]);
      await whitelist.addWhiteListForSwap([pair,owner.address,bshare.address]);
      await bshare.connect(owner).mint(owner.address, expandTo18Decimals(500000));
      await bshare.connect(owner).approve(router.address, expandTo18Decimals(400000));
      await BUSD.connect(owner).transfer(owner.address,expandTo18Decimals(400000));
      await BUSD.connect(owner).approve(router.address, expandTo18Decimals(400000));
      await router.connect(owner).addLiquidity(bshare.address,BUSD.address,expandTo18Decimals(100),expandTo18Decimals(100),
      1,1,signers[1].address,1678948210);
      await mineBlocks(ethers.provider, 11300);
      await bshare.connect(owner).transfer(signers[1].address,expandTo18Decimals(10));
       expect(await bshare.connect(owner).balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(10));           
  });

it('Bshare: Token Transfer if recipient is pair: price impact protection ', async () => {
  await factory1.createPair(bshare.address, BUSD.address);
  let pair = await factory1.getPair(bshare.address, BUSD.address);
  let Pair_instance = await new UniswapV2Factory__factory(owner).attach(pair);
  await whitelist.addWhiteList([pair,bshare.address]);
  await whitelist.addWhiteListForSwap([pair,bshare.address,owner.address]);
  await bshare.connect(owner).mint(owner.address, expandTo18Decimals(500000));
  await BUSD.connect(owner).transfer(owner.address,expandTo18Decimals(400000));
  await bshare.connect(owner).approve(router.address,expandTo18Decimals(100000000000000));
  await BUSD.connect(owner).approve(router.address,expandTo18Decimals(100000000000000));
  await router.connect(owner).addLiquidity(bshare.address,BUSD.address,expandTo18Decimals(1000),expandTo18Decimals(1000),
                          1,1,owner.address,1678948210);
  await whitelist.revokeWhiteListOfSwap([owner.address]);
  await mineBlocks(ethers.provider, 900);
  await bshare.connect(owner).transfer(pair,expandTo18Decimals(10));
  await expect(Number(bshare.connect(owner).transfer(pair,expandTo18Decimals(10))));
});
});
      
});
