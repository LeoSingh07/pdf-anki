#!/usr/bin/env node

// This script simulates the missing "build:dev" npm script
// It runs the same command that would be in package.json

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Running development build (simulating npm run build:dev)...');

// Set environment to development
process.env.NODE_ENV = 'development';

// Build command: vite build in development mode + esbuild for server
const buildCommand = 'npx vite build --mode development && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist';

const child = spawn(buildCommand, {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_ENV: 'development' }
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Development build completed successfully!');
  } else {
    console.error(`❌ Build failed with exit code ${code}`);
    process.exit(code);
  }
});

child.on('error', (err) => {
  console.error('❌ Failed to start build process:', err);
  process.exit(1);
});