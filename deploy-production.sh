#!/bin/bash

echo "==================================="
echo "Deploying Mammogram Viewer to Production"
echo "==================================="

# Build frontend with production API URL
echo "Building frontend..."
cd frontend
npm run build

if [ $? -ne 0 ]; then
    echo "Frontend build failed!"
    exit 1
fi

echo "Frontend build complete!"
echo ""
echo "Deployment files are in: frontend/dist/"
echo ""
echo "Next steps:"
echo "1. Copy frontend/dist/ to your web server"
echo "2. Make sure backend is running on 10.184.3.15:3000"
echo "3. Verify reverse proxy is configured correctly"
echo "4. Access via: https://xraycad.bosschn.in/mammogram/"
echo ""
echo "==================================="
