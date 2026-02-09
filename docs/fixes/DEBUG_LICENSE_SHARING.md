# Debug License-Based Image Sharing

## Problem
Users with the same license are not seeing each other's images.

## Debugging Steps

### Step 1: Check Browser Console Logs

1. Open the application in your browser
2. Open Developer Tools (F12)
3. Go to the Console tab
4. Navigate to the Dashboard/Images page
5. Look for these log messages:

```
🔍 Loading images...
📦 API Response: {...}
📸 Total images loaded: X
👤 Current User ID: XXX
📊 Image Breakdown:
  - My uploads: X
  - Shared with me: X
  - Total: X
```

**What to check:**
- Is "Shared with me" count > 0?
- Are there any error messages?

### Step 2: Check Backend Logs

Look at your backend console for these messages:

```
🔍 [by-patient] User requesting images: {...}
📋 [by-patient] Fetching images for license: XXX
📊 [by-patient] Found images: X
📊 [by-patient] Image breakdown:
  - My uploads: X
  - Shared with me: X
  - Total: X
```

**What to check:**
- Does the user have a `licenseId`?
- Is the query using license-based filtering?
- Are shared images being found?

### Step 3: Use the Debug Endpoint

1. Login to the application
2. Open Developer Tools > Application > Local Storage
3. Copy your token
4. Run this command:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:3000/api/images/debug-license
```

This will show:
- Your user info and license_id
- All your images
- All images in your license
- All users in your license

### Step 4: Run the Test Script

```bash
# Get tokens for two users with the same license
# User 1: Login and copy token from localStorage
# User 2: Login and copy token from localStorage

node test-license-sharing.js "USER1_TOKEN" "USER2_TOKEN"
```

This will verify if license sharing is working between two specific users.

### Step 5: Check Database Directly

```sql
-- Check users and their licenses
SELECT id, email, full_name, license_id 
FROM users 
WHERE license_id IS NOT NULL
ORDER BY license_id;

-- Check images and their licenses
SELECT i.id, i.original_filename, i.user_id, i.license_id, u.email
FROM images i
LEFT JOIN users u ON i.user_id = u.id
WHERE i.license_id IS NOT NULL
ORDER BY i.license_id, i.user_id;

-- Check if license_id matches between users and their images
SELECT 
  u.email as user_email,
  u.license_id as user_license,
  i.id as image_id,
  i.original_filename,
  i.license_id as image_license,
  CASE 
    WHEN u.license_id = i.license_id THEN '✅ Match'
    ELSE '❌ Mismatch'
  END as status
FROM users u
LEFT JOIN images i ON i.user_id = u.id
WHERE u.license_id IS NOT NULL
ORDER BY u.email, i.id;
```

## Common Issues and Solutions

### Issue 1: Users don't have license_id

**Symptom:** User's `license_id` is NULL

**Solution:**
```sql
-- Assign users to a license
UPDATE users 
SET license_id = 'LICENSE_ID_HERE'
WHERE email IN ('user1@example.com', 'user2@example.com');
```

### Issue 2: Images don't have license_id

**Symptom:** Image's `license_id` is NULL even though user has license_id

**Solution:**
```sql
-- Backfill license_id for existing images
UPDATE images i
SET license_id = u.license_id
FROM users u
WHERE i.user_id = u.id
AND u.license_id IS NOT NULL
AND i.license_id IS NULL;
```

### Issue 3: License IDs don't match

**Symptom:** User's license_id doesn't match their images' license_id

**Solution:**
```sql
-- Fix mismatched license IDs
UPDATE images i
SET license_id = u.license_id
FROM users u
WHERE i.user_id = u.id
AND u.license_id IS NOT NULL;
```

### Issue 4: Frontend not showing shared images

**Symptom:** Backend returns shared images but frontend doesn't display them

**Check:**
1. Browser console for the image breakdown logs
2. Verify the uploader filter is set to "All Images" (not "My Uploads")
3. Check if `userId` field is being sent correctly in the API response

## Quick Fix Script

Run this to ensure all data is properly set up:

```sql
-- 1. Check current state
SELECT 
  'Users with licenses' as category,
  COUNT(*) as count
FROM users 
WHERE license_id IS NOT NULL

UNION ALL

SELECT 
  'Images with licenses' as category,
  COUNT(*) as count
FROM images 
WHERE license_id IS NOT NULL

UNION ALL

SELECT 
  'Images missing license_id' as category,
  COUNT(*) as count
FROM images i
JOIN users u ON i.user_id = u.id
WHERE u.license_id IS NOT NULL 
AND i.license_id IS NULL;

-- 2. Fix missing license IDs on images
UPDATE images i
SET license_id = u.license_id
FROM users u
WHERE i.user_id = u.id
AND u.license_id IS NOT NULL
AND i.license_id IS NULL;

-- 3. Verify fix
SELECT 
  u.email,
  u.license_id as user_license,
  COUNT(i.id) as image_count,
  COUNT(CASE WHEN i.license_id = u.license_id THEN 1 END) as matching_images
FROM users u
LEFT JOIN images i ON i.user_id = u.id
WHERE u.license_id IS NOT NULL
GROUP BY u.id, u.email, u.license_id;
```

## Testing Checklist

- [ ] Users have `license_id` set in database
- [ ] Images have `license_id` set in database
- [ ] User's `license_id` matches their images' `license_id`
- [ ] Multiple users share the same `license_id`
- [ ] Backend logs show "Shared with me" count > 0
- [ ] Frontend logs show "Shared with me" count > 0
- [ ] Frontend filter shows correct counts for "All Images", "My Uploads", "Shared with Me"
- [ ] Shared images display with uploader name/email
- [ ] Can view, download, and annotate shared images

## Need More Help?

If the issue persists after following these steps, collect:
1. Browser console logs (full output)
2. Backend console logs (full output)
3. Output from the debug endpoint
4. Database query results

This will help identify the exact issue.
