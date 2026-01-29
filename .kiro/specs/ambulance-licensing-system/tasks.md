# Implementation Plan

- [x] 1. Set up database schema and core data models
  - Create migration for ambulance_licenses table (id, license_key, ambulance_name, contact info, status, quota, dates)
  - Create migration for license_templates table (template_name, default_duration_days, default_upload_quota)
  - Create migration for license_audit_log table (license_id, action, changed_by, old_values, new_values)
  - Add license_id and ambulance_role columns to users table
  - Add license_id column to images table
  - Create all TypeScript models and DTOs (AmbulanceLicense, LicenseTemplate, AmbulanceStats, SystemStats)
  - Add indexes for performance optimization
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 7.1, 7.2, 9.1, 9.2, 10.1_

- [x] 2. Implement backend repositories and data access layer
  - Create LicenseRepository with CRUD methods, filtering, quota increment, status updates
  - Create LicenseTemplateRepository with CRUD and template application logic
  - Create LicenseAuditRepository for audit logging
  - Create AmbulanceStatsRepository with SQL aggregation queries for images, storage, users
  - Extend UserRepository to support license association and user counting per license
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 7.1, 7.2, 7.3, 8.1, 9.1, 9.2, 10.1, 10.2, 10.3_

- [x] 3. Implement backend services with business logic
  - Create LicenseService with license key generation (AMB-XXXX-XXXX-XXXX-XXXX), validation, CRUD operations, quota management, audit logging
  - Create LicenseTemplateService for template management
  - Create AmbulanceStatsService to calculate statistics (storage in MB/GB, quota %, days until expiry, upload activity)
  - Extend AuthService to accept license key during registration, validate license on login, return license status
  - Implement background job method for automatic license expiration
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.5, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 9.1, 9.2, 9.3, 9.4_

- [x] 4. Create API routes and middleware for license management
  - Create license validation middleware (licensedUserMiddleware, quotaCheckMiddleware)
  - Implement /api/licenses routes (POST create, GET list, GET :id, PUT :id, DELETE :id/revoke, POST :id/extend, PUT :id/quota)
  - Implement /api/license-templates routes (POST, GET, GET :id, PUT :id, DELETE :id)
  - Implement /api/ambulance-stats routes (GET all, GET :licenseId, GET system, GET :licenseId/activity)
  - Create /api/auth/register/ambulance and /api/auth/license-status endpoints
  - Integrate license validation into existing upload routes
  - Update upload handler to increment quota and store license_id on images
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 7.1, 7.2, 8.1, 8.2, 9.1, 9.2_

- [x] 5. Create admin license management UI
  - Create LicenseManagementTable with filtering (status, ambulance name), sorting, and action buttons
  - Create CreateLicenseModal with form for ambulance details, quota, duration, and template selection
  - Create EditLicenseModal for updating license details, quota, and expiration
  - Create RevokeLicenseModal with reason input
  - Create LicenseDetailsPanel showing complete license info and audit history
  - Create LicenseTemplateManager with CRUD operations for templates
  - Integrate into AdminDashboardPage with navigation tabs
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 8.1, 8.2, 8.3, 8.4_

- [x] 6. Create admin statistics dashboard UI
  - Create SystemStatsOverview with cards for total licenses, users, images, storage
  - Create AmbulanceStatsTable showing all ambulances with usage metrics (images, storage, users, quota %)
  - Create AmbulanceDetailsDashboard for detailed single ambulance view
  - Create StorageUsageChart and UploadActivityChart for visualizations
  - Create QuotaUsageIndicator with progress bar and color coding (green/yellow/red)
  - Add filtering, sorting, and export capabilities
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 7. Create ambulance user UI components
  - Create AmbulanceLicenseStatus component showing expiry date and quota remaining
  - Create UploadQuotaWarning component (appears when quota < 20%)
  - Create LicenseExpiryNotice component (appears when expiry < 7 days)
  - Add license status indicator to user dashboard
  - Update UploadSection to display remaining quota and disable upload when exceeded
  - Add license validation checks on dashboard load
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 8. Extend registration and authentication flows
  - Add optional license key input field to RegisterPage
  - Add frontend license key format validation
  - Show license details after validation
  - Handle registration errors (invalid key, expired license)
  - Update login response to include license information
  - Create frontend API services (licenseService.ts, templateService.ts, ambulanceStatsService.ts)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2_

- [x] 9. Extend admin user management for ambulance users
  - Update UserManagementTable to show license_id and ambulance_role columns
  - Add ability to assign/unassign users to licenses
  - Add filter to view users by license
  - Update image details view to show license information
  - Add filter in admin dashboard to view images by license
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 7.1_

- [x] 10. Implement background job and end-to-end testing
  - Create scheduled job to automatically expire licenses daily
  - Test complete flow: admin creates license → user registers → uploads images → admin views stats
  - Test quota enforcement: uploads until quota reached → fails → admin increases → succeeds
  - Test license revocation: admin revokes → user cannot login/upload
  - Test license expiration: expires → user blocked → admin extends → user can access
  - Verify statistics accuracy (image counts, storage calculations, user counts)
  - Test all filtering, sorting, and error handling
  - _Requirements: 2.5, All requirements_
