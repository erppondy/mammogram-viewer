# Mammogram Viewer Application - Complete Technical Specification

**Version:** 1.0.0  
**Last Updated:** December 8, 2025  
**Document Type:** Technical Specification & Architecture Documentation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Database Architecture](#database-architecture)
5. [Backend Architecture](#backend-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Core Features & Modules](#core-features--modules)
8. [API Specification](#api-specification)
9. [Security Architecture](#security-architecture)
10. [Performance & Optimization](#performance--optimization)
11. [Deployment Architecture](#deployment-architecture)
12. [Development Workflow](#development-workflow)

---

## 1. Executive Summary

### 1.1 Application Overview

The Mammogram Viewer is a comprehensive medical imaging web application designed for healthcare professionals to upload, view, annotate, and manage mammogram images. The system supports multiple medical imaging formats including DICOM, AAN (custom mammogram format), and standard image formats.

### 1.2 Key Capabilities

- **Multi-format Medical Image Support**: DICOM, AAN, JPEG, PNG, TIFF, ZIP archives
- **Advanced DICOM Processing**: Real-time conversion, windowing, and rendering
- **Annotation System**: Multi-tool annotation with polygon, circle, rectangle, arrow, freehand, text, and measurement tools
- **Ambulance Licensing System**: Multi-tenant license management with quota tracking
- **User Management**: Role-based access control with approval workflow
- **Analytics Dashboard**: Comprehensive usage statistics and system monitoring
- **Background Processing**: Asynchronous job queue for image processing
- **Export Capabilities**: LabelMe format export for AI training

### 1.3 Target Users

- **Radiologists**: Primary users for image viewing and annotation
- **Ambulance Operators**: Upload and manage patient images
- **Super Admins**: System administration and license management
- **AI Researchers**: Export annotated data for machine learning

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Browser    │  │   Mobile     │  │   Tablet     │          │
│  │  (React SPA) │  │   Browser    │  │   Browser    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS / REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Nginx Reverse Proxy                          │  │
│  │  - SSL/TLS Termination                                    │  │
│  │  - Static File Serving                                    │  │
│  │  - Load Balancing                                         │  │
│  │  - Request Routing                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Node.js + Express Backend                       │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │   Auth     │  │   Upload   │  │   Image    │         │  │
│  │  │  Service   │  │  Service   │  │  Service   │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │ Annotation │  │  License   │  │  Analytics │         │  │
│  │  │  Service   │  │  Service   │  │  Service   │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PROCESSING LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         In-Memory Job Queue (Redis-Free)                  │  │
│  │  ┌────────────────┐  ┌────────────────┐                  │  │
│  │  │ DICOM Worker   │  │ Thumbnail      │                  │  │
│  │  │ (3 concurrent) │  │ Worker         │                  │  │
│  │  │                │  │ (5 concurrent) │                  │  │
│  │  └────────────────┘  └────────────────┘                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │   PostgreSQL     │  │  File Storage    │                    │
│  │   Database       │  │  (Local/NFS)     │                    │
│  │  - User Data     │  │  - Images        │                    │
│  │  - Metadata      │  │  - Thumbnails    │                    │
│  │  - Annotations   │  │  - DICOM Files   │                    │
│  │  - Licenses      │  │  - Converted PNG │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Architecture Patterns

**Pattern**: Layered Architecture with Repository Pattern

**Layers**:
1. **Presentation Layer**: React SPA with component-based UI
2. **API Layer**: RESTful Express.js endpoints
3. **Business Logic Layer**: Service classes with domain logic
4. **Data Access Layer**: Repository pattern for database operations
5. **Data Layer**: PostgreSQL + File System

**Key Design Principles**:
- Separation of Concerns
- Dependency Injection
- Single Responsibility Principle
- Repository Pattern for data access
- Service Layer for business logic
- Middleware for cross-cutting concerns

### 2.3 Communication Protocols

- **Client-Server**: REST API over HTTPS
- **Authentication**: JWT Bearer Tokens
- **File Upload**: Multipart Form Data
- **Real-time Updates**: Polling (WebSocket ready for future)

---
## 3. Technology Stack

### 3.1 Backend Technologies

#### Core Framework
- **Runtime**: Node.js 18+ (LTS)
- **Framework**: Express.js 4.18.2
- **Language**: TypeScript 5.3.3
- **Build Tool**: tsx (TypeScript execution)

#### Database & ORM
- **Database**: PostgreSQL 14+
- **Driver**: node-postgres (pg) 8.11.3
- **Query Builder**: Raw SQL with parameterized queries
- **Migrations**: Custom SQL migration system

#### Authentication & Security
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcrypt 5.1.1
- **Security Headers**: Helmet 7.1.0
- **CORS**: cors 2.8.5
- **Rate Limiting**: express-rate-limit 7.1.5

#### Medical Image Processing
- **DICOM Parser**: dicom-parser 1.8.21
- **Image Processing**: Sharp 0.33.2
- **PNG Generation**: pngjs 7.0.0
- **DICOM Conversion**: Custom DicomConverterService

#### File Handling
- **Upload**: Multer 1.4.5-lts.1
- **ZIP Extraction**: adm-zip 0.5.10
- **ZIP Creation**: archiver 7.0.1
- **Compression**: compression 1.7.4

#### Background Processing
- **Queue System**: Custom In-Memory Queue (Redis-free)
- **Workers**: 
  - DICOM Conversion Worker (3 concurrent)
  - Thumbnail Generation Worker (5 concurrent)
- **Scheduled Jobs**: Node.js setInterval for cron-like tasks

#### Logging & Monitoring
- **Logger**: Winston 3.11.0
- **Console Logging**: Custom structured logging

#### Development Tools
- **Testing**: Jest 29.7.0 + Supertest 6.3.4
- **Linting**: ESLint 8.56.0 + TypeScript ESLint
- **Formatting**: Prettier 3.2.4
- **Type Checking**: TypeScript strict mode

### 3.2 Frontend Technologies

#### Core Framework
- **Library**: React 18.2.0
- **Language**: TypeScript 5.3.3
- **Build Tool**: Vite 5.0.0
- **Routing**: React Router DOM 6.21.3

#### State Management
- **Global State**: Zustand 4.5.0
- **Server State**: TanStack React Query 5.17.19
- **Local State**: React Hooks (useState, useReducer)

#### UI & Styling
- **CSS Framework**: Tailwind CSS 3.4.1
- **CSS Preprocessor**: PostCSS 8.4.33
- **Animations**: Framer Motion (motion 12.23.24)
- **Icons**: Custom SVG icons
- **Theme**: Custom medical-themed CSS variables

#### Medical Image Viewing
- **DICOM Viewer**: DWV (DICOM Web Viewer) 0.35.1
- **Cornerstone**: cornerstone-core 2.6.1, cornerstone-tools 3.0.0
- **WADO Loader**: cornerstone-wado-image-loader 4.13.2
- **Canvas Manipulation**: Fabric.js 5.3.0

#### Data Visualization
- **Charts**: Chart.js 4.4.1 + react-chartjs-2 5.2.0

#### HTTP Client
- **API Client**: Axios 1.6.5
- **Interceptors**: Custom auth and error handling

#### File Upload
- **Drag & Drop**: react-dropzone 14.2.3

#### Development Tools
- **Testing**: Vitest 1.0.0 + Testing Library
- **Linting**: ESLint + React plugins
- **Formatting**: Prettier
- **Type Checking**: TypeScript strict mode

### 3.3 DevOps & Infrastructure

#### Containerization
- **Container Runtime**: Docker
- **Orchestration**: Docker Compose
- **Images**: 
  - postgres:14-alpine
  - node:18-alpine (custom builds)

#### Web Server
- **Reverse Proxy**: Nginx
- **SSL/TLS**: Let's Encrypt (Certbot)
- **Static Serving**: Nginx for frontend assets

#### Deployment
- **Process Manager**: PM2 (production)
- **Environment**: Linux (Ubuntu/Debian)
- **Shell Scripts**: Bash automation scripts

#### Version Control
- **VCS**: Git
- **Repository**: GitHub
- **Branching**: Feature branches + main

### 3.4 Development Environment

#### Package Management
- **Package Manager**: npm (workspaces)
- **Monorepo**: npm workspaces (backend + frontend)

#### Environment Configuration
- **Environment Variables**: dotenv
- **Config Files**: .env files per environment

#### Code Quality
- **Pre-commit Hooks**: Manual (ESLint + Prettier)
- **Code Review**: Pull request workflow
- **Testing**: Unit + Integration tests

---
## 4. Database Architecture

### 4.1 Database Schema Overview

**Database**: PostgreSQL 14+  
**Total Tables**: 15  
**Extensions**: uuid-ossp (UUID generation)

### 4.2 Core Tables

#### 4.2.1 Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  professional_credentials VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  role VARCHAR(20) DEFAULT 'user' NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  license_id UUID REFERENCES ambulance_licenses(id),
  ambulance_role VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);
```

**Indexes**:
- `idx_users_email` (email)
- `idx_users_role` (role)
- `idx_users_status` (status)
- `idx_users_created_at_desc` (created_at DESC)

**Constraints**:
- `chk_users_role`: role IN ('user', 'super_admin')
- `chk_users_status`: status IN ('pending', 'approved', 'rejected', 'deactivated')
- `chk_users_ambulance_role`: ambulance_role IN ('operator', 'supervisor', 'admin')

#### 4.2.2 Images Table
```sql
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_id UUID REFERENCES ambulance_licenses(id),
  original_filename VARCHAR(500) NOT NULL,
  file_format VARCHAR(50) NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  thumbnail_path VARCHAR(500),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
- `idx_images_user_id` (user_id)
- `idx_images_uploaded_at_desc` (uploaded_at DESC)
- `idx_images_file_format` (file_format)
- `idx_images_user_uploaded` (user_id, uploaded_at DESC)

#### 4.2.3 Image Metadata Table
```sql
CREATE TABLE image_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
  patient_id VARCHAR(255),
  patient_name VARCHAR(255),
  patient_birth_date DATE,
  patient_sex VARCHAR(20),
  patient_age VARCHAR(50),
  study_date DATE,
  study_description TEXT,
  modality VARCHAR(50),
  institution_name VARCHAR(255),
  image_width INTEGER,
  image_height INTEGER,
  bit_depth INTEGER,
  color_space VARCHAR(50),
  dicom_tags JSONB,
  custom_tags JSONB,
  metadata_source VARCHAR(100)
);
```

**Indexes**:
- `idx_metadata_image_id` (image_id)
- `idx_metadata_patient_id` (patient_id)
- `idx_metadata_study_date` (study_date)
- `idx_metadata_modality` (modality)
- `idx_metadata_patient_name` (patient_name)
- `idx_metadata_dicom_tags` (GIN index on JSONB)
- `idx_metadata_custom_tags` (GIN index on JSONB)

#### 4.2.4 Annotations Table
```sql
CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  annotation_type VARCHAR(50) NOT NULL,
  coordinates JSONB NOT NULL,
  color VARCHAR(20) DEFAULT '#ff0000',
  severity_level INTEGER CHECK (severity_level >= 1 AND severity_level <= 5),
  category VARCHAR(100),
  finding_name VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
- `idx_annotations_image_id` (image_id)
- `idx_annotations_user_id` (user_id)
- `idx_annotations_created_at` (created_at)

**Annotation Types**:
- circle
- rectangle
- arrow
- freehand
- text
- measurement
- polygon

#### 4.2.5 Ambulance Licenses Table
```sql
CREATE TABLE ambulance_licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_key VARCHAR(50) UNIQUE NOT NULL,
  ambulance_name VARCHAR(255) NOT NULL,
  ambulance_contact_email VARCHAR(255) NOT NULL,
  ambulance_contact_phone VARCHAR(50),
  ambulance_address TEXT,
  status VARCHAR(50) DEFAULT 'active' NOT NULL,
  upload_quota INTEGER NOT NULL DEFAULT 1000,
  uploads_used INTEGER DEFAULT 0,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  revoked_by UUID REFERENCES users(id),
  revocation_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
- `idx_ambulance_licenses_license_key` (license_key)
- `idx_ambulance_licenses_status` (status)
- `idx_ambulance_licenses_expires_at` (expires_at)
- `idx_ambulance_licenses_ambulance_name` (ambulance_name)

**Constraints**:
- `chk_ambulance_licenses_status`: status IN ('active', 'expired', 'revoked')
- `chk_ambulance_licenses_upload_quota`: upload_quota >= 0
- `chk_ambulance_licenses_uploads_used`: uploads_used >= 0

### 4.3 Analytics Tables

#### 4.3.1 User Activity Table
```sql
CREATE TABLE user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  metadata JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Activity Types**: login, upload, view, download, delete, annotate

#### 4.3.2 System Stats Table
```sql
CREATE TABLE system_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stat_date DATE NOT NULL UNIQUE,
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  total_images INTEGER DEFAULT 0,
  new_images INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_uploads INTEGER DEFAULT 0,
  total_downloads INTEGER DEFAULT 0,
  storage_used BIGINT DEFAULT 0,
  dicom_count INTEGER DEFAULT 0,
  aan_count INTEGER DEFAULT 0,
  jpeg_count INTEGER DEFAULT 0,
  png_count INTEGER DEFAULT 0,
  tiff_count INTEGER DEFAULT 0,
  other_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.4 Supporting Tables

- **license_templates**: Predefined license configurations
- **license_audit_log**: License change history
- **reports**: Medical reports with findings
- **upload_sessions**: Chunked upload tracking
- **audit_logs**: System-wide audit trail
- **image_views**: Image view tracking
- **job_queue**: Background job status

### 4.5 Database Optimization

**Performance Features**:
- B-tree indexes on frequently queried columns
- GIN indexes on JSONB columns for fast JSON queries
- Composite indexes for common query patterns
- Foreign key constraints with CASCADE deletes
- Check constraints for data integrity
- Cursor-based pagination for large datasets

**Connection Pooling**:
- Max connections: 20
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds

---
## 5. Backend Architecture

### 5.1 Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.ts      # PostgreSQL connection pool
│   │   └── redis.ts         # Redis config (optional)
│   ├── database/            # Database management
│   │   ├── migrations/      # SQL migration files
│   │   ├── seeds/           # Seed data
│   │   ├── init.ts          # Database initialization
│   │   ├── migrate.ts       # Migration runner
│   │   └── seed.ts          # Seed runner
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts          # JWT authentication
│   │   ├── adminAuth.ts     # Admin authorization
│   │   ├── licenseAuth.ts   # License validation
│   │   ├── validation.ts    # Request validation
│   │   └── activityTracker.ts # Activity logging
│   ├── models/              # Data models & DTOs
│   │   ├── User.ts
│   │   ├── Image.ts
│   │   ├── Annotation.ts
│   │   ├── AmbulanceLicense.ts
│   │   ├── LicenseTemplate.ts
│   │   ├── Report.ts
│   │   └── ...
│   ├── repositories/        # Data access layer
│   │   ├── UserRepository.ts
│   │   ├── ImageRepository.ts
│   │   ├── AnnotationRepository.ts
│   │   ├── LicenseRepository.ts
│   │   ├── AnalyticsRepository.ts
│   │   └── ...
│   ├── services/            # Business logic layer
│   │   ├── AuthService.ts
│   │   ├── AdminService.ts
│   │   ├── DicomConverterService.ts
│   │   ├── DicomParserService.ts
│   │   ├── DicomMetadataService.ts
│   │   ├── ImageProcessingService.ts
│   │   ├── ChunkedUploadService.ts
│   │   ├── StorageService.ts
│   │   ├── LicenseService.ts
│   │   ├── AnnotationExportService.ts
│   │   ├── AnalyticsService.ts
│   │   ├── InMemoryQueueService.ts
│   │   └── ...
│   ├── routes/              # API route handlers
│   │   ├── auth.routes.ts
│   │   ├── admin.routes.ts
│   │   ├── upload.routes.ts
│   │   ├── images.routes.ts
│   │   ├── annotations.routes.ts
│   │   ├── reports.routes.ts
│   │   ├── export.routes.ts
│   │   ├── licenses.routes.ts
│   │   ├── analytics.routes.ts
│   │   └── ...
│   ├── workers/             # Background workers
│   │   ├── inMemoryWorkers.ts
│   │   ├── dicomWorker.ts
│   │   ├── thumbnailWorker.ts
│   │   ├── licenseExpirationJob.ts
│   │   └── index.ts
│   ├── types/               # TypeScript type definitions
│   │   └── dcmjs.d.ts
│   ├── utils/               # Utility functions
│   │   └── storageCleanup.ts
│   ├── __tests__/           # Test files
│   └── index.ts             # Application entry point
├── storage/                 # File storage (runtime)
│   ├── uploads/
│   ├── thumbnails/
│   ├── dicom/
│   └── temp/
├── Dockerfile
├── package.json
├── tsconfig.json
└── .env
```

### 5.2 Service Layer Architecture

#### 5.2.1 AuthService
**Responsibilities**:
- User registration with pending status
- Login with JWT token generation
- Password hashing and verification
- Token validation and refresh
- User session management

**Key Methods**:
```typescript
register(data: CreateUserDTO): Promise<UserResponse>
login(email: string, password: string): Promise<{ token: string, user: UserResponse }>
verifyToken(token: string): Promise<User>
changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void>
```

#### 5.2.2 DicomConverterService
**Responsibilities**:
- Parse DICOM files using dicom-parser
- Extract pixel data and metadata
- Convert to PNG format with proper windowing
- Handle 8-bit and 16-bit grayscale images
- Support MONOCHROME1 and MONOCHROME2 photometric interpretations
- Optimize large images for web viewing

**Key Methods**:
```typescript
convertToPNG(dicomBuffer: Buffer, options?: ConversionOptions): Promise<Buffer>
```

**Conversion Process**:
1. Parse DICOM with dicom-parser
2. Extract image dimensions and bit depth
3. Extract pixel data
4. Apply windowing and normalization
5. Handle photometric interpretation (invert if MONOCHROME1)
6. Generate PNG using pngjs
7. Resize if exceeds max dimensions (2048x2048)
8. Compress with Sharp

#### 5.2.3 LicenseService
**Responsibilities**:
- Create and manage ambulance licenses
- Validate license keys
- Track upload quota usage
- Handle license expiration
- License revocation with audit trail

**Key Methods**:
```typescript
createLicense(data: CreateLicenseDTO, createdBy: string): Promise<AmbulanceLicense>
validateLicense(licenseKey: string): Promise<LicenseValidation>
incrementUploadsUsed(licenseId: string): Promise<void>
revokeLicense(licenseId: string, reason: string, revokedBy: string): Promise<void>
checkExpiredLicenses(): Promise<void>
```

#### 5.2.4 AnnotationExportService
**Responsibilities**:
- Export annotations in LabelMe format
- Generate JSON files for AI training
- Include image metadata and shapes
- Support multiple annotation types

**Export Format**:
```json
{
  "version": "5.0.1",
  "flags": {},
  "shapes": [
    {
      "label": "finding_name",
      "points": [[x1, y1], [x2, y2], ...],
      "group_id": null,
      "shape_type": "polygon",
      "flags": {}
    }
  ],
  "imagePath": "filename.png",
  "imageData": null,
  "imageHeight": 1024,
  "imageWidth": 1024
}
```

#### 5.2.5 InMemoryQueueService
**Responsibilities**:
- Manage background job queue without Redis
- Process DICOM conversions asynchronously
- Generate thumbnails in background
- Handle job retries and failures
- Track job status

**Queue Configuration**:
- DICOM Queue: 3 concurrent workers
- Thumbnail Queue: 5 concurrent workers
- Max retries: 3
- Retry delay: Exponential backoff

### 5.3 Repository Pattern

**Purpose**: Abstraction layer between business logic and data access

**Example - UserRepository**:
```typescript
class UserRepository {
  async create(data: CreateUserDTO): Promise<User>
  async findById(id: string): Promise<User | null>
  async findByEmail(email: string): Promise<User | null>
  async update(id: string, data: UpdateUserDTO): Promise<User>
  async delete(id: string): Promise<void>
  async findAll(filters: UserFilters): Promise<User[]>
  async updateLastLogin(id: string): Promise<void>
}
```

### 5.4 Middleware Stack

**Request Flow**:
```
Request → Helmet → CORS → Compression → JSON Parser → 
Rate Limiter → Auth Middleware → Route Handler → Response
```

**Middleware Components**:

1. **Helmet**: Security headers
2. **CORS**: Cross-origin resource sharing
3. **Compression**: Response compression
4. **Auth Middleware**: JWT validation
5. **Admin Auth**: Role-based access control
6. **License Auth**: License validation
7. **Activity Tracker**: User activity logging
8. **Validation**: Request payload validation

### 5.5 Error Handling

**Error Response Format**:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**HTTP Status Codes**:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error

### 5.6 File Storage Structure

```
storage/
├── uploads/
│   ├── {userId}/
│   │   ├── {imageId}.dcm
│   │   ├── {imageId}.png
│   │   ├── {imageId}.jpg
│   │   └── ...
├── thumbnails/
│   ├── {userId}/
│   │   ├── {imageId}_thumb.png
│   │   └── ...
├── dicom/
│   ├── converted/
│   │   ├── {imageId}.png
│   │   └── ...
└── temp/
    ├── uploads/
    └── processing/
```

---
## 6. Frontend Architecture

### 6.1 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── admin/           # Admin-specific components
│   │   │   ├── UserManagementTable.tsx
│   │   │   ├── LicenseManagementTable.tsx
│   │   │   ├── CreateLicenseModal.tsx
│   │   │   ├── AmbulanceStatsTable.tsx
│   │   │   ├── SystemStatsOverview.tsx
│   │   │   └── ...
│   │   ├── MedicalUI/       # Medical-themed UI components
│   │   │   └── MedicalButton.tsx
│   │   ├── ImageGallery.tsx
│   │   ├── ImageViewer.tsx
│   │   ├── DicomViewer.tsx
│   │   ├── UploadSection.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── AmbulanceLicenseStatus.tsx
│   │   ├── LicenseExpiryNotice.tsx
│   │   ├── UploadQuotaWarning.tsx
│   │   ├── ParticleNetworkBackground.tsx
│   │   ├── CustomLoader.tsx
│   │   ├── Toast.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── ...
│   ├── pages/               # Page components
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── AdminDashboardPage.tsx
│   │   ├── AnalyticsDashboardPage.tsx
│   │   ├── AnnotationViewerPage.tsx
│   │   └── EnhancedAnnotationViewer.tsx
│   ├── services/            # API service layer
│   │   ├── api.ts           # Axios instance
│   │   ├── authService.ts
│   │   ├── adminService.ts
│   │   ├── annotationService.ts
│   │   ├── licenseService.ts
│   │   ├── licenseTemplateService.ts
│   │   ├── ambulanceStatsService.ts
│   │   ├── analyticsService.ts
│   │   └── exportService.ts
│   ├── hooks/               # Custom React hooks
│   │   └── useIntersectionObserver.ts
│   ├── utils/               # Utility functions
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   ├── index.css            # Global styles
│   └── vite-env.d.ts        # Vite type definitions
├── public/                  # Static assets
├── dist/                    # Build output
├── Dockerfile
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── .env
```

### 6.2 Component Architecture

#### 6.2.1 Page Components

**DashboardPage**:
- Main user dashboard
- Image gallery with filtering
- Upload section
- License status display
- Quick actions

**AnnotationViewerPage / EnhancedAnnotationViewer**:
- Canvas-based annotation tools
- Fabric.js for drawing
- Multiple annotation types (polygon, circle, rectangle, arrow, freehand, text, measurement)
- Zoom and pan controls
- Brightness/contrast adjustment
- Annotation list and management
- Export to LabelMe format

**AdminDashboardPage**:
- User management table
- License management
- System statistics
- Approval workflow

**AnalyticsDashboardPage**:
- Usage charts (Chart.js)
- System metrics
- Upload trends
- User activity graphs

#### 6.2.2 Shared Components

**ImageGallery**:
- Grid/list view toggle
- Lazy loading with Intersection Observer
- Batch operations (select, delete, download)
- Cursor-based pagination
- Filtering and search

**ImageViewer**:
- Zoom controls
- Brightness/contrast adjustment
- Rotation
- Fullscreen mode
- Metadata display

**DicomViewer**:
- DICOM-specific rendering
- Windowing controls
- Measurement tools
- Integration with DWV library

**UploadSection**:
- Drag-and-drop upload (react-dropzone)
- Multiple file selection
- Progress tracking
- File format validation
- ZIP file support

### 6.3 State Management

#### 6.3.1 Authentication State
```typescript
// Stored in localStorage
interface AuthState {
  token: string | null;
  user: User | null;
}
```

#### 6.3.2 Component State (React Hooks)
- Local UI state with useState
- Side effects with useEffect
- Memoization with useMemo/useCallback
- Context for theme/settings

#### 6.3.3 Server State (React Query)
- Automatic caching
- Background refetching
- Optimistic updates
- Error handling

### 6.4 Routing Structure

```typescript
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  
  {/* Protected Routes */}
  <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
  <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
  <Route path="/annotate/:imageId" element={<ProtectedRoute><EnhancedAnnotationViewer /></ProtectedRoute>} />
  
  {/* Admin Routes */}
  <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboardPage /></ProtectedRoute>} />
  <Route path="/analytics" element={<ProtectedRoute requireAdmin><AnalyticsDashboardPage /></ProtectedRoute>} />
  
  <Route path="/" element={<Navigate to="/dashboard" />} />
</Routes>
```

### 6.5 API Service Layer

**Base Configuration**:
```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request interceptor - add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**Service Pattern**:
```typescript
// authService.ts
export const authService = {
  async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', response.data.token);
    return response.data;
  },
  
  async register(data: RegisterData) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  
  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  logout() {
    localStorage.removeItem('token');
  },
  
  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
};
```

### 6.6 Styling Architecture

#### 6.6.1 Tailwind CSS Configuration
```javascript
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        medical: {
          primary: '#00d4ff',
          secondary: '#0099cc',
          accent: '#00ffcc',
          dark: '#001a33',
        }
      }
    }
  }
}
```

#### 6.6.2 CSS Variables (Medical Theme)
```css
:root {
  --bg-primary: #0a0e27;
  --bg-secondary: #141b3d;
  --bg-tertiary: #1e2749;
  --text-primary: #e0e7ff;
  --text-secondary: #94a3b8;
  --accent-primary: #00d4ff;
  --accent-secondary: #00ffcc;
  --border-color: rgba(0, 212, 255, 0.2);
  --shadow-glow: 0 0 20px rgba(0, 212, 255, 0.3);
}
```

#### 6.6.3 Component Styling Pattern
- Tailwind utility classes for layout
- CSS modules for component-specific styles
- CSS variables for theming
- Animations with Framer Motion

### 6.7 Performance Optimization

**Techniques**:
1. **Code Splitting**: Route-based lazy loading
2. **Image Optimization**: Lazy loading with Intersection Observer
3. **Memoization**: React.memo, useMemo, useCallback
4. **Virtual Scrolling**: For large lists (future enhancement)
5. **Debouncing**: Search and filter inputs
6. **Caching**: React Query for API responses
7. **Bundle Optimization**: Vite tree-shaking and minification

**Build Optimization**:
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          'dicom-vendor': ['cornerstone-core', 'dwv', 'dicom-parser']
        }
      }
    }
  }
});
```

---
## 7. Core Features & Modules

### 7.1 Authentication & Authorization

#### 7.1.1 User Registration Flow
1. User submits registration form
2. Backend validates email uniqueness
3. Password hashed with bcrypt (10 rounds)
4. User created with `status: 'pending'`
5. User receives confirmation message
6. Admin notified of pending registration

#### 7.1.2 Login Flow
1. User submits credentials
2. Backend validates email and password
3. Check user status (must be 'approved')
4. Generate JWT token (24h expiry)
5. Update last_login_at timestamp
6. Return token and user data

#### 7.1.3 JWT Token Structure
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "user",
  "iat": 1234567890,
  "exp": 1234654290
}
```

#### 7.1.4 Role-Based Access Control

**Roles**:
- **user**: Regular users (radiologists, ambulance operators)
- **super_admin**: System administrators

**Permissions**:
```typescript
const permissions = {
  user: [
    'upload:own',
    'view:own',
    'annotate:own',
    'delete:own',
    'export:own'
  ],
  super_admin: [
    'user:manage',
    'license:manage',
    'system:view',
    'analytics:view',
    '*:*' // All permissions
  ]
};
```

### 7.2 Image Upload & Processing

#### 7.2.1 Upload Flow
```
1. User selects files (drag-drop or file picker)
2. Frontend validates file types and sizes
3. Files sent via multipart/form-data
4. Backend validates and stores files
5. Metadata extracted (DICOM/AAN)
6. Background jobs queued:
   - DICOM conversion (if applicable)
   - Thumbnail generation
