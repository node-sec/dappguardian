#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs').promises;
const { ethers } = require('ethers');
const crypto = require('crypto');

const CONTRACT_ABI = [
  "function registerRelease(string memory domain, FileHash[] memory files, string memory metadata) external"
];

async function submitUpdate() {
  try {
    const manifest = JSON.parse(
      await fs.readFile('dapp-manifest.json', 'utf8')
    );

    // Sort entries by path for consistent hashing
    manifest.sort((a, b) => a.path.localeCompare(b.path));

    // Compute global hash
    const globalHash = crypto.createHash('sha256')
      .update(manifest.map(entry => entry.hash).join(''))
      .digest();

    // Convert the manifest entries to the FileHash structure expected by the contract
    const fileHashes = manifest.map(entry => ({
      filename: entry.path,
      hash: '0x' + entry.hash, // Ensure hash is in bytes32 format
      timestamp: Math.floor(Date.now() / 1000)
    }));

    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      CONTRACT_ABI,
      wallet
    );

    const tx = await contract.registerRelease(
      process.env.DAPP_DOMAIN,
      fileHashes,
      "Update " + new Date().toISOString() // Add some metadata about the update
    );
    await tx.wait();

    console.log('Update submitted successfully!');
    console.log('Transaction:', tx.hash);
  } catch (error) {
    console.error('Error submitting update:', error);
    process.exit(1);
  }
}

submitUpdate(); 