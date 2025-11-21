# Design Document: Mammogram Viewer Application

## Overview

The Mammogram Viewer is a full-stack web application designed to handle medical imaging data with a focus on performance, security, and image quality preservation. The system uses a modern architecture with a React-based frontend, Node.js backend, and specialized medical imaging libraries for DICOM processing.

### Technology Stack

**Frontend:**
- React 18 with TypeScript for type safety
- Cornerstone.js / Cornerstone3D for DICOM rendering and medical image viewing
- dicomParser for DICOM metadata extraction
- React Query for efficient data fetching and caching
- Tailwind CSS for responsive UI design
- Fabric.js for image annotations and measurements

**Backend:**
- Node.js with Express.js
- TypeScript for type safety
- Multer for multipart file uploads with streaming support
- dcmjs-imaging for DICOM processing
- Sharp for image processing (JPEG, PNG, TIFF)
- AdmZip for ZIP file extraction
- PostgreSQL for metadata and user data storage
- Local filesystem storage for image files with organized directory structure

**Security:**
- JWT for authentication
- bcrypt for password hashing
- Helmet.js for security headers
- Rate limiting with express-rate-limit
- CORS configuration

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React UI   │  │  Cornerstone │  │  Image Cache │      │
│  │  Components  │  │    Viewer    │  │   Manager    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │ HTTPS/TLS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │     Auth     │  │ Rate Limiter │  │   Request    │      │
│  │  Middleware  │  │              │  │  Validator   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │     User     │  │    Upload    │  │    Image     │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Metadata   │  │  Processing  │  │    Export    │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │  Filesystem  │  │    Redis     │      │
│  │   Database   │  │   Storage    │  │    Cache     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Upload Flow Architecture

```
User Upload → Chunked Transfer → Validation → Format Detection
                                                      │
                    ┌─────────────────────────────────┼─────────────────────────┐
                    │                                 │                         │
                  DICOM                             .aan                    ZIP/Other
                    │                                 │                         │
                    ▼                                 ▼                         ▼
            DICOM Parser                      Custom Parser              Format Handler
                    │                                 │                         │
                    └─────────────────────────────────┴─────────────────────────┘
                                                      │
                                                      ▼
                                            Metadata Extraction
                                                      │
                                                      ▼
                                            Filesystem Storage + DB Record
                                                      │
                                                      ▼
                                            Thumbnail Generation
                                                      │
                                                      ▼
                                              Upload Complete
```

## Components and Interfaces

### Frontend Components

#### 1. Authentication Module
- **LoginForm**: User login interface
- **RegisterForm**: New user registration with validation
- **AuthProvider**: Context provider for authentication state
- **ProtectedRoute**: Route wrapper for authenticated access

#### 2. Upload Module
- **FileUploadZone**: Drag-and-drop upload interface with file type validation
- **UploadProgressBar**: Real-time upload progress with speed and ETA
- **BulkUploadManager**: Handles multiple file uploads with queue management
- **ResumableUploadHandler**: Manages chunked uploads with resume capability

#### 3. Image Viewer Module
- **ImageGallery**: Grid view of thumbnails with lazy loading
- **DicomViewer**: Cornerstone-based DICOM image renderer with window/level controls
- **StandardImageViewer**: Canvas-based viewer for JPEG/PNG/TIFF
- **ViewerToolbar**: Tools for zoom, pan, measurements, annotations
- **ComparisonView**: Side-by-side image comparison
- **MetadataPanel**: Display of image metadata and DICOM tags

#### 4. Image Management Module
- **ImageLibrary**: Searchable list of uploaded images
- **FilterPanel**: Search and filter controls
- **StudyOrganizer**: Groups images by patient and study
- **ImageActions**: Download, delete, share actions

### Backend Services

#### 1. UserService
```typescript
interface UserService {
  register(userData: RegisterDTO): Promise<User>
  login(credentials: LoginDTO): Promise<AuthToken>
  verifyToken(token: string): Promise<User>
  updateProfile(userId: string, updates: ProfileDTO): Promise<User>
}
```