7. Database records created
8. Response sent to frontend
9. Background workers process jobs
10. Frontend polls for completion
```

#### 7.2.2 Supported File Formats

| Format | Extension | Processing |
|--------|-----------|------------|
| DICOM | .dcm, .dicom | Parse → Convert to PNG → Generate thumbnail |
| AAN | .aan | Parse metadata → Generate thumbnail |
| JPEG | .jpg, .jpeg | Direct storage → Generate thumbnail |
| PNG | .png | Direct storage → Generate thumbnail |
| TIFF | .tif, .tiff | Direct storage → Generate thumbnail |
| ZIP | .zip | Extract → Process each file |

#### 7.2.3 DICOM Processing Pipeline

**Step 1: Parse DICOM**
```typescript
const dataSet = dicomParser.parseDicom(new Uint8Array(buffer));
```

**Step 2: Extract Metadata**
- Patient information (name, ID, age, sex)
- Study information (date, description, modality)
- Image properties (width, height, bit depth)
- DICOM tags (stored as JSONB)

**Step 3: Extract Pixel Data**
- Handle 8-bit and 16-bit grayscale
- Support MONOCHROME1 (inverted) and MONOCHROME2
- Apply windowing for optimal contrast

**Step 4: Convert to PNG**
- Normalize pixel values to 0-255
- Create PNG with pngjs
- Optimize with Sharp (resize if needed)

**Step 5: Generate Thumbnail**
- Resize to 200x200 (fit inside)
- Maintain aspect ratio
- Save as separate file

#### 7.2.4 File Validation

**Frontend Validation**:
- File type check (MIME type)
- File size limit (configurable)
- Batch size limit

**Backend Validation**:
- Magic number verification
- File integrity check
- Virus scanning (future enhancement)
- License quota check

### 7.3 Annotation System

#### 7.3.1 Annotation Tools

**Available Tools**:
1. **Polygon**: Multi-point shape for irregular regions
2. **Circle**: Circular regions
3. **Rectangle**: Rectangular regions
4. **Arrow**: Directional indicators
5. **Freehand**: Free-form drawing
6. **Text**: Text labels
7. **Measurement**: Distance and area measurements

#### 7.3.2 Annotation Data Structure

```typescript
interface Annotation {
  id: string;
  image_id: string;
  user_id: string;
  annotation_type: 'polygon' | 'circle' | 'rectangle' | 'arrow' | 'freehand' | 'text' | 'measurement';
  coordinates: {
    points?: Array<{x: number, y: number}>;  // For polygon, freehand
    x?: number;                               // For circle, rectangle
    y?: number;
    radius?: number;                          // For circle
    width?: number;                           // For rectangle
    height?: number;
    startX?: number;                          // For arrow
    startY?: number;
    endX?: number;
    endY?: number;
    text?: string;                            // For text
  };
  color: string;
  severity_level?: 1 | 2 | 3 | 4 | 5;
  category?: string;
  finding_name?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}
