#!/bin/bash

# Wrapper script to start backend and ensure frontend is running
# Use this instead of directly running: node server/index.js
# This ensures frontend always starts with backend

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to ensure frontend is running
ensure_frontend() {
    if ! lsof -ti:3000 > /dev/null 2>&1; then
        echo "🔄 Starting frontend..."
        cd "$SCRIPT_DIR/client"
        npm start > /tmp/frontend-server.log 2>&1 &
        FRONTEND_PID=$!
        echo "✅ Frontend starting (PID: $FRONTEND_PID)"
        sleep 10
    else
        # Check if accessible
        if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo "⚠️  Frontend is running but not accessible. Restarting..."
            lsof -ti:3000 | xargs kill -9 2>/dev/null
            sleep 2
            cd "$SCRIPT_DIR/client"
            npm start > /tmp/frontend-server.log 2>&1 &
            FRONTEND_PID=$!
            echo "✅ Frontend restarting (PID: $FRONTEND_PID)"
            sleep 10
        else
            echo "✅ Frontend is already running and accessible"
        fi
    fi
}

# Ensure frontend is running before starting backend
ensure_frontend

# Start backend
echo "🚀 Starting backend server..."
cd "$SCRIPT_DIR"
node server/index.js > /tmp/backend-server.log 2>&1 &
BACKEND_PID=$!

echo "✅ Backend starting (PID: $BACKEND_PID)"
echo ""
echo "📊 Server Status:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f /tmp/backend-server.log"
echo "   Frontend: tail -f /tmp/frontend-server.log"


