#!/bin/bash

# Production Deployment Script
# Run this on your production server after pushing to GitHub

set -e  # Exit on error

echo "🚀 Mammogram Viewer - Production Deployment"
echo "==========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}❌ Please don't run as root. Run as regular user with sudo access.${NC}"
    exit 1
fi

# Get repository URL
read -p "Enter your GitHub repository URL: " REPO_URL
if [ -z "$REPO_URL" ]; then
    echo -e "${RED}❌ Repository URL is required${NC}"
    exit 1
fi

# Deployment directory
DEPLOY_DIR="/var/www/mammogram-viewer"

echo ""
echo "📦 Step 1: Cloning Repository"
echo "------------------------------"

if [ -d "$DEPLOY_DIR" ]; then
    echo -e "${YELLOW}⚠️  Directory already exists${NC}"
    read -p "Do you want to pull latest changes? (y/N): " PULL_CHANGES
    if [ "$PULL_CHANGES" = "y" ] || [ "$PULL_CHANGES" = "Y" ]; then
        cd "$DEPLOY_DIR"
        git pull origin main
        echo -e "${GREEN}✅ Pulled latest changes${NC}"
    fi
else
    sudo git clone "$REPO_URL" "$DEPLOY_DIR"
    sudo chown -R $USER:$USER "$DEPLOY_DIR"
    echo -e "${GREEN}✅ Repository cloned${NC}"
fi

cd "$DEPLOY_DIR"

echo ""
echo "⚙️  Step 2: Configure Environment"
echo "--------------------------------"

# Backend .env
if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env..."
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}⚠️  Please edit backend/.env with production values${NC}"
    read -p "Press Enter to edit .env file..."
    nano backend/.env
else
    echo -e "${GREEN}✅ backend/.env already exists${NC}"
fi

echo ""
echo "📦 Step 3: Install Dependencies"
echo "-------------------------------"

# Backend
echo "Installing backend dependencies..."
cd backend
npm install --production
echo -e "${GREEN}✅ Backend dependencies installed${NC}"

# Frontend
echo "Installing frontend dependencies..."
cd ../frontend
npm install
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"

echo ""
echo "🗄️  Step 4: Setup Database"
echo "-------------------------"

read -p "Do you want to setup database? (y/N): " SETUP_DB
if [ "$SETUP_DB" = "y" ] || [ "$SETUP_DB" = "Y" ]; then
    read -p "Enter database name [mammogram_viewer]: " DB_NAME
    DB_NAME=${DB_NAME:-mammogram_viewer}
    
    read -p "Enter database user [mammogram_user]: " DB_USER
    DB_USER=${DB_USER:-mammogram_user}
    
    read -sp "Enter database password: " DB_PASS
    echo ""
    
    sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF
    
    echo -e "${GREEN}✅ Database created${NC}"
    
    # Run migrations
    cd "$DEPLOY_DIR/backend"
    npm run migrate
    echo -e "${GREEN}✅ Migrations completed${NC}"
    
    # Create super admin
    npm run seed
    echo -e "${GREEN}✅ Super admin created${NC}"
fi

echo ""
echo "🔨 Step 5: Build Application"
echo "---------------------------"

# Build backend
cd "$DEPLOY_DIR/backend"
npm run build
echo -e "${GREEN}✅ Backend built${NC}"

# Build frontend
cd "$DEPLOY_DIR/frontend"
npm run build
echo -e "${GREEN}✅ Frontend built${NC}"

echo ""
echo "📁 Step 6: Create Directories"
echo "----------------------------"

cd "$DEPLOY_DIR"
sudo mkdir -p uploads thumbnails dicom
sudo chown -R www-data:www-data "$DEPLOY_DIR"
sudo chmod -R 755 "$DEPLOY_DIR"
sudo chmod -R 775 uploads thumbnails dicom
echo -e "${GREEN}✅ Directories created${NC}"

echo ""
echo "🌐 Step 7: Configure Nginx"
echo "-------------------------"

read -p "Do you want to configure Nginx? (y/N): " CONFIG_NGINX
if [ "$CONFIG_NGINX" = "y" ] || [ "$CONFIG_NGINX" = "Y" ]; then
    echo "Backing up nginx config..."
    sudo cp /etc/nginx/sites-enabled/reverse-proxy.conf \
            /etc/nginx/sites-enabled/reverse-proxy.conf.backup.$(date +%Y%m%d)
    
    echo -e "${YELLOW}⚠️  Please add the mammogram location blocks to your nginx config${NC}"
    echo "See: nginx/xraycad-with-mammogram.conf"
    read -p "Press Enter when ready to test nginx config..."
    
    sudo nginx -t
    if [ $? -eq 0 ]; then
        sudo systemctl reload nginx
        echo -e "${GREEN}✅ Nginx configured${NC}"
    else
        echo -e "${RED}❌ Nginx config test failed${NC}"
        exit 1
    fi
fi

echo ""
echo "🔧 Step 8: Setup Systemd Service"
echo "--------------------------------"

if [ ! -f "/etc/systemd/system/mammogram-viewer.service" ]; then
    echo "Creating systemd service..."
    
    sudo tee /etc/systemd/system/mammogram-viewer.service > /dev/null << 'EOF'
[Unit]
Description=Mammogram Viewer Backend
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/mammogram-viewer/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

StandardOutput=append:/var/log/mammogram-viewer/output.log
StandardError=append:/var/log/mammogram-viewer/error.log

[Install]
WantedBy=multi-user.target
EOF
    
    sudo mkdir -p /var/log/mammogram-viewer
    sudo chown www-data:www-data /var/log/mammogram-viewer
    
    sudo systemctl daemon-reload
    sudo systemctl enable mammogram-viewer
    echo -e "${GREEN}✅ Systemd service created${NC}"
fi

echo ""
echo "🚀 Step 9: Start Service"
echo "-----------------------"

sudo systemctl start mammogram-viewer
sleep 2

if sudo systemctl is-active --quiet mammogram-viewer; then
    echo -e "${GREEN}✅ Service started successfully${NC}"
else
    echo -e "${RED}❌ Service failed to start${NC}"
    echo "Check logs: sudo journalctl -u mammogram-viewer -n 50"
    exit 1
fi

echo ""
echo "✅ Step 10: Verify Deployment"
echo "----------------------------"

# Check backend
echo "Checking backend..."
if curl -s http://localhost:3000/api/health | grep -q "ok"; then
    echo -e "${GREEN}✅ Backend is responding${NC}"
else
    echo -e "${RED}❌ Backend is not responding${NC}"
fi

# Check frontend files
if [ -f "$DEPLOY_DIR/frontend/dist/index.html" ]; then
    echo -e "${GREEN}✅ Frontend files exist${NC}"
else
    echo -e "${RED}❌ Frontend files missing${NC}"
fi

echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "📍 Application URL: https://xraycad.bosschn.in/mammogram/"
echo "🔐 Default Admin: admin@example.com / admin123"
echo ""
echo "⚠️  IMPORTANT: Change the admin password immediately!"
echo ""
echo "📊 Monitoring:"
echo "  - Backend logs: sudo journalctl -u mammogram-viewer -f"
echo "  - Nginx logs: sudo tail -f /var/log/nginx/xray-access.log"
echo "  - Service status: sudo systemctl status mammogram-viewer"
echo ""
echo "🔄 To update later:"
echo "  cd $DEPLOY_DIR && git pull && npm run build"
echo "  sudo systemctl restart mammogram-viewer"
echo ""
echo "✅ Done!"
