#!/bin/bash

# Performance & Analytics Setup Script
# This script sets up the new performance and analytics features

set -e

echo "========================================="
echo "Performance & Analytics Setup"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Redis is installed
echo "Checking Redis installation..."
if command -v redis-cli &> /dev/null; then
    echo -e "${GREEN}✓ Redis is installed${NC}"
    
    # Check if Redis is running
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✓ Redis is running${NC}"
    else
        echo -e "${YELLOW}⚠ Redis is not running. Starting Redis...${NC}"
        if command -v redis-server &> /dev/null; then
            redis-server --daemonize yes
            sleep 2
            if redis-cli ping &> /dev/null; then
                echo -e "${GREEN}✓ Redis started successfully${NC}"
            else
                echo -e "${RED}✗ Failed to start Redis${NC}"
                exit 1
            fi
        fi
    fi
else
    echo -e "${RED}✗ Redis is not installed${NC}"
    echo ""
    echo "Please install Redis:"
    echo "  Ubuntu/Debian: sudo apt-get install redis-server"
    echo "  macOS: brew install redis"
    echo "  Or visit: https://redis.io/download"
    exit 1
fi

echo ""
echo "Installing backend dependencies..."
cd backend
npm install

echo ""
echo "Installing frontend dependencies..."
cd ../frontend
npm install

echo ""
echo "Running database migrations..."
cd ../backend
npm run db:migrate

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Setup completed successfully!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Start the backend server:"
echo "   cd backend && npm run dev"
echo ""
echo "2. Start the workers (in a new terminal):"
echo "   cd backend && npm run worker"
echo ""
echo "3. Start the frontend (in a new terminal):"
echo "   cd frontend && npm run dev"
echo ""
echo "4. Access the analytics dashboard:"
echo "   - Login as admin"
echo "   - Navigate to Admin Dashboard"
echo "   - Click '📊 Analytics' button"
echo ""
echo "For more information, see PERFORMANCE_ANALYTICS_GUIDE.md"
echo ""
