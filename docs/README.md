# DappGuardian Documentation

Welcome to the DappGuardian documentation! This guide provides comprehensive information on installing, configuring, and using the DappGuardian system to protect your decentralized applications.

## Getting Started

- [Installation Guide](INSTALLATION.md) - Complete setup instructions for all components
- [Quick Start](INSTALLATION.md#5-registering-your-first-dapp) - Register and verify your first dApp

## Core Components

DappGuardian consists of three main components, each with its own detailed documentation:

### 1. Smart Contracts

- [Smart Contracts Documentation](SMART-CONTRACTS.md) - Detailed information about the contract architecture
  - [Contract Deployment](SMART-CONTRACTS.md#deployment-and-interaction)
  - [Contract Interaction](SMART-CONTRACTS.md#contract-interaction)
  - [Security Considerations](SMART-CONTRACTS.md#security-considerations)

### 2. Browser Extension

- [Browser Extension Documentation](BROWSER-EXTENSION.md) - Guide to the verification extension
  - [Architecture](BROWSER-EXTENSION.md#architecture)
  - [User Interface](BROWSER-EXTENSION.md#user-interface)
  - [Development Setup](BROWSER-EXTENSION.md#development-setup)
  - [Troubleshooting](BROWSER-EXTENSION.md#troubleshooting)

### 3. CLI Tools

- [CLI Tools Documentation](CLI-TOOLS.md) - Guide to the developer command-line tools
  - [Manifest Generator](CLI-TOOLS.md#1-manifest-generator)
  - [Submitter](CLI-TOOLS.md#2-submitter)
  - [Continuous Integration](CLI-TOOLS.md#continuous-integration)
  - [Advanced Usage](CLI-TOOLS.md#advanced-usage)

## Technical Features

- [IPFS Integration](IPFS-INTEGRATION.md) - How DappGuardian leverages IPFS for scalable storage
  - [Benefits](IPFS-INTEGRATION.md#benefits)
  - [Technical Implementation](IPFS-INTEGRATION.md#technical-implementation)
  - [Configuration](IPFS-INTEGRATION.md#configuration)
  - [Troubleshooting](IPFS-INTEGRATION.md#troubleshooting)

## Common Workflows

### For dApp Developers

1. **Initial Setup**
   - Register your domain on the DappGuardian contract
   - Generate a manifest of your dApp's file hashes
   - Upload to IPFS and register on the blockchain

2. **Updating Your dApp**
   - Generate a new manifest after changes
   - Submit the new manifest to create a new release version
   - Verify the update with the browser extension

### For dApp Users

1. **Verification Process**
   - Install the DappGuardian browser extension
   - Visit a dApp registered with DappGuardian
   - Check the verification status in the extension

## Troubleshooting

Each component documentation includes its own troubleshooting section:

- [Smart Contracts Troubleshooting](INSTALLATION.md#smart-contract-issues)
- [CLI Tools Troubleshooting](CLI-TOOLS.md#troubleshooting)
- [Browser Extension Troubleshooting](BROWSER-EXTENSION.md#troubleshooting)
- [IPFS Troubleshooting](IPFS-INTEGRATION.md#troubleshooting)

## Contributing

Contributions to DappGuardian are welcome! Please see our [Contributing Guide](../CONTRIBUTING.md) for details.

## License

DappGuardian is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

*This documentation is for the DappGuardian system version 1.0.0* 