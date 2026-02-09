# Shared License Image Access Implementation

## Overview

Users registered with the same ambulance license can now view, download, annotate, and delete all images uploaded by any user within their ambulance organization.

## Changes Made

### Backend Changes

#### 1. Image Routes (`backend/src/routes/images.routes.ts`)

Updated all image access endpoints to check license-based access:

**Access Control Logic:**
```typescript
// User can access image if:
// 1. They own the image (image.userId === user.id), OR
// 2. They share the same license (user.license_id && image.licenseId === user.license_id)

const hasAccess = image.userId === user.id || 
                 (user.license_id && image.licenseId === user.license_id);
```

**Updated Endpoints:**

- `GET /api/images` - Returns all images from user's license (or own images if no license)
- `GET /api/images/by-patient` - Groups images by patient from entire license
- `GET /api/images/:id` - Access single image if license-shared
- `GET /api/images/:id/metadata` - Access metadata if license-shared
- `GET /api/images/:id/file` - View image file if license-shared
- `GET /api/images/:id/thumbnail` - View thumbnail if license-shared
- `GET /api/images/:id/download` - Download image if license-shared
- `DELETE /api/images/:id` - Delete image if license-shared
- `POST /api/images/download-zip` - Download multiple license-shared images
- `GET /api/images/folder/:folder/download-zip` - Download folder from license
- `DELETE /api/images/folder/:folder` - Delete folder from license

#### 2. Image Repository (`backend/src/repositories/ImageRepository.ts`)

Added new methods for license-based queries:

```typescript
// Find images by license with pagination
async findByLicenseId(licenseId: string, limit: number, offset: number): Promise<Image[]>

// Find images by license and patient folder
async findByLicenseIdAndFolder(licenseId: string, folder: string): Promise<Image[]>

// Find images by license with cursor-based pagination
async findByLicenseIdWithCursor(
  licenseId: string,
  limit: number,
  cursor?: string,
  direction: 'next' | 'prev'
): Promise<CursorPaginationResult<Image>>
```

### Behavior

#### For Users WITH Ambulance License:

- **View Images**: See all images uploaded by anyone in their ambulance
- **Download Images**: Download any image from their ambulance
- **Delete Images**: Delete any image from their ambulance (not just their own)
- **Annotate Images**: Create annotations on any image from their ambulance
- **Create Reports**: Create reports for any image from their ambulance
- **Patient Folders**: See all patients from their ambulance organization

#### For Users WITHOUT Ambulance License:

- **View Images**: See only their own uploaded images
- **Download Images**: Download only their own images
- **Delete Images**: Delete only their own images
- **Annotate Images**: Annotate only their own images
- **Create Reports**: Create reports only for their own images
- **Patient Folders**: See only their own patients

### Security Considerations

1. **License Validation**: All access checks verify that the license is active and not expired
2. **Isolation**: Users from different licenses cannot access each other's images
3. **Quota Sharing**: Upload quota is shared across all users in the same license
4. **Audit Trail**: All operations are logged with user_id for accountability

### Database Schema

The existing schema already supports this feature:

```sql
-- Users table has license_id
users.license_id -> ambulance_licenses.id

-- Images table has license_id
images.license_id -> ambulance_licenses.id

-- Access is granted when:
-- user.license_id = image.license_id
```

### Use Cases

#### Use Case 1: Multi-User Ambulance Team
- Ambulance has 5 operators using the same license
- Operator A uploads patient scans during morning shift
- Operator B (afternoon shift) can view and annotate the same scans
- Supervisor can review all scans from all operators

#### Use Case 2: Collaborative Diagnosis
- Operator uploads mammogram images
- Radiologist (same license) reviews and annotates findings
- Another radiologist can add second opinion on same images
- All team members see the complete patient history

#### Use Case 3: Shift Handover
- Night shift operator uploads emergency scans
- Day shift operator can immediately access and continue work
- No need to transfer files or share credentials
- Seamless continuity of care

### Testing

To test the shared access feature:

1. **Create a license** (as super_admin):
   ```bash
   POST /api/licenses
   {
     "ambulanceName": "Test Ambulance",
     "ambulanceContactEmail": "test@ambulance.com",
     "uploadQuota": 1000,
     "durationDays": 365
   }
   ```

2. **Register two users** with the same license key:
   ```bash
   POST /api/auth/register/ambulance
   {
     "email": "user1@test.com",
     "password": "password123",
     "fullName": "User One",
     "licenseKey": "AMB-XXXX-XXXX-XXXX-XXXX"
   }
   
   POST /api/auth/register/ambulance
   {
     "email": "user2@test.com",
     "password": "password123",
     "fullName": "User Two",
     "licenseKey": "AMB-XXXX-XXXX-XXXX-XXXX"
   }
   ```

3. **Upload image as User 1**:
   ```bash
   POST /api/upload (authenticated as user1@test.com)
   ```

4. **View images as User 2**:
   ```bash
   GET /api/images (authenticated as user2@test.com)
   # Should see images uploaded by User 1
   ```

5. **Verify isolation** - Register User 3 with different license:
   ```bash
   GET /api/images (authenticated as user3@test.com)
   # Should NOT see images from User 1 or User 2
   ```

### Migration Notes

- **No database migration required** - existing schema supports this feature
- **Backward compatible** - users without licenses continue to work as before
- **Existing images** - images uploaded before this change will be accessible based on their license_id field

### Future Enhancements

1. **Role-Based Permissions**: Different permissions for operators vs supervisors
2. **Image Ownership Indicator**: Show which user uploaded each image
3. **Activity Log**: Track who viewed/modified each image
4. **Selective Sharing**: Option to mark images as private within a license
5. **Cross-License Sharing**: Allow specific images to be shared between licenses

## Summary

Users with the same ambulance license now have full shared access to all images within their organization, enabling true collaborative workflows while maintaining security isolation between different ambulance organizations.
