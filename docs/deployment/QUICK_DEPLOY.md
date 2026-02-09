# Quick Deployment Checklist

Deploy Mammogram Viewer to `https://xraycad.bosschn.in/mammogram/`

## Pre-Deployment

```bash
# 1. Update frontend config for path-based deployment
cd frontend
```

Edit `vite.config.ts` - add `base: '/mammogram/'`
Edit `src/services/api.ts` - change to `/mammogram/api`

```bash
# 2. Build frontend
npm install
npm run build

# 3. Setup backend .env
cd ../backend
cp .env.example .env
nano .env  # Update database credentials, JWT secret
```

## Server Deployment

```bash
# 1. Create directories
sudo mkdir -p /var/www/mammogram-viewer/{frontend/dist,uploads,thumbnails,dicom}

# 2. Copy files
sudo cp -r frontend/dist/* /var/www/mammogram-viewer/frontend/dist/
sudo cp -r backend /var/www/mammogram-viewer/

# 3. Install backend dependencies
cd /var/www/mammogram-viewer/backend
sudo npm install --production

# 4. Setup database
sudo -u postgres psql -c "CREATE DATABASE mammogram_viewer;"
sudo -u postgres psql -c "CREATE USER mammogram_user WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mammogram_viewer TO mammogram_user;"
npm run migrate
npm run seed

# 5. Set permissions
sudo chown -R www-data:www-data /var/www/mammogram-viewer
sudo chmod -R 755 /var/www/mammogram-viewer
sudo chmod -R 775 /var/www/mammogram-viewer/{uploads,thumbnails,dicom}

# 6. Update nginx
sudo nano /etc/nginx/sites-enabled/reverse-proxy.conf
# Add the mammogram location blocks (see DEPLOYMENT_GUIDE.md)

# 7. Test nginx
sudo nginx -t

# 8. Reload nginx
sudo systemctl reload nginx

# 9. Create systemd service
sudo nano /etc/systemd/system/mammogram-viewer.service
# Copy content from DEPLOYMENT_GUIDE.md

# 10. Start service
sudo mkdir -p /var/log/mammogram-viewer
sudo chown www-data:www-data /var/log/mammogram-viewer
sudo systemctl daemon-reload
sudo systemctl enable mammogram-viewer
sudo systemctl start mammogram-viewer

# 11. Check status
sudo systemctl status mammogram-viewer
```

## Verify

```bash
# Backend health
curl http://localhost:3000/api/health

# Frontend
curl https://xraycad.bosschn.in/mammogram/

# Logs
sudo journalctl -u mammogram-viewer -f
sudo tail -f /var/log/nginx/xray-access.log
```

## Access

- **Mammogram Viewer**: https://xraycad.bosschn.in/mammogram/
- **Default Admin**: admin@example.com / admin123
- **XRay CAD** (unchanged): https://xraycad.bosschn.in/

## Troubleshooting

```bash
# Backend not starting
sudo journalctl -u mammogram-viewer -n 50

# Frontend 404
sudo tail -f /var/log/nginx/xray-error.log

# API not working
curl http://localhost:3000/api/health
sudo systemctl status mammogram-viewer

# Permission issues
sudo chown -R www-data:www-data /var/www/mammogram-viewer
```

## Done! 🎉

Your mammogram viewer is now live at:
**https://xraycad.bosschn.in/mammogram/**
