#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs').promises;
const { ethers } = require('ethers');
const crypto = require('crypto');
const { create } = require('ipfs-http-client');
const axios = require('axios');
const FormData = require('form-data');

// Updated ABI - the contract function now accepts a CID instead of file array
const CONTRACT_ABI = [
  "function registerRelease(string memory domain, string memory ipfsCid, string memory metadata) external"
];

async function uploadToIPFS(jsonData) {
  try {
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
    
    const pinataOptions = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', pinataOptions);
    
    // Upload to Pinata
    const response = await axios.post(process.env.IPFS_API_URL, formData, {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
        'pinata_api_key': process.env.IPFS_API_KEY,
        'pinata_secret_api_key': process.env.IPFS_API_SECRET,
      },
    });
    
    return response.data.IpfsHash;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
}

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
      .digest('hex');

    // Create the enhanced manifest with metadata
    const enhancedManifest = {
      domain: process.env.DAPP_DOMAIN,
      timestamp: Math.floor(Date.now() / 1000),
      globalHash,
      files: manifest.map(entry => ({
        filename: entry.path,
        hash: entry.hash,
        timestamp: Math.floor(Date.now() / 1000)
      }))
    };

    // Upload manifest to IPFS and get CID
    console.log('Uploading manifest to IPFS...');
    const ipfsCid = await uploadToIPFS(enhancedManifest);
    console.log(`Manifest uploaded to IPFS with CID: ${ipfsCid}`);

    // Connect to the contract and register the release with the IPFS CID
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
      "Update " + new Date().toISOString() // Add some metadata about the update
    );
    await tx.wait();

    console.log('Update submitted successfully!');
    console.log('Transaction:', tx.hash);
    console.log('IPFS CID:', ipfsCid);
  } catch (error) {
    console.error('Error submitting update:', error);
    process.exit(1);
  }
}

submitUpdate(); 