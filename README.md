# DappGuardian

DappGuardian is a comprehensive security solution for decentralized applications (dApps), designed to protect users from malicious code changes and ensure integrity of web3 front-ends.

## Project Overview

DappGuardian consists of three main components:

1. **Smart Contracts**: On-chain registry for storing IPFS CIDs of dApp file manifests
2. **Browser Extension**: User-facing tool that verifies dApp integrity in real-time
3. **Developer CLI**: Tools for dApp developers to register and update their applications

### Problem Addressed

In the current web3 landscape, users have no way to verify if the front-end code they're interacting with is the same code that was audited or reviewed by the developer. DappGuardian solves this by:

- Allowing developers to generate cryptographic hashes of their dApp files
- Storing these hashes in IPFS for scalability and cost-efficiency
- Registering the IPFS CID on-chain for verifiable integrity
- Enabling users to automatically verify these hashes when they visit dApps
- Creating an immutable record of dApp versions and changes

## Documentation

Comprehensive documentation is available in the [docs](docs/) directory:

- [Installation Guide](docs/INSTALLATION.md) - Complete setup instructions
- [Smart Contracts](docs/SMART-CONTRACTS.md) - Contract architecture and usage
- [Browser Extension](docs/BROWSER-EXTENSION.md) - Extension functionality and development
- [CLI Tools](docs/CLI-TOOLS.md) - Developer utilities for hash generation and registration
- [IPFS Integration](docs/IPFS-INTEGRATION.md) - How the system leverages IPFS for storage

## Repository Structure
```
dapp-security/
├── contracts/ # Smart contract code (Solidity)
├── extension/ # Browser extension (TypeScript/React)
├── cli/ # Developer tools (Node.js)
└── docs/ # Documentation files
```

## Components

### Smart Contracts

The DappGuardian contract serves as a secure, decentralized registry for dApp releases, allowing:

- Developers to register domains and publish IPFS CIDs pointing to file manifests
- Users to verify file integrity through the IPFS-stored manifests
- History tracking of all dApp versions and changes

**Setup:**

```bash
cd contracts
npm install
cp .env.example .env  # Configure with your environment values
npx hardhat compile
npx hardhat test
```

### Browser Extension

A browser extension that automatically verifies dApp integrity when users visit web3 sites:

- Detects when users visit registered dApps
- Computes hashes of loaded resources
- Retrieves manifest data from IPFS using multiple gateways for reliability
- Verifies local hashes against the manifest data
- Alerts users if any discrepancies are found

**Development:**

```bash
cd extension
yarn install
yarn dev      # Start development mode
yarn build    # Build production version
```

**Installation:**

1. Build the extension using `yarn build`
2. In Chrome/Brave, go to Extensions
3. Enable Developer Mode
4. Click "Load unpacked" and select the `extension/dist` directory

### Developer CLI

Tools for dApp developers to easily integrate with DappGuardian:

- `generate-manifest`: Creates a manifest of file hashes for your dApp
- `submit-update`: Uploads the manifest to IPFS and registers the CID on-chain

**Usage:**

```bash
cd cli
npm install
cp .env.example .env  # Configure with your environment values

# Generate a manifest for your dApp
./manifestGenerator.js path/to/your/dapp

# Submit an update to IPFS and the registry
./submitter.js
```

## IPFS Integration

DappGuardian uses IPFS to store file manifests, providing several key benefits:

### Benefits

1. **Cost Efficiency**: Transaction costs remain constant regardless of how many files are in the build
2. **Scalability**: No limit to how many files can be included in a release
3. **Transparency**: Anyone can verify the manifest contents by accessing the IPFS CID
4. **Permanence**: Content is pinned on IPFS and retrievable as long as at least one node has it

### How It Works

1. **Manifest Generation**: The CLI tool generates a JSON manifest with cryptographic hashes of all dApp files
2. **IPFS Upload**: The manifest is uploaded to IPFS and pinned via Pinata or another pinning service
3. **On-Chain Registration**: Only the IPFS CID is stored on-chain, significantly reducing gas costs
4. **Verification**: The browser extension retrieves the manifest from IPFS and verifies file integrity

For more details, see the [IPFS Integration Guide](docs/IPFS-INTEGRATION.md).

## Technology Stack

- **Smart Contracts**: Solidity, Hardhat
- **Extension**: TypeScript, React, Chrome Extension API
- **CLI**: Node.js, ethers.js, IPFS HTTP Client
- **Storage**: IPFS, Pinata

## Quick Start

For a quick start guide to setting up the complete system, see the [Installation Guide](docs/INSTALLATION.md).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.