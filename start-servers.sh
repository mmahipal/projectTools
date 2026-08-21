#!/bin/bash

# Script to start both frontend and backend servers independently
# Each server runs independently and won't affect the other if one restarts

echo "🚀 Starting servers..."

# Check if servers are already running
if lsof -ti:5000 > /dev/null 2>&1; then
    echo "⚠️  Backend is already running on port 5000"
else
    echo "Starting backend server on port 5000..."
    cd "$(dirname "$0")"
    node server/index.js > /tmp/backend-server.log 2>&1 &
    BACKEND_PID=$!
    echo "✅ Backend started (PID: $BACKEND_PID)"
fi

if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️  Frontend is already running on port 3000"
else
    echo "Starting frontend server on port 3000..."
    cd client
    npm start > /tmp/frontend-server.log 2>&1 &
    FRONTEND_PID=$!
    echo "✅ Frontend started (PID: $FRONTEND_PID)"
fi

# Wait a bit for servers to initialize
sleep 5

echo ""
echo "📊 Server Status:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f /tmp/backend-server.log"
echo "   Frontend: tail -f /tmp/frontend-server.log"
echo ""
echo "💡 Note: Servers run independently. Restarting one won't affect the other."


