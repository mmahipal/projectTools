# Server Management Guide

## Overview

The application consists of two independent servers:
- **Frontend** (React): Runs on port 3000
- **Backend** (Node.js/Express): Runs on port 5000

## Important: Server Independence

✅ **The frontend and backend run independently.**
- Restarting the backend will NOT affect the frontend
- The frontend will gracefully handle backend unavailability
- The frontend will automatically reconnect when the backend is available again

## Available Scripts

### 1. Start Both Servers
```bash
./start-servers.sh
```
- Starts both frontend and backend if they're not already running
- If a server is already running, it will skip starting it
- Use this when starting fresh

### 2. Restart Backend Only
```bash
./restart-backend.sh
```
- **Recommended for backend restarts**
- Only restarts the backend server
- Frontend continues running and will reconnect automatically
- Use this when you make backend code changes

### 3. Restart Both Servers
```bash
./restart-servers.sh
```
- Restarts both frontend and backend
- Use this only when you need to restart both servers

### 4. Using npm scripts
```bash
# Start both servers in development mode (with auto-reload)
npm run dev

# Start backend only
npm run server

# Start frontend only
npm run client
```

## Frontend Resilience

The frontend has been configured to handle backend unavailability gracefully:

1. **Error Handling**: API errors don't crash the frontend
2. **Graceful Degradation**: UI shows loading/empty states when backend is unavailable
3. **Auto-Reconnect**: Frontend automatically retries when backend becomes available
4. **User-Friendly Messages**: Clear error messages when backend is restarting

## Troubleshooting

### Frontend becomes inaccessible after backend restart

**Solution**: The frontend should continue running. If it doesn't:
1. Check if frontend process is still running: `lsof -ti:3000`
2. If not running, start it: `cd client && npm start`
3. The frontend is independent and should not be affected by backend restarts

### Backend restart causes frontend to crash

**This should not happen**. If it does:
1. Check frontend logs: `tail -f /tmp/frontend-server.log`
2. Check for any hard dependencies on backend in frontend code
3. Ensure error boundaries are in place

### Check server status

```bash
# Check if servers are running
lsof -ti:3000 && echo "Frontend running" || echo "Frontend NOT running"
lsof -ti:5000 && echo "Backend running" || echo "Backend NOT running"

# Test server responses
curl http://localhost:3000  # Frontend
curl http://localhost:5000/api/health  # Backend
```

## Logs

- Backend logs: `tail -f /tmp/backend-server.log`
- Frontend logs: `tail -f /tmp/frontend-server.log`

## Best Practices

1. **For backend changes**: Use `./restart-backend.sh`
2. **For frontend changes**: Frontend auto-reloads in development mode
3. **For both changes**: Use `./restart-servers.sh` or `npm run dev`
4. **Always check logs** if something doesn't work


