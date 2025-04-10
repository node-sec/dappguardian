import { ethers } from "ethers";
import { HashEntry } from "../types";

// DappGuardian contract ABI (only the functions we need)
const ABI = [
  "function getLatestRelease(string memory domain) external view returns (tuple(uint256 version, string ipfsCid, uint256 timestamp, string metadata))",
  "function getRelease(string memory domain, uint256 version) external view returns (tuple(uint256 version, string ipfsCid, uint256 timestamp, string metadata))"
];

// Contract addresses for different networks
const CONTRACT_ADDRESSES = {
  // Use the deployed contract address here, or a default if testing on localhost
  sepolia: "YOUR_DEPLOYED_CONTRACT_ADDRESS", // Replace with actual deployed address
  localhost: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" // Default hardhat deployment address
};

// Multiple IPFS gateways for reliability
const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://dweb.link/ipfs/"
];

// Cache for IPFS manifest data
interface ManifestCache {
  [cid: string]: {
    data: any;
    timestamp: number;
    expiryTime: number;
  }
}

class ContractService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private manifestCache: ManifestCache = {};
  private cacheExpiryTime: number = 3600000; // 1 hour in milliseconds
  
  constructor(networkName: string = "localhost", rpcUrl?: string) {
    // Use default RPC URL if none provided
    const defaultRpcUrl = networkName === "sepolia" 
      ? "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161" // Public Infura endpoint
      : "http://localhost:8545";
    
    this.provider = new ethers.JsonRpcProvider(rpcUrl || defaultRpcUrl);
    const contractAddress = CONTRACT_ADDRESSES[networkName as keyof typeof CONTRACT_ADDRESSES] || CONTRACT_ADDRESSES.sepolia;
    this.contract = new ethers.Contract(contractAddress, ABI, this.provider);
  }
  
  async fetchFromIPFS(cid: string): Promise<any> {
    // Check cache first
    if (this.manifestCache[cid] && 
        Date.now() < this.manifestCache[cid].expiryTime) {
      console.log(`Using cached IPFS manifest for CID ${cid}`);
      return this.manifestCache[cid].data;
    }
    
    // Try each gateway in sequence until one works
    let lastError: Error | null = null;
    
    for (const gateway of IPFS_GATEWAYS) {
      try {
        const gatewayUrl = `${gateway}${cid}`;
        console.log(`Trying IPFS gateway: ${gatewayUrl}`);
        
        const response = await fetch(gatewayUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'default'
        });
        
        if (!response.ok) {
          throw new Error(`Gateway ${gateway} returned ${response.status}`);
        }
        
        const data = await response.json();
        
        // Cache the successful result
        this.manifestCache[cid] = {
          data,
          timestamp: Date.now(),
          expiryTime: Date.now() + this.cacheExpiryTime
        };
        
        return data;
      } catch (error) {
        console.warn(`Gateway ${gateway} failed:`, error);
        lastError = error as Error;
        // Continue to next gateway
      }
    }
    
    // If we got here, all gateways failed
    throw new Error(`All IPFS gateways failed: ${lastError?.message}`);
  }
  
  async getLatestReleaseFiles(domain: string): Promise<{ filename: string, hash: string, timestamp: number }[]> {
    try {
      const release = await this.contract.getLatestRelease(domain);
      
      // Fetch manifest from IPFS
      const ipfsCid = release.ipfsCid;
      console.log(`Fetching manifest for domain ${domain} with CID ${ipfsCid}`);
      
      // Use our new fetching method with multiple gateways and caching
      const manifestData = await this.fetchFromIPFS(ipfsCid);
      
      // Return the files data from the manifest
      return manifestData.files.map((file: any) => ({
        filename: file.filename,
        hash: file.hash,
        timestamp: file.timestamp
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
  
  // Clear cache for testing or when needed
  clearCache(): void {
    this.manifestCache = {};
    console.log("IPFS manifest cache cleared");
  }
}

export default ContractService; 