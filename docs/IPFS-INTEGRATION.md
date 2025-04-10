# IPFS Integration Guide for DappGuardian

This document provides detailed information about how DappGuardian integrates with IPFS (InterPlanetary File System) to store dApp manifests securely and cost-effectively.

## Overview

Instead of storing all file hashes directly on the blockchain, DappGuardian now:
1. Creates a manifest JSON file containing all file hashes and metadata
2. Uploads this manifest to IPFS and pins it to ensure availability
3. Stores only the IPFS CID (Content Identifier) on the blockchain

This approach dramatically reduces gas costs while maintaining the security and verifiability of the system.

## Benefits

### 1. Cost Efficiency

By storing only a single IPFS CID on-chain rather than multiple file hashes:
- Gas costs for registering releases remain constant regardless of the number of files
- Developers can include unlimited files in their dApp without worrying about transaction costs
- Updates become more economical, encouraging more frequent security updates

### 2. Scalability

IPFS provides excellent scalability advantages:
- No practical limit to manifest size
- Can include detailed metadata with each file hash
- Support for large dApps with hundreds or thousands of files
- Easy to extend the manifest schema without changing the smart contract

### 3. Decentralized Storage

IPFS offers strong guarantees for content availability:
- Content-addressed storage ensures integrity
- Data can be retrieved from any IPFS node that has the content
- Pinning services ensure your manifests remain available
- Multiple gateway fallbacks for high availability

## Technical Implementation

### Manifest Format

```json
{
  "domain": "your-dapp-domain.com",
  "timestamp": 1682459853,
  "globalHash": "a1b2c3d4e5f6...",
  "files": [
    {
      "filename": "index.js",
      "hash": "8d7c6b5a4e3...",
      "timestamp": 1682459853
    },
    {
      "filename": "app.js",
      "hash": "7a6b5c4d3e2...",
      "timestamp": 1682459853
    }
    // ... additional files
  ]
}
```

### Upload Process

1. The `manifestGenerator.js` script scans your dApp and creates the initial manifest
2. The `submitter.js` script:
   - Enhances the manifest with metadata
   - Uploads the manifest to IPFS using Pinata or another provider
   - Retrieves the IPFS CID
   - Registers the CID on the blockchain via the smart contract

### Verification Process

1. The browser extension detects JavaScript files loaded by the browser
2. When the extension popup is opened, it:
   - Retrieves the IPFS CID from the DappGuardian contract
   - Fetches the manifest from one of several IPFS gateways
   - Compares local file hashes with those in the manifest
   - Displays verification results to the user

## Configuration

### CLI Configuration

The CLI tool requires configuration for your preferred IPFS provider:

```
# .env file configuration
IPFS_API_URL=https://api.pinata.cloud/psa
IPFS_API_KEY=your-pinata-api-key
IPFS_API_SECRET=your-pinata-api-secret
```

### Supported IPFS Providers

#### 1. Pinata (Default)

[Pinata](https://pinata.cloud) is a popular IPFS pinning service that offers:
- Simple API integration
- Free tier with generous limits
- Reliable pinning infrastructure

To use Pinata:
1. Create an account at pinata.cloud
2. Generate API keys with pinning permissions
3. Add the keys to your `.env` file

#### 2. Infura IPFS

[Infura](https://infura.io/product/ipfs) provides enterprise-grade IPFS infrastructure:
- High availability
- Fast response times
- Production-ready infrastructure

To use Infura IPFS, modify the `uploadToIPFS` function in `submitter.js` to use Infura's endpoints and authentication.

#### 3. Web3.Storage

[Web3.Storage](https://web3.storage) offers storage built on Filecoin and IPFS:
- Free tier available
- Built-in Filecoin storage deals
- Long-term storage guarantees

To use Web3.Storage, you'll need to adapt the `uploadToIPFS` function to use their API.

#### 4. Self-Hosted IPFS Node

For complete control, you can run your own IPFS node:
1. Install and run an IPFS node
2. Use the IPFS HTTP API for uploading
3. Configure your node for pinning

## Extension Gateway Configuration

The browser extension uses multiple IPFS gateways for reliability:

```typescript
// Multiple IPFS gateways for reliability
const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://dweb.link/ipfs/"
];
```

You can modify this list in `extension/services/contractService.ts` to add or remove gateways according to your preferences.

## Troubleshooting

### Common Issues

1. **IPFS Upload Failures**
   - Check your API credentials
   - Verify network connectivity to the IPFS provider
   - Ensure the manifest JSON is valid

2. **Extension Cannot Retrieve Manifest**
   - Confirm the CID is registered correctly on-chain
   - Check that the IPFS content is properly pinned
   - Try using the retry functionality in the extension

3. **Gateway Timeouts**
   - IPFS gateways may occasionally experience high load or downtime
   - The extension will automatically try alternative gateways
   - If all gateways fail, try again later or add more gateways to the configuration

## Advanced Configuration

### Custom IPFS Gateway

If you operate your own IPFS gateway, you can configure the extension to use it first:

```typescript
// Add your gateway at the beginning of the array for highest priority
const IPFS_GATEWAYS = [
  "https://your-custom-gateway.com/ipfs/",
  // ... other gateways
];
```

### Adjusting Cache Duration

The extension caches IPFS manifests to improve performance. To change the cache duration:

```typescript
// In contractService.ts
private cacheExpiryTime: number = 3600000; // Default: 1 hour in milliseconds
```

## Migration from Previous Versions

If you're migrating from a previous version of DappGuardian that stored file hashes directly on-chain:

1. Deploy the updated smart contract
2. Register your domain on the new contract
3. Generate a manifest with the CLI tool
4. Submit the manifest to IPFS and register the CID

Users will seamlessly benefit from the new IPFS-based verification without needing to update their extension. 