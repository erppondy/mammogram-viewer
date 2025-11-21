# Mammogram Viewer Application

A professional medical imaging application for viewing and managing mammogram images with DICOM support, featuring a high-tech medical UI and comprehensive admin controls.

## 🚀 Quick Start

- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[Quick Deploy](QUICK_DEPLOY.md)** - Fast deployment checklist  
- **[Admin Guide](ADMIN_USER_GUIDE.md)** - Admin features and user management
- **[UI Theme Guide](MEDICAL_UI_THEME_GUIDE.md)** - Medical UI customization
- **[API Documentation](ADMIN_API_DOCUMENTATION.md)** - Backend API reference

## ✨ Features

- 🔐 **User Authentication**: Secure JWT-based authentication with admin approval workflow
- 👥 **Admin Dashboard**: Comprehensive user management and approval system
- 📤 **File Upload**: Drag-and-drop upload with support for multiple formats
- 🖼️ **Image Gallery**: Advanced filtering, search, and batch operations with cursor-based pagination
- 🏥 **DICOM Support**: View DICOM medical images with proper rendering
- 📊 **Metadata Management**: Extract and display medical image metadata
- 🎨 **Image Viewer**: Interactive viewer with zoom, brightness, contrast controls
- 💾 **Background Processing**: Async job queue for DICOM conversion and thumbnail generation
- 📈 **Analytics Dashboard**: Comprehensive usage analytics, trends, and system statistics
- ⚡ **Performance Optimized**: Database indexes and cursor pagination for fast queries

## Supported Formats

- **DICOM** (.dcm, .dicom) - Medical imaging format
- **AAN** (.aan) - Custom mammogram format
- **JPEG** (.jpg, .jpeg)
- **PNG** (.png)
- **TIFF** (.tif, .tiff)
- **ZIP** - Batch upload support

## Tech Stack

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL (with optimized indexes)
- In-memory job queue (no Redis required!)
- JWT Authentication
- dicom-parser + pngjs for DICOM processing
- Sharp for image processing

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- Axios for API calls

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

**Note**: Redis is NOT required! The application uses an efficient in-memory job queue.

### 1. Database Setup

```bash
# Create database
createdb mammogram_viewer

# Or using psql
psql -U postgres
CREATE DATABASE mammogram_viewer;
\q
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials and super admin settings

# Run migrations (includes performance optimizations)
npm run db:migrate

# Create super admin account
npm run db:seed

# Start development server (workers run automatically!)
npm run dev
```

Backend will run on http://localhost:3000

**Note**: Background workers start automatically - no separate process needed!

**Default Super Admin Credentials:**
- Email: admin@mammogram-viewer.com
- Password: Admin@123456

⚠️ **Important**: Change these credentials in production!

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on http://localhost:5173

### 4. Access the Application

Open http://localhost:5173 in your browser and:

**For Regular Users:**
1. Register a new account
2. Wait for admin approval
3. Login with your credentials after approval
4. Upload mammogram images
5. View and manage your images

**For Administrators:**
1. Login with super admin credentials
2. Click "Admin Dashboard" in the navigation
3. Approve/reject pending user registrations
4. Manage user accounts
5. View analytics dashboard for system insights

## Project Structure

```
mammogram-viewer/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── database/        # Database migrations and setup
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Data models
│   │   ├── repositories/    # Database access layer
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── types/           # TypeScript type definitions
│   │   └── index.ts         # Application entry point
│   ├── storage/             # File storage (auto-created)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── hooks/           # Custom React hooks
│   │   └── App.tsx          # Main app component
│   └── package.json
└── docker-compose.yml       # Docker setup (optional)
```

## User Roles and Approval System

### User Registration Flow

1. **User Registers** → Account created with `pending` status
2. **Admin Reviews** → Super admin reviews registration in admin dashboard
3. **Admin Approves/Rejects** → User status updated
4. **User Logs In** → Only approved users can access the application

### User Statuses

- **Pending**: Awaiting admin approval (cannot log in)
- **Approved**: Active user with full access
- **Rejected**: Registration denied (cannot log in)
- **Deactivated**: Temporarily disabled (cannot log in)

