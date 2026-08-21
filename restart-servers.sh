#!/bin/bash

# Script to restart both frontend and backend servers
# Usage: ./restart-servers.sh
# Note: This restarts BOTH servers. Use restart-backend.sh to restart only backend.

echo "🔄 Restarting servers..."

# Kill existing processes
echo "Stopping existing servers..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5000 | xargs kill -9 2>/dev/null
sleep 2

# Start backend
echo "Starting backend server on port 5000..."
cd "$(dirname "$0")"
node server/index.js > /tmp/backend-server.log 2>&1 &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend server on port 3000..."
cd client
npm start > /tmp/frontend-server.log 2>&1 &
FRONTEND_PID=$!

# Wait for servers to start
echo "Waiting for servers to start..."
sleep 15

# Check if servers are running
if lsof -ti:5000 > /dev/null 2>&1; then
    echo "✅ Backend server is running on port 5000 (PID: $BACKEND_PID)"
else
    echo "❌ Backend server failed to start. Check /tmp/backend-server.log"
    exit 1
fi

if lsof -ti:3000 > /dev/null 2>&1; then
    echo "✅ Frontend server is running on port 3000 (PID: $FRONTEND_PID)"
else
    echo "❌ Frontend server failed to start. Check /tmp/frontend-server.log"
    exit 1
fi

# Test server responses
echo ""
echo "Testing server responses..."
sleep 5

if curl -s http://localhost:5000/api/auth/verify > /dev/null 2>&1; then
    echo "✅ Backend is responding"
else
    echo "⚠️  Backend may not be fully ready yet"
fi

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is responding"
else
    echo "⚠️  Frontend may not be fully ready yet"
fi

echo ""
echo "🎉 Servers are running!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""
echo "Logs:"
echo "   Backend:  tail -f /tmp/backend-server.log"
echo "   Frontend: tail -f /tmp/frontend-server.log"



