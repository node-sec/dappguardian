# CLI Tools Documentation

This document provides a detailed guide to the command-line tools provided by DappGuardian for developers to manage their dApp file integrity.

## Overview

DappGuardian's CLI tools enable developers to:

1. Generate cryptographic hashes of their dApp files
2. Create a standardized manifest of these hashes
3. Upload the manifest to IPFS for decentralized storage
4. Register the IPFS CID on the Ethereum blockchain

These tools form a critical part of the workflow for securing decentralized applications against front-end attacks.

## Installation

```bash
# Clone the repository
git clone https://github.com/your-org/dappguardian.git
cd dappguardian/cli

# Install dependencies
npm install

# Make scripts executable
chmod +x manifestGenerator.js submitter.js
```

## Configuration

Create a `.env` file based on the example:

```bash
cp .env.example .env
```

Edit the file with your configuration:

```
# Ethereum RPC connection
RPC_URL=https://sepolia.infura.io/v3/your-api-key

# Wallet for transactions
PRIVATE_KEY=your-private-key-here

# DappGuardian contract
CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890

# Your dApp information
DAPP_DOMAIN=yourdapp.eth

# IPFS configuration (Pinata)
IPFS_API_URL=https://api.pinata.cloud/psa
IPFS_API_KEY=your-pinata-api-key
IPFS_API_SECRET=your-pinata-api-secret
```

## Tools

### 1. Manifest Generator

The `manifestGenerator.js` tool scans a directory and creates a manifest of file hashes.

#### Usage

```bash
./manifestGenerator.js <path-to-your-dapp>
```

For example:

```bash
./manifestGenerator.js ../build
```

#### Output

The tool will generate a `dapp-manifest.json` file containing:

```json
[
  {
    "path": "index.html",
    "hash": "8a5edab282632443219e051e4ade2d1d5bbc671c781051bf1437897cbdfea0f1"
  },
  {
    "path": "static/js/main.js",
    "hash": "73475cb40a568e8da8a045ced110137e159f890ac4da883b6b17dc651b3a8049"
  },
  ...
]
```

#### Options

- **Exclude patterns**: You can modify the code to exclude specific file patterns
- **Custom output location**: By default, the manifest is saved in the current directory

### 2. Submitter

The `submitter.js` tool uploads the manifest to IPFS and registers it on the blockchain.

#### Usage

```bash
./submitter.js
```

#### Process

1. Reads the `dapp-manifest.json` file
2. Enhances it with metadata
3. Uploads it to IPFS via Pinata
4. Retrieves the IPFS CID
5. Registers the CID on the DappGuardian contract

#### Output

The tool will display:

```
Uploading manifest to IPFS...
Manifest uploaded to IPFS with CID: QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX
Update submitted successfully!
Transaction: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
IPFS CID: QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX
```

## Technical Details

### Manifest Generation

The manifest generator uses Node.js file system operations and cryptographic functions:

```javascript
async function computeFileHash(filePath) {
  const content = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function scanDirectory(dir) {
  const manifest = [];
  const files = await fs.readdir(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      const subManifest = await scanDirectory(fullPath);
      manifest.push(...subManifest);
    } else {
      const hash = await computeFileHash(fullPath);
      const relativePath = path.relative(process.cwd(), fullPath);
      manifest.push({ path: relativePath, hash });
    }
  }

  return manifest;
}
```

### IPFS Integration

The submitter tool uses Pinata's API to upload the manifest to IPFS:

```javascript
async function uploadToIPFS(jsonData) {
  // Create form data with the JSON file
  const formData = new FormData();
  const manifestBuffer = Buffer.from(JSON.stringify(jsonData, null, 2));
  
  formData.append('file', manifestBuffer, {
    filename: 'manifest.json',
    contentType: 'application/json',
  });
  
  // Set pinning options
  const pinataMetadata = JSON.stringify({
    name: `DApp-Manifest-${Date.now()}`,
  });
  formData.append('pinataMetadata', pinataMetadata);
  
  // Upload to Pinata
  const response = await axios.post(process.env.IPFS_API_URL, formData, {
    headers: {
      'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
      'pinata_api_key': process.env.IPFS_API_KEY,
      'pinata_secret_api_key': process.env.IPFS_API_SECRET,
    },
  });
  
  return response.data.IpfsHash;
}
```