```

#### 7.3.3 Canvas Implementation

**Technology**: Fabric.js

**Features**:
- Interactive canvas manipulation
- Object selection and editing
- Undo/redo functionality
- Export to JSON
- Import from JSON
- Zoom and pan

**Canvas Initialization**:
```typescript
const canvas = new fabric.Canvas('annotation-canvas', {
  width: imageWidth,
  height: imageHeight,
  selection: true,
  preserveObjectStacking: true
});
```

#### 7.3.4 Export to LabelMe Format

**Purpose**: AI training data preparation

**Format**:
```json
{
  "version": "5.0.1",
  "flags": {},
  "shapes": [
    {
      "label": "mass",
      "points": [[100, 150], [200, 150], [200, 250], [100, 250]],
      "group_id": null,
      "shape_type": "polygon",
      "flags": {}
    }
  ],
  "imagePath": "mammogram_001.png",
  "imageData": null,
  "imageHeight": 1024,
  "imageWidth": 1024
}
```

### 7.4 Ambulance Licensing System

#### 7.4.1 License Structure

**License Key Format**: `AMB-XXXX-XXXX-XXXX` (auto-generated)

**License Properties**:
- Ambulance name and contact information
- Upload quota (number of images)
- Expiration date
- Status (active, expired, revoked)
- Usage tracking

#### 7.4.2 License Validation Flow

```
1. User uploads image
2. Middleware extracts license_id from user
3. LicenseService.validateLicense(licenseKey)
4. Check status === 'active'
5. Check expires_at > now
6. Check uploads_used < upload_quota
7. If valid, allow upload
8. Increment uploads_used
9. If invalid, reject with error
```

#### 7.4.3 License Templates

**Purpose**: Predefined license configurations

**Template Structure**:
```typescript
interface LicenseTemplate {
  id: string;
  name: string;
  description: string;
  default_upload_quota: number;
  default_duration_days: number;
  is_active: boolean;
}
```

**Example Templates**:
- Basic: 100 uploads, 30 days
- Standard: 500 uploads, 90 days
- Premium: 2000 uploads, 365 days
- Enterprise: Unlimited, 365 days

#### 7.4.4 License Expiration Job

**Schedule**: Every 24 hours (midnight)

**Process**:
1. Query licenses where expires_at < now AND status = 'active'
2. Update status to 'expired'
3. Log to license_audit_log
4. Send notification (future enhancement)

### 7.5 Analytics & Reporting

#### 7.5.1 System Statistics

**Metrics Tracked**:
- Total users (by status)
- Active users (daily, weekly, monthly)
- Total images (by format)
- Storage usage
- Upload trends
- View counts
- Download counts

#### 7.5.2 User Activity Tracking

**Activities Logged**:
- Login/logout
- Image upload
- Image view
- Image download
- Image delete
- Annotation create/update/delete
- License usage

**Activity Record**:
```typescript
{
  user_id: string;
  activity_type: 'login' | 'upload' | 'view' | 'download' | 'delete';
  resource_type: 'image' | 'annotation' | 'license';
  resource_id: string;
  metadata: object;
  ip_address: string;
  user_agent: string;
  created_at: Date;
}
```

#### 7.5.3 Analytics Dashboard

**Charts & Visualizations**:
1. **Upload Trends**: Line chart (Chart.js)
2. **User Growth**: Area chart
3. **Storage Usage**: Pie chart
4. **Format Distribution**: Doughnut chart
5. **Activity Heatmap**: Calendar heatmap (future)
6. **License Usage**: Bar chart

### 7.6 Image Gallery & Filtering

#### 7.6.1 Gallery Features

- **View Modes**: Grid view, List view
- **Sorting**: Date, Name, Size, Format
- **Filtering**: Format, Date range, License
- **Search**: Filename, Patient ID, Patient name
- **Batch Operations**: Select multiple, Delete, Download as ZIP
- **Pagination**: Cursor-based (efficient for large datasets)

#### 7.6.2 Cursor-Based Pagination

**Advantages**:
- Consistent results (no skipped/duplicate items)
- Efficient for large datasets
- Better performance than OFFSET

**Implementation**:
```typescript
// Request
GET /api/images?limit=20&cursor=2023-12-01T10:30:00Z

