# Mammogram Viewer - Deployment Guide

## Overview

This guide will help you deploy the Mammogram Viewer alongside your existing XRay CAD application on `xraycad.bosschn.in`.

**Access URLs:**
- XRay CAD (existing): `https://xraycad.bosschn.in/`
- Mammogram Viewer (new): `https://xraycad.bosschn.in/mammogram/`

## Prerequisites

- Server with existing XRay CAD running
- Node.js 18+ installed
- PostgreSQL database
- Nginx already configured
- Root/sudo access

## Step 1: Prepare the Application

### 1.1 Build Frontend

```bash
cd /path/to/mammogram-viewer/frontend
npm install
npm run build
```

This creates `frontend/dist/` with production files.

### 1.2 Configure Backend

Update `backend/.env`:

```env
# Server
PORT=3000
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mammogram_viewer
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# Storage
UPLOAD_DIR=/var/www/mammogram-viewer/uploads
THUMBNAIL_DIR=/var/www/mammogram-viewer/thumbnails
DICOM_DIR=/var/www/mammogram-viewer/dicom

# CORS (important for path-based deployment)
CORS_ORIGIN=https://xraycad.bosschn.in
```

### 1.3 Setup Database

```bash
cd /path/to/mammogram-viewer/backend

# Create database
sudo -u postgres psql -c "CREATE DATABASE mammogram_viewer;"
sudo -u postgres psql -c "CREATE USER mammogram_user WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mammogram_viewer TO mammogram_user;"

# Run migrations
npm run migrate

# Create super admin
npm run seed
```

## Step 2: Deploy Files

### 2.1 Create Directory Structure

```bash
sudo mkdir -p /var/www/mammogram-viewer
sudo mkdir -p /var/www/mammogram-viewer/uploads
sudo mkdir -p /var/www/mammogram-viewer/thumbnails
sudo mkdir -p /var/www/mammogram-viewer/dicom
```

### 2.2 Copy Frontend Build

```bash
sudo cp -r /path/to/mammogram-viewer/frontend/dist /var/www/mammogram-viewer/frontend/
```

### 2.3 Copy Backend

```bash
sudo cp -r /path/to/mammogram-viewer/backend /var/www/mammogram-viewer/
cd /var/www/mammogram-viewer/backend
sudo npm install --production
```

### 2.4 Set Permissions

```bash
sudo chown -R www-data:www-data /var/www/mammogram-viewer
sudo chmod -R 755 /var/www/mammogram-viewer
sudo chmod -R 775 /var/www/mammogram-viewer/uploads
sudo chmod -R 775 /var/www/mammogram-viewer/thumbnails
sudo chmod -R 775 /var/www/mammogram-viewer/dicom
```

## Step 3: Configure Nginx

### 3.1 Backup Existing Configuration

```bash
sudo cp /etc/nginx/sites-enabled/reverse-proxy.conf /etc/nginx/sites-enabled/reverse-proxy.conf.backup
```

### 3.2 Update Configuration

**Option A: Replace entire file**

```bash
sudo cp nginx/xraycad-with-mammogram.conf /etc/nginx/sites-enabled/reverse-proxy.conf
```

**Option B: Add to existing file**

Edit your existing configuration:

```bash
sudo nano /etc/nginx/sites-enabled/reverse-proxy.conf
```

Add these blocks inside the `server` block for port 443 (BEFORE the existing `location /` block):

```nginx
# Mammogram API
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

# Mammogram Frontend
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

### 3.3 Test Configuration

```bash
sudo nginx -t
```

If successful, you'll see:
```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 3.4 Reload Nginx

```bash
sudo systemctl reload nginx
```

## Step 4: Setup Backend Service

### 4.1 Create Systemd Service

```bash
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

# Logging
StandardOutput=append:/var/log/mammogram-viewer/output.log
StandardError=append:/var/log/mammogram-viewer/error.log

[Install]
WantedBy=multi-user.target
```

### 4.2 Create Log Directory

```bash
sudo mkdir -p /var/log/mammogram-viewer
sudo chown www-data:www-data /var/log/mammogram-viewer
```

