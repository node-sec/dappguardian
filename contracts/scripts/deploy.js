const hre = require("hardhat");

async function main() {
  const DappGuardian = await hre.ethers.getContractFactory("DappGuardian");
  const guardian = await DappGuardian.deploy();
  await guardian.waitForDeployment();

  console.log("DappGuardian deployed to:", await guardian.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 