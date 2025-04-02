#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

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

async function generateManifest() {
  try {
    const buildDir = process.argv[2] || 'build';
    const manifest = await scanDirectory(buildDir);
    await fs.writeFile(
      'dapp-manifest.json',
      JSON.stringify(manifest, null, 2)
    );
    console.log('Manifest generated successfully!');
  } catch (error) {
    console.error('Error generating manifest:', error);
    process.exit(1);
  }
}

generateManifest(); 