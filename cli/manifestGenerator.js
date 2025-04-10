#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

async function computeFileHash(filePath) {
  const content = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function scanDirectory(dir, baseDir) {
  const manifest = [];
  const files = await fs.readdir(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      const subManifest = await scanDirectory(fullPath, baseDir);
      manifest.push(...subManifest);
    } else {
      const hash = await computeFileHash(fullPath);
      const pathInBuild = path.relative(baseDir, fullPath);
      manifest.push({ path: pathInBuild, hash });
    }
  }

  return manifest;
}

async function generateManifest() {
  try {
    const buildDir = process.argv[2] || 'build';
    const absoluteBuildDir = path.resolve(buildDir);
    const manifest = await scanDirectory(buildDir, absoluteBuildDir);
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