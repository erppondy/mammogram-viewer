#!/bin/bash

echo "Starting Mammogram Viewer Application..."

# Start PostgreSQL if not running
echo "Checking PostgreSQL..."
sudo systemctl start postgresql

# Start Backend
echo "Starting Backend..."
cd backend
npm run dev &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait for backend to be ready
sleep 3

# Start Frontend
echo "Starting Frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

echo ""
echo "✅ Application started successfully!"
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:3000"
echo ""
echo "To stop the application, run: ./stop-app.sh"
echo "Or press Ctrl+C and run: kill $BACKEND_PID $FRONTEND_PID"

# Save PIDs to file for easy stopping
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

# Wait for processes
wait
