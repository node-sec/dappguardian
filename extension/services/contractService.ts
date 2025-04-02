import { ethers } from "ethers";
import { HashEntry } from "../types";

// DappGuardian contract ABI (only the functions we need)
const ABI = [
  "function getLatestRelease(string memory domain) external view returns (tuple(uint256 version, tuple(string filename, bytes32 hash, uint256 timestamp)[] files, uint256 timestamp, string metadata))",
  "function getRelease(string memory domain, uint256 version) external view returns (tuple(uint256 version, tuple(string filename, bytes32 hash, uint256 timestamp)[] files, uint256 timestamp, string metadata))"
];

// Contract addresses for different networks
const CONTRACT_ADDRESSES = {
  // Use the deployed contract address here, or a default if testing on localhost
  sepolia: "YOUR_DEPLOYED_CONTRACT_ADDRESS", // Replace with actual deployed address
  localhost: "0x5FbDB2315678afecb367f032d93F642f64180aa3" // Default hardhat deployment address
};

class ContractService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  
  constructor(networkName: string = "sepolia", rpcUrl?: string) {
    // Use default RPC URL if none provided
    const defaultRpcUrl = networkName === "sepolia" 
      ? "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161" // Public Infura endpoint
      : "http://localhost:8545";
    
    this.provider = new ethers.JsonRpcProvider(rpcUrl || defaultRpcUrl);
    const contractAddress = CONTRACT_ADDRESSES[networkName as keyof typeof CONTRACT_ADDRESSES] || CONTRACT_ADDRESSES.sepolia;
    this.contract = new ethers.Contract(contractAddress, ABI, this.provider);
  }
  
  async getLatestReleaseFiles(domain: string): Promise<{ filename: string, hash: string, timestamp: number }[]> {
    try {
      const release = await this.contract.getLatestRelease(domain);
      return release.files.map((file: any) => ({
        filename: file.filename,
        hash: ethers.hexlify(file.hash).substring(2), // Convert bytes32 to hex string without 0x prefix
        timestamp: Number(file.timestamp)
      }));
    } catch (error) {
      console.error("Error fetching release from contract:", error);
      return [];
    }
  }
  
  async verifyHash(domain: string, filename: string, hash: string): Promise<boolean> {
    try {
      const files = await this.getLatestReleaseFiles(domain);
      const matchingFile = files.find(file => {
        // Try to match the filename or the full URL path
        return file.filename === filename || 
               filename.endsWith(file.filename) ||
               filename.includes(`/${file.filename}`);
      });
      
      return matchingFile ? matchingFile.hash === hash : false;
    } catch (error) {
      console.error("Error verifying hash:", error);
      return false;
    }
  }
}

export default ContractService; 