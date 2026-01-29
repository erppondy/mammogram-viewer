# Ambulance Licensing System - Design Document

## Overview

The Ambulance Licensing System extends the existing mammogram application to support multi-tenant ambulance operations. It introduces a licensing layer that controls access, tracks resource usage, and provides comprehensive monitoring dashboards for administrators. The system integrates with the existing user authentication and image upload infrastructure while adding ambulance-specific entities and business logic.

### Key Design Principles

1. **Minimal Disruption**: Extend existing authentication and upload flows without breaking current functionality
2. **Multi-Tenancy**: Support multiple ambulances with isolated data and usage tracking
3. **Resource Monitoring**: Track storage, uploads, and user counts per ambulance
4. **Scalability**: Design for hundreds of ambulances with thousands of users
5. **Audit Trail**: Maintain complete history of license changes and usage

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  - Admin Dashboard (License Management)                      │
│  - Ambulance Dashboard (Usage Monitoring)                    │
│  - Enhanced Upload Flow (License Validation)                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
├─────────────────────────────────────────────────────────────┤
│  - License Routes (/api/licenses)                            │
│  - License Template Routes (/api/license-templates)          │
│  - Ambulance Stats Routes (/api/ambulance-stats)             │
│  - Enhanced Auth Routes (License Validation)                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
├─────────────────────────────────────────────────────────────┤
│  - LicenseService (CRUD, Validation)                         │
│  - LicenseTemplateService (Template Management)              │
│  - AmbulanceStatsService (Usage Aggregation)                 │
│  - Enhanced AuthService (License Integration)                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Repository Layer                            │
├─────────────────────────────────────────────────────────────┤
│  - LicenseRepository                                         │
│  - LicenseTemplateRepository                                 │
│  - AmbulanceStatsRepository                                  │
│  - Enhanced UserRepository (Ambulance Association)           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
├─────────────────────────────────────────────────────────────┤
│  - ambulance_licenses                                        │
│  - license_templates                                         │
│  - license_audit_log                                         │
│  - users (extended with license_id)                          │
│  - images (tracked for quota)                                │
└─────────────────────────────────────────────────────────────┘
```

### Integration Points

1. **Authentication Flow**: Extended to validate ambulance license status
2. **Upload Flow**: Modified to track uploads against ambulance quota
3. **User Management**: Users associated with ambulance licenses
4. **Admin Dashboard**: New section for license management and monitoring

## Data Models

### Database Schema

#### ambulance_licenses Table

```sql
CREATE TABLE ambulance_licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_key VARCHAR(50) UNIQUE NOT NULL,
    ambulance_name VARCHAR(255) NOT NULL,
    ambulance_contact_email VARCHAR(255) NOT NULL,
    ambulance_contact_phone VARCHAR(50),
    ambulance_address TEXT,
    
    -- License parameters
    status VARCHAR(50) DEFAULT 'active', -- active, expired, revoked
    upload_quota INTEGER NOT NULL DEFAULT 1000,
    uploads_used INTEGER DEFAULT 0,
    
    -- Dates
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    revoked_by UUID REFERENCES users(id),
    revocation_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_license_key (license_key),
    INDEX idx_status (status),
    INDEX idx_expires_at (expires_at)
);
```

#### license_templates Table

```sql
CREATE TABLE license_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Default parameters
    default_duration_days INTEGER NOT NULL DEFAULT 365,
    default_upload_quota INTEGER NOT NULL DEFAULT 1000,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_template_name (template_name),
    INDEX idx_is_active (is_active)
);
```

#### license_audit_log Table

```sql
CREATE TABLE license_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_id UUID NOT NULL REFERENCES ambulance_licenses(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- created, modified, revoked, extended, quota_updated
    
    -- Change details
    changed_by UUID REFERENCES users(id),
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_license_id (license_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);
```

#### users Table Extension

```sql
-- Add license_id column to existing users table
ALTER TABLE users ADD COLUMN license_id UUID REFERENCES ambulance_licenses(id);
ALTER TABLE users ADD COLUMN ambulance_role VARCHAR(50); -- operator, supervisor, admin

CREATE INDEX idx_users_license_id ON users(license_id);
```

#### images Table Extension

```sql
-- Add license_id to track which ambulance uploaded the image
ALTER TABLE images ADD COLUMN license_id UUID REFERENCES ambulance_licenses(id);

CREATE INDEX idx_images_license_id ON images(license_id);
```

### TypeScript Models

#### License Model

```typescript
export interface AmbulanceLicense {
  id: string;
  licenseKey: string;
  ambulanceName: string;
  ambulanceContactEmail: string;
  ambulanceContactPhone: string | null;
  ambulanceAddress: string | null;
  
  status: 'active' | 'expired' | 'revoked';
  uploadQuota: number;
  uploadsUsed: number;
  
  issuedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  
  createdBy: string;
  revokedBy: string | null;
  revocationReason: string | null;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLicenseDTO {
  ambulanceName: string;
  ambulanceContactEmail: string;
  ambulanceContactPhone?: string;
  ambulanceAddress?: string;
  uploadQuota: number;
  durationDays: number;
  templateId?: string;
}

export interface UpdateLicenseDTO {
  ambulanceName?: string;
  ambulanceContactEmail?: string;
  ambulanceContactPhone?: string;
  ambulanceAddress?: string;
  uploadQuota?: number;
  expiresAt?: Date;
}

export interface RevokeLicenseDTO {
  reason: string;
}
```

#### License Template Model

```typescript
export interface LicenseTemplate {
  id: string;
  templateName: string;
  description: string | null;
  defaultDurationDays: number;
  defaultUploadQuota: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTemplateDTO {
  templateName: string;
  description?: string;
  defaultDurationDays: number;
  defaultUploadQuota: number;
}

export interface UpdateTemplateDTO {
  templateName?: string;
  description?: string;
  defaultDurationDays?: number;
  defaultUploadQuota?: number;
  isActive?: boolean;
}
```

#### Ambulance Statistics Model

```typescript
export interface AmbulanceStats {
  licenseId: string;
  ambulanceName: string;
  licenseStatus: string;
  
  // Usage metrics
  totalImages: number;
  totalStorageBytes: number;
  totalStorageMB: number;
  totalStorageGB: number;
  
  // User metrics
  totalUsers: number;
  activeUsers: number;
  
  // Quota metrics
  uploadQuota: number;
  uploadsUsed: number;
  uploadsRemaining: number;
  quotaUsagePercent: number;
  
  // Date metrics
  expiresAt: Date;
  daysUntilExpiry: number;
  
  // Activity metrics
  lastUploadAt: Date | null;
  uploadsToday: number;
  uploadsThisWeek: number;
  uploadsThisMonth: number;
}

export interface SystemStats {
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  revokedLicenses: number;
  
  totalAmbulanceUsers: number;
  totalImages: number;
  totalStorageGB: number;
  
  averageImagesPerAmbulance: number;
  averageStoragePerAmbulance: number;
}
```

## Components and Interfaces

### Backend Services

#### LicenseService

```typescript
class LicenseService {
  // CRUD operations
  async createLicense(data: CreateLicenseDTO, adminId: string): Promise<AmbulanceLicense>
  async getLicenseById(id: string): Promise<AmbulanceLicense | null>
  async getLicenseByKey(key: string): Promise<AmbulanceLicense | null>
  async getAllLicenses(filters?: LicenseFilters): Promise<AmbulanceLicense[]>
  async updateLicense(id: string, data: UpdateLicenseDTO, adminId: string): Promise<AmbulanceLicense>
  async revokeLicense(id: string, data: RevokeLicenseDTO, adminId: string): Promise<void>
  
  // Validation
  async validateLicense(licenseKey: string): Promise<LicenseValidation>
  async checkQuotaAvailable(licenseId: string): Promise<boolean>
  
  // Quota management
  async incrementUploadCount(licenseId: string): Promise<void>
  async updateQuota(licenseId: string, newQuota: number, adminId: string): Promise<void>
  
  // Status management
  async expireLicenses(): Promise<number> // Background job
  
  // Key generation
  generateLicenseKey(): string
}
```

#### LicenseTemplateService

```typescript
class LicenseTemplateService {
  async createTemplate(data: CreateTemplateDTO): Promise<LicenseTemplate>
  async getTemplateById(id: string): Promise<LicenseTemplate | null>
  async getAllTemplates(activeOnly?: boolean): Promise<LicenseTemplate[]>
  async updateTemplate(id: string, data: UpdateTemplateDTO): Promise<LicenseTemplate>
  async deleteTemplate(id: string): Promise<void>
  async applyTemplate(templateId: string, licenseData: Partial<CreateLicenseDTO>): Promise<CreateLicenseDTO>
}
```

#### AmbulanceStatsService

```typescript
class AmbulanceStatsService {
  // Individual ambulance stats
  async getAmbulanceStats(licenseId: string): Promise<AmbulanceStats>
  async getAmbulanceStorageUsage(licenseId: string): Promise<StorageUsage>
  async getAmbulanceUploadActivity(licenseId: string, dateRange?: DateRange): Promise<UploadActivity[]>
  
  // System-wide stats
  async getSystemStats(): Promise<SystemStats>
  async getAllAmbulanceStats(filters?: StatsFilters): Promise<AmbulanceStats[]>
  
  // Export
  async exportStatsToCSV(licenseId?: string): Promise<Buffer>
  async exportStatsToPDF(licenseId?: string): Promise<Buffer>
}
```

### API Endpoints

#### License Management Routes

```
POST   /api/licenses                    - Create new license (admin only)
GET    /api/licenses                    - List all licenses (admin only)
GET    /api/licenses/:id                - Get license details (admin only)
PUT    /api/licenses/:id                - Update license (admin only)
DELETE /api/licenses/:id/revoke         - Revoke license (admin only)
POST   /api/licenses/:id/extend         - Extend license expiration (admin only)
PUT    /api/licenses/:id/quota          - Update upload quota (admin only)
GET    /api/licenses/validate/:key      - Validate license key (public)
```

#### License Template Routes

```
POST   /api/license-templates           - Create template (admin only)
GET    /api/license-templates           - List templates (admin only)
GET    /api/license-templates/:id       - Get template (admin only)
PUT    /api/license-templates/:id       - Update template (admin only)
DELETE /api/license-templates/:id       - Delete template (admin only)
```

#### Ambulance Statistics Routes

```
GET    /api/ambulance-stats             - Get all ambulance stats (admin only)
GET    /api/ambulance-stats/:licenseId  - Get specific ambulance stats (admin only)
GET    /api/ambulance-stats/system      - Get system-wide stats (admin only)
GET    /api/ambulance-stats/:licenseId/export/csv  - Export stats as CSV (admin only)
GET    /api/ambulance-stats/:licenseId/export/pdf  - Export stats as PDF (admin only)
```

#### Enhanced Auth Routes

```
POST   /api/auth/register/ambulance     - Register ambulance user with license key
GET    /api/auth/license-status         - Get current user's license status
```

### Frontend Components

#### Admin Dashboard Components

```typescript
// License Management
<LicenseManagementTable />          // List all licenses with filters
<CreateLicenseModal />              // Create new license form
<EditLicenseModal />                // Edit license details
<RevokeLicenseModal />              // Revoke license with reason
<LicenseDetailsPanel />             // Detailed license information

// Template Management
<LicenseTemplateManager />          // Manage license templates
<CreateTemplateModal />             // Create new template

// Statistics Dashboard
<SystemStatsOverview />             // System-wide statistics cards
<AmbulanceStatsTable />             // Table of all ambulance statistics
<AmbulanceDetailsDashboard />       // Detailed stats for one ambulance
<StorageUsageChart />               // Storage usage visualization
<UploadActivityChart />             // Upload activity over time
<QuotaUsageIndicator />             // Visual quota usage indicator
```

#### Ambulance User Components

```typescript
<AmbulanceLicenseStatus />          // Display license status and quota
<UploadQuotaWarning />              // Warning when quota is low
<LicenseExpiryNotice />             // Notice when license is expiring
```

## Authentication and Authorization

### Enhanced Authentication Flow

1. **Ambulance User Registration**:
   - User provides license key during registration
   - System validates license key (active, not expired)
   - User is associated with ambulance license
   - User account created with `license_id` field populated

2. **Login Validation**:
   - Existing user authentication
   - Additional check: validate associated license status
   - Reject login if license is expired or revoked
   - Return license status in auth response

3. **Upload Authorization**:
   - Check user's associated license
   - Validate license is active and not expired
   - Check upload quota not exceeded
   - Increment upload count on successful upload
   - Associate uploaded image with license_id

### Middleware

```typescript
// License validation middleware
export const licensedUserMiddleware = async (req, res, next) => {
  const user = req.user;
  
  if (!user.license_id) {
    return res.status(403).json({ error: 'No license associated with user' });
  }
  
  const license = await licenseService.getLicenseById(user.license_id);
  
  if (!license || license.status !== 'active') {
    return res.status(403).json({ error: 'Invalid or inactive license' });
  }
  
  if (new Date() > license.expiresAt) {
    return res.status(403).json({ error: 'License expired' });
  }
  
  req.license = license;
  next();
};

// Quota check middleware
export const quotaCheckMiddleware = async (req, res, next) => {
  const license = req.license;
  
  if (license.uploadsUsed >= license.uploadQuota) {
    return res.status(429).json({ error: 'Upload quota exceeded' });
  }
  
  next();
};
```

### Role-Based Access Control

```typescript
// User roles extended
type UserRole = 'user' | 'super_admin' | 'ambulance_operator' | 'ambulance_supervisor';

// Permission checks
const canManageLicenses = (user: User) => user.role === 'super_admin';
const canViewAmbulanceStats = (user: User, licenseId: string) => 
  user.role === 'super_admin' || 
  (user.license_id === licenseId && user.ambulance_role === 'supervisor');
```

## Error Handling

### License-Specific Errors

```typescript
export class LicenseError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'LicenseError';
  }
}

// Error codes
const LICENSE_ERRORS = {
  INVALID_KEY: { code: 'INVALID_LICENSE_KEY', message: 'Invalid license key', status: 404 },
  EXPIRED: { code: 'LICENSE_EXPIRED', message: 'License has expired', status: 403 },
  REVOKED: { code: 'LICENSE_REVOKED', message: 'License has been revoked', status: 403 },
  QUOTA_EXCEEDED: { code: 'QUOTA_EXCEEDED', message: 'Upload quota exceeded', status: 429 },
  DUPLICATE_KEY: { code: 'DUPLICATE_KEY', message: 'License key already exists', status: 409 },
};
```

## Testing Strategy

### Unit Tests

1. **LicenseService Tests**:
   - License creation with valid data
   - License key generation uniqueness
   - License validation logic
   - Quota increment and checking
   - License expiration logic

2. **AmbulanceStatsService Tests**:
   - Statistics calculation accuracy
   - Storage aggregation
   - User counting
   - Date range filtering

3. **Repository Tests**:
   - CRUD operations
   - Query filtering
   - Audit log creation

### Integration Tests

1. **License Management Flow**:
   - Admin creates license
   - User registers with license key
   - User uploads image (quota incremented)
   - Admin views statistics
   - Admin revokes license
   - User upload fails after revocation

2. **Quota Management Flow**:
   - User uploads until quota reached
   - Upload fails when quota exceeded
   - Admin increases quota
   - User can upload again

3. **Statistics Accuracy**:
   - Create multiple ambulances with users
   - Upload images from different ambulances
   - Verify statistics are correctly isolated
   - Verify system-wide aggregation

### API Tests

1. **License Endpoints**:
   - Test all CRUD operations
   - Test authorization (admin only)
   - Test validation errors
   - Test concurrent operations

2. **Statistics Endpoints**:
   - Test data accuracy
   - Test filtering and pagination
   - Test export functionality
   - Test performance with large datasets

## Performance Considerations

### Database Optimization

1. **Indexes**:
   - `license_key` for fast lookups during authentication
   - `status` and `expires_at` for filtering active licenses
   - `license_id` on users and images for join performance

2. **Query Optimization**:
   - Use aggregation queries for statistics
   - Cache frequently accessed license data
   - Batch update operations for quota increments

3. **Archival Strategy**:
   - Archive expired licenses after 1 year
   - Archive audit logs after 2 years
   - Maintain statistics snapshots for historical reporting

### Caching Strategy

```typescript
// Cache license validation results
const licenseCache = new Map<string, { license: AmbulanceLicense, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedLicense(licenseKey: string): Promise<AmbulanceLicense | null> {
  const cached = licenseCache.get(licenseKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.license;
  }
  
  const license = await licenseRepository.findByKey(licenseKey);
  
  if (license) {
    licenseCache.set(licenseKey, { license, timestamp: Date.now() });
  }
  
  return license;
}
```

### Background Jobs

1. **License Expiration Job**:
   - Run daily at midnight
   - Update status of expired licenses
   - Clear cache for expired licenses

2. **Statistics Aggregation Job**:
   - Run hourly
   - Pre-calculate statistics for dashboard
   - Store in materialized view or cache

3. **Audit Log Cleanup Job**:
   - Run weekly
   - Archive old audit logs
   - Maintain last 90 days in hot storage

## Security Considerations

### License Key Security

1. **Key Generation**:
   - Use cryptographically secure random generation
   - Format: `AMB-XXXX-XXXX-XXXX-XXXX` (20 characters)
   - Check for uniqueness before issuing

2. **Key Storage**:
   - Store in database with unique constraint
   - Index for fast lookup
   - No encryption needed (not a secret)

### Access Control

1. **Admin Operations**:
   - Require `super_admin` role
   - Log all license modifications
   - Require reason for revocations

2. **Ambulance User Operations**:
   - Users can only view their own license status
   - Users cannot modify license parameters
   - Upload operations validate license in real-time

### Audit Trail

1. **License Changes**:
   - Log all create, update, revoke operations
   - Store old and new values
   - Record admin who made the change

2. **Usage Tracking**:
   - Log every upload with license_id
   - Track quota increments
   - Monitor for unusual patterns

## Migration Strategy

### Phase 1: Database Schema

1. Create new tables (licenses, templates, audit_log)
2. Add columns to existing tables (users.license_id, images.license_id)
3. Create indexes
4. Test migrations on staging

### Phase 2: Backend Implementation

1. Implement models and repositories
2. Implement services
3. Add API routes
4. Add middleware
5. Write tests

### Phase 3: Frontend Implementation

1. Create admin dashboard components
2. Create ambulance user components
3. Integrate with existing upload flow
4. Add license status indicators

### Phase 4: Data Migration

1. Create default license template
2. Optionally create licenses for existing users
3. Associate existing users with licenses
4. Backfill license_id on existing images

### Phase 5: Deployment

1. Deploy database migrations
2. Deploy backend changes
3. Deploy frontend changes
4. Monitor for issues
5. Enable license validation

## Future Enhancements

1. **Geographic Restrictions**: Limit license usage to specific regions
2. **API Rate Limiting**: Per-license API rate limits
3. **License Tiers**: Bronze, Silver, Gold with different features
4. **Self-Service Portal**: Ambulances can request license extensions
5. **Billing Integration**: Connect licenses to billing system
6. **Multi-Region Support**: Licenses valid across multiple regions
7. **Advanced Analytics**: ML-based usage predictions and anomaly detection
8. **Mobile App Support**: License validation in mobile applications
