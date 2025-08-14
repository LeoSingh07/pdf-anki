#!/usr/bin/env node

// Immediately fix package.json by adding the missing build:dev script
import fs from 'fs';
import { execSync } from 'child_process';

console.log('🔧 EMERGENCY FIX: Adding missing build:dev script...');

try {
  // Read current package.json
  const packagePath = './package.json';
  const originalContent = fs.readFileSync(packagePath, 'utf8');
  const pkg = JSON.parse(originalContent);

  // Add the missing script
  pkg.scripts['build:dev'] = 'NODE_ENV=development vite build --mode development && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist';

  // Write it back immediately
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
  
  console.log('✅ Successfully added build:dev script!');
  console.log('📋 Script added: "build:dev": "NODE_ENV=development vite build --mode development && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"');
  
  // Verify it was added
  const newContent = fs.readFileSync(packagePath, 'utf8');
  const newPkg = JSON.parse(newContent);
  
  if (newPkg.scripts['build:dev']) {
    console.log('🎉 Verification successful - build:dev script now exists');
  } else {
    console.log('❌ Verification failed - script was not added');
  }

} catch (error) {
  console.error('❌ Failed to fix package.json:', error.message);
  
  // Fallback: create package.json from scratch with all the necessary scripts
  console.log('🔄 Attempting fallback approach...');
  
  const fallbackPackage = {
    "name": "rest-express",
    "version": "1.0.0",
    "type": "module",
    "license": "MIT",
    "scripts": {
      "dev": "NODE_ENV=development tsx server/index.ts",
      "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
      "build:dev": "NODE_ENV=development vite build --mode development && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
      "start": "NODE_ENV=production node dist/index.js",
      "check": "tsc",
      "db:push": "drizzle-kit push"
    }
  };
  
  try {
    fs.writeFileSync('./package.json', JSON.stringify(fallbackPackage, null, 2) + '\n');
    console.log('✅ Fallback successful - created new package.json with build:dev script');
  } catch (fallbackError) {
    console.error('❌ Fallback also failed:', fallbackError.message);
    process.exit(1);
  }
}

// Run this script immediately