#### 2. UploadService
```typescript
interface UploadService {
  initializeUpload(metadata: UploadMetadata): Promise<UploadSession>
  processChunk(sessionId: string, chunk: Buffer, offset: number): Promise<ChunkResult>
  finalizeUpload(sessionId: string): Promise<UploadedFile>
  validateFile(file: Buffer, format: string): Promise<ValidationResult>
}
```

#### 3. ImageService
```typescript
interface ImageService {
  getImage(imageId: string, userId: string): Promise<ImageData>
  getImageMetadata(imageId: string): Promise<Metadata>
  listImages(userId: string, filters: FilterOptions): Promise<ImageList>
  deleteImage(imageId: string, userId: string): Promise<void>
  generateThumbnail(imageId: string): Promise<Buffer>
  getImagePath(imageId: string): string
  ensureStorageDirectory(userId: string): Promise<void>
}
```

#### 4. ProcessingService
```typescript
interface ProcessingService {
  parseDicom(buffer: Buffer): Promise<DicomData>
  parseAan(buffer: Buffer): Promise<AanData>
  extractZip(buffer: Buffer): Promise<ExtractedFile[]>
  extractMetadata(file: Buffer, format: string): Promise<Metadata>
}
```

#### 5. MetadataService
```typescript
interface MetadataService {
  storeMetadata(imageId: string, metadata: Metadata): Promise<void>
  searchMetadata(query: SearchQuery): Promise<SearchResults>
  updateMetadata(imageId: string, updates: MetadataUpdate): Promise<void>
}
```

#### 6. ExportService
```typescript
interface ExportService {
  exportImage(imageId: string, format: ExportFormat): Promise<Buffer>
  exportBatch(imageIds: string[], format: ExportFormat): Promise<Buffer>
  createZipArchive(images: ImageData[]): Promise<Buffer>
}
```

## Data Models

### User Model
```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  professionalCredentials: string;
  isVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date;
}
```

### Image Model
```typescript
interface Image {
  id: string;
  userId: string;
  originalFilename: string;
  fileFormat: 'dicom' | 'aan' | 'jpeg' | 'png' | 'tiff';
  fileSize: number;
  storagePath: string;  // Relative path from storage root
  thumbnailPath: string;  // Relative path from storage root
  uploadedAt: Date;
  metadata: ImageMetadata;
}
```

### ImageMetadata Model
```typescript
interface ImageMetadata {
  patientId?: string;
  patientName?: string;
  studyDate?: Date;
  studyDescription?: string;
  modality?: string;
  imageWidth: number;
  imageHeight: number;
  bitDepth: number;
  colorSpace: string;
  dicomTags?: Record<string, any>;
  customTags?: Record<string, any>;
}
```

### UploadSession Model
```typescript
interface UploadSession {
  id: string;
  userId: string;
  filename: string;
  fileSize: number;
  uploadedBytes: number;
  chunkSize: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  expiresAt: Date;
}
```

### Filesystem Storage Structure

Images will be stored on the local filesystem within the project directory with the following structure:

```
project-root/
├── storage/
│   ├── images/
│   │   ├── user-{userId}/
│   │   │   ├── {year}/
│   │   │   │   ├── {month}/
│   │   │   │   │   ├── {imageId}.{extension}
│   │   │   │   │   └── ...
│   │   │   │   └── ...
│   │   │   └── ...
│   │   └── ...
│   ├── thumbnails/
│   │   ├── user-{userId}/
│   │   │   ├── {year}/
│   │   │   │   ├── {month}/
│   │   │   │   │   ├── {imageId}_thumb.jpg
│   │   │   │   │   └── ...
│   │   │   │   └── ...
│   │   │   └── ...
│   │   └── ...
│   └── temp/
│       ├── uploads/
│       │   └── {sessionId}/
│       └── processing/
```

**Storage Configuration:**
- Base storage path: `./storage` (relative to project root)
- Configurable via environment variable `STORAGE_ROOT` (defaults to `./storage`)
- Images organized by user ID, year, and month for efficient file management
- Thumbnails stored separately in JPEG format for fast loading
- Temporary directory for upload sessions and processing
- Automatic cleanup of temp files older than 24 hours
- Storage directory added to .gitignore to prevent committing uploaded files
- File permissions: 640 (owner read/write, group read)
- Directory permissions: 750 (owner full, group read/execute)

