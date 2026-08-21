#!/bin/bash

# Quick script to check server status and restart if needed

echo "🔍 Checking server status..."

FRONTEND_RUNNING=$(lsof -ti:3000 2>/dev/null)
BACKEND_RUNNING=$(lsof -ti:5000 2>/dev/null)

if [ -z "$FRONTEND_RUNNING" ]; then
    echo "❌ Frontend is NOT running"
    echo "🔄 Starting frontend..."
    cd "$(dirname "$0")/client"
    npm start > /tmp/frontend-server.log 2>&1 &
    echo "✅ Frontend starting (check logs: tail -f /tmp/frontend-server.log)"
else
    echo "✅ Frontend is running (PID: $FRONTEND_RUNNING)"
fi

if [ -z "$BACKEND_RUNNING" ]; then
    echo "❌ Backend is NOT running"
    echo "🔄 Starting backend..."
    cd "$(dirname "$0")"
    node server/index.js > /tmp/backend-server.log 2>&1 &
    echo "✅ Backend starting (check logs: tail -f /tmp/backend-server.log)"
else
    echo "✅ Backend is running (PID: $BACKEND_RUNNING)"
fi

echo ""
echo "📊 Access URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"


