# DappGuardian Installation Guide

This document provides step-by-step instructions for setting up the complete DappGuardian system, including the smart contracts, browser extension, and CLI tools.

## Prerequisites

Before beginning, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16.0.0 or later)
- [npm](https://www.npmjs.com/) (v7.0.0 or later)
- [Yarn](https://yarnpkg.com/) (v1.22.0 or later, for the extension)
- [Git](https://git-scm.com/)
- A code editor (e.g., [Visual Studio Code](https://code.visualstudio.com/))
- [Metamask](https://metamask.io/) or another Ethereum wallet
- Some ETH for gas fees (can be testnet ETH for development)

## 1. Clone the Repository

```bash
git clone https://github.com/your-org/dappguardian.git
cd dappguardian
```

## 2. Smart Contract Setup

### Installation

```bash
cd contracts
npm install
```

### Configuration

Create a `.env` file:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```
PRIVATE_KEY=your-private-key-here
ETHERSCAN_API_KEY=your-etherscan-api-key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your-api-key
MAINNET_RPC_URL=https://mainnet.infura.io/v3/your-api-key
```

### Compilation

```bash
npx hardhat compile
```

### Testing

```bash
npx hardhat test
```

### Deployment

For testnet (Sepolia):

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

For mainnet (use with caution):

```bash
npx hardhat run scripts/deploy.js --network mainnet
```

Note the deployed contract address for later use.

## 3. CLI Tools Setup

### Installation

```bash
cd ../cli
npm install
chmod +x manifestGenerator.js submitter.js
```

### Configuration

Create a `.env` file:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```
# Ethereum RPC connection
RPC_URL=https://sepolia.infura.io/v3/your-api-key

# Wallet for transactions
PRIVATE_KEY=your-private-key-here

# DappGuardian contract (from step 2)
CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890

# Your dApp information
DAPP_DOMAIN=yourdapp.eth

# IPFS configuration (Pinata)
IPFS_API_URL=https://api.pinata.cloud/psa
IPFS_API_KEY=your-pinata-api-key
IPFS_API_SECRET=your-pinata-api-secret
```

### IPFS Provider Setup

#### Pinata (Recommended)

1. Create an account at [Pinata](https://pinata.cloud)
2. Generate API keys with pinning permissions
3. Add the API key and secret to your `.env` file

#### Alternatives

See the [CLI Tools Documentation](CLI-TOOLS.md) for configuring other IPFS providers.

## 4. Browser Extension Setup

### Installation

```bash
cd ../extension
yarn install
```

### Configuration

Edit the contract address in `services/contractService.ts`:

```typescript
const CONTRACT_ADDRESSES = {
  sepolia: "YOUR_DEPLOYED_CONTRACT_ADDRESS", // Replace with actual deployed address
  localhost: "0x5FbDB2315678afecb367f032d93F642f64180aa3"
};
```

### Development Mode

```bash
yarn dev
```

### Build for Production

```bash
yarn build
```

### Loading in Browser

1. Open Chrome or Brave
2. Navigate to `chrome://extensions`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `extension/dist` directory

## 5. Registering Your First dApp

### Step 1: Register Domain

If you haven't already registered your domain on the contract:

```javascript
// Using ethers.js with your contract
await dappGuardian.registerDomain("yourdapp.eth");
```

Or you can write a simple script using the CLI configuration:

```javascript
// register-domain.js
require('dotenv').config();
const { ethers } = require('ethers');

const CONTRACT_ABI = [
  "function registerDomain(string memory domain) external"
];

async function registerDomain() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    CONTRACT_ABI,
    wallet
  );

  const tx = await contract.registerDomain(process.env.DAPP_DOMAIN);
  console.log("Transaction submitted:", tx.hash);
  await tx.wait();
  console.log("Domain registered successfully!");
}

registerDomain().catch(console.error);
```

Run with:

```bash
node register-domain.js
```

### Step 2: Generate Manifest

```bash
cd cli
./manifestGenerator.js /path/to/your/dapp/build
```

This will create a `dapp-manifest.json` file.

### Step 3: Submit to Blockchain

```bash
./submitter.js
```

This will:
1. Upload the manifest to IPFS
2. Register the IPFS CID on the blockchain

## 6. Verifying Your dApp

1. Open your dApp in a browser with the DappGuardian extension installed
2. Click the DappGuardian icon in the browser toolbar
3. The extension will show the verification status of your dApp

## 7. Complete System Test

To ensure everything is working together:

1. Make a small change to your dApp
2. Generate a new manifest
3. Submit the update to the blockchain
4. Refresh your dApp in the browser
5. Verify that the extension shows the updated verification status

## Troubleshooting

### Smart Contract Issues

- **Error: Contract deployment failed**
  - Check your private key and RPC URL
  - Ensure you have enough ETH for gas fees

- **Error: Transaction reverted**
  - Check that you're using the correct function parameters
  - Ensure you have the necessary permissions (e.g., for domain registration)

### CLI Issues

- **Error: Cannot find module**
  - Run `npm install` again
  - Check that all dependencies are properly installed

- **Error: IPFS upload failed**
  - Verify your IPFS provider credentials
  - Check your internet connection
  - Try a different IPFS provider

### Extension Issues

- **Extension not appearing in browser**
  - Ensure you've enabled developer mode
  - Check that the extension was built correctly (`yarn build`)
  - Try reloading the extension

- **Verification not working**
  - Check console for errors (F12 > Console)
  - Verify that the contract address in the extension matches your deployed contract
  - Ensure your dApp domain is registered and has releases

## Production Deployment

For production use:

1. **Smart Contracts**: Deploy to mainnet after thorough testing
2. **Extension**: Package and publish to the Chrome Web Store
3. **CLI Tools**: Set up secure key management and CI/CD integration

## Next Steps

Once your basic setup is complete:

- Explore [IPFS Integration](IPFS-INTEGRATION.md) for advanced configuration
- Read the [Browser Extension Documentation](BROWSER-EXTENSION.md) for customization options
- Check the [Smart Contracts Documentation](SMART-CONTRACTS.md) for advanced contract features
- Set up [Continuous Integration](CLI-TOOLS.md#continuous-integration) for automated updates 