// Response
{
  images: [...],
  nextCursor: "2023-11-30T15:20:00Z",
  hasMore: true
}

// SQL Query
SELECT * FROM images 
WHERE user_id = $1 
  AND uploaded_at < $2 
ORDER BY uploaded_at DESC 
LIMIT $3
```

#### 7.6.3 Lazy Loading

**Implementation**: Intersection Observer API

```typescript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadImage(entry.target);
      observer.unobserve(entry.target);
    }
  });
});
```

---
## 8. API Specification

### 8.1 Authentication Endpoints

#### POST /api/auth/register
**Description**: Register new user (pending approval)

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "Dr. John Smith",
  "professionalCredentials": "MD, Radiologist"
}
```

**Response** (201):
```json
{
  "message": "Registration successful. Awaiting admin approval.",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Dr. John Smith",
    "status": "pending",
    "role": "user"
  }
}
```

#### POST /api/auth/login
**Description**: Login user and get JWT token

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Dr. John Smith",
    "role": "user",
    "status": "approved"
  }
}
```

#### GET /api/auth/me
**Description**: Get current user info

**Headers**: `Authorization: Bearer <token>`

**Response** (200):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "Dr. John Smith",
  "role": "user",
  "status": "approved",
  "licenseId": "uuid",
  "ambulanceRole": "operator"
}
```

#### PUT /api/auth/change-password
**Description**: Change user password

