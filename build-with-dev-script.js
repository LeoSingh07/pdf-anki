#!/usr/bin/env node

// This script temporarily creates a package.json with build:dev script
// and runs the missing command

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Creating temporary package.json with build:dev script...');

// Read existing package.json
const originalPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Add the missing build:dev script
const modifiedPackage = {
  ...originalPackage,
  scripts: {
    ...originalPackage.scripts,
    "build:dev": "NODE_ENV=development vite build --mode development && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
  }
};

// Backup original package.json
fs.copyFileSync('package.json', 'package.json.backup');

// Write modified package.json
fs.writeFileSync('package.json', JSON.stringify(modifiedPackage, null, 2));

console.log('✅ Temporary package.json created with build:dev script');
console.log('🔧 Running npm run build:dev...');

// Run the build:dev command
const child = spawn('npm', ['run', 'build:dev'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_ENV: 'development' }
});

child.on('close', (code) => {
  console.log('🔄 Restoring original package.json...');
  
  // Restore original package.json
  fs.copyFileSync('package.json.backup', 'package.json');
  fs.unlinkSync('package.json.backup');
  
  if (code === 0) {
    console.log('✅ Development build completed successfully!');
  } else {
    console.error(`❌ Build failed with exit code ${code}`);
    process.exit(code);
  }
});

child.on('error', (err) => {
  console.log('🔄 Restoring original package.json due to error...');
  
  // Restore original package.json on error
  if (fs.existsSync('package.json.backup')) {
    fs.copyFileSync('package.json.backup', 'package.json');
    fs.unlinkSync('package.json.backup');
  }
  
  console.error('❌ Failed to start build process:', err);
  process.exit(1);
});