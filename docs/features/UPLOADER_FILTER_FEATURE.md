# Uploader Filter Feature - Added

## What Was Added

A new filter in the Image Gallery that allows users to view:
1. **All Images** - All images from the license
2. **My Uploads** - Only images uploaded by the current user
3. **Shared with Me** - Only images uploaded by other users in the same license

## Changes Made

### Backend (`backend/src/routes/images.routes.ts`)

**Added uploader information to API response:**
- Added `user_id`, `uploader_email`, and `uploader_name` to the SQL query
- Joined with `users` table to get uploader details
- Included uploader info in the response for each image

**API Response now includes:**
```json
{
  "patients": [
    {
      "folder": "Patient Name",
      "images": [
        {
          "id": "...",
          "originalFilename": "...",
          "userId": "user-uuid",
          "uploaderEmail": "john@test.com",
          "uploaderName": "John Operator",
          ...
        }
      ]
    }
  ]
}
```

### Frontend (`frontend/src/components/ImageGallery.tsx`)

**Added new state:**
- `uploaderFilter`: 'all' | 'mine' | 'shared'
- `currentUserId`: Current logged-in user's ID

**Added filter UI:**
- Three buttons at the top: "All Images", "My Uploads", "Shared with Me"
- Shows count for each category
- Active filter is highlighted

**Added uploader display:**
- Images uploaded by others show "📤 Uploaded by: [Name/Email]"
- Only shown for shared images (not your own)
- Displayed in both folder view and grid view

**Filter logic:**
- Filters images based on selected option
- Works with existing filters (search, format, date)
- Applied to both folder view and grid view

## How It Works

### User Experience

1. **Login as User 1** (e.g., john@test.com)
   - Click "All Images" → See all 14 images
   - Click "My Uploads" → See only 7 images uploaded by john
   - Click "Shared with Me" → See 7 images uploaded by onkart and bassam

2. **Images show uploader info:**
   - Your own images: No uploader label
   - Shared images: "📤 Uploaded by: Onkar A. Tavate"

3. **Filter persists across views:**
   - Switch between Folders and Grid view
   - Filter selection remains active
   - Counts update automatically

### Technical Details

**Getting Current User ID:**
```typescript
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
const currentUserId = payload.userId;
```

**Filtering Logic:**
```typescript
if (uploaderFilter === 'mine' && image.userId !== currentUserId) {
  return false; // Hide shared images
}
if (uploaderFilter === 'shared' && image.userId === currentUserId) {
  return false; // Hide own images
}
```

## Testing

### Test Scenario 1: View All Images
1. Login as john@test.com
2. Click "All Images"
3. Should see 14 images total

### Test Scenario 2: View My Uploads
1. Click "My Uploads"
2. Should see only 7 images uploaded by john
3. No uploader labels (all are yours)

### Test Scenario 3: View Shared Images
1. Click "Shared with Me"
2. Should see 7 images from onkart and bassam
3. Each image shows "📤 Uploaded by: [Name]"

### Test Scenario 4: Switch Views
1. Select "My Uploads"
2. Switch between Folders and Grid view
3. Filter should remain active in both views

### Test Scenario 5: Combine Filters
1. Select "Shared with Me"
2. Use search filter to find specific filename
3. Should only search within shared images

## Benefits

1. **Easy Identification** - Quickly see which images are yours vs shared
2. **Better Organization** - Focus on your own work or review others' uploads
3. **Transparency** - Clear indication of who uploaded each image
4. **Collaboration** - Easy to see team contributions

## UI/UX

**Filter Buttons:**
- Located at the top of the image gallery
- Three options with counts
- Active button highlighted in primary color
- Responsive design

**Uploader Labels:**
- Small, unobtrusive text
- Primary color (medical blue)
- Only shown for shared images
- Includes name or email

## Example Output

```
Show: [All Images (14)] [My Uploads (7)] [Shared with Me (7)]

My Uploads (7)

📁 PRIYA
  ├─ image1.dcm
  ├─ image2.dcm
  └─ image3.dcm

Shared with Me (7)

📁 PUSHPARANI
  ├─ image1.dcm  📤 Uploaded by: Onkar A. Tavate
  ├─ image2.dcm  📤 Uploaded by: Onkar A. Tavate
  └─ image3.dcm  📤 Uploaded by: Onkar A. Tavate

📁 Unknown Patient
  └─ image1.dcm  📤 Uploaded by: Bassam Nazer
```

## Future Enhancements

Possible additions:
1. Filter by specific uploader (dropdown of team members)
2. Sort by uploader name
3. Group by uploader in folder view
4. Show upload statistics per user
5. Color-code images by uploader

## Summary

✅ Backend updated to include uploader information  
✅ Frontend filter UI added with 3 options  
✅ Uploader labels displayed on shared images  
✅ Filter works in both folder and grid views  
✅ Combines with existing filters  
✅ No breaking changes to existing functionality  

The feature is ready to use immediately after the backend restarts (or it will pick up changes automatically if using nodemon/hot reload).
