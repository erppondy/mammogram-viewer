# License Creation Fix - Removed Expiry Requirement

## Issue
License creation was failing because the backend still required `durationDays` field, which was removed from the frontend when we eliminated the expiry feature.

## Root Cause
After removing expiry functionality from the frontend, the backend still had validation requiring `durationDays` to calculate the expiration date.

## Changes Made

### Backend Models
1. **AmbulanceLicense.ts** - `CreateLicenseDTO`
   - Removed `durationDays: number` field (no longer required)
   - Kept `templateId` as optional

### Backend Services
2. **LicenseService.ts** - `createLicense()`
   - Removed `durationDays` validation
   - Changed expiry calculation to set date 100 years in future (effectively no expiry)
   - Removed `durationDays` from template default logic
   - Removed `expiresAt` from audit log new values

3. **LicenseService.ts** - `validateLicenseKey()`
   - Removed expiry date check
   - Licenses no longer fail validation due to expiration

### Backend Routes
4. **licenses.routes.ts** - Create license validation
   - Removed `durationDays` field requirement from validation schema

## How It Works Now

When creating a license:
1. Frontend sends: `ambulanceName`, `ambulanceContactEmail`, `uploadQuota`, etc.
2. Backend automatically sets `expiresAt` to 100 years in the future
3. License is created without requiring duration input
4. License validation no longer checks expiry dates
5. Licenses remain active until manually revoked

## Testing
To test the fix:
1. Login as super admin
2. Navigate to Admin Dashboard → License Management
3. Click "Create New License"
4. Fill in ambulance details and quota (no duration field)
5. Click "Create License"
6. License should be created successfully

## Notes
- Database still contains `expires_at` field for backward compatibility
- All existing licenses will continue to work
- License templates still have `defaultDurationDays` but it's not used for new licenses
- Future cleanup could remove duration fields from templates if desired