**Request**:
```json
{
  "oldPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

**Response** (200):
```json
{
  "message": "Password changed successfully"
}
```

### 8.2 Image Management Endpoints

#### POST /api/upload/single
**Description**: Upload single image file

**Headers**: 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request**: FormData with `file` field

**Response** (201):
```json
{
  "message": "File uploaded successfully",
  "image": {
    "id": "uuid",
    "originalFilename": "mammogram.dcm",
    "fileFormat": "dicom",
    "fileSize": 2048576,
    "uploadedAt": "2025-12-08T10:30:00Z"
  }
}
```

#### POST /api/upload/multiple
**Description**: Upload multiple image files

**Request**: FormData with multiple `files` fields

**Response** (201):
```json
{
  "message": "3 files uploaded successfully",
  "images": [...]
}
```

#### GET /api/images
**Description**: Get user's images with pagination

**Query Parameters**:
- `limit`: Number of images (default: 20)
- `cursor`: Pagination cursor (timestamp)
- `format`: Filter by format (dicom, aan, jpeg, png, tiff)
- `search`: Search filename or patient info

**Response** (200):
```json
{
  "images": [
    {
      "id": "uuid",
      "originalFilename": "mammogram.dcm",
      "fileFormat": "dicom",
      "fileSize": 2048576,
      "uploadedAt": "2025-12-08T10:30:00Z",
      "thumbnailPath": "/api/images/uuid/thumbnail"
    }
  ],
  "nextCursor": "2025-12-07T15:20:00Z",
  "hasMore": true
}
```

#### GET /api/images/:id
**Description**: Get image details with metadata

**Response** (200):
```json
{
  "id": "uuid",
  "originalFilename": "mammogram.dcm",
  "fileFormat": "dicom",
  "fileSize": 2048576,
  "uploadedAt": "2025-12-08T10:30:00Z",
  "metadata": {
    "patientName": "John Doe",
    "patientId": "12345",
    "studyDate": "2025-12-08",
    "modality": "MG",
    "imageWidth": 2048,
    "imageHeight": 2048
  }
}
```

#### GET /api/images/:id/file
**Description**: View image (converts DICOM to PNG)

**Response**: Image file (PNG/JPEG)

#### GET /api/images/:id/thumbnail
**Description**: Get image thumbnail

**Response**: Thumbnail image (PNG)

#### GET /api/images/:id/download
**Description**: Download original file

**Response**: Original file with proper filename

#### DELETE /api/images/:id
**Description**: Delete image

**Response** (200):
```json
{
  "message": "Image deleted successfully"
}
```

#### POST /api/images/batch-delete
**Description**: Delete multiple images

**Request**:
```json
{
  "imageIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response** (200):
```json
{
  "message": "3 images deleted successfully"
}
```

#### POST /api/images/download-zip
**Description**: Download multiple images as ZIP

**Request**:
```json
{
  "imageIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response**: ZIP file

### 8.3 Annotation Endpoints

#### GET /api/annotations/image/:imageId
**Description**: Get all annotations for an image

**Response** (200):
```json
{
  "annotations": [
    {
      "id": "uuid",
      "imageId": "uuid",
      "userId": "uuid",
      "annotationType": "polygon",
      "coordinates": {
        "points": [[100, 150], [200, 150], [200, 250]]
      },
      "color": "#ff0000",
      "severityLevel": 3,
      "category": "mass",
      "findingName": "Suspicious mass",
      "notes": "Requires biopsy",
      "createdAt": "2025-12-08T10:30:00Z"
    }
  ]
}
```

#### POST /api/annotations
**Description**: Create new annotation

**Request**:
```json
{
  "imageId": "uuid",
  "annotationType": "polygon",
  "coordinates": {
    "points": [[100, 150], [200, 150], [200, 250]]
  },
  "color": "#ff0000",
  "severityLevel": 3,
  "category": "mass",
  "findingName": "Suspicious mass",
  "notes": "Requires biopsy"
}
```

**Response** (201):
```json
{
  "message": "Annotation created successfully",
  "annotation": {...}
}
```

#### PUT /api/annotations/:id
**Description**: Update annotation

**Request**: Same as create (partial update supported)

**Response** (200):
```json
{
  "message": "Annotation updated successfully",
  "annotation": {...}
}
```

#### DELETE /api/annotations/:id
**Description**: Delete annotation

**Response** (200):
```json
{
  "message": "Annotation deleted successfully"
}
```

### 8.4 Export Endpoints

#### GET /api/export/labelme/:imageId
**Description**: Export annotations in LabelMe format

**Response** (200):
```json
{
  "version": "5.0.1",
  "flags": {},
  "shapes": [...],
  "imagePath": "mammogram.png",
  "imageHeight": 1024,
  "imageWidth": 1024
}
```

#### POST /api/export/batch-labelme
**Description**: Export multiple images with annotations

**Request**:
```json
{
  "imageIds": ["uuid1", "uuid2"]
}
```

**Response**: ZIP file with JSON files

### 8.5 Admin Endpoints

#### GET /api/admin/users
**Description**: Get all users with filtering

**Query Parameters**:
- `status`: Filter by status (pending, approved, rejected, deactivated)
- `role`: Filter by role (user, super_admin)
- `search`: Search by name or email

**Response** (200):
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "Dr. John Smith",
      "role": "user",
      "status": "pending",
      "createdAt": "2025-12-08T10:30:00Z"
    }
  ],
  "total": 50
}
```

#### PUT /api/admin/users/:id/approve
**Description**: Approve pending user

**Response** (200):
```json
{
  "message": "User approved successfully",
  "user": {...}
}
```

#### PUT /api/admin/users/:id/reject
**Description**: Reject pending user

**Request**:
```json
{
  "reason": "Insufficient credentials"
}
```

**Response** (200):
```json
{
  "message": "User rejected successfully"
}
```

#### DELETE /api/admin/users/:id
**Description**: Delete user account

**Response** (200):
```json
{
  "message": "User deleted successfully"
}
```

#### GET /api/admin/stats
**Description**: Get system statistics

**Response** (200):
```json
{
  "totalUsers": 150,
  "pendingUsers": 5,
  "approvedUsers": 140,
  "totalImages": 5000,
  "storageUsed": 10737418240,
  "totalAnnotations": 2500
}
```

### 8.6 License Management Endpoints

#### GET /api/licenses
**Description**: Get all licenses (admin only)

**Query Parameters**:
- `status`: Filter by status
- `search`: Search by ambulance name

**Response** (200):
```json
{
  "licenses": [
    {
      "id": "uuid",
      "licenseKey": "AMB-1234-5678-9012",
      "ambulanceName": "City Ambulance Service",
      "status": "active",
      "uploadQuota": 1000,
      "uploadsUsed": 250,
      "expiresAt": "2026-12-08T00:00:00Z"
    }
  ]
}
```

#### POST /api/licenses
**Description**: Create new license

**Request**:
```json
{
  "ambulanceName": "City Ambulance Service",
  "ambulanceContactEmail": "contact@ambulance.com",
  "ambulanceContactPhone": "+1234567890",
  "uploadQuota": 1000,
  "durationDays": 365
}
```

**Response** (201):
```json
{
  "message": "License created successfully",
  "license": {...}
}
```

#### PUT /api/licenses/:id/revoke
**Description**: Revoke license

**Request**:
```json
{
  "reason": "Contract terminated"
}
```

**Response** (200):
```json
{
  "message": "License revoked successfully"
}
```

### 8.7 Analytics Endpoints

#### GET /api/analytics/overview
**Description**: Get analytics overview

**Response** (200):
```json
{
  "totalUsers": 150,
  "activeUsers": 45,
  "totalImages": 5000,
  "totalAnnotations": 2500,
  "storageUsed": 10737418240,
  "uploadTrend": [
    { "date": "2025-12-01", "count": 50 },
    { "date": "2025-12-02", "count": 65 }
  ]
}
```

#### GET /api/analytics/user-activity
**Description**: Get user activity data

**Query Parameters**:
- `startDate`: Start date (ISO 8601)
- `endDate`: End date (ISO 8601)
- `userId`: Filter by user (optional)

**Response** (200):
```json
{
  "activities": [
    {
      "date": "2025-12-08",
      "uploads": 25,
      "views": 150,
      "downloads": 10,
      "annotations": 45
    }
  ]
}
```

### 8.8 Error Responses

**Standard Error Format**:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Common Error Codes**:
- `UNAUTHORIZED`: 401 - Invalid or missing token
- `FORBIDDEN`: 403 - Insufficient permissions
- `NOT_FOUND`: 404 - Resource not found
- `VALIDATION_ERROR`: 400 - Invalid request data
- `DUPLICATE_EMAIL`: 409 - Email already exists
- `LICENSE_EXPIRED`: 403 - License has expired
- `QUOTA_EXCEEDED`: 403 - Upload quota exceeded
- `INVALID_FILE_FORMAT`: 400 - Unsupported file format

---
## 9. Security Architecture

### 9.1 Authentication Security

#### 9.1.1 Password Security
**Hashing Algorithm**: bcrypt with 10 salt rounds

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Implementation**:
```typescript
import bcrypt from 'bcrypt';

// Hash password
const passwordHash = await bcrypt.hash(password, 10);

// Verify password
const isValid = await bcrypt.compare(password, passwordHash);
```

#### 9.1.2 JWT Token Security

**Token Configuration**:
- Algorithm: HS256
- Expiration: 24 hours
- Secret: Environment variable (minimum 32 characters)
- Payload: userId, email, role

**Token Generation**:
```typescript
const token = jwt.sign(
  { userId: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET!,
  { expiresIn: '24h' }
);
```

**Token Validation**:
```typescript
const decoded = jwt.verify(token, process.env.JWT_SECRET!);
```

**Security Measures**:
- Tokens stored in localStorage (XSS protection via CSP)
- HTTP-only cookies option (future enhancement)
- Token refresh mechanism (future enhancement)
- Automatic logout on token expiration

### 9.2 Authorization

#### 9.2.1 Role-Based Access Control (RBAC)

**Middleware Implementation**:
```typescript
// Auth middleware - verify JWT
export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = await userRepository.findById(decoded.userId);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin middleware - check role
export const adminAuthMiddleware = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
```

#### 9.2.2 Resource Ownership Validation

**Pattern**: Verify user owns resource before allowing access

```typescript
// Example: Delete image
const image = await imageRepository.findById(imageId);
if (image.userId !== req.user.id && req.user.role !== 'super_admin') {
  return res.status(403).json({ error: 'Forbidden' });
}
```

### 9.3 Input Validation & Sanitization

#### 9.3.1 Request Validation

**Validation Middleware**:
```typescript
export const validateRequest = (schema: any) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details 
      });
    }
    next();
  };
};
```

#### 9.3.2 File Upload Validation

**Validation Checks**:
1. File type validation (MIME type + magic number)
2. File size limits (configurable per format)
3. Filename sanitization (remove special characters)
4. Path traversal prevention
5. License quota validation

**Implementation**:
```typescript
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/dicom',
    'image/jpeg',
    'image/png',
    'image/tiff',
    'application/zip'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};
```

### 9.4 Security Headers

**Helmet Configuration**:
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

**Headers Applied**:
- `Strict-Transport-Security`: Force HTTPS
- `X-Content-Type-Options`: Prevent MIME sniffing
- `X-Frame-Options`: Prevent clickjacking
- `X-XSS-Protection`: Enable XSS filter
- `Content-Security-Policy`: Restrict resource loading
- `Referrer-Policy`: Control referrer information

### 9.5 CORS Configuration

**CORS Policy**:
```typescript
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'https://xraycad.bosschn.in',
      process.env.CORS_ORIGIN
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 9.6 Rate Limiting

**Rate Limit Configuration**:
```typescript
import rateLimit from 'express-rate-limit';

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later'
});

