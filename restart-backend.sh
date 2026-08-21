#!/bin/bash

# Script to restart backend server and ALWAYS restart frontend
# This ensures UI remains accessible after backend restart

echo "🔄 Restarting backend server..."

# Kill existing backend process
echo "Stopping existing backend server..."
lsof -ti:5000 | xargs kill -9 2>/dev/null
sleep 2

# ALWAYS restart frontend when backend restarts (force restart)
echo "🔄 Restarting frontend (always restarts with backend)..."
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "   Stopping existing frontend..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    sleep 2
fi

# Get absolute path to script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Start frontend
echo "   Starting frontend..."
cd "$SCRIPT_DIR/client"
npm start > /tmp/frontend-server.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend starting (PID: $FRONTEND_PID)"
sleep 10  # Increased wait time for frontend to fully start

# Start backend
echo "Starting backend server on port 5000..."
cd "$SCRIPT_DIR"
node server/index.js > /tmp/backend-server.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Check if backend is running
if lsof -ti:5000 > /dev/null 2>&1; then
    echo "✅ Backend server is running on port 5000 (PID: $BACKEND_PID)"
    echo ""
    echo "📊 Server Status:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:5000"
    echo ""
    echo "📝 Logs:"
    echo "   Backend:  tail -f /tmp/backend-server.log"
    echo "   Frontend: tail -f /tmp/frontend-server.log"
else
    echo "❌ Backend server failed to start. Check /tmp/backend-server.log"
    exit 1
fi

