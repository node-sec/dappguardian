import { ethers } from "hardhat";
import * as readline from "readline";

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  // Get the deployed contract address
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("Please set CONTRACT_ADDRESS in your environment variables");
    process.exit(1);
  }

  // Get network information
  const network = await ethers.provider.getNetwork();
  console.log(`Connected to network: ${network.name} (chainId: ${network.chainId})`);

  // Get the signer (deployer/owner)
  const [deployer] = await ethers.getSigners();
  console.log(`Using address: ${deployer.address}`);

  // Connect to the DappGuardian contract using ABI instead of attach
  const dappGuardianAbi = [
    "function owner() view returns (address)",
    "function registerDomain(string memory domain, address developer) external",
    "function getDeveloper(string memory domain) external view returns (address)"
  ];
  
  const dappGuardian = new ethers.Contract(
    contractAddress,
    dappGuardianAbi,
    deployer
  );
  
  try {
    // Verify the caller is the owner
    const owner = await dappGuardian.owner();
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.error(`Error: Your address (${deployer.address}) is not the contract owner (${owner})`);
      process.exit(1);
    }

    // Prompt for domain information
    const domain = await promptInput("Enter the domain to register (e.g., app.example.com): ");
    const developerAddress = await promptInput("Enter the developer's Ethereum address: ");

    // Validate the address
    if (!ethers.isAddress(developerAddress)) {
      console.error("Error: Invalid Ethereum address");
      process.exit(1);
    }

    console.log(`Registering domain "${domain}" for developer ${developerAddress}...`);
    
    // Register the domain
    const tx = await dappGuardian.registerDomain(domain, developerAddress);
    console.log(`Transaction submitted: ${tx.hash}`);
    
    // Wait for transaction to be mined
    console.log("Waiting for transaction confirmation...");
    const receipt = await tx.wait();
    
    console.log(`Domain successfully registered! Transaction confirmed in block ${receipt.blockNumber}`);
    
    // Verify the registration
    const registeredDeveloper = await dappGuardian.getDeveloper(domain);
    console.log(`Verification: Domain "${domain}" is registered to developer: ${registeredDeveloper}`);
    
  } catch (error) {
    console.error("Error registering domain:");
    console.error(error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Helper function to prompt for input
function promptInput(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Run the script
main().catch((error) => {
  console.error(error);
  process.exit(1);
});