# Docker Issues Fixed

## Problems Identified

### 1. **Working Directory Mismatch** (CRITICAL)
- **Dockerfile**: Set `WORKDIR /usr/src/app`
- **docker-compose.yaml**: Mounted volumes to `/app`
- **Impact**: Commands failed because they ran in wrong directory
- **Fix**: Changed Dockerfile to use `/app` to match docker-compose

### 2. **Volume Mount Issues**
- **Problem**: Volume mounts were overriding node_modules incorrectly
- **Impact**: Dependencies might not be available or wrong versions loaded
- **Fix**: Added explicit node_modules volume mounts for both root and client

### 3. **Missing Environment Variables**
- **Problem**: Frontend didn't have WebSocket and API URL configured
- **Impact**: React dev server couldn't connect to backend or hot reload
- **Fix**: Added `WDS_SOCKET_HOST`, `WDS_SOCKET_PORT`, and `REACT_APP_API_URL`

### 4. **Network Configuration**
- **Problem**: Frontend couldn't access backend properly
- **Impact**: API calls failed, UI couldn't load data
- **Fix**: Added `network_mode: "host"` for frontend to access backend

### 5. **Health Check Missing**
- **Problem**: Frontend started before backend was ready
- **Impact**: Frontend tried to connect to backend that wasn't ready
- **Fix**: Added health check to backend and made frontend wait

## Changes Made

### Dockerfile
- Changed `WORKDIR` from `/usr/src/app` to `/app`
- Improved layer caching by copying package files first
- Added comments for clarity

### docker-compose.yaml
- Fixed working directory consistency
- Added proper volume mounts for node_modules
- Added environment variables for React dev server
- Added health check for backend
- Added network configuration for frontend
- Made frontend wait for backend to be healthy

## How to Use

### Start Services
```bash
docker-compose up --build
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f frontend
docker-compose logs -f backend
```

### Rebuild After Changes
```bash
docker-compose up --build --force-recreate
```

## Troubleshooting

### If UI still blank:
1. Check if both containers are running: `docker-compose ps`
2. Check frontend logs: `docker-compose logs frontend`
3. Check backend logs: `docker-compose logs backend`
4. Verify ports are accessible: `curl http://localhost:3000` and `curl http://localhost:5000/api/health`

### If node_modules issues:
```bash
docker-compose down -v
docker-compose up --build
```

### If network issues:
- Verify `network_mode: "host"` is working
- Check if ports 3000 and 5000 are available
- Ensure backend health check is passing

## Notes

- The frontend uses `network_mode: "host"` to access backend on localhost:5000
- Backend health check ensures frontend only starts when backend is ready
- Volume mounts allow live code changes without rebuilding
- node_modules are preserved in volumes to avoid reinstalling on every start
