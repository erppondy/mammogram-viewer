# DICOM Viewer Fix - December 8, 2025

## Issues Found and Fixed

### 1. Analytics Tracking Error - NULL user_id
**Problem**: The `user_activity` table was receiving `null` for `user_id`, causing constraint violations.

**Root Cause**: The `activityTracker` middleware was using `user.userId` instead of `user.id`.

**Fix**: Updated `backend/src/middleware/activityTracker.ts` to use `user.id` instead of `user.userId`.

### 2. Analytics Tracking Error - Invalid UUID "NaN"
**Problem**: The analytics tracking was trying to use "NaN" as a UUID for `resource_id`, causing PostgreSQL errors.

**Root Cause**: The middleware was calling `parseInt(req.params.id)` on UUID strings, which returns `NaN`. The database schema uses UUID for `resource_id`, not integers.

**Fix**: 
- Updated `activityTracker.ts` to pass UUID strings directly without parsing
- Updated `AnalyticsService.ts` to accept string UUIDs instead of numbers
- Updated `AnalyticsRepository.ts` to accept string UUIDs instead of numbers

## DICOM Conversion Status

✅ **DICOM conversion is working correctly!**

The logs show successful DICOM to PNG conversion:
```
[DicomConverter] ========== CONVERSION COMPLETE ==========
PNG buffer created, size: 483673 bytes
```

The DICOM viewer should now work properly without analytics errors blocking the requests.

## Files Modified

1. `backend/src/middleware/activityTracker.ts`
   - Changed `user.userId` → `user.id`
   - Changed `parseInt(req.params.id)` → `req.params.id`

2. `backend/src/services/AnalyticsService.ts`
   - Changed `userId: number` → `userId: string`
   - Changed `imageId: number` → `imageId: string`
   - Changed `resourceId?: number` → `resourceId?: string`

3. `backend/src/repositories/AnalyticsRepository.ts`
   - Changed `userId: number` → `userId: string`
   - Changed `imageId: number` → `imageId: string`
   - Changed `resourceId?: number` → `resourceId?: string`

## Testing

The backend has been recompiled successfully. To apply the changes:

```bash
# Restart the backend server
./stop-app.sh
./start-app.sh
```

Or if running manually:
```bash
pm2 restart mammogram-backend
```

## Verification

After restarting, the following should work without errors:
- Viewing DICOM images in the gallery
- Opening DICOM images in the viewer
- No more "null value in column user_id" errors
- No more "invalid input syntax for type uuid: NaN" errors
