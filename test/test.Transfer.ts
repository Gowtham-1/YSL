import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import exp from "constants";
import { ethers } from "hardhat";
import { Admin, Admin__factory, Blacklist, Blacklist__factory, BSHARE, BSHARE__factory, BYSL, BYSL__factory, ERC20, ERC20__factory, Factory, Factory__factory, TransferAll, TransferAll__factory, UniswapV2Router01, UniswapV2Router01__factory, UniswapV2Router02, UniswapV2Router02__factory, WETH9, WETH9__factory, WhiteList, WhiteList__factory, YSL, YSL__factory } from "../typechain";
import { expandTo18Decimals, mineBlocks } from "./utilities/utilities";

describe("transfer", async () => 
{
    let bshare : BSHARE;
    let ysl : YSL;
    let factory1: Factory;
    let WETH: WETH9;
    let transfer : TransferAll;
    let whitelist: WhiteList;
    let owner: SignerWithAddress;
    let signers: SignerWithAddress[];
    let busd: ERC20;
    let admin:Admin;
    let blacklist: Blacklist;
    let router: UniswapV2Router02;
    
    beforeEach(async () => {
        signers = await ethers.getSigners();
        owner = signers[0];
        admin= await new Admin__factory(owner).deploy();
        await admin.initialize(owner.address,owner.address);
        whitelist = await new WhiteList__factory(owner).deploy();
        await whitelist.initialize(admin.address);
        blacklist = await new Blacklist__factory(owner).deploy();
        await blacklist.initialize(admin.address);
        busd = await new ERC20__factory(signers[1]).deploy(expandTo18Decimals(100000000000)); 
        bshare = await new BSHARE__factory(owner).deploy();
        await bshare.initialise(admin.address);
        transfer = await new TransferAll__factory(owner).deploy();
        await transfer.initialize(admin.address);
        factory1 = await new Factory__factory(owner).deploy();
        WETH = await new WETH9__factory(owner).deploy();
        router = await new UniswapV2Router02__factory(owner).deploy(factory1.address,WETH.address);

        await admin.setWhitelist(whitelist.address) ;
        await admin.setBlacklist(blacklist.address);
        await admin.setBShare(bshare.address);
        await admin.setBUSD(busd.address);
        await admin.setWBNB(WETH.address) ;
        await admin.setApeswapRouter(router.address);
        ysl = await new YSL__factory(owner).deploy();
        await ysl.initialise(admin.address)
        await admin.setYSL(ysl.address);

    })

    describe("transfer", async() => {
        it("token transfer",async() => {
            await bshare.setLockTransactionTime(3600);
            await ysl.setLockTransactionTime(3600);
            await whitelist.connect(owner).addWhiteList([transfer.address]);
            await factory1.connect(owner).createPair(bshare.address,busd.address);
            await bshare.connect(owner).mint(signers[1].address,expandTo18Decimals(100000));
            await factory1.connect(owner).createPair(ysl.address,busd.address);
            await ysl.connect(owner).mint(signers[1].address,expandTo18Decimals(100000));
            await mineBlocks(ethers.provider,3*3600);
            await bshare.connect(signers[1]).approve(transfer.address,expandTo18Decimals(100000));
            await ysl.connect(signers[1]).approve(transfer.address,expandTo18Decimals(100000));
            await transfer.connect(signers[1]).transferToken([bshare.address,ysl.address],signers[2].address);
            await bshare.connect(owner).mint(signers[1].address,expandTo18Decimals(100000));
            await expect(transfer.connect(signers[1]).transferToken([bshare.address],signers[2].address)).to.be.revertedWith("You reached transfer limit for a day");
        });    

        it("token transfer",async() => {
            await bshare.setLockTransactionTime(3600);
            await ysl.setLockTransactionTime(3600);
            await whitelist.connect(owner).addWhiteList([transfer.address]);
            await factory1.connect(owner).createPair(bshare.address,busd.address);
            await bshare.connect(owner).mint(signers[1].address,expandTo18Decimals(100000));
            await factory1.connect(owner).createPair(ysl.address,busd.address);
            await ysl.connect(owner).mint(signers[1].address,expandTo18Decimals(100000));
            await mineBlocks(ethers.provider,3*3600);
            await bshare.connect(signers[1]).approve(transfer.address,expandTo18Decimals(100000));
            await ysl.connect(signers[1]).approve(transfer.address,expandTo18Decimals(100000));
            await transfer.connect(signers[1]).transferToken([bshare.address,ysl.address],signers[2].address);
            expect(await bshare.balanceOf(signers[2].address)).to.be.eq(expandTo18Decimals(100000));
            expect(await ysl.balanceOf(signers[2].address)).to.be.eq(expandTo18Decimals(100000));

        });
        it("token transfer",async() => {
            await bshare.setLockTransactionTime(3600);
            await ysl.setLockTransactionTime(3600);
            await admin.setYSL("0x0000000000000000000000000000000000000000");
            await whitelist.connect(owner).addWhiteList([transfer.address]);
            await factory1.connect(owner).createPair(bshare.address,busd.address);
            await bshare.connect(owner).mint(signers[1].address,expandTo18Decimals(100000));
            await factory1.connect(owner).createPair(ysl.address,busd.address);
            await ysl.connect(owner).mint(signers[1].address,expandTo18Decimals(100000));
            await mineBlocks(ethers.provider,3*3600);
            await bshare.connect(signers[1]).approve(transfer.address,expandTo18Decimals(100000));
            await ysl.connect(signers[1]).approve(transfer.address,expandTo18Decimals(100000));
            await expect(transfer.connect(signers[1]).transferToken([bshare.address,ysl.address],signers[2].address)).to.be.revertedWith("Invalid TOKEN");
        });   
    });

})