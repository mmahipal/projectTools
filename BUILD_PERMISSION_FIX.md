# Build Permission Fix for OneDrive

## Issue
`EPERM: operation not permitted` error when running `npm run build` due to OneDrive cloud storage permission issues.

## Root Cause
OneDrive sync can cause permission issues with node_modules, especially when files are not fully downloaded or synced.

## Solutions

### Solution 1: Exclude node_modules from OneDrive (Recommended)

1. **Right-click on the project folder** in Finder
2. Select **"OneDrive" → "Always Keep on This Device"**
3. Or exclude `node_modules` folders from OneDrive sync:
   - Go to OneDrive settings
   - Add `node_modules` to exclusion list

### Solution 2: Reinstall node_modules

```bash
# Remove node_modules
rm -rf node_modules client/node_modules

# Clear npm cache
npm cache clean --force

# Reinstall
npm run install-all
```

### Solution 3: Move Project Outside OneDrive

Move the project to a local directory (not synced with OneDrive):
```bash
# Move to local directory
mv ~/Library/CloudStorage/OneDrive-Appen/Github-Appen/project-tools ~/Projects/
cd ~/Projects/project-tools
npm run install-all
npm run build
```

### Solution 4: Use Docker Build (Bypasses Local Permissions)

Since we fixed the Docker setup, you can build using Docker:
```bash
docker-compose build frontend
docker-compose run --rm frontend npm run build
```

### Solution 5: Fix Permissions

```bash
# Fix permissions on node_modules
sudo chmod -R u+w client/node_modules
sudo chmod -R u+w node_modules

# Then try build again
npm run build
```

## Quick Fix (Try This First)

```bash
# Navigate to client directory
cd client

# Remove and reinstall
rm -rf node_modules
npm install

# Go back and build
cd ..
npm run build
```

## Prevention

Add to `.gitignore` (if not already there):
```
node_modules/
client/node_modules/
```

And configure OneDrive to exclude `node_modules` folders from sync.
