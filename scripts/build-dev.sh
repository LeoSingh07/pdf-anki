#!/bin/bash

# Development build script as workaround for missing npm script
echo "Running development build..."

# Set NODE_ENV to development
export NODE_ENV=development

# Run vite build in development mode
npx vite build --mode development

echo "Development build completed!"