### Blockchain Interaction

The tool uses ethers.js to interact with the DappGuardian contract:

```javascript
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  CONTRACT_ABI,
  wallet
);

const tx = await contract.registerRelease(
  process.env.DAPP_DOMAIN,
  ipfsCid,
  "Update " + new Date().toISOString()
);
await tx.wait();
```

## Alternative IPFS Providers

The CLI tools currently use Pinata, but can be modified to work with other IPFS providers:

### Infura IPFS

```javascript
// Example configuration for Infura IPFS
const projectId = 'YOUR_INFURA_PROJECT_ID';
const projectSecret = 'YOUR_INFURA_PROJECT_SECRET';
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

const client = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth
  }
});

const result = await client.add(JSON.stringify(jsonData));
return result.path; // IPFS CID
```

### Web3.Storage

```javascript
// Example configuration for Web3.Storage
const client = new Web3Storage({ token: process.env.WEB3_STORAGE_TOKEN });
const file = new File([JSON.stringify(jsonData)], 'manifest.json', { type: 'application/json' });
const cid = await client.put([file]);
return cid;
```

## Advanced Usage

### Continuous Integration

The CLI tools can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
name: Deploy and Register

on:
  push:
    branches: [ main ]

jobs:
  build-and-register:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build dApp
        run: npm run build
        
      - name: Generate manifest
        run: |
          cd cli
          npm install
          ./manifestGenerator.js ../build
          
      - name: Submit to blockchain
        run: |
          cd cli
          ./submitter.js
        env:
          RPC_URL: ${{ secrets.RPC_URL }}
          PRIVATE_KEY: ${{ secrets.PRIVATE_KEY }}
          CONTRACT_ADDRESS: ${{ secrets.CONTRACT_ADDRESS }}
          DAPP_DOMAIN: ${{ secrets.DAPP_DOMAIN }}
          IPFS_API_URL: ${{ secrets.IPFS_API_URL }}
          IPFS_API_KEY: ${{ secrets.IPFS_API_KEY }}
          IPFS_API_SECRET: ${{ secrets.IPFS_API_SECRET }}
```

### Custom Manifest Format

You can extend the manifest with additional metadata:

```javascript
// Example of enhanced manifest
const enhancedManifest = {
  domain: process.env.DAPP_DOMAIN,
  version: "1.0.0",
  buildTimestamp: Math.floor(Date.now() / 1000),
  commitHash: "git-commit-hash-here",
  environment: "production",
  globalHash, // Computed from all file hashes
  files: manifest.map(entry => ({
    filename: entry.path,
    hash: entry.hash,
    timestamp: Math.floor(Date.now() / 1000)
  }))
};
```

## Troubleshooting

### Common Issues

1. **"Error: insufficient funds"**
   - Ensure your wallet has enough ETH for gas fees
   - Consider using a testnet for development

2. **"Error uploading to IPFS"**
   - Verify your Pinata API keys
   - Check your internet connection
   - Ensure the manifest JSON is valid

3. **"Error: nonce too low"**
   - This usually happens when transactions are sent too quickly
   - Wait for previous transactions to confirm or reset your nonce

## Best Practices

1. **Secure Key Management**
   - Never commit `.env` files with private keys
   - Use environment variables in production
   - Consider using a hardware wallet for production deployments

2. **Regular Updates**
   - Register new releases whenever your dApp is updated
   - Include version information in the metadata
   - Keep a changelog of what files changed and why

3. **Verification**
   - After registration, verify your dApp with the browser extension
   - Test the verification flow on different browsers
   - Ensure all critical JavaScript files are being verified 