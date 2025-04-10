# Browser Extension Documentation

This document provides a comprehensive guide to the DappGuardian browser extension, which verifies the integrity of decentralized applications in real-time.

## Overview

The DappGuardian browser extension works in the background to:

1. Monitor web resources loaded by the browser
2. Calculate cryptographic hashes of JavaScript files
3. Verify these hashes against trusted records stored on the blockchain
4. Alert users when discrepancies are detected

This provides users with confidence that the front-end code they're interacting with hasn't been maliciously modified.

## Architecture

The extension consists of several key components:

### 1. Background Service Worker

A persistent script that:
- Intercepts network requests via Chrome's WebRequest API
- Processes JavaScript files loaded by the browser
- Calculates SHA-256 hashes of file contents
- Stores these hashes in the browser's local storage

### 2. Popup Interface

A React-based UI that:
- Shows verification status for the current site
- Displays detailed information about file hashes
- Compares local hashes with those from the blockchain
- Provides troubleshooting options

### 3. Contract Service

A module that:
- Connects to the Ethereum blockchain
- Retrieves file manifests from IPFS via multiple gateways
- Caches results for improved performance
- Provides a resilient verification pathway

## Technical Implementation

### File Monitoring

The extension monitors JavaScript files loaded by web pages:

```typescript
// Monitoring network requests
chrome.webRequest.onCompleted.addListener(
  this.handleRequest.bind(this),
  { 
    urls: ["<all_urls>"],
    types: ["script", "xmlhttprequest"] 
  },
  ["responseHeaders"]
);
```

### Hash Calculation

Secure hash calculation using the Web Crypto API:

```typescript
async computeHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### IPFS Integration

The extension uses a fallback strategy for retrieving IPFS content:

```typescript
// Multiple IPFS gateways for reliability
const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://dweb.link/ipfs/"
];
```

### Verification Process

When a user opens the extension popup, it performs:

1. Retrieval of the IPFS CID from the smart contract
2. Fetching of the manifest from IPFS through multiple gateways
3. Extraction of file hashes from the manifest
4. Comparison with locally computed hashes
5. Visual presentation of verification results

## User Interface

### Status Indicators

The extension provides clear visual indicators:

- **SECURE**: All files match the verified hashes
- **VERIFYING**: The verification process is in progress
- **UNVERIFIED**: Files don't match or verification failed

### File Listing

For each JavaScript file, the extension shows:
- File name/path
- Local hash (computed by the extension)
- Contract hash (retrieved from the blockchain/IPFS)
- Match status (✓ or ✗)

### Error Handling

When issues occur, the extension provides:
- Clear error messages
- Retry functionality
- Troubleshooting guidance

## Performance Considerations

### Caching

The extension implements multiple caching layers:

1. **IPFS Manifest Caching**: Manifests are cached for one hour to reduce requests
2. **File Hash Storage**: Computed hashes are stored in local storage
3. **Contract Data Caching**: Blockchain data is cached to minimize RPC calls

### Gateway Fallbacks

If one IPFS gateway fails, the extension automatically tries others:

```typescript
async fetchFromIPFS(cid: string): Promise<any> {
  // Check cache first
  if (this.manifestCache[cid] && 
      Date.now() < this.manifestCache[cid].expiryTime) {
    return this.manifestCache[cid].data;
  }
  
  // Try each gateway in sequence until one works
  for (const gateway of IPFS_GATEWAYS) {
    try {
      const gatewayUrl = `${gateway}${cid}`;
      // Attempt to fetch from this gateway
      // ...
      return data;
    } catch (error) {
      // Continue to next gateway
    }
  }
  
  // All gateways failed
  throw new Error("All IPFS gateways failed");
}
```

## Development Setup

To set up the extension for development:

```bash
# Clone the repository
git clone https://github.com/your-org/dappguardian.git
cd dappguardian/extension

# Install dependencies
yarn install

# Start development mode
yarn dev
```

### Build for Production

```bash
yarn build
```

This creates a production-ready extension in the `dist` directory.

### Loading the Extension

1. Open Chrome or Brave
2. Navigate to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `extension/dist` directory

## Customization

### Contract Address

Update the contract address in `extension/services/contractService.ts`:

```typescript
const CONTRACT_ADDRESSES = {
  sepolia: "YOUR_DEPLOYED_CONTRACT_ADDRESS",
  localhost: "0x5FbDB2315678afecb367f032d93F642f64180aa3"
};
```

### IPFS Gateways

Add or remove IPFS gateways:

```typescript
const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  // Add your preferred gateways here
];
```

## Troubleshooting

### Common Issues

1. **Extension shows "UNVERIFIED" for all files**
   - The domain may not be registered in the DappGuardian contract
   - The IPFS manifest might be unavailable or improperly formatted
   - Check browser console for detailed error messages

2. **Some files are not being verified**
   - File paths in the manifest might not match the loaded resources
   - CORS issues might prevent file content access
   - The file might be dynamically generated or obfuscated

3. **IPFS connectivity issues**
   - Try using the retry button
   - Check if all IPFS gateways are accessible
   - Verify that the IPFS CID is valid

## Privacy Considerations

The extension:
- Only processes JavaScript files
- Does not track user behavior or browsing history
- Does not send any data to external servers except for:
  - Ethereum RPC calls to read the contract
  - IPFS gateway requests to retrieve manifests

## Future Enhancements

Planned improvements for the extension:

1. **Enhanced UI/UX**: Better visualization of verification results
2. **Automated Alerting**: Proactive notifications for verification failures
3. **Offline Mode**: Support for working without active internet connection
4. **Additional File Types**: Extend verification to CSS, HTML, and other resources 