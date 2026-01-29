#!/bin/bash

echo "🔄 Restarting backend to pick up code changes..."
echo ""

# Stop the backend
echo "Stopping backend..."
./stop-app.sh

# Wait a moment
sleep 2

# Start the backend
echo "Starting backend..."
./start-app.sh

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Test the API
echo ""
echo "🧪 Testing API with your token..."
echo ""

TOKEN="$1"

if [ -z "$TOKEN" ]; then
  echo "❌ Please provide your token as an argument"
  echo "Usage: ./restart-and-test.sh 'YOUR_TOKEN_HERE'"
  exit 1
fi

node test-api-direct.js "$TOKEN"
