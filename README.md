# DappGuardian

DappGuardian is a comprehensive security solution for decentralized applications (dApps), designed to protect users from malicious code changes and ensure integrity of web3 front-ends.

## Project Overview

DappGuardian consists of three main components:

1. **Smart Contracts**: On-chain registry for storing and verifying dApp file hashes
2. **Browser Extension**: User-facing tool that verifies dApp integrity in real-time
3. **Developer CLI**: Tools for dApp developers to register and update their applications

### Problem Addressed

In the current web3 landscape, users have no way to verify if the front-end code they're interacting with is the same code that was audited or reviewed by the developer. DappGuardian solves this by:

- Allowing developers to register cryptographic hashes of their dApp files on-chain
- Enabling users to automatically verify these hashes when they visit dApps
- Creating an immutable record of dApp versions and changes

## Repository Structure
```
dapp-security/
├── contracts/ # Smart contract code (Solidity)
├── extension/ # Browser extension (TypeScript/React)
└── cli/ # Developer tools (Node.js)
```

## Components

### Smart Contracts

The DappGuardian contract serves as a secure, decentralized registry for dApp file hashes, allowing:

- Developers to register domains and publish file hashes
- Users to verify file integrity against on-chain data
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
- Verifies hashes against the on-chain registry
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
- `submit-update`: Registers a new version of your dApp on-chain

**Usage:**

```bash
cd cli
npm install
cp .env.example .env  # Configure with your environment values

# Generate a manifest for your dApp
./manifestGenerator.js path/to/your/dapp

# Submit an update to the registry
./submitter.js
```

## Technology Stack

- **Smart Contracts**: Solidity, Hardhat
- **Extension**: TypeScript, React, Chrome Extension API
- **CLI**: Node.js, ethers.js

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.