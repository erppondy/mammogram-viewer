# Production Server Deployment from GitHub

## Overview

This guide shows how to pull your mammogram viewer from GitHub and deploy it on your production server (xraycad.bosschn.in).

## Prerequisites

- SSH access to production server
- GitHub repository created and pushed
- Node.js 18+ installed on server
- PostgreSQL installed on server
- Nginx already running

## Step 1: Setup SSH Access to GitHub (On Production Server)

### Option A: Using SSH Key (Recommended)

```bash
# SSH into your production server
ssh user@xraycad.bosschn.in

# Generate SSH key on server
ssh-keygen -t ed25519 -C "server@xraycad.bosschn.in"

# Display public key
cat ~/.ssh/id_ed25519.pub

# Copy the output and add to GitHub:
# 1. Go to https://github.com/settings/keys
# 2. Click "New SSH key"
# 3. Paste the key
# 4. Save
```

### Option B: Using Personal Access Token

```bash
# Create token at: https://github.com/settings/tokens
# Select scopes: repo (all)
# Save the token securely
```

## Step 2: Clone Repository on Production Server

```bash
# SSH into production server
ssh user@xraycad.bosschn.in

# Navigate to deployment directory
cd /var/www

# Clone repository (SSH method)
sudo git clone git@github.com:YOUR_USERNAME/mammogram-viewer.git

# OR clone with HTTPS (using token)
sudo git clone https://YOUR_TOKEN@github.com/YOUR_USERNAME/mammogram-viewer.git

# Set ownership
sudo chown -R $USER:$USER mammogram-viewer
cd mammogram-viewer
```

## Step 3: Configure Environment

### 3.1 Create Backend .env

```bash
cd /var/www/mammogram-viewer/backend

# Copy example
cp .env.example .env

# Edit with production values
nano .env
```

**Production .env values:**
```env
# Server
PORT=3000
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mammogram_viewer
DB_USER=mammogram_user
DB_PASSWORD=YOUR_SECURE_PASSWORD

# JWT (generate random string)
JWT_SECRET=YOUR_RANDOM_SECRET_KEY_HERE

# Storage
UPLOAD_DIR=/var/www/mammogram-viewer/uploads
THUMBNAIL_DIR=/var/www/mammogram-viewer/thumbnails
DICOM_DIR=/var/www/mammogram-viewer/dicom

# CORS
CORS_ORIGIN=https://xraycad.bosschn.in
```

### 3.2 Update Frontend Configuration

```bash
cd /var/www/mammogram-viewer/frontend

# Edit vite.config.ts
nano vite.config.ts
```

Add base path:
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/mammogram/',  // Add this line
});
```

```bash
# Edit API configuration
nano src/services/api.ts
```

Update API URL:
```typescript
const API_BASE_URL = '/mammogram/api';  // Change this
```

## Step 4: Install Dependencies

```bash
# Backend dependencies
cd /var/www/mammogram-viewer/backend
npm install --production

# Frontend dependencies
cd /var/www/mammogram-viewer/frontend
npm install
```

## Step 5: Setup Database

```bash
cd /var/www/mammogram-viewer/backend

# Create database
sudo -u postgres psql << EOF
CREATE DATABASE mammogram_viewer;
CREATE USER mammogram_user WITH PASSWORD 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE mammogram_viewer TO mammogram_user;
\q
EOF

# Run migrations
npm run migrate

# Create super admin
npm run seed
```

## Step 6: Build Application

```bash
# Build backend
cd /var/www/mammogram-viewer/backend
npm run build

# Build frontend
cd /var/www/mammogram-viewer/frontend
npm run build
```

## Step 7: Create Required Directories

```bash
cd /var/www/mammogram-viewer

# Create storage directories
sudo mkdir -p uploads thumbnails dicom

# Set permissions
sudo chown -R www-data:www-data /var/www/mammogram-viewer
sudo chmod -R 755 /var/www/mammogram-viewer
sudo chmod -R 775 uploads thumbnails dicom
```

## Step 8: Configure Nginx

```bash
# Backup existing config
sudo cp /etc/nginx/sites-enabled/reverse-proxy.conf \
       /etc/nginx/sites-enabled/reverse-proxy.conf.backup

# Edit nginx config
sudo nano /etc/nginx/sites-enabled/reverse-proxy.conf
```

Add these blocks inside the `server` block for port 443 (BEFORE the existing `location /` block):

```nginx
# Mammogram Viewer - Backend API
location /mammogram/api/ {
    rewrite ^/mammogram/api/(.*) /api/$1 break;
    
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    proxy_connect_timeout 3600;
    proxy_read_timeout 3600;
    proxy_send_timeout 3600;
    
    proxy_buffering off;
    proxy_request_buffering off;
    
    client_max_body_size 2000M;
}