**Storage Service:**
```typescript
interface StorageService {
  saveFile(userId: string, imageId: string, buffer: Buffer, extension: string): Promise<string>
  getFile(storagePath: string): Promise<Buffer>
  deleteFile(storagePath: string): Promise<void>
  saveThumbnail(userId: string, imageId: string, buffer: Buffer): Promise<string>
  getThumbnail(thumbnailPath: string): Promise<Buffer>
  ensureDirectory(path: string): Promise<void>
  getStorageStats(): Promise<StorageStats>
}

interface StorageStats {
  totalSize: number;
  availableSpace: number;
  fileCount: number;
}
```

**Backup Strategy:**
- Daily incremental backups of storage directory
- Weekly full backups
- Backup retention: 30 days
- Backup location: Separate disk/volume for redundancy

### Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  professional_credentials VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);

-- Images table
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  original_filename VARCHAR(500) NOT NULL,
  file_format VARCHAR(50) NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  thumbnail_path VARCHAR(500),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_uploaded_at (uploaded_at)
);

-- Image metadata table
CREATE TABLE image_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  patient_id VARCHAR(255),
  patient_name VARCHAR(255),
  study_date DATE,
  study_description TEXT,
  modality VARCHAR(50),
  image_width INTEGER,
  image_height INTEGER,
  bit_depth INTEGER,
  color_space VARCHAR(50),
  dicom_tags JSONB,
  custom_tags JSONB,
  INDEX idx_patient_id (patient_id),
  INDEX idx_study_date (study_date),
  INDEX idx_modality (modality)
);

-- Upload sessions table
CREATE TABLE upload_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_bytes BIGINT DEFAULT 0,
  chunk_size INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);

-- Audit log table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);
```

## Error Handling

### Error Categories

1. **Validation Errors** (400)
   - Invalid file format
   - File size exceeds limit
   - Missing required fields
   - Invalid metadata

2. **Authentication Errors** (401)
   - Invalid credentials
   - Expired token
   - Missing authentication

3. **Authorization Errors** (403)
   - Insufficient permissions
   - Resource access denied

4. **Not Found Errors** (404)
   - Image not found
   - User not found
   - Upload session not found

5. **Server Errors** (500)
   - Database connection failure
   - Storage service unavailable
   - Processing failure

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  }
}
```

### Error Handling Strategy

- All errors are logged with context (user, action, timestamp)
- Client receives sanitized error messages (no sensitive data)
- Retry logic for transient failures (network, storage)
- Graceful degradation for non-critical features
- User-friendly error messages in the UI

## Performance Optimizations

### Upload Performance

1. **Chunked Uploads**: Files split into 5MB chunks for efficient transfer
2. **Resumable Uploads**: Store upload state in temp directory to resume interrupted transfers
3. **Streaming Writes**: Stream chunks directly to filesystem to minimize memory usage
4. **Progress Streaming**: Real-time progress updates via WebSocket or SSE
5. **Client-side Validation**: Validate file type/size before upload starts
6. **Disk Space Checks**: Verify available disk space before accepting uploads

### Viewing Performance

1. **Progressive Loading**: Load low-res preview first, then full resolution
2. **Image Caching**: Cache recently viewed images in browser (IndexedDB)
3. **Lazy Loading**: Load thumbnails only when visible in viewport
4. **Static File Serving**: Serve images via Express static middleware with caching headers
5. **Image Optimization**: Generate multiple resolutions for responsive delivery
6. **Web Workers**: Process DICOM parsing in background threads
7. **Stream Response**: Stream large files to client to reduce memory usage

### Database Performance

1. **Indexing**: Indexes on user_id, patient_id, study_date, uploaded_at
2. **Connection Pooling**: Maintain connection pool for database queries
3. **Query Optimization**: Use prepared statements and efficient joins
4. **Caching Layer**: Redis cache for frequently accessed metadata
5. **Pagination**: Limit query results with cursor-based pagination

