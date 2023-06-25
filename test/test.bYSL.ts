import {
    UniswapV2Router02,
    UniswapV2Router02__factory,
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
    BYSL,
    BYSL__factory,
    Treasury__factory,
    Treasury,
    ProtocolOwnedLiquidity__factory,
    ProtocolOwnedLiquidity,
    Admin,
    Admin__factory,
    TemporaryHolding,
    TemporaryHolding__factory,
    Blacklist,
    Blacklist__factory
} from "../typechain";
  
  import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
  import { ethers } from "hardhat";
  import { mineBlocks, expandTo18Decimals } from "./utilities/utilities";
  import { expect } from "chai";
  import exp from "constants";
  
  describe("bYSL", async () => 
{
    let router: UniswapV2Router02;
    let factory: UniswapV2Factory;
    let factory1: Factory;
    let WETH: WETH9;
    let calHash: CalHash;
    let pair: UniswapV2Pair;
    let bysl: BYSL
    let whitelist: WhiteList;
    let owner: SignerWithAddress;
    let signers: SignerWithAddress[];
    let BUSD: ERC20;
    let treasury: Treasury;
    let pol: ProtocolOwnedLiquidity;
    let admin:Admin;
    let blacklist: Blacklist;

  
    beforeEach(async () => {
      signers = await ethers.getSigners();
      owner = signers[0];
      admin= await new Admin__factory(owner).deploy();
      await admin.initialize(owner.address,owner.address);
      calHash = await new CalHash__factory(owner).deploy();
      factory1 = await new Factory__factory(owner).deploy();
      WETH = await new WETH9__factory(owner).deploy();
      whitelist = await new WhiteList__factory(owner).deploy();
      await whitelist.initialize(admin.address);
      blacklist = await new Blacklist__factory(owner).deploy();
      await blacklist.initialize(admin.address);
      treasury= await new Treasury__factory(owner).deploy();
      pol= await new ProtocolOwnedLiquidity__factory(owner).deploy();
      router = await new UniswapV2Router02__factory(owner).deploy(factory1.address, WETH.address);
      BUSD = await new ERC20__factory(signers[1]).deploy(expandTo18Decimals(100000000000)); 
      await BUSD.transfer(treasury.address, expandTo18Decimals(50000));
      await BUSD.transfer(pol.address, expandTo18Decimals(50000)); 
    
    await admin.setWBNB(WETH.address) ;
    await admin.setBUSD(BUSD.address) ;
    await admin.setWhitelist(whitelist.address) ;
    await admin.setBlacklist(blacklist.address);
    await admin.setPOL(pol.address) ; 
    await admin.setTreasury(treasury.address);   
    bysl = await new BYSL__factory(owner).deploy(admin.address);
    await admin.setbYSL(bysl.address) ;
    
    await treasury.connect(owner).initialize(owner.address,admin.address);
    });

    describe('bYSL', async () => {
        describe('bYSL: Initilization', async () => {
            it('bYSL: Constructor', async () => {
                expect(await admin.whitelist()).to.be.eq(whitelist.address);
                await whitelist.addWhiteList([bysl.address]);
                expect(await whitelist.getAddresses(bysl.address)).to.be.eq(true);
                expect(await whitelist.getAddresses(whitelist.address)).to.be.eq(false);
            });
        }); 

        describe('bYSL: Token functionality', async () => {
            it('bYSL: Mint functonality', async () => {
                await whitelist.addWhiteList([bysl.address]);
                expect(await whitelist.getAddresses(bysl.address)).to.be.eq(true);
                await bysl.connect(owner).isMinter(owner.address);
                await bysl.connect(owner).mint(signers[1].address, expandTo18Decimals(50));
                expect(await bysl.connect(owner).balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(50));
            })
            
            it('bYSL: Burn functionality', async () => {
                await whitelist.addWhiteList([bysl.address]);
                expect(await whitelist.getAddresses(bysl.address)).to.be.eq(true);
                await bysl.connect(owner).isMinter(owner.address);
                await bysl.connect(owner).mint(signers[1].address, expandTo18Decimals(50))
                expect(await bysl.connect(owner).balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(50));
                await bysl.connect(owner).burn(signers[1].address, expandTo18Decimals(25));
                expect(await bysl.connect(owner).balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(25));
            });

            it('bYSL: Transfer functionality-> From Blacklisted User',async()=> {
                await whitelist.addWhiteList([bysl.address,owner.address]);
                expect(await whitelist.getAddresses(bysl.address)).to.be.eq(true);
                expect(await whitelist.getAddresses(owner.address)).to.be.eq(true);
                await bysl.connect(owner).isMinter(owner.address);
                await bysl.connect(owner).mint(signers[1].address, expandTo18Decimals(1000));
                expect(await bysl.connect(owner).balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(1000));
                await blacklist.addBlacklist([signers[1].address]);
                expect(await blacklist.getAddresses(signers[1].address)).to.be.eq(true);
                await expect (bysl.connect(signers[1]).transfer(signers[2].address,(expandTo18Decimals(100)))).to.be.revertedWith('bYSL: address is Blacklisted');
            })

            it('bYSL: Transfer functionality-> Receiver is Blacklisted',async()=> {
                await whitelist.addWhiteList([bysl.address,owner.address]);
                expect(await whitelist.getAddresses(bysl.address)).to.be.eq(true);
                expect(await whitelist.getAddresses(owner.address)).to.be.eq(true);
                await bysl.connect(owner).isMinter(owner.address);
                await bysl.connect(owner).mint(signers[1].address, expandTo18Decimals(1000));
                expect(await bysl.connect(owner).balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(1000));
                await blacklist.addBlacklist([signers[1].address]);
                expect(await blacklist.getAddresses(signers[1].address)).to.be.eq(true);
                await expect (bysl.connect(owner).transfer(signers[1].address,(expandTo18Decimals(100)))).to.be.revertedWith('bYSL: address is Blacklisted');
            })

            it('bYSL: Transfer functionality-> User is Whitelisted',async()=> {
                await whitelist.addWhiteList([bysl.address,owner.address]);
                expect(await whitelist.getAddresses(bysl.address)).to.be.eq(true);
                expect(await whitelist.getAddresses(owner.address)).to.be.eq(true);
                await bysl.connect(owner).isMinter(owner.address);
                await bysl.connect(owner).mint(owner.address, expandTo18Decimals(1000));
                await bysl.connect(owner).transfer(bysl.address,expandTo18Decimals(100));
                expect(await bysl.connect(owner).balanceOf(owner.address)).to.be.eq(expandTo18Decimals(900));
            })

            
            it('bYSL: Transfer to Non-Whitelist user',async () =>{
                await whitelist.addWhiteList([bysl.address,owner.address]);
                await bysl.connect(owner).mint(signers[1].address, expandTo18Decimals(50000));
                expect(await bysl.connect(signers[1]).balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(50000));
                await bysl.setLockTransactionTime(10);
                await expect ( bysl.connect(signers[1]).transfer(signers[2].address, expandTo18Decimals(10000))).revertedWith("bYSL: transactionTimeLimit is greater than current time");
                await mineBlocks(ethers.provider,(3600));
                await (bysl.connect(signers[1]).transfer(signers[2].address, expandTo18Decimals(10000)));
                expect(await bysl.connect(signers[1]).balanceOf(signers[2].address)).to.be.eq(expandTo18Decimals(10000));
            })

            describe('bYSL: Token transfer', async () => {
                it('bYSL:Transfer to a NON- Whitelist contract', async () => {
                    await whitelist.addWhiteList([bysl.address,owner.address]);
                    await bysl.connect(owner).mint(signers[1].address, expandTo18Decimals(500));
                    expect(await bysl.connect(signers[1]).balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(500));
                    await expect(bysl.connect(signers[1]).transfer(BUSD.address, expandTo18Decimals(100))).to.be.revertedWith('bYSL: No external contract interact with bYSL');
    
                });
            });

            describe('bYSL: Token transfer', async () => {
                it('bYSL:Transfer from a NON- Whitelist contract', async () => {
                    await whitelist.addWhiteList([owner.address]);
                    await bysl.connect(owner).mint(signers[1].address, expandTo18Decimals(500));
                    expect(await bysl.connect(signers[1]).balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(500));
                    await expect(bysl.connect(signers[1]).transfer(BUSD.address, expandTo18Decimals(100))).to.be.revertedWith('bYSL: No external contract interact with bYSL');
                });
            });

            describe('bYSL: Token transfer', async () => {
                it('bYSL: A NON-Whitelist User can make only 1 transaction, either Transfer or Receive ', async () => {
                    await whitelist.addWhiteList([bysl.address,owner.address]);
                    await bysl.connect(owner).mint(signers[1].address, expandTo18Decimals(500));
                    expect(await bysl.connect(signers[1]).balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(500));
                    await expect ( bysl.connect(signers[1]).transfer(signers[2].address, expandTo18Decimals(100))).revertedWith("bYSL: transactionTimeLimit is greater than current time");
                });
            });

            describe('bYSL: Token transfer', async () => {
                it('bYSL: A NON-Whitelist User can make 2nd transaction,after log hours(i.e 24 hours) of his 1st transaction either Transfer or Receive ', async () => {
                    await whitelist.addWhiteList([bysl.address,owner.address]);
                    await bysl.setLockTransactionTime(3600);
                    await bysl.connect(owner).mint(signers[1].address, expandTo18Decimals(500));
                    expect(await bysl.connect(signers[1]).balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(500));
                    await expect ( bysl.connect(signers[1]).transfer(signers[2].address, expandTo18Decimals(100))).revertedWith("bYSL: transactionTimeLimit is greater than current time");
                    await mineBlocks(ethers.provider,(3600));
                    await (bysl.connect(signers[1]).transfer(signers[2].address, expandTo18Decimals(10)));
                    expect(await bysl.connect(signers[1]).balanceOf(signers[2].address)).to.be.eq(expandTo18Decimals(10));
                });
            });
        });

        describe('bYSL: Pause Mint or Burn', async () => {
            it('bYSL: Pause Minting', async () => {
                await bysl.connect(owner).pause();
                await expect(bysl.connect(owner).mint(signers[1].address, expandTo18Decimals(100))).to.be.revertedWith('Pausable: paused');
            });

            it('bYSL: Pause Burning', async () => {
                await bysl.connect(owner).pause();
                await expect(bysl.connect(owner).burn(signers[1].address, expandTo18Decimals(25))).to.be.revertedWith('Pausable: paused');
            }); 
        });

        describe('bYSL: Seter functionality', async () => {
            it('bYSL: Pause Minting and Burn', async () => {
                await bysl.connect(owner).pause();
                expect(await bysl.paused()).to.be.eq(true);
            });
        });

    });
});
