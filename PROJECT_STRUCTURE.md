# Project Structure

## 📁 Directory Layout

```
mammogram-viewer/
├── backend/                    # Node.js/Express backend
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── database/          # Migrations and seeds
│   │   ├── middleware/        # Express middleware
│   │   ├── models/            # Data models
│   │   ├── repositories/      # Database access layer
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Utility functions
│   │   └── workers/           # Background workers
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── MedicalUI/    # Medical UI component library
│   │   │   └── admin/        # Admin components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── App.tsx           # Main app component
│   │   └── index.css         # Medical UI theme
│   ├── package.json
│   └── vite.config.ts
│
├── nginx/                      # Nginx configurations
│   ├── mammogram-viewer.conf
│   └── xraycad-with-mammogram.conf
│
├── .kiro/                      # Kiro IDE specs
│   ├── specs/
│   └── steering/
│
└── Documentation files (see below)
```

## 📄 Essential Documentation

### Deployment
- **DEPLOYMENT_GUIDE.md** - Complete step-by-step deployment guide
- **QUICK_DEPLOY.md** - Quick deployment checklist
- **docker-compose.yml** - Docker setup (optional)

### User Guides
- **README.md** - Main project documentation
- **ADMIN_USER_GUIDE.md** - Admin features and workflows
- **PERFORMANCE_ANALYTICS_GUIDE.md** - Analytics dashboard guide

### Technical Reference
- **ADMIN_API_DOCUMENTATION.md** - Complete API reference
- **ARCHITECTURE_DIAGRAM.md** - System architecture
- **MEDICAL_UI_THEME_GUIDE.md** - UI theme customization
- **PROFESSIONAL_UI_READY.md** - UI features overview

### Backend Specific
- **backend/AUTH.md** - Authentication system
- **backend/DATABASE.md** - Database schema
- **backend/STORAGE.md** - File storage system

## 🗂️ Key Files

### Configuration
- `backend/.env` - Backend environment variables
- `backend/src/config/database.ts` - Database configuration
- `frontend/vite.config.ts` - Frontend build configuration
- `nginx/*.conf` - Web server configuration

### Database
- `backend/src/database/migrations/` - Database migrations
- `backend/src/database/seeds/` - Initial data seeds

### Entry Points
- `backend/src/index.ts` - Backend server entry
- `frontend/src/main.tsx` - Frontend app entry

## 🎨 Frontend Structure

### Components
```
frontend/src/components/
├── MedicalUI/              # Reusable medical UI components
│   ├── MedicalButton.tsx
│   ├── MedicalCard.tsx
│   ├── MedicalInput.tsx
│   ├── MedicalHeader.tsx
│   ├── StatusBadge.tsx
│   ├── DataDisplay.tsx
│   └── LoadingSpinner.tsx
├── admin/                  # Admin-specific components
│   ├── AdminStats.tsx
│   └── UserManagementTable.tsx
├── DicomViewer.tsx
├── ImageGallery.tsx
├── ImageViewer.tsx
├── UploadSection.tsx
└── FilterPanel.tsx
```

### Pages
```
frontend/src/pages/
├── LoginPage.tsx
├── RegisterPage.tsx
├── DashboardPage.tsx
├── AdminDashboardPage.tsx
└── AnalyticsDashboardPage.tsx
```

### Services
```
frontend/src/services/
├── api.ts              # Base API client
├── authService.ts      # Authentication
├── adminService.ts     # Admin operations
└── analyticsService.ts # Analytics data
```

## 🔧 Backend Structure

### Routes
```
backend/src/routes/
├── auth.routes.ts      # Authentication endpoints
├── admin.routes.ts     # Admin operations
├── upload.routes.ts    # File upload
├── images.routes.ts    # Image management
└── analytics.routes.ts # Analytics data
```

### Services
```
backend/src/services/
├── AuthService.ts              # Authentication logic
├── AdminService.ts             # Admin operations
├── AnalyticsService.ts         # Analytics
├── StorageService.ts           # File storage
├── ImageProcessingService.ts   # Image processing
├── DicomParserService.ts       # DICOM parsing
├── AanParserService.ts         # AAN parsing
└── QueueService.ts             # Background jobs
```

### Models
```
backend/src/models/
├── User.ts             # User model
└── Image.ts            # Image model
```

## 🗄️ Database Schema

### Tables
- `users` - User accounts
- `images` - Uploaded images
- `metadata` - Image metadata
- `upload_sessions` - Upload tracking
- `user_activity` - Activity logs
- `system_metrics` - System statistics

See `backend/DATABASE.md` for complete schema.

## 🎨 UI Theme

The application uses a custom medical UI theme with:
- Dark background (#0a0e1a)
- Cyan accents (#00d4ff)
- Professional medical styling
- GPU-accelerated animations
- Accessibility compliant

See `MEDICAL_UI_THEME_GUIDE.md` for customization.

## 🔐 Authentication Flow

1. User registers → Pending approval
2. Admin approves → User can login
3. JWT token issued → Stored in localStorage
4. Token validated on each request
5. Role-based access control

See `backend/AUTH.md` for details.

## 📤 Upload Flow

1. User selects files
2. Frontend validates format
3. Chunked upload to backend
4. Background processing:
   - Generate thumbnails
   - Parse DICOM/AAN
   - Extract metadata
5. Image available in gallery

## 🚀 Deployment

### Development
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Production
See `DEPLOYMENT_GUIDE.md` for complete instructions.

## 📊 Monitoring

### Logs
- Backend: `/var/log/mammogram-viewer/`
- Nginx: `/var/log/nginx/`
- Systemd: `journalctl -u mammogram-viewer`

### Health Checks
- Backend: `http://localhost:3000/api/health`
- Database: Check PostgreSQL status
- Storage: Monitor disk space

## 🔧 Maintenance

### Database Backups
```bash
pg_dump mammogram_viewer > backup.sql
```

### File Backups
```bash
tar -czf uploads.tar.gz /var/www/mammogram-viewer/uploads
```

### Updates
```bash
git pull
npm install
npm run build
systemctl restart mammogram-viewer
```

## 📚 Additional Resources

- **Nginx Config**: `nginx/` directory
- **Docker Setup**: `docker-compose.yml`
- **Specs**: `.kiro/specs/` directory
- **Tests**: `backend/src/**/__tests__/`

## 🆘 Support

For issues:
1. Check logs
2. Review documentation
3. Verify configuration
4. Check troubleshooting sections

---

**For deployment, start with `DEPLOYMENT_GUIDE.md`**
