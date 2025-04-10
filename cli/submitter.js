#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs').promises;
const { ethers } = require('ethers');
const crypto = require('crypto');
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
    
    // Add the file to the form data - notice the specific format required by Pinata
    formData.append('file', manifestBuffer, {
      filename: 'manifest.json',
      contentType: 'application/json',
    });
    
    // Specify network (public IPFS)
    formData.append('network', 'public');
    
    // Set pinning options with proper format
    formData.append('pinataMetadata', JSON.stringify({
      name: `DApp-Manifest-${Date.now()}`
    }));
    
    formData.append('pinataOptions', JSON.stringify({
      cidVersion: 0
    }));
    
    // Check if API keys are available
    if (!process.env.IPFS_API_JWT) {
      throw new Error('Pinata API keys not found in environment variables');
    }
    
    console.log('Sending request to Pinata...');
    
    // Use the updated v3 API endpoint
    const response = await axios.post(
      process.env.IPFS_API_URL || 'https://uploads.pinata.cloud/v3/files',
      formData, 
      {
        maxBodyLength: Infinity,
        headers: {
          // Let FormData set its content-type with proper boundaries
          ...formData.getHeaders ? formData.getHeaders() : {},
          // Use Authorization Bearer token format instead of separate API keys
          Authorization: `Bearer ${process.env.IPFS_API_JWT}`
        },
      }
    );
    
    if (!response.data || !response.data.data || !response.data.data.cid) {
      console.error('Unexpected response structure:', response.data);
      throw new Error('Invalid response from Pinata API');
    }
    
    return response.data.data.cid;
  } catch (error) {
    console.error('Error uploading to IPFS:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else {
      console.error(error.message);
    }
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