/* eslint-disable jest/valid-expect */
const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("Escrow", () => {
  let buyer, seller, inspector, lender, fakeSeller;
  let realEstate, escrow;

  beforeEach(async () => {
    const signers = await ethers.getSigners();
    [buyer, seller, lender, inspector, fakeSeller] = signers;
    const RealEstate = await ethers.getContractFactory("RealEstate");
    realEstate = await RealEstate.deploy();

    // Minting
    let transction = await realEstate
      .connect(seller)
      .mint(
        "https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS"
      );
    await transction.wait();

    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(
      lender.address,
      seller.address,
      realEstate.address,
      inspector.address
    );
    //Apporve Propperty
    transction = await realEstate.connect(seller).approve(escrow.address, 1);
    await transction.wait();

    // List Propperty
    transction = await escrow
      .connect(seller)
      .list(1, tokens(10), tokens(5), buyer.address);
    await transction.wait();
  });

  describe("Deployment", () => {
    it("Returns NFT address", async () => {
      const results = await escrow.nftAddress();
      // eslint-disable-next-line jest/valid-expect
      expect(results).to.be.equal(realEstate.address);
    });

    it("Returns seller address", async () => {
      const results = await escrow.seller();
      // eslint-disable-next-line jest/valid-expect
      expect(results).to.be.equal(seller.address);
    });

    it("Returns inspector address", async () => {
      const results = await escrow.inspector();
      // eslint-disable-next-line jest/valid-expect
      expect(results).to.be.equal(inspector.address);
    });

    it("Returns lender address", async () => {
      const results = await escrow.lender();
      // eslint-disable-next-line jest/valid-expect
      expect(results).to.be.equal(lender.address);
    });
  });

  describe("Listing", () => {
    it("Update the ownerships", async () => {
      // eslint-disable-next-line jest/valid-expect
      expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address);
    });
    it("Update Listed", async () => {
      const results = await escrow.isListed(1);
      // eslint-disable-next-line jest/valid-expect
      expect(results).to.be.equal(true);
    });
    it("Purchase Price", async () => {
      const results = await escrow.purchasePrice(1);
      // eslint-disable-next-line jest/valid-expect
      expect(results).to.be.equal(tokens(10));
    });
    it("Escrow amount", async () => {
      const results = await escrow.escrowAmount(1);
      // eslint-disable-next-line jest/valid-expect
      expect(results).to.be.equal(tokens(5));
    });
    it("Buyer Address", async () => {
      const results = await escrow.buyer(1);
      // eslint-disable-next-line jest/valid-expect
      expect(results).to.be.equal(buyer.address);
    });
  });

  describe("Deposit", () => {
    it("Test payble to the Escrow", async () => {
      const transction = await escrow
        .connect(buyer)
        .depositEarnest(1, { value: tokens(5) });
      await transction.wait();

      const result = await escrow.getBalance();
      // eslint-disable-next-line jest/valid-expect
      expect(result).to.be.equal(tokens(5));
    });
  });

  describe("Inspection", () => {
    it("Update Inspection status", async () => {
      const transction = await escrow
        .connect(inspector)
        .updateInspectionStatus(1, true);
      await transction.wait();

      const result = await escrow.inspectionPassed(1);
      // eslint-disable-next-line jest/valid-expect
      expect(result).to.be.equal(true);
    });
  });

  describe("Approval", () => {
    it("Update Approval status", async () => {
      let transction = await escrow.connect(buyer).approveSale(1);
      await transction.wait();

      transction = await escrow.connect(seller).approveSale(1);
      await transction.wait();

      transction = await escrow.connect(lender).approveSale(1);
      await transction.wait();

      expect(await escrow.approval(1, buyer.address)).to.be.equal(true);
      expect(await escrow.approval(1, seller.address)).to.be.equal(true);
      expect(await escrow.approval(1, lender.address)).to.be.equal(true);
    });
  });

  describe("Sale", () => {
    beforeEach(async () => {
      let transaction = await escrow
        .connect(buyer)
        .depositEarnest(1, { value: tokens(5) });
      await transaction.wait();

      transaction = await escrow
        .connect(inspector)
        .updateInspectionStatus(1, true);
      await transaction.wait();

      transaction = await escrow.connect(buyer).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(seller).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(lender).approveSale(1);
      await transaction.wait();

      await lender.sendTransaction({to: escrow.address, value:tokens(5)});
    });
  });
});
