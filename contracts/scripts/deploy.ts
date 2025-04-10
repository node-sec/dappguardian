import { ethers } from "hardhat";

async function main() {
  const DappGuardian = await ethers.getContractFactory("DappGuardian");
  const guardian = await DappGuardian.deploy();
  await guardian.waitForDeployment();

  console.log("DappGuardian deployed to:", await guardian.getAddress());
  
  // Wait for a few block confirmations
  // const deployTx = await guardian.deploymentTransaction();
  // if (deployTx) await deployTx.wait(5);
  
  console.log("Deployment confirmed");
  
  // Save deployment info for verification
  const deploymentInfo = {
    address: await guardian.getAddress(),
    network: network.name,
    timestamp: new Date().toISOString()
  };
  
  console.log("Deployment info:", deploymentInfo);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 