### 4.3 Enable and Start Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable mammogram-viewer
sudo systemctl start mammogram-viewer
```

### 4.4 Check Service Status

```bash
sudo systemctl status mammogram-viewer
```

## Step 5: Update Frontend Configuration

The frontend needs to know it's running under `/mammogram` path.

### 5.1 Update Vite Config

Edit `frontend/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/mammogram/', // Add this line
  server: {
    port: 5173,
  },
});
```

### 5.2 Update API Base URL

Edit `frontend/src/services/api.ts`:

```typescript
const API_BASE_URL = '/mammogram/api'; // Update this line
```

### 5.3 Rebuild Frontend

```bash
cd frontend
npm run build
sudo cp -r dist/* /var/www/mammogram-viewer/frontend/dist/
```

## Step 6: Verify Deployment

### 6.1 Check Backend

```bash
curl http://localhost:3000/api/health
```

Should return: `{"status":"ok"}`

### 6.2 Check Frontend Files

```bash
ls -la /var/www/mammogram-viewer/frontend/dist/
```

Should see `index.html`, `assets/`, etc.

### 6.3 Test URLs

1. **Frontend**: https://xraycad.bosschn.in/mammogram/
2. **API Health**: https://xraycad.bosschn.in/mammogram/api/health
3. **Existing XRay**: https://xraycad.bosschn.in/ (should still work)

## Step 7: Create Super Admin

```bash
cd /var/www/mammogram-viewer/backend
sudo -u www-data npm run seed
```

Default credentials:
- Email: `admin@example.com`
- Password: `admin123`

**⚠️ Change these immediately after first login!**

## Troubleshooting

### Backend Not Starting

```bash
# Check logs
sudo journalctl -u mammogram-viewer -f

# Check if port 3000 is available
sudo netstat -tlnp | grep 3000

# Check backend logs
sudo tail -f /var/log/mammogram-viewer/error.log
```

### Frontend 404 Errors

```bash
# Check nginx error log
sudo tail -f /var/log/nginx/xray-error.log

# Verify files exist
ls -la /var/www/mammogram-viewer/frontend/dist/

# Check nginx configuration
sudo nginx -t
```

### API Calls Failing

```bash
# Check if backend is running
sudo systemctl status mammogram-viewer

# Test API directly
curl http://localhost:3000/api/health

# Check nginx proxy
sudo tail -f /var/log/nginx/xray-access.log
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test database connection
sudo -u postgres psql -d mammogram_viewer -c "SELECT 1;"

# Check backend environment
cat /var/www/mammogram-viewer/backend/.env
```

### Permission Issues

```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/mammogram-viewer

# Fix permissions
sudo chmod -R 755 /var/www/mammogram-viewer
sudo chmod -R 775 /var/www/mammogram-viewer/uploads
```

## Maintenance

### View Logs

```bash
# Backend logs
sudo journalctl -u mammogram-viewer -f

# Nginx logs
sudo tail -f /var/log/nginx/xray-access.log
sudo tail -f /var/log/nginx/xray-error.log
```

### Restart Services

```bash
# Restart backend
sudo systemctl restart mammogram-viewer

# Reload nginx
sudo systemctl reload nginx
```

### Update Application

```bash
# Pull latest code
cd /path/to/mammogram-viewer
git pull

# Rebuild frontend
cd frontend
npm install
npm run build
sudo cp -r dist/* /var/www/mammogram-viewer/frontend/dist/

# Update backend
cd ../backend
npm install
npm run build
sudo cp -r dist/* /var/www/mammogram-viewer/backend/dist/

# Restart service
sudo systemctl restart mammogram-viewer
```

## Security Checklist

- [ ] Change default admin password
- [ ] Update JWT_SECRET in .env
- [ ] Set strong database password
- [ ] Configure firewall (allow only 80, 443)
- [ ] Enable fail2ban for SSH
- [ ] Regular backups of database
- [ ] Regular backups of uploads
- [ ] Monitor disk space
- [ ] Review nginx logs regularly

## Backup Strategy

### Database Backup

```bash
# Create backup script
sudo nano /usr/local/bin/backup-mammogram-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mammogram"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump mammogram_viewer > $BACKUP_DIR/mammogram_$DATE.sql
find $BACKUP_DIR -name "mammogram_*.sql" -mtime +7 -delete
```

```bash
sudo chmod +x /usr/local/bin/backup-mammogram-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-mammogram-db.sh
```

### Files Backup

```bash
# Backup uploads
sudo tar -czf /var/backups/mammogram/uploads_$(date +%Y%m%d).tar.gz \
  /var/www/mammogram-viewer/uploads
```

## Support

If you encounter issues:

1. Check logs (backend, nginx)
2. Verify all services are running
3. Test each component individually
4. Review this guide step by step

## Summary

After deployment, you'll have:

- **XRay CAD**: https://xraycad.bosschn.in/ (unchanged)
- **Mammogram Viewer**: https://xraycad.bosschn.in/mammogram/
- Both applications running independently
- Shared SSL certificate
- Separate backend services
- Professional medical UI

**Your mammogram viewer is now live!** 🎉