### Admin Capabilities

Super admins can:
- View all users and system statistics
- Approve or reject pending registrations
- Deactivate or reactivate user accounts
- Delete user accounts
- Filter and search users
- View rejection reasons

See [ADMIN_USER_GUIDE.md](./ADMIN_USER_GUIDE.md) for detailed admin instructions.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (returns pending status)
- `POST /api/auth/login` - Login user (checks approval status)

### Admin (Requires super_admin role)
- `GET /api/admin/users` - Get all users with filtering
- `GET /api/admin/users/pending` - Get pending users
- `GET /api/admin/stats` - Get system statistics
- `PUT /api/admin/users/:id/approve` - Approve user
- `PUT /api/admin/users/:id/reject` - Reject user
- `PUT /api/admin/users/:id/deactivate` - Deactivate user
- `PUT /api/admin/users/:id/activate` - Activate user
- `DELETE /api/admin/users/:id` - Delete user

See [ADMIN_API_DOCUMENTATION.md](./ADMIN_API_DOCUMENTATION.md) for complete API reference.

### Images
- `GET /api/images` - Get user's images
- `GET /api/images/:id` - Get image details
- `GET /api/images/:id/file` - View image (converts DICOM to PNG)
- `GET /api/images/:id/thumbnail` - Get image thumbnail
- `GET /api/images/:id/download` - Download original file
- `GET /api/images/:id/metadata` - Get image metadata
- `DELETE /api/images/:id` - Delete image

### Upload
- `POST /api/upload/single` - Upload single file
- `POST /api/upload/multiple` - Upload multiple files

## DICOM Viewer

The application includes a sophisticated DICOM viewer that:
- Converts DICOM files to PNG for web viewing
- Supports 8-bit and 16-bit grayscale images
- Handles MONOCHROME1 (inverted) and MONOCHROME2 (normal)
- Automatic windowing for optimal contrast
- Caches converted images for performance
- Interactive controls (zoom, brightness, contrast, invert)

See [DICOM_VIEWER_FIX.md](./DICOM_VIEWER_FIX.md) for technical details.

## Development

### Backend Development

```bash
cd backend

# Run in development mode with auto-reload
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run linter
npm run lint
```

### Frontend Development

```bash
cd frontend

# Run in development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Production Deployment

### Using Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Deployment

1. Build backend:
```bash
cd backend
npm install --production
npm run build
```

2. Build frontend:
```bash
cd frontend
npm install
npm run build
```

3. Serve frontend build with nginx or similar
4. Run backend with PM2 or similar process manager

## Environment Variables

### Backend (.env)
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mammogram_viewer
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Storage Configuration
STORAGE_ROOT=./storage

# Super Admin Configuration
SUPER_ADMIN_EMAIL=admin@mammogram-viewer.com
SUPER_ADMIN_PASSWORD=Admin@123456
SUPER_ADMIN_USERNAME=Super Admin

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

⚠️ **Security Notes:**
- Change `JWT_SECRET` in production
- Change super admin credentials after first login
- Use strong passwords
- Enable HTTPS in production

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api
```

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists: `createdb mammogram_viewer`

### DICOM Viewing Issues
- Check backend logs for conversion errors
- Verify DICOM file is valid
- Clear cache: `rm -rf backend/storage/*.png`

### Upload Issues
- Check file size limits in backend configuration
- Verify storage directory permissions
- Check available disk space

## Documentation

- [Quick Start Guide](./QUICK_START.md) - Step-by-step setup
- [Performance & Analytics Guide](./PERFORMANCE_ANALYTICS_GUIDE.md) - New features guide
- [Quick Reference](./QUICK_REFERENCE.md) - Command cheat sheet
- [Admin User Guide](./ADMIN_USER_GUIDE.md) - How to use the admin dashboard
- [Admin API Documentation](./ADMIN_API_DOCUMENTATION.md) - Complete API reference
- [DICOM Viewer Details](./DICOM_VIEWER_FIX.md) - Technical implementation
- [How to Run](./HOW_TO_RUN.md) - Detailed running instructions
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - What was built

## License

MIT

## Support

For issues and questions, please open an issue on the repository.
