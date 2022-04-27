const { ethers } = require("hardhat");

const { expect } = require("chai");

describe("Testing Airdrop functionalities", function () {
  let CI, ci;
  let AirdropNFT, ad;
  let owner, user, user1, user2;

  before(async function () {
    let accounts = await ethers.getSigners();
    owner = accounts[0];
    user = accounts[1];
    user1 = accounts[2];
    user2 = accounts[3];
  });

  describe("Setting up the enviroment", function () {
    it("Should deploy all the contracts", async function () {
      CI = await ethers.getContractFactory("CarItems");
      ci = await CI.connect(user).deploy();
      await ci.deployed();
      console.log("CarItems deployed to:", ci.address);

      AirdropNFT = await ethers.getContractFactory("AirdropNFT");
      ad = await AirdropNFT.deploy();
      await ad.deployed();
      console.log("AirdropNFT deployed to: ", ad.address, ad.owner.address);
    });
  });

  describe("AirdropNFT", function () {
    it("Should airdrop CI NFTs", async function () {
      expect(await ci.balanceOf(user.address, 1)).to.equal(1000);
      expect(await ci.balanceOf(user.address, 2)).to.equal(1000);

      //  airdrop erc721 JTT
      await ci.connect(user).setApprovalForAll(ad.address, true);
      await ad.connect(user).airdrop(
        ci.address,
        [user1.address, user2.address],
        true,
        [1, 2]
      );

      expect(await ci.balanceOf(user.address, 1)).to.equal(999);
      expect(await ci.balanceOf(user.address, 2)).to.equal(999);
      expect(await ci.balanceOf(user1.address, 1)).to.equal(1);
      expect(await ci.balanceOf(user2.address, 2)).to.equal(1);

      await expect(
        ad.connect(user).airdrop(ci.address, [user1.address, user2.address], true, [1, 2])
      ).to.be.revertedWith("Receiver has already retrieved this airdrop!");

      await ad.setAirdroped(user1.address, ci.address, 1, false);
      await ad.setAirdroped(user2.address, ci.address, 2, false);
      await ad.connect(user).airdrop(
        ci.address,
        [user1.address, user2.address],
        true,
        [1, 2]
      );

      expect(await ci.balanceOf(user.address, 1)).to.equal(998);
      expect(await ci.balanceOf(user.address, 2)).to.equal(998);
      expect(await ci.balanceOf(user1.address, 1)).to.equal(2);
      expect(await ci.balanceOf(user2.address, 2)).to.equal(2);

    });
  });
});
