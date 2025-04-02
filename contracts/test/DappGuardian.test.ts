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
  const testFiles = [
    {
      filename: "index.js",
      hash: ethers.id("test content 1"),
      timestamp: Math.floor(Date.now() / 1000)
    },
    {
      filename: "app.js",
      hash: ethers.id("test content 2"),
      timestamp: Math.floor(Date.now() / 1000)
    }
  ];

  beforeEach(async function () {
    [owner, developer, other] = await ethers.getSigners();
    const DappGuardian = await ethers.getContractFactory("DappGuardian");
    dappGuardian = await DappGuardian.deploy();
    await dappGuardian.waitForDeployment();
  });

  describe("Domain Registration", function () {
    it("should allow registering a new domain", async function () {
      await expect(dappGuardian.connect(developer).registerDomain(testDomain))
        .to.emit(dappGuardian, "DomainRegistered")
        .withArgs(testDomain, developer.address);

      expect(await dappGuardian.getDeveloper(testDomain)).to.equal(developer.address);
    });

    it("should prevent registering an already registered domain", async function () {
      await dappGuardian.connect(developer).registerDomain(testDomain);
      await expect(dappGuardian.connect(other).registerDomain(testDomain))
        .to.be.revertedWithCustomError(dappGuardian, "DomainAlreadyRegistered");
    });
  });

  describe("Release Management", function () {
    beforeEach(async function () {
      await dappGuardian.connect(developer).registerDomain(testDomain);
    });

    it("should allow developer to register a new release", async function () {
      const metadata = "Release 1.0.0";
      
      await expect(dappGuardian.connect(developer).registerRelease(testDomain, testFiles, metadata))
        .to.emit(dappGuardian, "ReleaseRegistered")
        .withArgs(testDomain, 1, testFiles.length, await getBlockTimestamp())
        .to.emit(dappGuardian, "FileHashRegistered")
        .withArgs(testDomain, 1, testFiles[0].filename, testFiles[0].hash)
        .to.emit(dappGuardian, "FileHashRegistered")
        .withArgs(testDomain, 1, testFiles[1].filename, testFiles[1].hash);
    });

    it("should prevent non-developer from registering a release", async function () {
      await expect(dappGuardian.connect(other).registerRelease(testDomain, testFiles, ""))
        .to.be.revertedWithCustomError(dappGuardian, "Unauthorized");
    });

    it("should allow registering multiple releases", async function () {
      await dappGuardian.connect(developer).registerRelease(testDomain, testFiles, "v1");
      await dappGuardian.connect(developer).registerRelease(testDomain, testFiles, "v2");
      
      const history = await dappGuardian.getReleaseHistory(testDomain);
      expect(history.length).to.equal(2);
      expect(history[0].version).to.equal(1n);
      expect(history[1].version).to.equal(2n);
    });

    it("should allow registering a release with no files", async function () {
      await expect(dappGuardian.connect(developer).registerRelease(testDomain, [], "empty"))
        .to.emit(dappGuardian, "ReleaseRegistered")
        .withArgs(testDomain, 1, 0, await getBlockTimestamp());
    });
  });

  describe("Release Queries", function () {
    beforeEach(async function () {
      await dappGuardian.connect(developer).registerDomain(testDomain);
      await dappGuardian.connect(developer).registerRelease(testDomain, testFiles, "v1");
    });

    it("should return the latest release", async function () {
      const release = await dappGuardian.getLatestRelease(testDomain);
      expect(release.version).to.equal(1n);
      expect(release.files.length).to.equal(testFiles.length);
      expect(release.metadata).to.equal("v1");
    });

    it("should revert when getting latest release for unregistered domain", async function () {
      await expect(dappGuardian.getLatestRelease("nonexistent.com"))
        .to.be.revertedWithCustomError(dappGuardian, "NoReleasesFound");
    });

    it("should return a specific release version", async function () {
      const release = await dappGuardian.getRelease(testDomain, 1);
      expect(release.version).to.equal(1n);
      expect(release.files.length).to.equal(testFiles.length);
    });

    it("should revert when getting invalid release version", async function () {
      await expect(dappGuardian.getRelease(testDomain, 0))
        .to.be.revertedWithCustomError(dappGuardian, "InvalidVersion");
      await expect(dappGuardian.getRelease(testDomain, 2))
        .to.be.revertedWithCustomError(dappGuardian, "InvalidVersion");
    });

    it("should return complete release history", async function () {
      await dappGuardian.connect(developer).registerRelease(testDomain, testFiles, "v2");
      const history = await dappGuardian.getReleaseHistory(testDomain);
      expect(history.length).to.equal(2);
      expect(history[0].version).to.equal(1n);
      expect(history[1].version).to.equal(2n);
    });
  });

  describe("Developer Management", function () {
    it("should return zero address for unregistered domain", async function () {
      expect(await dappGuardian.getDeveloper("nonexistent.com"))
        .to.equal(ethers.ZeroAddress);
    });

    it("should return correct developer address", async function () {
      await dappGuardian.connect(developer).registerDomain(testDomain);
      expect(await dappGuardian.getDeveloper(testDomain))
        .to.equal(developer.address);
    });
  });
});

async function getBlockTimestamp(): Promise<number> {
  const blockNumber = await ethers.provider.getBlockNumber();
  const block = await ethers.provider.getBlock(blockNumber);
  return Number(block?.timestamp);
} 