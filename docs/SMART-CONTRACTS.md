# Smart Contracts Documentation

This document provides a comprehensive overview of the smart contract architecture used in DappGuardian.

## Overview

The DappGuardian smart contracts serve as a secure, decentralized registry for dApp file integrity. They allow developers to:

- Register domain ownership
- Record IPFS CIDs that point to file hash manifests
- Track version history of dApp releases
- Provide a source of truth for dApp integrity verification

## Contract Architecture

### DappGuardian.sol

The main contract that manages the entire registry system:

#### Key Data Structures

```solidity
struct Release {
    uint256 version;
    string ipfsCid;    // IPFS CID pointing to the manifest JSON
    uint256 timestamp;
    string metadata;   // Optional metadata about the release
}

mapping(string => address) public domainToDeveloper;
mapping(string => Release[]) public domainToReleases;
```

#### Events

```solidity
event ReleaseRegistered(
    string indexed domain,
    uint256 version,
    string ipfsCid,
    uint256 timestamp
);
```

#### Core Functions

1. **Domain Registration**

```solidity
function registerDomain(string memory domain) external {
    if (domainToDeveloper[domain] != address(0)) {
        revert DomainAlreadyRegistered();
    }
    domainToDeveloper[domain] = msg.sender;
}
```

2. **Release Registration**

```solidity
function registerRelease(
    string memory domain,
    string memory ipfsCid,
    string memory metadata
) external onlyDeveloper(domain) {
    uint256 newVersion = domainToReleases[domain].length + 1;
    
    Release storage newRelease = domainToReleases[domain].push();
    newRelease.version = newVersion;
    newRelease.ipfsCid = ipfsCid;
    newRelease.timestamp = block.timestamp;
    newRelease.metadata = metadata;

    emit ReleaseRegistered(
        domain,
        newVersion,
        ipfsCid,
        block.timestamp
    );
}
```

3. **Release Queries**

```solidity
function getLatestRelease(string memory domain) 
    external 
    view 
    returns (Release memory);

function getRelease(string memory domain, uint256 version) 
    external 
    view 
    returns (Release memory);

function getReleaseHistory(string memory domain) 
    external 
    view 
    returns (Release[] memory);
```

## Security Considerations

### Access Control

The contract implements a simple yet effective access control mechanism:

```solidity
modifier onlyDeveloper(string memory domain) {
    if (domainToDeveloper[domain] != msg.sender) {
        revert Unauthorized();
    }
    _;
}
```

This ensures that only the registered developer of a domain can publish releases for it.

### Error Handling

The contract uses custom errors for clear failure reporting:

```solidity
error Unauthorized();
error DomainAlreadyRegistered();
error DomainNotRegistered();
error InvalidVersion();
error NoReleasesFound();
```

### Data Integrity

- Release versions are assigned automatically in sequential order
- Timestamps are captured from the blockchain for verifiable timing
- IPFS CIDs provide content-addressed integrity for manifests

## Deployment and Interaction

### Contract Deployment

```bash
cd contracts
npm install
cp .env.example .env  # Set your private key and RPC URL
npx hardhat compile
npx hardhat deploy --network <network-name>
```

### Contract Interaction

The contract can be interacted with directly using tools like Hardhat or ethers.js:

```javascript
// Example: Registering a new domain
await dappGuardian.registerDomain("example.com");

// Example: Publishing a release
await dappGuardian.registerRelease(
  "example.com",
  "QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX", // IPFS CID
  "Initial release v1.0.0"  // Metadata
);
```

## Gas Optimization

The contract is designed with gas efficiency in mind:

1. **IPFS Integration**: Only storing CIDs on-chain instead of all file hashes
2. **Efficient Storage**: Using mappings for O(1) lookups
3. **Minimal Events**: Only essential events are emitted

## Testing

The contract includes a comprehensive test suite to ensure correctness:

```bash
npx hardhat test
```

Key test cases include:
- Domain registration and ownership verification
- Release registration and retrieval
- Access control enforcement
- Edge cases and error conditions

## Future Improvements

Potential future enhancements to the contract architecture:

1. **Upgradability**: Implementing proxy patterns for contract upgrades
2. **Enhanced Access Control**: Adding multi-sig capabilities for enterprise usage
3. **Domain Transfer**: Allowing domains to be transferred to new owners
4. **Subscription Model**: Implementing a token-based subscription for premium features 