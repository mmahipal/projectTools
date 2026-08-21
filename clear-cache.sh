#!/bin/bash
# Clear all build caches

echo "Clearing build caches..."

# Remove React build cache
rm -rf client/node_modules/.cache
rm -rf client/build
rm -rf .cache
rm -rf node_modules/.cache

# Remove babel cache
find client/node_modules -name ".cache" -type d -exec rm -rf {} + 2>/dev/null
find . -name ".cache" -type d -exec rm -rf {} + 2>/dev/null

# Remove webpack cache
rm -rf client/node_modules/.cache/babel-loader
rm -rf client/node_modules/.cache/webpack

echo "Cache cleared! Please restart your dev server."