# Mammogram Viewer - Frontend
location /mammogram/ {
    alias /var/www/mammogram-viewer/frontend/dist/;
    try_files $uri $uri/ /mammogram/index.html;
    index index.html;
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

location = /mammogram {
    return 301 /mammogram/;
}
```

Test and reload nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Step 9: Setup Systemd Service

```bash
# Create service file
sudo nano /etc/systemd/system/mammogram-viewer.service
```

Add this content:
```ini
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
```

```bash
# Create log directory
sudo mkdir -p /var/log/mammogram-viewer
sudo chown www-data:www-data /var/log/mammogram-viewer

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable mammogram-viewer
sudo systemctl start mammogram-viewer

# Check status
sudo systemctl status mammogram-viewer
```

## Step 10: Verify Deployment

### Check Backend
```bash
# Check if backend is running
curl http://localhost:3000/api/health
# Should return: {"status":"ok"}

# Check logs
sudo journalctl -u mammogram-viewer -n 50
```

### Check Frontend
```bash
# Check if files exist
ls -la /var/www/mammogram-viewer/frontend/dist/

# Test URL
curl https://xraycad.bosschn.in/mammogram/
```

### Access Application
1. Open browser: `https://xraycad.bosschn.in/mammogram/`
2. Should see login page with medical UI
3. Login with: `admin@example.com` / `admin123`
4. Change password immediately!

## Step 11: Setup Automatic Updates (Optional)

### Create Update Script

```bash
sudo nano /usr/local/bin/update-mammogram.sh
```

```bash
#!/bin/bash

echo "🔄 Updating Mammogram Viewer..."

cd /var/www/mammogram-viewer

# Pull latest changes
git pull origin main

# Update backend
cd backend
npm install --production
npm run build

# Update frontend
cd ../frontend
npm install
npm run build

# Restart service
sudo systemctl restart mammogram-viewer

echo "✅ Update complete!"
```

```bash
sudo chmod +x /usr/local/bin/update-mammogram.sh
```

### Use the update script:
```bash
sudo /usr/local/bin/update-mammogram.sh
```

## Troubleshooting

### Backend Not Starting

```bash
# Check logs
sudo journalctl -u mammogram-viewer -f

# Check if port 3000 is available
sudo netstat -tlnp | grep 3000

# Check environment variables
cat /var/www/mammogram-viewer/backend/.env

# Test manually
cd /var/www/mammogram-viewer/backend
node dist/index.js
```

### Frontend 404 Errors

```bash
# Check nginx logs
sudo tail -f /var/log/nginx/xray-error.log

# Verify files exist
ls -la /var/www/mammogram-viewer/frontend/dist/

# Check nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Database Connection Failed

```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Test connection
sudo -u postgres psql -d mammogram_viewer -c "SELECT 1;"

# Check credentials in .env
cat /var/www/mammogram-viewer/backend/.env
```

### Permission Errors

```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/mammogram-viewer

# Fix permissions
sudo chmod -R 755 /var/www/mammogram-viewer
sudo chmod -R 775 /var/www/mammogram-viewer/{uploads,thumbnails,dicom}
```

### Git Pull Fails

```bash
# Check SSH key
ssh -T git@github.com

# Or use HTTPS with token
git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/mammogram-viewer.git

# Pull again
git pull origin main
```

## Updating from GitHub

### Pull Latest Changes

```bash
# SSH into server
ssh user@xraycad.bosschn.in

# Navigate to project
cd /var/www/mammogram-viewer

# Pull changes
git pull origin main

# Rebuild and restart
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
sudo systemctl restart mammogram-viewer
```

### Or use the update script:
```bash
sudo /usr/local/bin/update-mammogram.sh
```

## Monitoring

### View Logs

```bash
# Backend logs
sudo journalctl -u mammogram-viewer -f

# Nginx access logs
sudo tail -f /var/log/nginx/xray-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/xray-error.log

# Application logs
sudo tail -f /var/log/mammogram-viewer/output.log
sudo tail -f /var/log/mammogram-viewer/error.log
```

### Check Service Status

```bash
# Backend service
sudo systemctl status mammogram-viewer

# Nginx
sudo systemctl status nginx

# PostgreSQL
sudo systemctl status postgresql

# Disk space
df -h /var/www/mammogram-viewer
```

## Backup Before Updates

```bash
# Backup database
sudo -u postgres pg_dump mammogram_viewer > \
  /var/backups/mammogram_$(date +%Y%m%d).sql

# Backup uploads
sudo tar -czf /var/backups/uploads_$(date +%Y%m%d).tar.gz \
  /var/www/mammogram-viewer/uploads

# Backup config
sudo cp /var/www/mammogram-viewer/backend/.env \
  /var/backups/.env.backup
```

## Security Checklist

- [ ] Changed default admin password
- [ ] Updated JWT_SECRET in .env
- [ ] Set strong database password
- [ ] Configured firewall (ufw)
- [ ] Setup fail2ban
- [ ] Regular backups configured
- [ ] Monitoring setup
- [ ] SSL certificate valid

## Quick Reference

### Common Commands

```bash
# Restart backend
sudo systemctl restart mammogram-viewer

# Reload nginx
sudo systemctl reload nginx

# View logs
sudo journalctl -u mammogram-viewer -f

# Update from GitHub
cd /var/www/mammogram-viewer && git pull

# Check status
sudo systemctl status mammogram-viewer
```

### URLs

- **Application**: https://xraycad.bosschn.in/mammogram/
- **API Health**: https://xraycad.bosschn.in/mammogram/api/health
- **XRay CAD**: https://xraycad.bosschn.in/ (unchanged)

## Summary

After deployment:
- ✅ Application running at `/mammogram/`
- ✅ Backend service managed by systemd
- ✅ Nginx configured for both apps
- ✅ Database setup and migrated
- ✅ Automatic restart on failure
- ✅ Logs available for monitoring

**Your mammogram viewer is now live in production!** 🎉
