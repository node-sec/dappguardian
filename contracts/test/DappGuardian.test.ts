import { expect } from "chai";
import { ethers } from "hardhat";
import { DappGuardian } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("DappGuardian", function () {
  let dappGuardian: DappGuardian;
  let owner: HardhatEthersSigner;
  let developer: HardhatEthersSigner;
  let other: HardhatEthersSigner;
  const testDomain = "test.com";
  const testIpfsCid = "QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX";
  
  beforeEach(async function () {
    [owner, developer, other] = await ethers.getSigners();
    const DappGuardianFactory = await ethers.getContractFactory("DappGuardian");
    const contract = await DappGuardianFactory.deploy();
    dappGuardian = await contract.waitForDeployment() as unknown as DappGuardian;
  });

  describe("Domain Registration", function () {
    it("should allow owner to register a new domain", async function () {
      await expect(dappGuardian.connect(owner).registerDomain(testDomain, developer.address))
        .to.emit(dappGuardian, "DomainRegistered")
        .withArgs(developer.address, testDomain);

      expect(await dappGuardian.getDeveloper(testDomain)).to.equal(developer.address);
    });

    it("should prevent non-owner from registering a domain", async function () {
      await expect(dappGuardian.connect(developer).registerDomain(testDomain, developer.address))
        .to.be.revertedWithCustomError(dappGuardian, "OwnableUnauthorizedAccount");
    });

    it("should prevent registering an already registered domain", async function () {
      await dappGuardian.connect(owner).registerDomain(testDomain, developer.address);
      await expect(dappGuardian.connect(owner).registerDomain(testDomain, other.address))
        .to.be.revertedWithCustomError(dappGuardian, "DomainAlreadyRegistered");
    });
  });

  describe("Ownership", function () {
    it("should set the deployer as the owner", async function () {
      expect(await dappGuardian.owner()).to.equal(owner.address);
    });

    it("should allow transferring ownership", async function () {
      await dappGuardian.connect(owner).transferOwnership(developer.address);
      expect(await dappGuardian.owner()).to.equal(developer.address);
      
      // New owner should be able to register domains
      await dappGuardian.connect(developer).registerDomain("newdomain.com", other.address);
      expect(await dappGuardian.getDeveloper("newdomain.com")).to.equal(other.address);
    });

    it("should prevent non-owner from transferring ownership", async function () {
      await expect(dappGuardian.connect(developer).transferOwnership(other.address))
        .to.be.revertedWithCustomError(dappGuardian, "OwnableUnauthorizedAccount");
    });
  });

  describe("Release Management", function () {
    beforeEach(async function () {
      await dappGuardian.connect(owner).registerDomain(testDomain, developer.address);
    });

    it("should allow developer to register a new release", async function () {
      const metadata = "Release 1.0.0";
      
      // Execute the transaction first
      const tx = await dappGuardian.connect(developer).registerRelease(testDomain, testIpfsCid, metadata);
      const receipt = await tx.wait();
      
      // Get the block from the transaction
      const blockNumber = receipt?.blockNumber;
      if (!blockNumber) throw new Error("Block number is undefined");
      
      const block = await ethers.provider.getBlock(blockNumber);
      const timestamp = block?.timestamp;
      if (!timestamp) throw new Error("Timestamp is undefined");
      
      // Now check the event with the correct timestamp
      await expect(tx)
        .to.emit(dappGuardian, "ReleaseRegistered")
        .withArgs(testDomain, 1, testIpfsCid, timestamp);
    });

    it("should prevent non-developer from registering a release", async function () {
      await expect(dappGuardian.connect(other).registerRelease(testDomain, testIpfsCid, ""))
        .to.be.revertedWithCustomError(dappGuardian, "Unauthorized");
    });

    it("should allow registering multiple releases", async function () {
      await dappGuardian.connect(developer).registerRelease(testDomain, testIpfsCid, "v1");
      await dappGuardian.connect(developer).registerRelease(testDomain, testIpfsCid, "v2");
      
      const history = await dappGuardian.getReleaseHistory(testDomain);
      expect(history.length).to.equal(2);
      expect(history[0].version).to.equal(1n);
      expect(history[1].version).to.equal(2n);
    });
  });

  describe("Release Queries", function () {
    beforeEach(async function () {
      await dappGuardian.connect(owner).registerDomain(testDomain, developer.address);
      await dappGuardian.connect(developer).registerRelease(testDomain, testIpfsCid, "v1");
    });

    it("should return the latest release", async function () {
      const release = await dappGuardian.getLatestRelease(testDomain);
      expect(release.version).to.equal(1n);
      expect(release.ipfsCid).to.equal(testIpfsCid);
      expect(release.metadata).to.equal("v1");
    });

    it("should revert when getting latest release for unregistered domain", async function () {
      await expect(dappGuardian.getLatestRelease("nonexistent.com"))
        .to.be.revertedWithCustomError(dappGuardian, "NoReleasesFound");
    });

    it("should return a specific release version", async function () {
      const release = await dappGuardian.getRelease(testDomain, 1);
      expect(release.version).to.equal(1n);
      expect(release.ipfsCid).to.equal(testIpfsCid);
    });

    it("should revert when getting invalid release version", async function () {
      await expect(dappGuardian.getRelease(testDomain, 0))
        .to.be.revertedWithCustomError(dappGuardian, "InvalidVersion");
      await expect(dappGuardian.getRelease(testDomain, 2))
        .to.be.revertedWithCustomError(dappGuardian, "InvalidVersion");
    });

    it("should return complete release history", async function () {
      await dappGuardian.connect(developer).registerRelease(testDomain, testIpfsCid, "v2");
      const history = await dappGuardian.getReleaseHistory(testDomain);
      expect(history.length).to.equal(2);
      expect(history[0].version).to.equal(1n);
      expect(history[1].version).to.equal(2n);
    });
  });

  // Helper function to get the current block timestamp
  async function getBlockTimestamp() {
    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    return block?.timestamp;
  }
}); 