### API Performance

1. **Response Compression**: Gzip compression for API responses
2. **Rate Limiting**: Prevent abuse with per-user rate limits
3. **Request Batching**: Batch multiple metadata requests
4. **Async Processing**: Queue heavy processing tasks (thumbnail generation)
5. **Load Balancing**: Distribute requests across multiple server instances

## Security Implementation

### Authentication Flow

1. User submits credentials
2. Server validates and generates JWT with 24h expiration
3. JWT includes user ID, email, and role
4. Client stores JWT in httpOnly cookie
5. Refresh token mechanism for extended sessions

### Data Encryption

1. **In Transit**: TLS 1.3 for all client-server communication
2. **At Rest**: AES-256 encryption for stored images in S3
3. **Database**: Encrypted connections to PostgreSQL
4. **Passwords**: bcrypt with salt rounds = 12

### Access Control

1. **User Isolation**: Users can only access their own images
2. **Role-Based Access**: Support for admin, radiologist, technician roles
3. **Resource Ownership**: Verify ownership before any operation
4. **Audit Logging**: Log all access and modifications

### Input Validation

1. **File Type Validation**: Magic number verification, not just extension
2. **File Size Limits**: Enforce 100MB limit at multiple layers
3. **Metadata Sanitization**: Escape and validate all metadata fields
4. **SQL Injection Prevention**: Use parameterized queries
5. **XSS Prevention**: Sanitize all user inputs

## Testing Strategy

### Unit Tests

- Service layer functions (upload, processing, metadata)
- Utility functions (validation, parsing, encryption)
- Data model methods
- Target: 80% code coverage

### Integration Tests

- API endpoint testing with supertest
- Database operations with test database
- Filesystem storage operations with temporary test directory
- Authentication and authorization flows

### End-to-End Tests

- User registration and login flow
- Complete upload workflow (single file, bulk)
- Image viewing and manipulation
- Search and filter functionality
- Export and download operations

### Performance Tests

- Load testing with Artillery or k6
- Upload performance with various file sizes
- Concurrent user simulation
- Database query performance
- Memory leak detection

### Security Tests

- Authentication bypass attempts
- SQL injection testing
- XSS vulnerability scanning
- File upload security (malicious files)
- Rate limiting verification

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer (ALB)                     │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  App Server  │    │  App Server  │    │  App Server  │
│   (Node.js)  │    │   (Node.js)  │    │   (Node.js)  │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │    │   Redis      │    │  Filesystem  │
│   (Primary)  │    │   Cache      │    │   Storage    │
└──────────────┘    └──────────────┘    └──────────────┘
        │
        ▼
┌──────────────┐
│  PostgreSQL  │
│  (Replica)   │
└──────────────┘
```

### Scaling Strategy

1. **Horizontal Scaling**: Add more app server instances behind load balancer with shared network storage (NFS/GlusterFS)
2. **Database Scaling**: Read replicas for query distribution
3. **Storage Scaling**: Monitor disk usage and expand volumes as needed, or migrate to distributed filesystem
4. **Cache Scaling**: Redis cluster for distributed caching
5. **Static Serving**: Nginx reverse proxy for efficient static file serving

### Monitoring and Logging

1. **Application Logs**: Structured logging with Winston
2. **Metrics**: Prometheus for metrics collection
3. **Dashboards**: Grafana for visualization
4. **Alerts**: PagerDuty integration for critical issues
5. **Tracing**: OpenTelemetry for distributed tracing
6. **Health Checks**: Endpoint for load balancer health monitoring

## Future Enhancements

1. **AI Integration**: Automated anomaly detection in mammograms
2. **Collaboration**: Share images with other users/institutions
3. **Mobile App**: Native iOS/Android applications
4. **PACS Integration**: Integration with existing PACS systems
5. **3D Reconstruction**: Support for tomosynthesis 3D viewing
6. **Reporting**: Generate structured reports from images
7. **Workflow Management**: Track image review status and assignments
