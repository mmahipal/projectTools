#!/bin/bash

# Helper script to ensure frontend is always running
# This can be called from anywhere to ensure frontend is accessible

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if frontend is running and accessible
if lsof -ti:3000 > /dev/null 2>&1; then
    # Frontend process exists, check if accessible
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Frontend is running and accessible"
        exit 0
    else
        echo "⚠️  Frontend process exists but not accessible. Restarting..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null
        sleep 2
    fi
else
    echo "⚠️  Frontend is not running. Starting..."
fi

# Start frontend
cd "$SCRIPT_DIR/client"
npm start > /tmp/frontend-server.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend starting (PID: $FRONTEND_PID)"
echo "   Waiting for frontend to be accessible..."
sleep 10

# Verify it's accessible
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is now accessible at http://localhost:3000"
else
    echo "⚠️  Frontend started but may not be fully ready yet. Check logs: tail -f /tmp/frontend-server.log"
fi


