# License Management API Implementation

This document describes the implementation of the Ambulance Licensing System API routes and middleware.

## Implemented Components

### 1. Middleware (`backend/src/middleware/licenseAuth.ts`)

#### `licensedUserMiddleware`
- Validates that authenticated users have a valid, active license
- Checks license status (must be 'active')
- Checks expiration date
- Attaches license object to request
- Returns appropriate error codes for various failure scenarios

#### `quotaCheckMiddleware`
- Validates that the license has not exceeded its upload quota
- Must be used after `licensedUserMiddleware`
- Returns 429 status code when quota is exceeded

#### `optionalLicenseMiddleware`
- Attaches license if user has one, but doesn't require it
- Useful for endpoints that support both licensed and non-licensed users
- Silently fails if license validation fails

### 2. License Routes (`backend/src/routes/licenses.routes.ts`)

All routes require admin authentication except the validate endpoint.

#### `POST /api/licenses`
- Create a new ambulance license
- Requires: ambulanceName, ambulanceContactEmail, uploadQuota, durationDays
- Optional: ambulanceContactPhone, ambulanceAddress, templateId
- Returns: Created license with generated license key

#### `GET /api/licenses`
- List all licenses with optional filtering
- Query params: status, ambulanceName, page, limit
- Returns: Array of licenses

#### `GET /api/licenses/:id`
- Get license details by ID
- Returns: License object or 404

#### `PUT /api/licenses/:id`
- Update license details
- Can update: ambulanceName, contact info, uploadQuota, expiresAt
- Returns: Updated license

#### `DELETE /api/licenses/:id/revoke`
- Revoke a license
- Requires: reason (minimum 5 characters)
- Returns: Success message

#### `POST /api/licenses/:id/extend`
- Extend license expiration date
- Requires: additionalDays OR newExpiryDate
- Returns: Updated license

#### `PUT /api/licenses/:id/quota`
- Update license upload quota
- Requires: newQuota (minimum 1)
- Returns: Updated license

#### `GET /api/licenses/validate/:key`
- Validate a license key (public endpoint)
- Returns: Validation result with license details

### 3. License Template Routes (`backend/src/routes/license-templates.routes.ts`)

All routes require admin authentication.

#### `POST /api/license-templates`
- Create a new license template
- Requires: templateName, defaultDurationDays, defaultUploadQuota
- Optional: description
- Returns: Created template

#### `GET /api/license-templates`
- List all templates
- Query params: activeOnly (boolean)
- Returns: Array of templates

#### `GET /api/license-templates/:id`
- Get template details by ID
- Returns: Template object or 404

#### `PUT /api/license-templates/:id`
- Update template details
- Returns: Updated template

#### `DELETE /api/license-templates/:id`
- Delete a template
- Returns: Success message or error if template is in use

### 4. Ambulance Statistics Routes (`backend/src/routes/ambulance-stats.routes.ts`)

All routes require admin authentication.

#### `GET /api/ambulance-stats`
- Get statistics for all ambulances
- Query params: status, sortBy, sortOrder
- Returns: Array of ambulance statistics

#### `GET /api/ambulance-stats/system`
- Get system-wide statistics
- Returns: Aggregated statistics across all ambulances

#### `GET /api/ambulance-stats/:licenseId`
- Get statistics for a specific ambulance
- Returns: Detailed statistics for one ambulance

#### `GET /api/ambulance-stats/:licenseId/activity`
- Get upload activity for a specific ambulance
- Query params: startDate, endDate
- Returns: Upload activity data

#### `GET /api/ambulance-stats/:licenseId/storage`
- Get storage usage for a specific ambulance
- Returns: Storage usage details

### 5. Enhanced Auth Routes (`backend/src/routes/auth.routes.ts`)

#### `POST /api/auth/register/ambulance`
- Register a new ambulance user with license key
- Requires: email, password, fullName, licenseKey
- Optional: professionalCredentials, ambulanceRole
- Validates license key before registration
- Auto-approves ambulance users
- Returns: Registration response with license status

#### `GET /api/auth/license-status`
- Get current user's license status
- Requires authentication
- Returns: License details including quota usage, expiry info, warnings

### 6. Enhanced Upload Routes (`backend/src/routes/upload.routes.ts`)

#### Updated `POST /api/upload`
- Now uses `optionalLicenseMiddleware` to support both licensed and non-licensed users
- Checks quota before upload for licensed users
- Stores `license_id` on uploaded images
- Increments license upload count after successful upload
- Returns license info in response for licensed users

### 7. Updated Repositories

#### ImageRepository (`backend/src/repositories/ImageRepository.ts`)
- Updated `create` method to accept and store `licenseId`
- Updated `mapRowToImage` to include `licenseId` field

## Integration Points

### Database Schema
The implementation assumes the following database tables exist:
- `ambulance_licenses` - License records
- `license_templates` - Template definitions
- `license_audit_log` - Audit trail
- `users.license_id` - User-license association
- `images.license_id` - Image-license tracking

### Services Used
- `LicenseService` - License CRUD and validation
- `LicenseTemplateService` - Template management
- `AmbulanceStatsService` - Statistics aggregation
- `AuthService` - Enhanced with ambulance user registration

### Error Handling
All routes implement consistent error handling with:
- Appropriate HTTP status codes
- Error codes for client identification
- Descriptive error messages
- Timestamps for logging

### Validation
All routes use the validation middleware with:
- Required field validation
- Type checking
- Custom validation for numeric ranges
- Email format validation
- String length validation

## Testing Recommendations

1. **License Creation Flow**
   - Create license as admin
   - Validate license key
   - Register user with license key
   - Upload image and verify quota increment

2. **Quota Management**
   - Upload until quota reached
   - Verify upload fails with 429
   - Increase quota as admin
   - Verify upload succeeds

3. **License Revocation**
   - Revoke license as admin
   - Verify user cannot login
   - Verify user cannot upload

4. **Statistics Accuracy**
   - Create multiple licenses
   - Upload images from different users
   - Verify statistics are correctly isolated
   - Verify system-wide aggregation

## Security Considerations

1. All admin operations require `super_admin` role
2. License validation happens on every upload
3. Quota checks prevent over-usage
4. Audit trail maintained for all license changes
5. License keys are validated before user registration
6. Expired/revoked licenses block access immediately

## Performance Optimizations

1. License validation results could be cached (5-minute TTL)
2. Statistics queries use aggregation at database level
3. Pagination supported for large result sets
4. Indexes on license_key, status, and expires_at fields

## Future Enhancements

1. Rate limiting per license
2. Geographic restrictions
3. License tiers with different features
4. Self-service license extension requests
5. Automated billing integration
6. Advanced analytics and reporting