// Auth endpoints rate limit (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per window
  message: 'Too many login attempts, please try again later'
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
```

### 9.7 SQL Injection Prevention

**Parameterized Queries**:
```typescript
// SAFE - Parameterized query
const result = await query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// UNSAFE - String concatenation (NEVER DO THIS)
// const result = await query(`SELECT * FROM users WHERE email = '${email}'`);
```

**All database queries use parameterized statements** to prevent SQL injection.

### 9.8 XSS Prevention

**Measures**:
1. Content Security Policy (CSP) headers
2. Input sanitization on backend
3. Output encoding in React (automatic)
4. No `dangerouslySetInnerHTML` usage
5. Sanitize user-generated content

### 9.9 CSRF Protection

**Current**: Not implemented (stateless JWT)

**Future Enhancement**: CSRF tokens for state-changing operations

### 9.10 File Storage Security

**Security Measures**:
1. Files stored outside web root
2. Unique filenames (UUID-based)
3. Access control via API endpoints
4. No direct file system access
5. File type validation
6. Size limits enforced

**Storage Path Structure**:
```
storage/
├── uploads/{userId}/{imageId}.ext
├── thumbnails/{userId}/{imageId}_thumb.ext
└── temp/ (auto-cleanup after 24h)
```

### 9.11 Audit Logging

**Logged Events**:
- User login/logout
- Failed login attempts
- User registration
- Admin actions (approve, reject, delete)
- License creation/revocation
- Image upload/delete
- Annotation create/update/delete

**Audit Log Structure**:
```typescript
{
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  metadata: object;
}
```

### 9.12 Environment Variables Security

**Best Practices**:
1. Never commit `.env` files to version control
2. Use `.env.example` as template
3. Rotate secrets regularly
4. Use strong, random secrets (minimum 32 characters)
5. Different secrets per environment

**Required Environment Variables**:
```env
# Critical Security Variables
JWT_SECRET=<strong-random-secret-min-32-chars>
DB_PASSWORD=<strong-database-password>

# Super Admin Credentials (change after first login)
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=<strong-password>
```

### 9.13 HTTPS/TLS

**Production Requirements**:
- TLS 1.2 or higher
- Valid SSL certificate (Let's Encrypt)
- HSTS header enabled
- Redirect HTTP to HTTPS

**Nginx Configuration**:
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/domain/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

### 9.14 Dependency Security

**Practices**:
1. Regular dependency updates (`npm audit`)
2. Automated vulnerability scanning
3. Lock file usage (package-lock.json)
4. Minimal dependency footprint
5. Review dependencies before adding

**Security Scanning**:
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Check outdated packages
npm outdated
```

---
## 10. Performance & Optimization

### 10.1 Database Optimization

#### 10.1.1 Indexing Strategy

**Primary Indexes**:
```sql
-- Users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at_desc ON users(created_at DESC);

-- Images table
CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_uploaded_at_desc ON images(uploaded_at DESC);
CREATE INDEX idx_images_file_format ON images(file_format);
CREATE INDEX idx_images_user_uploaded ON images(user_id, uploaded_at DESC);

-- Annotations table
CREATE INDEX idx_annotations_image_id ON annotations(image_id);
CREATE INDEX idx_annotations_user_id ON annotations(user_id);

-- Metadata table (JSONB GIN indexes)
CREATE INDEX idx_metadata_dicom_tags ON image_metadata USING GIN (dicom_tags);
CREATE INDEX idx_metadata_custom_tags ON image_metadata USING GIN (custom_tags);
```

**Index Benefits**:
- 10-100x faster queries on indexed columns
- Efficient sorting and filtering
- Fast JSONB queries with GIN indexes
- Composite indexes for common query patterns

#### 10.1.2 Query Optimization

**Cursor-Based Pagination**:
```sql
-- Efficient pagination (no OFFSET)
SELECT * FROM images 
WHERE user_id = $1 
  AND uploaded_at < $2 
ORDER BY uploaded_at DESC 
LIMIT $3;
```

**Benefits over OFFSET**:
- Consistent results (no skipped items)
- O(log n) complexity vs O(n)
- Better performance for large datasets

**Query Analysis**:
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM images WHERE user_id = '...';
```

#### 10.1.3 Connection Pooling

**Configuration**:
```typescript
const poolConfig = {
  max: 20,                    // Maximum connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000 // Timeout for acquiring connection
};
```

**Benefits**:
- Reuse database connections
- Reduce connection overhead
- Handle concurrent requests efficiently

### 10.2 Image Processing Optimization

#### 10.2.1 DICOM Conversion

**Optimization Techniques**:
1. **Streaming Processing**: Process large files in chunks
2. **Resize Large Images**: Max 2048x2048 for web viewing
3. **Compression**: PNG compression level 6 (balance speed/size)
4. **Caching**: Cache converted PNG files
5. **Background Processing**: Async conversion via job queue

**Performance Metrics**:
- Small DICOM (< 5MB): ~500ms conversion
- Large DICOM (> 20MB): ~2-3s conversion
- Thumbnail generation: ~100-200ms

#### 10.2.2 Thumbnail Generation

**Strategy**:
```typescript
await sharp(filePath)
  .resize(200, 200, {
    fit: 'inside',
    withoutEnlargement: true
  })
  .toFile(thumbnailPath);
```

**Benefits**:
- Fast gallery loading
- Reduced bandwidth usage
- Better user experience

#### 10.2.3 Image Caching

**Cache Strategy**:
1. Original files: Permanent storage
2. Converted PNG: Cache on first access
3. Thumbnails: Pre-generated on upload
4. Browser caching: Cache-Control headers

**Cache Headers**:
```typescript
res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
res.setHeader('ETag', imageId);
```

### 10.3 Background Job Processing

#### 10.3.1 In-Memory Queue Architecture

**Queue Configuration**:
```typescript
class InMemoryQueueService {
  private dicomQueue: Job[] = [];
  private thumbnailQueue: Job[] = [];
  private dicomWorkers = 3;      // Concurrent DICOM workers
  private thumbnailWorkers = 5;   // Concurrent thumbnail workers
}
```

**Job Processing Flow**:
```
1. Job added to queue
2. Worker picks up job
3. Process job (with retry logic)
4. Update job status
5. Remove from queue
6. Pick next job
```

**Retry Strategy**:
- Max retries: 3
- Backoff: Exponential (1s, 2s, 4s)
- Failed jobs logged for manual review

#### 10.3.2 Worker Concurrency

**DICOM Workers**: 3 concurrent
- CPU-intensive operations
- Limited by CPU cores

**Thumbnail Workers**: 5 concurrent
- I/O-intensive operations
- Can handle more concurrency

**Benefits**:
- Non-blocking uploads
- Better resource utilization
- Improved user experience

### 10.4 Frontend Performance

#### 10.4.1 Code Splitting

**Route-Based Splitting**:
```typescript
const AdminDashboard = lazy(() => import('./pages/AdminDashboardPage'));
const AnnotationViewer = lazy(() => import('./pages/AnnotationViewerPage'));
```

**Benefits**:
- Smaller initial bundle
- Faster page load
- Load code on demand

#### 10.4.2 Image Lazy Loading

**Implementation**:
```typescript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target as HTMLImageElement;
      img.src = img.dataset.src!;
      observer.unobserve(img);
    }
  });
}, { rootMargin: '50px' });
```

**Benefits**:
- Load images only when visible
- Reduced initial bandwidth
- Faster page rendering

#### 10.4.3 React Optimization

**Memoization**:
```typescript
// Memoize expensive computations
const filteredImages = useMemo(() => {
  return images.filter(img => img.format === selectedFormat);
}, [images, selectedFormat]);

// Memoize callbacks
const handleDelete = useCallback((id: string) => {
  deleteImage(id);
}, [deleteImage]);

// Memoize components
const ImageCard = React.memo(({ image }) => {
  return <div>...</div>;
});
```

**Benefits**:
- Prevent unnecessary re-renders
- Reduce computation overhead
- Improve responsiveness

#### 10.4.4 Bundle Optimization

**Vite Configuration**:
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          'dicom-vendor': ['cornerstone-core', 'dwv', 'dicom-parser']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true // Remove console.log in production
      }
    }
  }
});
```

**Bundle Sizes** (gzipped):
- Main bundle: ~150KB
- React vendor: ~130KB
- Chart vendor: ~60KB
- DICOM vendor: ~200KB

### 10.5 Network Optimization

#### 10.5.1 Compression

**Backend Compression**:
```typescript
import compression from 'compression';
app.use(compression());
```

**Compression Ratio**: ~70-80% size reduction for JSON/HTML

#### 10.5.2 HTTP/2

**Benefits**:
- Multiplexing (multiple requests over single connection)
- Header compression
- Server push (future enhancement)

**Nginx Configuration**:
```nginx
listen 443 ssl http2;
```

#### 10.5.3 CDN (Future Enhancement)

**Strategy**:
- Serve static assets from CDN
- Cache images at edge locations
- Reduce latency for global users

### 10.6 Monitoring & Profiling

#### 10.6.1 Performance Metrics

**Backend Metrics**:
- Request duration
- Database query time
- Job processing time
- Memory usage
- CPU usage

**Frontend Metrics**:
- Page load time
- Time to interactive
- First contentful paint
- Largest contentful paint

#### 10.6.2 Logging

