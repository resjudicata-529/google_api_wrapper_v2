#!/bin/bash

# Clean previous build
rm -rf dist/

# Build TypeScript
npm run build

# Copy static files
cp -r public/ dist/public/

echo "Build completed successfully!" 