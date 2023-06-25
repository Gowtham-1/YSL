import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";
import { mineBlocks, expandTo18Decimals, expandTo16Decimals } from "./utilities/utilities";
import { expect } from "chai";
import { Admin, Admin__factory, Blacklist, Blacklist__factory, BshareVault, BshareVault__factory,
     CalHash, CalHash__factory, ERC20, ERC20__factory, Factory, Factory__factory, IERC20, 
     LiquidityProvider, LiquidityProvider__factory, TemporaryHolding,
      TemporaryHolding__factory, Treasury, Treasury__factory, UniswapV2Factory, 
      UniswapV2Factory__factory, UniswapV2Pair, UniswapV2Pair__factory, UniswapV2Router02,
       UniswapV2Router02__factory, USDy, USDy__factory, WETH9, WETH9__factory, WhiteList, 
       WhiteList__factory } from "../typechain";
import { Signer } from "ethers";
describe("USDY", async () => {
  let router: UniswapV2Router02;
  let router1: UniswapV2Router02;
  let factory1: Factory;
  let WETH: WETH9;
  let lprovider: LiquidityProvider;
  let admin:Admin;
  let usdy:USDy;
  let treasury: Treasury;
  let whitelist: WhiteList;
  let owner: SignerWithAddress;
  let signers: SignerWithAddress[];
  let BUSD: ERC20;
  let blacklist: Blacklist;
  let calhash: CalHash;
  let tempholding: TemporaryHolding;
  let bsharevault: BshareVault;

  beforeEach(async () => {
    signers = await ethers.getSigners();
    owner = signers[0];
    admin= await new Admin__factory(owner).deploy();
    await admin.initialize(owner.address,owner.address);
    factory1 = await new Factory__factory(owner).deploy();
    WETH = await new WETH9__factory(owner).deploy();
    treasury = await new Treasury__factory(owner).deploy();
    await admin.setTreasury(treasury.address);  
    router = await new UniswapV2Router02__factory(owner).deploy(factory1.address, WETH.address);  
    bsharevault = await new BshareVault__factory(owner).deploy();
    await admin.setBShareVault(bsharevault.address);  
    await bsharevault.initialize(admin.address);
    tempholding = await new TemporaryHolding__factory(owner).deploy();
    await admin.setTemporaryHolding(tempholding.address);
    lprovider = await new LiquidityProvider__factory(owner).deploy();
    calhash = await new CalHash__factory(owner).deploy();
    await lprovider.initialize(router.address,admin.address);
    whitelist = await new WhiteList__factory(owner).deploy();
    blacklist = await new Blacklist__factory(owner).deploy();
    BUSD = await new ERC20__factory(owner).deploy(expandTo18Decimals(1000000000000));
    await admin.setBUSD(BUSD.address) ;
    await treasury.connect(owner).initialize(owner.address,admin.address);
    await admin.setApeswapRouter(router.address);
    usdy = await new USDy__factory(owner).deploy();
    await usdy.initialise(admin.address);
    await admin.setWBNB(WETH.address) ;
    await admin.setUSDy(usdy.address);
    await whitelist.initialize(admin.address);
    await blacklist.initialize(admin.address);
    await admin.setWhitelist(whitelist.address);
    await admin.setBlacklist(blacklist.address);
    await usdy.setLockTransactionTime(10);
  });
  describe("USDy TOKEN", async () => {
    describe('USDy: Token functionality', async () => {
      it('USDy: Mint functionality', async () => {
        await usdy.connect(owner).setOperator(signers[1].address);
        await usdy.connect(signers[1]).mint(signers[3].address, expandTo18Decimals(13));
        expect(await usdy.connect(signers[3]).balanceOf(signers[3].address)).to.be.eq(expandTo18Decimals(13));
      })

      it('usdy: Burn functionality', async () => {
        await usdy.connect(owner).setOperator(signers[1].address);
        await usdy.connect(signers[1]).mint(signers[3].address, expandTo18Decimals(13));
        expect(await usdy.connect(signers[3]).balanceOf(signers[3].address)).to.be.eq(expandTo18Decimals(13));
        await usdy.connect(signers[1]).burn(signers[3].address, expandTo18Decimals(13));
        expect(await usdy.connect(signers[1]).balanceOf(signers[3].address)).to.be.eq(0);
      })
      it("usdy: Token Transfer when sender is whitelisted", async () => {
        await whitelist.connect(owner).addWhiteList([signers[2].address]);
        await usdy.connect(owner).mint(signers[1].address, expandTo18Decimals(130));

        await usdy.connect(signers[1]).transfer(signers[2].address, expandTo18Decimals(10));
        expect(await usdy.balanceOf(signers[2].address)).to.be.equal(expandTo18Decimals(10));
      })
      it("usdy: Token Transfer when sender is Non-whitelisted", async () => {
        await usdy.connect(owner).mint(signers[1].address, expandTo18Decimals(130));
        await expect(usdy.connect(signers[1]).transfer(signers[3].address, expandTo18Decimals(10))).revertedWith("USDy: transactionTimeLimit is greater than current time");
      })
      it("init hash",async()=>{
        await calhash.connect(owner).getInitHash();
      })

      it("usdy: Blacklist",async()=>{
        await factory1.createPair(usdy.address, BUSD.address);
        let pair = await factory1.getPair(usdy.address, BUSD.address);
        let Pair_instance = await new UniswapV2Factory__factory(owner).attach(pair);
        await blacklist.addBlacklist([signers[1].address]);
        await expect(usdy.connect(owner).transfer(signers[1].address,expandTo18Decimals(10))).revertedWith("USDy: address is Blacklisted");

      })  
});
    })
  })
