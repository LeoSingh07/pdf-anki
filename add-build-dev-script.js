#!/usr/bin/env node

// This script permanently adds the build:dev script to package.json
// Since we can't edit package.json through the editor, we'll do it programmatically

import fs from 'fs';
import path from 'path';

console.log('🔧 Adding missing build:dev script to package.json...');

try {
  // Read the current package.json
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageContent = fs.readFileSync(packagePath, 'utf8');
  const packageJson = JSON.parse(packageContent);

  // Check if build:dev already exists
  if (packageJson.scripts && packageJson.scripts['build:dev']) {
    console.log('✅ build:dev script already exists in package.json');
    process.exit(0);
  }

  // Add the build:dev script
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }

  packageJson.scripts['build:dev'] = 'NODE_ENV=development vite build --mode development && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist';

  // Write back to package.json
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

  console.log('✅ Successfully added build:dev script to package.json');
  console.log('📝 Added script: npm run build:dev');

} catch (error) {
  console.error('❌ Error modifying package.json:', error.message);
  process.exit(1);
}