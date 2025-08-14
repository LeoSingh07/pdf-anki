#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Running development build...');

// Run vite build with development mode
const viteBuild = spawn('npx', ['vite', 'build', '--mode', 'development'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

viteBuild.on('close', (code) => {
  if (code === 0) {
    console.log('Development build completed successfully!');
  } else {
    console.error(`Build failed with exit code ${code}`);
    process.exit(code);
  }
});

viteBuild.on('error', (err) => {
  console.error('Failed to start build process:', err);
  process.exit(1);
});