import {
  UniswapV2Router02,
  UniswapV2Router02__factory,
  Factory,
  Factory__factory,
  CalHash,
  WETH9,
  WETH9__factory,
  ERC20,
  ERC20__factory,
  YSL,
  YSL__factory,
  WhiteList,
  WhiteList__factory,
  Blacklist,
  Blacklist__factory,
  Admin,
  Admin__factory,
  UniswapV2Pair__factory, 
  LiquidityProvider,
  LiquidityProvider__factory,
  Treasury,
  Treasury__factory,
  YSLVault,
  YSLVault__factory,
  USDy,
  USDy__factory,
  TemporaryHolding,
  TemporaryHolding__factory,
  CalHash__factory
} from "../typechain";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";
import { mineBlocks, expandTo18Decimals, expandTo16Decimals,expandTo15Decimals,expandTo17Decimals } from "./utilities/utilities";
import { expect } from "chai";

describe("YSL", async () => {
  let router: UniswapV2Router02;
  let factory1: Factory;
  let WETH: WETH9;
  let treasury: Treasury;
  let calHash: CalHash;
  let whitelist: WhiteList;
  let ysl: YSL;
  let yslVault : YSLVault;
  let owner: SignerWithAddress;
  let signers: SignerWithAddress[];
  let BUSD: ERC20;
  let admin:Admin;
  let Blacklist : Blacklist;
  let liquiddityProvider : LiquidityProvider;
  let usdy : USDy;
  let tempholding : TemporaryHolding;
  let inithash : CalHash;

  beforeEach(async () => {
      signers = await ethers.getSigners();
      owner = signers[0];
      inithash = await new CalHash__factory(owner).deploy();
      admin = await new Admin__factory(owner).deploy();
      await admin.initialize(owner.address, owner.address);
      factory1 = await new Factory__factory(owner).deploy();
      WETH = await new WETH9__factory(owner).deploy();
      treasury = await new Treasury__factory(owner).deploy();
      router = await new UniswapV2Router02__factory(owner).deploy(factory1.address, WETH.address);
      await admin.setApeswapRouter(router.address);
      liquiddityProvider = await new LiquidityProvider__factory(owner).deploy();
      await liquiddityProvider.initialize(router.address, admin.address);
      whitelist = await new WhiteList__factory(owner).deploy();
      Blacklist = await new Blacklist__factory(owner).deploy();
      tempholding = await new TemporaryHolding__factory(owner).deploy();
      usdy = await new USDy__factory(owner).deploy();
      await usdy.initialise(admin.address);
      BUSD = await new ERC20__factory(owner).deploy(expandTo18Decimals(1000000000000));
      await admin.setBUSD(BUSD.address) ;
      yslVault = await new YSLVault__factory(owner).deploy();
      await admin.setYSLVault(yslVault.address);
      await yslVault.initialize(admin.address,signers[1].address);
      await admin.setWBNB(WETH.address) ;
      await admin.setWhitelist(whitelist.address);
      await admin.setBlacklist(Blacklist.address);
      await admin.setTreasury(treasury.address);
      await admin.setTeamAddress(owner.address);
      await whitelist.initialize(admin.address);
      await Blacklist.initialize(admin.address);
      await treasury.connect(owner).initialize(owner.address,admin.address);
      await admin.setUSDy(usdy.address);
      await admin.setTemporaryHolding(tempholding.address);
      ysl = await new YSL__factory(owner).deploy();
      await ysl.initialise(admin.address);
      await admin.setYSL(ysl.address); 
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

  describe('YSL Contract', async () => {
    describe('YSL Initilization', async () => {
      it('YSL: Contructor', async () => {
        expect(await ysl.YSL_Tax()).to.be.eq(1500);
        expect(await ysl.YSL_Tax_Allocation(0)).to.be.eq(1000);
        expect(await ysl.YSL_Tax_Allocation(1)).to.be.eq(500);
      });
    });

    describe('YSL: Role', async () => {

      it('YSL: Set minter role', async () => {
        await ysl.connect(owner).setOperator(signers[2].address);
      });
    })

    describe('YSL: Seter functions', async () => {
      it('YSL: Tax', async () => {
        expect(await ysl.YSL_Tax()).to.be.eq(1500);
        await ysl.connect(owner).setYSLAndAllocationTax(3000, [1000, 2000])
        expect(await ysl.YSL_Tax()).to.be.eq(3000);
      });

      it('YSL Fails: Tax', async () => {
        await expect(ysl.connect(owner).setYSLAndAllocationTax(0, [0])).to.be.revertedWith('YSL: invalid tax');
      });

      it('YSL: Allocation Taxes', async () => {
        expect(await ysl.YSL_Tax_Allocation(0)).to.be.eq(1000);
        expect(await ysl.YSL_Tax_Allocation(1)).to.be.eq(500);
        await ysl.connect(owner).setYSLAndAllocationTax(4500, [1500, 3000])
        expect(await ysl.YSL_Tax()).to.be.eq(4500);
        expect(await ysl.YSL_Tax_Allocation(0)).to.be.eq(1500);
        expect(await ysl.YSL_Tax_Allocation(1)).to.be.eq(3000);
      });

      it('YSL Fails: Allocation Tax', async () => {
        await expect(ysl.connect(owner).setYSLAndAllocationTax(10, [])).to.be.revertedWith('YSL: invalid AllocationTax');
      });

      it('YSL Fails: Tax is equals to sum of Allocation Taxes', async () => {
        await expect(ysl.connect(owner).setYSLAndAllocationTax(10, [1, 1, 1])).to.be.revertedWith('YSL: incorrect inputs');
      });

    });

    describe('YSL: Token functionality', async () => {
      it('YSL: Mint functionality', async () => {
        await ysl.connect(owner).setOperator(signers[1].address);
        await ysl.connect(signers[1]).mint(signers[3].address, expandTo18Decimals(13));
        expect(await ysl.connect(signers[3]).balanceOf(signers[3].address)).to.be.eq(expandTo18Decimals(13));
      })

      it('YSL: Burn functionality', async () => {
        await ysl.connect(owner).setOperator(signers[1].address);
        await ysl.connect(signers[1]).mint(signers[3].address, expandTo18Decimals(13));
        expect(await ysl.connect(signers[3]).balanceOf(signers[3].address)).to.be.eq(expandTo18Decimals(13));
        await ysl.connect(signers[1]).burn(signers[3].address, expandTo18Decimals(13));
        expect(await ysl.connect(signers[1]).balanceOf(signers[3].address)).to.be.eq(0);
      })

    
    });

    describe('YSL: Compensation YSL', async () => {
      it('YSL: Add compensation users', async () => {
        await ysl.connect(owner).setOperator(signers[1].address);
        await ysl.connect(owner).setYSLCompensationAmount([signers[1].address, signers[2].address, signers[3].address], [expandTo18Decimals(100), expandTo18Decimals(200), expandTo18Decimals(300)]);
        expect(await ysl.compensationUsers(signers[1].address)).to.be.eq(expandTo18Decimals(100));
        expect(await ysl.compensationUsers(signers[2].address)).to.be.eq(expandTo18Decimals(200));
        expect(await ysl.compensationUsers(signers[3].address)).to.be.eq(expandTo18Decimals(300));
        expect(await ysl.compensationUsers(signers[4].address)).to.be.eq(expandTo18Decimals(0));
      })

      it('YSL fails: User address', async () => {
        await expect(ysl.connect(owner).setYSLCompensationAmount([], [expandTo18Decimals(100), expandTo18Decimals(200), expandTo18Decimals(300)])).to.be.revertedWith('YSL: null array');
      });

      it('YSL fails: User amounts', async () => {
        await expect(ysl.connect(owner).setYSLCompensationAmount([signers[1].address], [])).to.be.revertedWith('YSL: null array');
      });

      it('YSL fails: User addresses length not equals user amounts length', async () => {
        await expect(ysl.connect(owner).setYSLCompensationAmount([signers[1].address, signers[2].address], [expandTo18Decimals(1000)])).to.be.revertedWith('YSL: unequal array');
      });

      it('YSL: Claim YSL', async () => {
        await ysl.connect(owner).setYSLCompensationAmount([signers[1].address, signers[2].address, signers[3].address], [expandTo18Decimals(1000), expandTo18Decimals(8000), expandTo18Decimals(4000)]);
        expect(await ysl.compensationUsers(signers[1].address)).to.be.eq(expandTo18Decimals(1000));
        expect(await ysl.compensationUsers(signers[2].address)).to.be.eq(expandTo18Decimals(8000));
        expect(await ysl.compensationUsers(signers[3].address)).to.be.eq(expandTo18Decimals(4000));
        expect(await ysl.compensationUsers(signers[4].address)).to.be.eq(expandTo18Decimals(0));
        await mineBlocks(ethers.provider, 600);
        await ysl.connect(signers[1]).claimYSL();
        expect(await ysl.balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(1000));
        await mineBlocks(ethers.provider, 100);
        await ysl.connect(signers[2]).claimYSL();
        expect(await ysl.balanceOf(signers[2].address)).to.be.eq(expandTo18Decimals(8000));
        await mineBlocks(ethers.provider, 100);
        await ysl.connect(signers[3]).claimYSL();
        expect(await ysl.balanceOf(signers[3].address)).to.be.eq(expandTo18Decimals(4000));
        await expect(ysl.connect(signers[1]).claimYSL()).to.be.revertedWith('YSL: zero YSL');
      });


      it('YSL fails: Compensation Period Over', async () => {
        await ysl.connect(owner).setYSLCompensationAmount([signers[1].address, signers[2].address, signers[3].address], [expandTo18Decimals(1000), expandTo18Decimals(8000), expandTo18Decimals(4000)]);
        expect(await ysl.compensationUsers(signers[1].address)).to.be.eq(expandTo18Decimals(1000));
        expect(await ysl.compensationUsers(signers[2].address)).to.be.eq(expandTo18Decimals(8000));
        expect(await ysl.compensationUsers(signers[3].address)).to.be.eq(expandTo18Decimals(4000));
        expect(await ysl.compensationUsers(signers[4].address)).to.be.eq(expandTo18Decimals(0));
        await mineBlocks(ethers.provider, 100);
        await ysl.connect(signers[1]).claimYSL();
        expect(await ysl.balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(1000));
      });

      it('YSL fails: Total supply reaches compensation limit', async () => {
        await ysl.connect(owner).setYSLCompensationAmount([signers[1].address, signers[2].address, signers[3].address], [expandTo18Decimals(1000), expandTo18Decimals(18000), expandTo18Decimals(4000)]);
        expect(await ysl.compensationUsers(signers[1].address)).to.be.eq(expandTo18Decimals(1000));
        expect(await ysl.compensationUsers(signers[2].address)).to.be.eq(expandTo18Decimals(18000));
        expect(await ysl.compensationUsers(signers[3].address)).to.be.eq(expandTo18Decimals(4000));
        expect(await ysl.compensationUsers(signers[4].address)).to.be.eq(expandTo18Decimals(0));
        await mineBlocks(ethers.provider, 600);
        await ysl.connect(signers[1]).claimYSL();
        expect(await ysl.balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(1000));
        await mineBlocks(ethers.provider, 100);
        await ysl.connect(signers[2]).claimYSL();
        expect(await ysl.balanceOf(signers[2].address)).to.be.eq(expandTo18Decimals(18000));
        await ysl.setCompensationLimit(10);
        await expect(ysl.connect(signers[3]).claimYSL()).to.be.revertedWith('YSL: reached limit');
      });

      it('YSL fails: Zero amount', async () => {
        await ysl.connect(owner).setYSLCompensationAmount([signers[1].address, signers[2].address, signers[3].address], [expandTo18Decimals(1000), expandTo18Decimals(18000), expandTo18Decimals(4000)]);
        expect(await ysl.compensationUsers(signers[1].address)).to.be.eq(expandTo18Decimals(1000));
        await ysl.connect(signers[1]).claimYSL();
        expect(await ysl.balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(1000));
        await expect(ysl.connect(signers[1]).claimYSL()).to.be.revertedWith('YSL: zero YSL');
        await expect(ysl.connect(signers[5]).claimYSL()).to.be.revertedWith('YSL: zero YSL');
      });

      it('YSL: Threshold token limit', async () => {
        await factory1.createPair(ysl.address, BUSD.address);
        let pair = await factory1.getPair(ysl.address, BUSD.address);
        let pair_instance = await new UniswapV2Pair__factory(owner).attach(pair);
        await whitelist.connect(owner).addWhiteList([pair, liquiddityProvider.address]);
        await whitelist.connect(owner).addWhiteListForSwap([pair, ysl.address, liquiddityProvider.address, owner.address]);
        await ysl.connect(owner).mint(owner.address, expandTo18Decimals(500000000000));
        await ysl.connect(owner).approve(router.address, expandTo18Decimals(4000000000));
        await BUSD.connect(owner).approve(router.address, expandTo18Decimals(4000000000));
        await ysl.connect(owner).approve(liquiddityProvider.address, expandTo18Decimals(4000000000));
        await BUSD.connect(owner).approve(liquiddityProvider.address, expandTo18Decimals(4000000000));
        await liquiddityProvider.connect(owner).addLiquidity(ysl.address, BUSD.address, expandTo18Decimals(600), expandTo18Decimals(600),expandTo18Decimals(1),expandTo18Decimals(1),treasury.address);
        let result = await pair_instance.getReserves();
      })
      it("YSL FAILS: transfer from the zero address", async () => {
        let addressZero = "0x0000000000000000000000000000000000000000";
        await factory1.createPair(ysl.address, BUSD.address);
        let pair = await factory1.getPair(ysl.address, BUSD.address);
        await whitelist.connect(owner).addWhiteList([pair, liquiddityProvider.address, ysl.address]);
        await whitelist.connect(owner).addWhiteListForSwap([pair,liquiddityProvider.address, owner.address, ysl.address]);

        await ysl.connect(owner).mint(owner.address, expandTo18Decimals(4000000000));

        await ysl.connect(owner).approve(router.address, expandTo18Decimals(4000000000));
        await BUSD.connect(owner).approve(router.address, expandTo18Decimals(4000000000));

        await ysl.connect(owner).approve(liquiddityProvider.address, expandTo18Decimals(4000000000));
        await BUSD.connect(owner).approve(liquiddityProvider.address, expandTo18Decimals(4000000000));
        await liquiddityProvider.connect(owner).addLiquidity(ysl.address, BUSD.address, expandTo18Decimals(600), expandTo18Decimals(600),expandTo18Decimals(1),expandTo18Decimals(1),treasury.address);
        await expect(ysl.connect(addressZero).transfer(signers[1].address, expandTo18Decimals(100))).revertedWith("ERC20: transfer from the zero address");

      })
      it("YSL: Blacklist",async()=>{
        await factory1.createPair(ysl.address, BUSD.address);
        let pair = await factory1.getPair(ysl.address, BUSD.address);
        await Blacklist.addBlacklist([signers[1].address]);
        await expect(ysl.connect(owner).transfer(signers[1].address,expandTo18Decimals(10))).revertedWith("YSL: address is Blacklisted");

      })
      it("YSL FAILS: This contract can't interact", async () => {
        await factory1.createPair(ysl.address, BUSD.address);
        let pair = await factory1.getPair(ysl.address, BUSD.address);
        await whitelist.connect(owner).addWhiteList([pair,liquiddityProvider.address]);
        await whitelist.connect(owner).addWhiteListForSwap([pair,owner.address, liquiddityProvider.address]);

        await ysl.connect(owner).mint(owner.address, expandTo18Decimals(4000000000));

        await ysl.connect(owner).approve(router.address, expandTo18Decimals(4000000000));
        await BUSD.connect(owner).approve(router.address, expandTo18Decimals(4000000000));

        await ysl.connect(owner).approve(liquiddityProvider.address, expandTo18Decimals(4000000000));
        await BUSD.connect(owner).approve(liquiddityProvider.address, expandTo18Decimals(4000000000));
        await liquiddityProvider.connect(owner).addLiquidity(ysl.address, BUSD.address, expandTo18Decimals(600), expandTo18Decimals(600),expandTo18Decimals(1),expandTo18Decimals(1),treasury.address);
        await expect(ysl.connect(BUSD.address).transfer(owner.address, expandTo18Decimals(100))).to.be.revertedWith("YSL: No external interact");
      })
    });
});

});
