# Build Troubleshooting Guide

## Why Changes Aren't Appearing in Build

There are several common reasons why code changes don't appear in the build:

### 1. **Build Not Run After Code Changes**

**Problem**: The `client/build/` directory contains old compiled code.

**Solution**: Rebuild the frontend after making changes:
```bash
cd client
npm run build
```

Or from project root:
```bash
npm run build
```

### 2. **Browser Cache**

**Problem**: Browser is serving cached JavaScript files from previous builds.

**Solutions**:
- **Hard refresh**: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- **Clear browser cache**: Clear cached files in browser settings
- **Incognito/Private mode**: Test in a private browsing window
- **Disable cache in DevTools**: 
  - Open DevTools (F12)
  - Go to Network tab
  - Check "Disable cache"
  - Keep DevTools open while testing

### 3. **Development vs Production Mode**

**Problem**: Running in development mode (`npm start`) uses source files directly, while production uses the `build/` folder.

**Check which mode you're in**:
- **Development**: Running `npm start` or `npm run client` - uses `client/src/` directly
- **Production**: Serving from `client/build/` - requires `npm run build` first

**Solution**: 
- For development: Changes appear immediately (hot reload)
- For production: Must rebuild after changes: `npm run build`

### 4. **Stale Build Files**

**Problem**: Build directory contains old files that aren't being overwritten.

**Solution**: Clean and rebuild:
```bash
cd client
rm -rf build
npm run build
```

### 5. **Build Directory Not Updated**

**Problem**: The build process might be failing silently or not completing.

**Solution**: Check build output:
```bash
cd client
npm run build 2>&1 | tee build.log
# Check build.log for errors
```

### 6. **File Not Included in Build**

**Problem**: File might not be imported/used anywhere, so it's tree-shaken out.

**Solution**: 
- Ensure the file is imported somewhere in your component tree
- Check that the file path is correct
- Verify the file extension matches the import

### 7. **Environment Variables**

**Problem**: Build-time environment variables might be different.

**Solution**: 
- Check `.env` files
- Rebuild after changing environment variables
- Environment variables are embedded at build time, not runtime

### 8. **Docker/Container Issues**

**Problem**: If using Docker, the build might be using cached layers.

**Solution**:
```bash
# Rebuild without cache
docker-compose build --no-cache frontend

# Or rebuild the entire stack
docker-compose down
docker-compose build
docker-compose up
```

## Quick Diagnostic Steps

1. **Check if build exists and is recent**:
   ```bash
   ls -la client/build/
   # Check timestamps - should be recent
   ```

2. **Verify source files changed**:
   ```bash
   # Check when source files were last modified
   find client/src -name "*.js" -type f -exec ls -lt {} + | head -10
   ```

3. **Compare source vs build**:
   ```bash
   # Check if a specific file is in the build
   grep -r "your-change-text" client/build/
   ```

4. **Check build output for errors**:
   ```bash
   cd client
   npm run build 2>&1 | grep -i error
   ```

5. **Verify build process completes**:
   ```bash
   cd client
   npm run build
   # Should end with "Build successful" or similar
   ```

## Common Scenarios

### Scenario 1: Changed a React Component
```bash
# 1. Make your changes in client/src/
# 2. Rebuild
cd client && npm run build
# 3. Hard refresh browser (Ctrl+Shift+R)
```

### Scenario 2: Changed index.html
```bash
# index.html changes require rebuild
cd client && npm run build
# Clear browser cache completely
```

### Scenario 3: Changed API Configuration
```bash
# API config changes require rebuild
cd client && npm run build
# Restart server if needed
```

### Scenario 4: Added New Dependencies
```bash
# Install new dependencies
cd client && npm install
# Rebuild
npm run build
```

## Prevention

1. **Always rebuild after code changes** when deploying to production
2. **Use development mode** (`npm start`) during development for instant updates
3. **Clear browser cache** regularly during testing
4. **Check build output** for warnings or errors
5. **Version your builds** - add build timestamp or version to help identify stale builds

## Build Verification Script

Run this to verify your build is up to date:

```bash
#!/bin/bash
echo "Checking build status..."
cd client

# Check if build exists
if [ ! -d "build" ]; then
  echo "❌ Build directory doesn't exist - run 'npm run build'"
  exit 1
fi

# Check build timestamp
BUILD_TIME=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" build 2>/dev/null || stat -c "%y" build 2>/dev/null | cut -d' ' -f1,2)
echo "📦 Build timestamp: $BUILD_TIME"

# Check if source is newer than build
NEWEST_SOURCE=$(find src -type f -exec stat -f "%Sm" -t "%s" {} \; 2>/dev/null | sort -n | tail -1 || find src -type f -exec stat -c "%Y" {} \; 2>/dev/null | sort -n | tail -1)
NEWEST_BUILD=$(stat -f "%Sm" -t "%s" build 2>/dev/null || stat -c "%Y" build 2>/dev/null)

if [ "$NEWEST_SOURCE" -gt "$NEWEST_BUILD" ]; then
  echo "⚠️  Source files are newer than build - rebuild needed!"
  echo "   Run: npm run build"
else
  echo "✅ Build is up to date"
fi
```
