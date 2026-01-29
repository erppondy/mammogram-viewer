#!/bin/bash

echo "==================================="
echo "Backend Logs - Press Ctrl+C to exit"
echo "==================================="
echo ""

# Check if backend is running
if ! pgrep -f "tsx.*backend/src/index.ts" > /dev/null; then
    echo "Backend is not running!"
    echo "Start it with: cd backend && npm run dev"
    exit 1
fi

# Follow the backend process logs
echo "Showing backend logs..."
echo ""

# Get the PID of the backend process
BACKEND_PID=$(pgrep -f "tsx.*backend/src/index.ts")

echo "Backend PID: $BACKEND_PID"
echo ""
echo "Logs:"
echo "-----------------------------------"

# This will show the output from the running process
# Note: This is a simplified version. For production, use proper logging to files
tail -f /proc/$BACKEND_PID/fd/1 2>/dev/null || echo "Cannot access process logs directly. Check terminal where backend is running."
