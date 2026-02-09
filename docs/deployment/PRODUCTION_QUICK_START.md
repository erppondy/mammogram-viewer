# Production Deployment - Quick Start

## 🚀 Deploy in 3 Steps

### Step 1: Push to GitHub (Local Machine)

```bash
# Option A: Automated
./push-to-github.sh

# Option B: Manual
git init
git remote add origin git@github.com:YOUR_USERNAME/mammogram-viewer.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

### Step 2: Pull on Production Server

```bash
# SSH into server
ssh user@xraycad.bosschn.in

# Run deployment script
wget https://raw.githubusercontent.com/YOUR_USERNAME/mammogram-viewer/main/deploy-from-github.sh
chmod +x deploy-from-github.sh
./deploy-from-github.sh
```

### Step 3: Access Application

Open: `https://xraycad.bosschn.in/mammogram/`

Login: `admin@example.com` / `admin123`

**⚠️ Change password immediately!**

---

## 📋 Manual Deployment (If Script Fails)

### On Production Server

```bash
# 1. Clone repository
cd /var/www
sudo git clone git@github.com:YOUR_USERNAME/mammogram-viewer.git
sudo chown -R $USER:$USER mammogram-viewer
cd mammogram-viewer

# 2. Configure
cp backend/.env.example backend/.env
nano backend/.env  # Edit with production values

# 3. Install dependencies
cd backend && npm install --production
cd ../frontend && npm install

# 4. Setup database
sudo -u postgres psql << EOF
CREATE DATABASE mammogram_viewer;
CREATE USER mammogram_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE mammogram_viewer TO mammogram_user;
EOF

cd backend
npm run migrate
npm run seed

# 5. Build
cd backend && npm run build
cd ../frontend && npm run build

# 6. Create directories
cd /var/www/mammogram-viewer
sudo mkdir -p uploads thumbnails dicom
sudo chown -R www-data:www-data .
sudo chmod -R 775 uploads thumbnails dicom

# 7. Configure Nginx
sudo nano /etc/nginx/sites-enabled/reverse-proxy.conf
# Add mammogram location blocks (see PRODUCTION_DEPLOYMENT.md)
sudo nginx -t
sudo systemctl reload nginx

# 8. Create systemd service
sudo nano /etc/systemd/system/mammogram-viewer.service
# Copy content from PRODUCTION_DEPLOYMENT.md

sudo mkdir -p /var/log/mammogram-viewer
sudo chown www-data:www-data /var/log/mammogram-viewer
sudo systemctl daemon-reload
sudo systemctl enable mammogram-viewer
sudo systemctl start mammogram-viewer

# 9. Verify
curl http://localhost:3000/api/health
sudo systemctl status mammogram-viewer
```

---

## 🔄 Update from GitHub

```bash
# SSH into server
ssh user@xraycad.bosschn.in

# Pull and rebuild
cd /var/www/mammogram-viewer
git pull origin main
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
sudo systemctl restart mammogram-viewer
```

---

## 🔍 Troubleshooting

### Backend not starting
```bash
sudo journalctl -u mammogram-viewer -n 50
```

### Frontend 404
```bash
sudo tail -f /var/log/nginx/xray-error.log
ls -la /var/www/mammogram-viewer/frontend/dist/
```

### Database connection failed
```bash
sudo systemctl status postgresql
cat /var/www/mammogram-viewer/backend/.env
```

---

## 📊 Monitoring

```bash
# Backend logs
sudo journalctl -u mammogram-viewer -f

# Nginx logs
sudo tail -f /var/log/nginx/xray-access.log

# Service status
sudo systemctl status mammogram-viewer

# Disk space
df -h /var/www/mammogram-viewer
```

---

## 🔐 Security

- [ ] Change admin password
- [ ] Update JWT_SECRET in .env
- [ ] Set strong DB password
- [ ] Configure firewall
- [ ] Setup backups

---

## 📚 Full Documentation

- **PRODUCTION_DEPLOYMENT.md** - Complete deployment guide
- **DEPLOYMENT_GUIDE.md** - Detailed instructions
- **QUICK_DEPLOY.md** - Quick checklist

---

## ✅ Success Checklist

- [ ] Repository pushed to GitHub
- [ ] Cloned on production server
- [ ] Dependencies installed
- [ ] Database setup and migrated
- [ ] Application built
- [ ] Nginx configured
- [ ] Systemd service running
- [ ] Application accessible
- [ ] Admin password changed

---

**Your mammogram viewer is now live!** 🎉

**URL**: https://xraycad.bosschn.in/mammogram/
