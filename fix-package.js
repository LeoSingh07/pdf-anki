#!/usr/bin/env node

// Directly modify package.json to add the missing script
// This runs immediately when called

import fs from 'fs';

try {
  console.log('🔧 Reading package.json...');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (!pkg.scripts['build:dev']) {
    console.log('📝 Adding build:dev script...');
    pkg.scripts['build:dev'] = 'NODE_ENV=development vite build --mode development && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist';
    
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
    console.log('✅ Successfully added build:dev script to package.json');
  } else {
    console.log('✅ build:dev script already exists');
  }
} catch (err) {
  console.error('❌ Failed to modify package.json:', err.message);
  process.exit(1);
}