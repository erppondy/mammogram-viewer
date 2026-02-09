# Ambulance Doctor Role - Annotate Button Fix

## Issue
When registering as an ambulance user with `ambulanceRole = 'doctor'`, the annotate button was not visible in the image gallery.

## Root Cause
The frontend code only checked if `role === 'doctor'` to show the annotate button, but didn't check for `ambulanceRole === 'doctor'`.

## Changes Made

### 1. Backend - User Model (`backend/src/models/User.ts`)
- Updated `AmbulanceRole` type to explicitly include 'doctor':
  ```typescript
  export type AmbulanceRole = 'operator' | 'supervisor' | 'admin' | 'doctor';
  ```

### 2. Frontend - Image Gallery (`frontend/src/components/ImageGallery.tsx`)
- Updated the doctor role check to include ambulance users with doctor role:
  ```typescript
  const isDoctorRole = userResponse.data?.role === 'doctor' || userResponse.data?.ambulanceRole === 'doctor';
  ```

### 3. Database
- No changes needed - the database constraint already supports 'doctor' as a valid ambulance role (see migration `013_update_ambulance_role_constraint.sql`)

## Result
Now when an ambulance user registers with `ambulanceRole: 'doctor'`, they will see the annotate button (✏️) next to each image in both folder and grid views, allowing them to annotate images.

## Testing
To test this fix:
1. Register a new ambulance user with `ambulanceRole: 'doctor'`
2. Login with that user
3. Navigate to the image gallery
4. Verify that the "Annotate" button is visible for each image
5. Click the annotate button to ensure it navigates to the annotation page

## Related Files
- `backend/src/models/User.ts` - User type definitions
- `frontend/src/components/ImageGallery.tsx` - Image gallery component
- `backend/src/database/migrations/013_update_ambulance_role_constraint.sql` - Database constraint
