import { ethers } from "hardhat";

async function main() {
  const DappGuardian = await ethers.getContractFactory("DappGuardian");
  const guardian = await DappGuardian.deploy();
  await guardian.deployed();

  console.log("DappGuardian deployed to:", guardian.address);
  
  // Wait for a few block confirmations
  await guardian.deployTransaction.wait(5);
  
  console.log("Deployment confirmed");
  
  // Save deployment info for verification
  const deploymentInfo = {
    address: guardian.address,
    network: network.name,
    timestamp: new Date().toISOString()
  };
  
  console.log("Deployment info:", deploymentInfo);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 