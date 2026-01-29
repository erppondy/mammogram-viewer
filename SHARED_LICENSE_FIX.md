# Shared License Image Access - Fix Applied

## Issue Description

Users with the same ambulance license were unable to see each other's images. The feature was correctly implemented in the code, but existing images in the database were missing the `license_id` field.

## Root Cause

When images were uploaded, the `license_id` field was not being populated in the `images` table, even though:
1. The users had valid `license_id` values
2. The code was correctly checking for shared access based on `license_id`
3. The database schema had the `license_id` column

This meant that the query `WHERE license_id = $1` would return no results because all images had `license_id = NULL`.

## Fix Applied

### 1. Database Migration

Created and executed migration `014_backfill_image_license_ids.sql` that:
- Updates all existing images to inherit the `license_id` from their uploader
- Verifies that no images are left without a license_id when their uploader has one

**SQL executed:**
```sql
UPDATE images i
SET license_id = u.license_id
FROM users u
WHERE i.user_id = u.id
AND u.license_id IS NOT NULL
AND i.license_id IS NULL;
```

### 2. Results

**Before Fix:**
- 15 images had `license_id = NULL` despite their uploaders having licenses
- Users could only see their own images
- Shared access queries returned 0 results

**After Fix:**
- All 15 images now have the correct `license_id`
- Users can see all images from their license
- Shared access is working correctly

### 3. Verification

Tested with two licenses:

#### License 1: "chennai"
- **Users:** 3 (nithish1@gmail.com, user1@gmail.com, user2@gmail.com)
- **Images:** 1 total
- **Result:** ✓ All 3 users can access the 1 image uploaded by user1

#### License 2: "Test Ambulance 2"
- **Users:** 3 (bassam@test.com, john@test.com, onkart@test.com)
- **Images:** 14 total
  - john@test.com: 7 images
  - onkart@test.com: 6 images
  - bassam@test.com: 1 image
- **Result:** ✓ All 3 users can access all 14 images

## How Shared Access Works

### Backend Logic (images.routes.ts)

All image endpoints check access using:
```typescript
const hasAccess = image.userId === user.id || 
                 (user.license_id && image.licenseId === user.license_id);
```

This allows access if:
1. User owns the image, OR
2. User shares the same license as the image

### Database Queries

Images are fetched by license:
```typescript
// Get all images for a license
const images = await imageRepository.findByLicenseId(user.license_id);

// Get images grouped by patient
SELECT i.*, m.patient_name 
FROM images i
LEFT JOIN image_metadata m ON i.id = m.image_id
WHERE i.license_id = $1
```

## Future Prevention

The upload route (`upload.routes.ts`) already correctly sets `license_id` when creating new images:

```typescript
const image = await imageRepository.create({
  userId: user.id,
  originalFilename: file.originalname,
  fileFormat: detectedFormat,
  fileSize: file.size,
  storagePath,
  licenseId: license?.id || null,  // ✓ Correctly set
});
```

All new uploads will automatically have the correct `license_id`.

## Testing

### Manual Testing Steps

1. **Login as User 1** (with license)
   - Upload an image
   - Note the image appears in gallery

2. **Login as User 2** (same license)
   - Check gallery
   - ✓ Should see User 1's image
   - ✓ Can view the image
   - ✓ Can download the image
   - ✓ Can annotate the image
   - ✓ Can delete the image

3. **Login as User 3** (different license)
   - Check gallery
   - ✓ Should NOT see User 1's or User 2's images

### Automated Testing

Run the verification scripts:

```bash
# Check database structure and data
node test-license-access.js

# Verify shared access between users
node verify-shared-access.js
```

## Files Modified

1. **Created:**
   - `backend/src/database/migrations/014_backfill_image_license_ids.sql` - Migration to fix existing data
   - `test-license-access.js` - Database verification script
   - `verify-shared-access.js` - Shared access verification script
   - `fix-image-license-ids.js` - One-time fix script (already executed)
   - `SHARED_LICENSE_FIX.md` - This documentation

2. **Existing (verified correct):**
   - `backend/src/routes/images.routes.ts` - Access control logic
   - `backend/src/routes/upload.routes.ts` - License ID assignment on upload
   - `backend/src/repositories/ImageRepository.ts` - License-based queries
   - `backend/src/middleware/licenseAuth.ts` - License validation

## Deployment Notes

### For Production Deployment

1. **Backup database** before applying migration
2. Run migration: `014_backfill_image_license_ids.sql`
3. Verify with test scripts
4. No application restart required (code was already correct)

### For New Installations

The migration will run automatically as part of the normal migration process. No special action needed.

## Summary

✓ **Issue:** Existing images missing `license_id` field  
✓ **Fix:** Database migration to backfill `license_id` from user's license  
✓ **Result:** Shared license access now working correctly  
✓ **Prevention:** Upload code already sets `license_id` for new images  
✓ **Verified:** Tested with multiple licenses and users  

The shared license image access feature is now fully functional!