**Winston Logger Configuration**:
```typescript
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

**Logged Information**:
- Request/response times
- Error stack traces
- Database query performance
- Job processing status

### 10.7 Scalability Considerations

#### 10.7.1 Horizontal Scaling

**Current Architecture**: Single server

**Future Scaling Options**:
1. **Load Balancer**: Nginx/HAProxy
2. **Multiple App Servers**: PM2 cluster mode
3. **Shared Storage**: NFS/S3 for images
4. **Redis**: Shared session/cache
5. **Database Replication**: Read replicas

#### 10.7.2 Vertical Scaling

**Resource Requirements**:
- **Small** (< 100 users): 2 CPU, 4GB RAM
- **Medium** (100-500 users): 4 CPU, 8GB RAM
- **Large** (500+ users): 8+ CPU, 16GB+ RAM

#### 10.7.3 Storage Scaling

**Current**: Local file system

**Future Options**:
1. **NFS**: Network file system
2. **S3**: Object storage (AWS/MinIO)
3. **Ceph**: Distributed storage
4. **Storage Tiering**: Hot/cold storage

### 10.8 Performance Benchmarks

**API Response Times** (p95):
- GET /api/images: < 100ms
- POST /api/upload/single: < 500ms (excluding file transfer)
- GET /api/images/:id/file: < 200ms (cached)
- POST /api/annotations: < 50ms

**Database Query Times** (p95):
- Simple SELECT: < 10ms
- JOIN queries: < 50ms
- JSONB queries: < 100ms

**Image Processing Times**:
- DICOM conversion: 500ms - 3s (size dependent)
- Thumbnail generation: 100-200ms
- ZIP extraction: 1-5s (size dependent)

---
## 11. Deployment Architecture

### 11.1 Deployment Options

#### 11.1.1 Docker Compose (Recommended)

**Architecture**:
```
┌─────────────────────────────────────────┐
│         Docker Host                      │
│  ┌────────────┐  ┌────────────┐         │
│  │  Frontend  │  │  Backend   │         │
│  │  Container │  │  Container │         │
│  │  (Nginx)   │  │  (Node.js) │         │
│  └────────────┘  └────────────┘         │
│         │               │                │
│         └───────┬───────┘                │
│                 │                        │
│         ┌───────▼────────┐               │
│         │   PostgreSQL   │               │
│         │   Container    │               │
│         └────────────────┘               │
│                                          │
│  Volumes:                                │
│  - postgres_data                         │
│  - ./storage (bind mount)                │
└─────────────────────────────────────────┘
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    container_name: mammogram-db
    environment:
      POSTGRES_DB: mammogram_viewer
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: mammogram-backend
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: mammogram_viewer
      DB_USER: postgres
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      STORAGE_ROOT: /app/storage
    ports:
      - "3000:3000"
    volumes:
      - ./storage:/app/storage
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: mammogram-frontend
    ports:
      - "5173:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

**Deployment Commands**:
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

#### 11.1.2 Manual Deployment

**System Requirements**:
- Ubuntu 20.04+ / Debian 11+
- Node.js 18+
- PostgreSQL 14+
- Nginx
- PM2 (process manager)

**Deployment Steps**:

1. **Install Dependencies**:
```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Nginx
sudo apt-get install -y nginx

# PM2
sudo npm install -g pm2
```

2. **Setup Database**:
```bash
sudo -u postgres psql
CREATE DATABASE mammogram_viewer;
CREATE USER mammogram_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE mammogram_viewer TO mammogram_user;
\q
```

3. **Deploy Backend**:
```bash
cd backend
npm install --production
npm run build
npm run db:migrate
npm run db:seed

# Start with PM2
pm2 start dist/index.js --name mammogram-backend
pm2 save
pm2 startup
```

4. **Deploy Frontend**:
```bash
cd frontend
npm install
npm run build

# Copy build to nginx
sudo cp -r dist/* /var/www/mammogram-viewer/
```

5. **Configure Nginx**:
```nginx
server {
    listen 80;
    server_name xraycad.bosschn.in;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name xraycad.bosschn.in;
    
    ssl_certificate /etc/letsencrypt/live/xraycad.bosschn.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/xraycad.bosschn.in/privkey.pem;
    
    # Frontend
    location /mammogram {
        alias /var/www/mammogram-viewer;
        try_files $uri $uri/ /mammogram/index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for large uploads
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }
    
    # Increase max body size for uploads
    client_max_body_size 100M;
}
```

6. **SSL Certificate**:
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d xraycad.bosschn.in
```

### 11.2 Environment Configuration

#### 11.2.1 Backend Environment Variables

**Production .env**:
```env
# Server
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mammogram_viewer
DB_USER=mammogram_user
DB_PASSWORD=<strong-password>

# JWT
JWT_SECRET=<strong-random-secret-min-32-chars>
JWT_EXPIRES_IN=24h

# Storage
STORAGE_ROOT=/var/www/mammogram-storage

# CORS
CORS_ORIGIN=https://xraycad.bosschn.in

# Super Admin (change after first login)
SUPER_ADMIN_EMAIL=admin@xraycad.bosschn.in
SUPER_ADMIN_PASSWORD=<strong-password>
SUPER_ADMIN_USERNAME=Super Admin
```

#### 11.2.2 Frontend Environment Variables

**Production .env**:
```env
VITE_API_URL=https://xraycad.bosschn.in/api
VITE_BASE_PATH=/mammogram
```

### 11.3 Deployment Scripts

#### 11.3.1 deploy-production.sh
```bash
#!/bin/bash

echo "Starting production deployment..."

# Pull latest code
git pull origin main

# Backend deployment
echo "Deploying backend..."
cd backend
npm install --production
npm run build
npm run db:migrate
pm2 restart mammogram-backend

