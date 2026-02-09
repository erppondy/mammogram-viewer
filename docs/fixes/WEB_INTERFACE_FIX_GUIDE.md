# Web Interface - Shared Images Not Visible

## Quick Fix Steps

### Step 1: Test the API Directly

Open this file in your browser:
```
test-frontend-api.html
```

**Instructions:**
1. Enter your email and password (e.g., john@test.com)
2. Click "Login"
3. Click "Get Images"
4. You should see all images from your license

**If this works:** The backend is fine, issue is in the frontend React app.  
**If this doesn't work:** There's a backend or authentication issue.

### Step 2: Check Browser Console

1. Open your web application
2. Press `F12` to open Developer Tools
3. Go to "Console" tab
4. Look for any red error messages
5. Take a screenshot and share it

### Step 3: Check Network Tab

1. Keep Developer Tools open
2. Go to "Network" tab
3. Refresh the page
4. Look for `/images/by-patient` request
5. Click on it
6. Check the "Response" tab
7. You should see JSON with patient folders and images

**If you see an error:**
- 401 = Need to re-login
- 403 = Permission denied
- 500 = Server error

### Step 4: Try Hard Refresh

Sometimes the browser caches old code:

**Windows/Linux:** `Ctrl + Shift + R`  
**Mac:** `Cmd + Shift + R`

Or try opening in Incognito/Private mode.

## Detailed Troubleshooting

### Option A: Use Test HTML Page

The `test-frontend-api.html` file tests the API without the React app:

1. Open `test-frontend-api.html` in browser
2. Login with your credentials
3. Click "Get Images"
4. See if images appear

**Result:**
- ✅ Images appear → Backend is working, frontend React app has issue
- ❌ Images don't appear → Backend or authentication issue

### Option B: Manual API Test

Open browser console and run:

```javascript
// Check if you're logged in
console.log('Token:', localStorage.getItem('token'));

// Manually call the API
fetch('http://localhost:5000/api/images/by-patient', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  console.log('API Response:', data);
  console.log('Number of folders:', data.patients?.length);
  console.log('Total images:', data.patients?.reduce((sum, p) => sum + p.imageCount, 0));
});
```

**Expected output:**
```
API Response: {patients: Array(X)}
Number of folders: X
Total images: Y
```

### Option C: Check Backend Logs

Look at the terminal where backend is running. You should see:

```
Executed query { text: 'SELECT * FROM images...', duration: XX, rows: Y }
```

If you don't see this when loading the images page, the API isn't being called.

## Common Issues

### Issue 1: "Cannot read property 'patients' of undefined"

**Cause:** API response format changed or error occurred

**Fix:** Check Network tab for actual API response

### Issue 2: Images show for one user but not another

**Cause:** Users have different licenses

**Verify:**
```bash
node verify-shared-access.js
```

Make sure both users have the same `license_id`.

### Issue 3: Page shows "Loading..." forever

**Cause:** API call is failing or hanging

**Fix:**
1. Check Network tab - is request completing?
2. Check Console tab - any errors?
3. Check backend is running: `curl http://localhost:5000/api/health`

### Issue 4: "401 Unauthorized" error

**Cause:** Token expired or invalid

**Fix:**
1. Logout
2. Login again
3. Try accessing images

### Issue 5: Empty array returned

**Cause:** No images in the license yet

**Verify:**
```bash
node test-api-endpoint.js
```

This shows what the API should return.

## Test Accounts

Use these to test shared access:

### License: "Test Ambulance 2"
- **john@test.com** - Has 7 images
- **onkart@test.com** - Has 6 images
- **bassam@test.com** - Has 1 image

All three should see all 14 images.

### License: "chennai"
- **user1@gmail.com** - Has 1 image
- **user2@gmail.com** - Has 0 images
- **nithish1@gmail.com** - Has 0 images

All three should see the 1 image.

## What Should Happen

### Correct Behavior:

1. **Login as john@test.com**
   - Navigate to Images page
   - Should see 14 images in 8 folders
   - Some uploaded by john, some by onkart, some by bassam

2. **Logout and login as onkart@test.com**
   - Navigate to Images page
   - Should see the SAME 14 images
   - Can view, download, annotate any of them

3. **Logout and login as user from different license**
   - Should NOT see john's or onkart's images
   - Only sees their own images

## Debug Commands

Run these to collect information:

```bash
# Test database
node test-shared-access-simple.js

# Test API endpoint
node test-api-endpoint.js

# Verify shared access
node verify-shared-access.js

# Check user tokens
node check-user-token.js
```

## Files to Check

If the issue persists, check these files:

### Frontend:
- `frontend/src/components/ImageGallery.tsx` - Line 57 (loadImages function)
- `frontend/src/services/api.ts` - API configuration

### Backend:
- `backend/src/routes/images.routes.ts` - Line 57 (GET /images/by-patient)
- `backend/src/middleware/auth.ts` - Authentication
- `backend/src/repositories/ImageRepository.ts` - Database queries

## Still Not Working?

### Collect this information:

1. **Screenshot of browser console** (with errors visible)
2. **Screenshot of Network tab** (showing /images/by-patient request)
3. **Output of test commands:**
   ```bash
   node test-api-endpoint.js > debug-output.txt
   ```
4. **Which user you're logged in as**
5. **What you see vs what you expect to see**

### Quick Diagnostic:

Run this in browser console:
```javascript
// Diagnostic script
console.log('=== DIAGNOSTIC INFO ===');
console.log('Token exists:', !!localStorage.getItem('token'));
console.log('API URL:', 'http://localhost:5000/api');

fetch('http://localhost:5000/api/images/by-patient', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
})
.then(r => {
  console.log('Response status:', r.status);
  return r.json();
})
.then(data => {
  console.log('Patients:', data.patients?.length || 0);
  console.log('Total images:', data.patients?.reduce((s,p) => s + p.imageCount, 0) || 0);
  console.log('Full response:', data);
})
.catch(e => console.error('Error:', e));
```

Copy the console output and share it.

## Summary

✅ **Database:** Fixed - all images have license_id  
✅ **Backend API:** Working - returns correct data  
❓ **Frontend:** Need to verify with browser tools

**Next step:** Open `test-frontend-api.html` in browser and test the API directly.
