# Frontend Troubleshooting - Shared Images Not Visible

## Issue
Users cannot see shared images in the web interface even though the database is correctly configured.

## Database Status
✅ **Database is FIXED** - All images have correct `license_id` values

## What to Check

### 1. Browser Console (Most Important!)

**Open Browser Developer Tools:**
- Chrome/Edge: Press `F12` or `Ctrl+Shift+I`
- Firefox: Press `F12` or `Ctrl+Shift+K`
- Safari: Press `Cmd+Option+I`

**Look for errors in the Console tab:**
- Red error messages
- Failed API calls
- JavaScript errors

### 2. Network Tab

**Check the API Response:**

1. Open Developer Tools → Network tab
2. Refresh the page
3. Look for request to `/images/by-patient`
4. Click on it to see the response

**Expected Response:**
```json
{
  "patients": [
    {
      "folder": "Patient Name",
      "patientName": "Patient Name",
      "patientId": "123",
      "imageCount": 5,
      "images": [...]
    }
  ]
}
```

**If you see an error response:**
- 401 Unauthorized → Token expired, need to re-login
- 403 Forbidden → Permission issue
- 500 Server Error → Backend problem

### 3. Check Which User is Logged In

**In Browser Console, type:**
```javascript
localStorage.getItem('token')
```

This shows your authentication token. If it's `null`, you need to login.

**To decode the token (see which user):**
```javascript
JSON.parse(atob(localStorage.getItem('token').split('.')[1]))
```

This shows: `userId`, `email`, `role`, `status`

### 4. Verify Backend is Running

**Check if backend is responding:**
```bash
curl http://localhost:5000/api/health
```

Or open in browser: `http://localhost:5000/api/health`

### 5. Check Backend Logs

**Look at the terminal where backend is running:**
- Should see: `Executed query` messages
- Look for errors or warnings

## Common Issues and Solutions

### Issue 1: "No images found" but database has images

**Cause:** User's `license_id` might be NULL in database

**Solution:**
```bash
node test-license-access.js
```

Look for: "Found X images where user has license but image doesn't"

If found, run:
```bash
node fix-image-license-ids.js
```

### Issue 2: API returns empty array

**Cause:** User doesn't have a license, or license has no images

**Check:**
```bash
node test-api-endpoint.js
```

This simulates the API call and shows what should be returned.

### Issue 3: Frontend shows loading forever

**Cause:** API call is failing or hanging

**Check:**
1. Browser Network tab - is the request completing?
2. Backend logs - is the query executing?
3. Database connection - is PostgreSQL running?

### Issue 4: Images show for one user but not another

**Cause:** Users might have different licenses

**Verify:**
```bash
node verify-shared-access.js
```

This shows which users share which licenses.

### Issue 5: Need to clear cache

**Try:**
1. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Open in Incognito/Private window

## Step-by-Step Debugging

### Step 1: Verify Database
```bash
node test-shared-access-simple.js
```

Expected output: "✅ SHARED LICENSE ACCESS IS WORKING CORRECTLY!"

### Step 2: Verify API Endpoint
```bash
node test-api-endpoint.js
```

Should show images grouped by patient folders.

### Step 3: Test in Browser

1. **Login as User 1** (e.g., john@test.com)
2. **Open Developer Tools** (F12)
3. **Go to Network tab**
4. **Navigate to Images page**
5. **Look for `/images/by-patient` request**
6. **Check the response** - should contain images

### Step 4: Check Response Data

**In Browser Console:**
```javascript
// Manually call the API
fetch('http://localhost:5000/api/images/by-patient', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => console.log('API Response:', data))
```

This shows exactly what the API returns.

## Quick Fixes

### Fix 1: Re-login
Sometimes the simplest solution works:
1. Logout
2. Clear browser cache
3. Login again

### Fix 2: Restart Backend
```bash
# Stop the backend (Ctrl+C)
# Start it again
npm run dev:backend
```

### Fix 3: Check Environment Variables
```bash
# In backend directory
cat .env | grep DB_
```

Verify database connection settings are correct.

## Expected Behavior

### For Users WITH Same License:

**User 1 (john@test.com) uploads 5 images**
- john@test.com sees: 5 images (all own)

**User 2 (onkart@test.com) logs in (same license)**
- onkart@test.com sees: 5 images (all shared from john)

**User 2 uploads 3 more images**
- john@test.com sees: 8 images (5 own + 3 shared)
- onkart@test.com sees: 8 images (3 own + 5 shared)

### For Users WITHOUT Same License:

**User 3 (different license) logs in**
- User 3 sees: Only their own images
- User 3 does NOT see john's or onkart's images

## Still Not Working?

### Collect Debug Information:

1. **Browser Console Screenshot**
2. **Network Tab Screenshot** (showing /images/by-patient request)
3. **Backend Terminal Output**
4. **Run all test scripts:**
   ```bash
   node test-license-access.js > debug-license.txt
   node test-api-endpoint.js > debug-api.txt
   node verify-shared-access.js > debug-verify.txt
   ```

### Check Backend Code:

The issue might be in:
- `backend/src/routes/images.routes.ts` - Line ~57 (GET /images/by-patient)
- `backend/src/middleware/auth.ts` - Token verification
- `frontend/src/components/ImageGallery.tsx` - Line ~57 (loadImages function)

## Test Accounts

Use these test accounts to verify shared access:

**License: "Test Ambulance 2"**
- john@test.com (7 images)
- onkart@test.com (6 images)  
- bassam@test.com (1 image)

All three should see all 14 images.

**License: "chennai"**
- user1@gmail.com (1 image)
- user2@gmail.com (0 images)
- nithish1@gmail.com (0 images)

All three should see the 1 image uploaded by user1.

## Summary Checklist

- [ ] Database has images with license_id set
- [ ] Backend is running without errors
- [ ] User is logged in (has valid token)
- [ ] User has a license_id in database
- [ ] API endpoint returns images
- [ ] Browser console shows no errors
- [ ] Network tab shows successful API call
- [ ] Frontend component is rendering

If all checkboxes are ✅ but still not working, there may be a frontend rendering issue in the ImageGallery component.