# Frontend deployment
echo "Deploying frontend..."
cd ../frontend
npm install
npm run build
sudo rm -rf /var/www/mammogram-viewer/*
sudo cp -r dist/* /var/www/mammogram-viewer/

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx

echo "Deployment complete!"
```

#### 11.3.2 start-app.sh
```bash
#!/bin/bash

# Start PostgreSQL
sudo systemctl start postgresql

# Start backend with PM2
cd backend
pm2 start dist/index.js --name mammogram-backend

# Start nginx
sudo systemctl start nginx

echo "Application started!"
```

#### 11.3.3 stop-app.sh
```bash
#!/bin/bash

# Stop backend
pm2 stop mammogram-backend

# Stop nginx
sudo systemctl stop nginx

echo "Application stopped!"
```

### 11.4 Backup & Recovery

#### 11.4.1 Database Backup

**Automated Backup Script**:
```bash
#!/bin/bash

BACKUP_DIR="/var/backups/mammogram"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U mammogram_user mammogram_viewer > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

**Cron Job** (daily at 2 AM):
```bash
0 2 * * * /path/to/backup-database.sh
```

#### 11.4.2 File Storage Backup

**Backup Script**:
```bash
#!/bin/bash

STORAGE_DIR="/var/www/mammogram-storage"
BACKUP_DIR="/var/backups/mammogram/storage"
DATE=$(date +%Y%m%d)

# Create incremental backup
rsync -av --delete $STORAGE_DIR/ $BACKUP_DIR/$DATE/

echo "Storage backup completed: $BACKUP_DIR/$DATE"
```

#### 11.4.3 Database Restore

```bash
# Restore from backup
gunzip -c /var/backups/mammogram/db_backup_20251208_020000.sql.gz | \
  psql -U mammogram_user mammogram_viewer
```

### 11.5 Monitoring & Logging

#### 11.5.1 Application Logs

**PM2 Logs**:
```bash
# View logs
pm2 logs mammogram-backend

# Log files location
~/.pm2/logs/mammogram-backend-out.log
~/.pm2/logs/mammogram-backend-error.log
```

**Winston Logs**:
```
backend/logs/
├── error.log
├── combined.log
└── access.log
```

#### 11.5.2 Nginx Logs

```
/var/log/nginx/
├── access.log
└── error.log
```

#### 11.5.3 System Monitoring

**PM2 Monitoring**:
```bash
# Monitor processes
pm2 monit

# Process status
pm2 status

# Resource usage
pm2 show mammogram-backend
```

**System Resources**:
```bash
# CPU and memory
htop

# Disk usage
df -h

# Database connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"
```

### 11.6 Health Checks

#### 11.6.1 Application Health Endpoint

**GET /health**:
```json
{
  "status": "ok",
  "database": "connected",
  "queueType": "in-memory",
  "storage": {
    "totalSize": 10737418240,
    "fileCount": 5000,
    "availableSpace": 53687091200
  },
  "timestamp": "2025-12-08T10:30:00Z"
}
```

#### 11.6.2 Monitoring Script

```bash
#!/bin/bash

# Check backend health
HEALTH=$(curl -s http://localhost:3000/health)
STATUS=$(echo $HEALTH | jq -r '.status')

if [ "$STATUS" != "ok" ]; then
    echo "Backend health check failed!"
    # Send alert (email, Slack, etc.)
    pm2 restart mammogram-backend
fi

# Check database
pg_isready -h localhost -U mammogram_user
if [ $? -ne 0 ]; then
    echo "Database connection failed!"
    # Send alert
fi

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "Disk usage above 80%!"
    # Send alert
fi
```

### 11.7 Scaling Strategy

#### 11.7.1 Vertical Scaling

**Resource Upgrades**:
- Increase CPU cores
- Add more RAM
- Faster storage (SSD)
- Increase database connections

#### 11.7.2 Horizontal Scaling (Future)

**Architecture**:
```
                    ┌─────────────┐
                    │ Load        │
                    │ Balancer    │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │ App     │       │ App     │       │ App     │
   │ Server 1│       │ Server 2│       │ Server 3│
   └────┬────┘       └────┬────┘       └────┬────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────▼──────┐
                    │ PostgreSQL  │
                    │ (Primary)   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ PostgreSQL  │
                    │ (Replica)   │
                    └─────────────┘
```

**Requirements**:
- Shared storage (NFS/S3)
- Redis for session/cache
- Database replication
- Load balancer (Nginx/HAProxy)

---
## 12. Development Workflow

### 12.1 Development Environment Setup

#### 12.1.1 Prerequisites

**Required Software**:
- Node.js 18+ (LTS)
- PostgreSQL 14+
- Git
- Code editor (VS Code recommended)

**Optional**:
- Docker & Docker Compose
- Postman (API testing)
- pgAdmin (database management)

#### 12.1.2 Initial Setup

```bash
# Clone repository
git clone https://github.com/your-org/mammogram-viewer.git
cd mammogram-viewer

# Install dependencies (monorepo)
npm install

# Setup backend
cd backend
cp .env.example .env
# Edit .env with your configuration

# Setup database
createdb mammogram_viewer
npm run db:migrate
npm run db:seed

# Setup frontend
cd ../frontend
cp .env.example .env
# Edit .env with backend URL

# Start development servers
cd ..
npm run dev  # Starts both backend and frontend
```

### 12.2 Project Structure

**Monorepo Structure**:
```
mammogram-viewer/
├── backend/              # Backend application
├── frontend/             # Frontend application
├── docs/                 # Documentation
├── scripts/              # Utility scripts
├── package.json          # Root package.json (workspaces)
├── docker-compose.yml    # Docker setup
└── README.md
```

### 12.3 Development Commands

#### 12.3.1 Backend Commands

```bash
cd backend

# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build TypeScript to JavaScript
npm start                # Start production server

# Database
npm run db:init          # Initialize database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed initial data
npm run db:setup         # Init + migrate + seed

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run type-check       # TypeScript type checking

# Utilities
npm run storage:cleanup  # Clean up old temp files
```

#### 12.3.2 Frontend Commands

```bash
cd frontend

# Development
npm run dev              # Start dev server (Vite)
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm test                 # Run tests
npm run test:ui          # Run tests with UI

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run type-check       # TypeScript type checking
```

#### 12.3.3 Root Commands

```bash
# Run both backend and frontend
npm run dev

# Build both
npm run build

# Test both
npm test
```

### 12.4 Git Workflow

#### 12.4.1 Branch Strategy

**Main Branches**:
- `main`: Production-ready code
- `develop`: Development branch (integration)

**Feature Branches**:
- `feature/feature-name`: New features
- `bugfix/bug-name`: Bug fixes
- `hotfix/issue-name`: Critical production fixes

**Branch Naming Convention**:
```
feature/user-authentication
bugfix/dicom-conversion-error
hotfix/security-vulnerability
```

#### 12.4.2 Commit Convention

**Format**: `type(scope): description`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```bash
git commit -m "feat(auth): add JWT token refresh"
git commit -m "fix(dicom): handle MONOCHROME1 images correctly"
git commit -m "docs(api): update authentication endpoints"
git commit -m "refactor(upload): extract file validation logic"
```

#### 12.4.3 Pull Request Process

1. **Create Feature Branch**:
```bash
git checkout -b feature/new-feature
```

2. **Make Changes and Commit**:
```bash
git add .
git commit -m "feat(scope): description"
```

3. **Push to Remote**:
```bash
git push origin feature/new-feature
```

4. **Create Pull Request**:
- Title: Clear description of changes
- Description: What, why, and how
- Link related issues
- Add reviewers

5. **Code Review**:
- Address review comments
- Update PR as needed

6. **Merge**:
- Squash and merge (preferred)
- Delete feature branch after merge

### 12.5 Testing Strategy

#### 12.5.1 Backend Testing

**Test Types**:
1. **Unit Tests**: Individual functions/methods
2. **Integration Tests**: API endpoints
3. **E2E Tests**: Complete workflows

**Test Structure**:
```typescript
describe('AuthService', () => {
  describe('register', () => {
    it('should create user with pending status', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        fullName: 'Test User'
      };
      
      const user = await authService.register(userData);
      
      expect(user.status).toBe('pending');
      expect(user.email).toBe(userData.email);
    });
    
    it('should throw error for duplicate email', async () => {
      // Test implementation
    });
  });
});
```

**Running Tests**:
```bash
# Run all tests
npm test

# Run specific test file
npm test -- auth.test.ts

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

#### 12.5.2 Frontend Testing

**Test Types**:
1. **Component Tests**: React components
2. **Hook Tests**: Custom hooks
3. **Integration Tests**: User interactions

**Test Example**:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from './LoginPage';

describe('LoginPage', () => {
  it('should render login form', () => {
    render(<LoginPage />);
    
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });
  
  it('should submit form with valid credentials', async () => {
    const onLogin = jest.fn();
    render(<LoginPage onLogin={onLogin} />);
    
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Password123!' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    
    await waitFor(() => {
      expect(onLogin).toHaveBeenCalled();
    });
  });
});
```

### 12.6 Code Quality Standards

#### 12.6.1 TypeScript Configuration

**tsconfig.json** (strict mode):
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

#### 12.6.2 ESLint Configuration

**Key Rules**:
- No unused variables
- Consistent code style
- TypeScript best practices
- React hooks rules (frontend)

#### 12.6.3 Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### 12.7 Documentation Standards

#### 12.7.1 Code Documentation

**Function Documentation**:
```typescript
/**
 * Convert DICOM buffer to PNG format
 * 
 * @param dicomBuffer - Raw DICOM file buffer
 * @param options - Conversion options (maxWidth, maxHeight, quality)
 * @returns PNG buffer
 * @throws Error if DICOM parsing fails
 * 
 * @example
 * const pngBuffer = await dicomConverter.convertToPNG(buffer, {
 *   maxWidth: 2048,
 *   maxHeight: 2048
 * });
 */
async convertToPNG(
  dicomBuffer: Buffer, 
  options?: ConversionOptions
): Promise<Buffer> {
  // Implementation
}
```

#### 12.7.2 API Documentation

**Endpoint Documentation**:
```typescript
/**
 * @route   POST /api/auth/login
 * @desc    Login user and get JWT token
 * @access  Public
 * @body    { email: string, password: string }
 * @returns { token: string, user: UserResponse }
 */
router.post('/login', async (req, res) => {
  // Implementation
});
```

#### 12.7.3 README Files

**Required Sections**:
- Overview
- Features
- Installation
- Usage
- API Reference
- Contributing
- License

### 12.8 Debugging

#### 12.8.1 Backend Debugging

**VS Code Launch Configuration**:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

**Console Logging**:
```typescript
console.log('[Service] Processing DICOM conversion:', imageId);
console.error('[Error] DICOM conversion failed:', error);
```

#### 12.8.2 Frontend Debugging

**React DevTools**: Browser extension for React debugging

**Console Logging**:
```typescript
console.log('User state:', user);
console.error('API error:', error);
```

**Network Tab**: Monitor API requests and responses

### 12.9 Performance Profiling

#### 12.9.1 Backend Profiling

**Query Performance**:
```typescript
const start = Date.now();
const result = await query('SELECT * FROM images WHERE user_id = $1', [userId]);
const duration = Date.now() - start;
console.log(`Query took ${duration}ms`);
```

**Memory Profiling**:
```bash
node --inspect dist/index.js
# Open chrome://inspect in Chrome
```

#### 12.9.2 Frontend Profiling

**React Profiler**:
```typescript
import { Profiler } from 'react';

<Profiler id="ImageGallery" onRender={onRenderCallback}>
  <ImageGallery />
</Profiler>
```

**Chrome DevTools**:
- Performance tab
- Memory tab
- Network tab

### 12.10 Troubleshooting

#### 12.10.1 Common Issues

**Database Connection Failed**:
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection settings in .env
DB_HOST=localhost
DB_PORT=5432
```

**DICOM Conversion Failed**:
```bash
# Check file is valid DICOM
file image.dcm

# Check logs for detailed error
tail -f backend/logs/error.log
```

**Frontend Build Failed**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

**Port Already in Use**:
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

---

## 13. Appendices

### 13.1 Glossary

**Terms**:
- **DICOM**: Digital Imaging and Communications in Medicine
- **AAN**: Custom mammogram format
- **JWT**: JSON Web Token
- **RBAC**: Role-Based Access Control
- **BI-RADS**: Breast Imaging Reporting and Data System
- **LabelMe**: Annotation format for AI training
- **GIN Index**: Generalized Inverted Index (PostgreSQL)
- **MONOCHROME1**: Inverted grayscale (white = 0)
- **MONOCHROME2**: Normal grayscale (black = 0)

### 13.2 References

**Technologies**:
- [Node.js Documentation](https://nodejs.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [DICOM Standard](https://www.dicomstandard.org/)

**Libraries**:
- [dicom-parser](https://github.com/cornerstonejs/dicomParser)
- [Sharp](https://sharp.pixelplumbing.com/)
- [Fabric.js](http://fabricjs.com/)
- [Chart.js](https://www.chartjs.org/)

### 13.3 Change Log

**Version 1.0.0** (December 2025):
- Initial release
- User authentication with approval workflow
- DICOM and multi-format image support
- Annotation system with 7 tools
- Ambulance licensing system
- Analytics dashboard
- LabelMe export for AI training
- In-memory job queue (Redis-free)
- Comprehensive admin controls

### 13.4 Future Enhancements

**Planned Features**:
1. **Real-time Collaboration**: Multiple users annotating simultaneously
2. **AI-Assisted Annotation**: Auto-detection of abnormalities
3. **PACS Integration**: Connect to hospital PACS systems
4. **Mobile App**: Native iOS/Android applications
5. **Telemedicine**: Video consultation integration
6. **Advanced Analytics**: ML-based insights
7. **Multi-language Support**: Internationalization
8. **Voice Commands**: Hands-free operation
9. **3D Visualization**: Tomosynthesis support
10. **Blockchain**: Immutable audit trail

---

## Document Information

**Document Version**: 1.0.0  
**Last Updated**: December 8, 2025  
**Authors**: Development Team  
**Status**: Final  

**Document History**:
- v1.0.0 (2025-12-08): Initial comprehensive technical specification

---

**End of Technical Specification Document**
