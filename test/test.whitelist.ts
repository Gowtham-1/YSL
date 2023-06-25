import {
    WhiteList,
    WhiteList__factory,
    WETH9,
    WETH9__factory,
    Admin,
    Admin__factory
} from "../typechain";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "hardhat";
import { mineBlocks, expandTo18Decimals } from "./utilities/utilities";
import { expect } from "chai";

describe("Whitelist", async () => {
    let whitelist: WhiteList;
    let owner: SignerWithAddress;
    let signers: SignerWithAddress[];
    let admin: Admin;

    beforeEach(async () => {
        signers  = await ethers.getSigners();
        owner = signers[0];
        admin = await new Admin__factory(owner).deploy();
        await admin.initialize(owner.address,owner.address);
        whitelist =  await new WhiteList__factory(owner).deploy();
        await whitelist.initialize(admin.address);
    });

    it("Whitelist (success): addWhiteList", async() =>{
        let WETH = await new WETH9__factory(owner).deploy();
        await whitelist.connect(owner).addWhiteList([WETH.address]);
        expect(await whitelist.getAddresses(WETH.address)).to.be.eq(true); 
    });

    it("Whitelist (fail): addProtocolAddresses", async() =>{
        let WETH = await new WETH9__factory(owner).deploy();
        await expect(whitelist.connect(signers[1]).addWhiteList([WETH.address])).to.be.revertedWith("Transaction reverted without a reason string");
    });

    it("Whitelist (success): addUserWhiteList", async() =>{
        await whitelist.connect(owner).addWhiteList([signers[2].address]);
        expect(await whitelist.getAddresses(signers[2].address)).to.be.eq(true); 
    });

    it("Whitelist (fail): addUserWhiteList", async() =>{
        await expect(whitelist.connect(owner).addWhiteList(["0x0000000000000000000000000000000000000000"])).to.be.revertedWith("Whitelist: Zero address");
    });
    it("Whitelist (success): revokeWhiteList", async() =>{
        let WETH = await new WETH9__factory(owner).deploy();
        await whitelist.connect(owner).addWhiteList([WETH.address]);
        await whitelist.connect(owner).revokeWhiteList([WETH.address]);
        expect(await whitelist.getAddresses(WETH.address)).to.be.eq(false); 
    });

    it("Whitelist (fail): revokeWhiteList", async() =>{
        let WETH = await new WETH9__factory(owner).deploy();
        await expect(whitelist.connect(owner).revokeWhiteList([WETH.address])).to.be.revertedWith("WhiteList: not whitelisted");
    });

    it("Whitelist (fail): revokeWhiteList", async() =>{
        let WETH = await new WETH9__factory(owner).deploy();
        await expect(whitelist.connect(signers[1]).revokeWhiteList([WETH.address])).to.be.revertedWith("Transaction reverted without a reason string");
    });

    it("Whitelist (success): revokeUserWhiteList", async() =>{
        await whitelist.connect(owner).addWhiteList([signers[2].address]);
        await whitelist.connect(owner).revokeWhiteList([signers[2].address]);
        expect(await whitelist.getAddresses(signers[2].address)).to.be.eq(false); 
    });

    it("Whitelist (fail): revokeUserWhiteList", async() =>{
        let WETH = await new WETH9__factory(owner).deploy();
        await expect(whitelist.connect(owner).revokeWhiteList([signers[2].address])).to.be.revertedWith("'WhiteList: not whitelisted'");
    });

    it("Whitelist (fail): revokeUserWhiteList", async() =>{
        await expect(whitelist.connect(signers[1]).revokeWhiteList([signers[2].address]))
    });
})