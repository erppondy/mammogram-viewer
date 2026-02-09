# Fix LICENSE_EXPIRED Login Error

## Issue
Login was failing with `LICENSE_EXPIRED` error because the backend was still checking for expired licenses even though we removed the expiry feature.

## Root Cause
When we removed the expiry feature from the frontend, we didn't fully remove all expiry checks from the backend:
- AuthService was still checking `license.status === 'expired'` and `new Date() > new Date(license.expiresAt)`
- License middleware was still checking expiry dates
- Auth routes were still handling LICENSE_EXPIRED errors

## Changes Made

### 1. AuthService.ts
- **Removed expiry check** from login method (line 132)
- **Updated LicenseStatus interface** - removed `expiresAt` and `daysUntilExpiry` fields
- **Updated buildLicenseStatus method** - removed expiry calculations

### 2. licenseAuth.ts (middleware)
- **Removed expiry check** that was blocking requests with expired licenses
- License middleware now only checks if license is active/revoked, not expired

### 3. auth.routes.ts
- **Removed LICENSE_EXPIRED error handling** from login route
- No longer returns LICENSE_EXPIRED error responses

## Before vs After

### Before (Broken):
```typescript
// AuthService - was checking expiry
if (license.status === 'expired' || new Date() > new Date(license.expiresAt)) {
  throw new Error('LICENSE_EXPIRED');
}

// Middleware - was checking expiry
if (new Date() > new Date(license.expiresAt)) {
  return res.status(403).json({ error: { code: 'LICENSE_EXPIRED' } });
}
```

### After (Fixed):
```typescript
// AuthService - only checks active/revoked
if (license.status !== 'active') {
  throw new Error('LICENSE_INACTIVE');
}

// Middleware - no expiry check, only status check
// (expiry check completely removed)
```

## Current License Validation

Licenses are now validated based on:
- ✅ **Status**: Must be 'active' (not 'revoked')
- ✅ **Existence**: License must exist in database
- ❌ **Expiry**: No longer checked (licenses effectively never expire)

## Impact

- **Existing licenses** with past expiry dates will now work
- **New licenses** are created with expiry set 100 years in future
- **Login** will succeed for all active licenses regardless of expiry date
- **Upload/API access** will work for all active licenses

## Testing

The admin user `admin@mammogram-viewer.com` should now be able to login successfully without the LICENSE_EXPIRED error.

## Related Changes
- License creation no longer requires duration (see LICENSE_CREATION_FIX.md)
- Frontend expiry displays removed (see EXPIRY_REMOVAL_COMPLETE_GUIDE.md)