# Folder View Checkbox Update

## Changes Made

Added checkboxes to the Folder View for better image selection and batch operations.

## New Features

### 1. Folder-Level "Select All" Checkbox
- **Location**: Next to the folder icon in each folder header
- **Function**: Selects/deselects ALL images in that specific folder
- **Visual**: Same styled checkbox as other checkboxes
- **Tooltip**: Shows "Select all in folder" or "Deselect all in folder"

### 2. Individual Image Checkboxes in Folders
- **Location**: Left side of each image (next to thumbnail)
- **Function**: Select individual images within a folder
- **Visual**: Blue checkmark when selected, image gets blue border
- **Behavior**: Works independently or with folder-level checkbox

### 3. Global "Select All" Works in Folder View
- **Location**: Header next to "Your Images" title
- **Function**: Selects ALL images across ALL folders
- **Behavior**: Works in both Grid and Folder views

## Visual Layout

### Folder Header:
```
[✓] 📁 Patient Name
     3 images
     [Download] [Delete Folder] [▶]
```

### Expanded Folder:
```
[✓] 📁 Patient Name (folder checkbox)
     3 images
     
     [✓] 📄 image1.dcm  [View] [✏️] [×]
     [✓] 📄 image2.dcm  [View] [✏️] [×]
     [ ] 📄 image3.dcm  [View] [✏️] [×]
```

## Use Cases

### Use Case 1: Select All Images in One Patient Folder
1. Navigate to Folder view
2. Find patient folder
3. Click checkbox next to folder icon
4. All images in that folder selected
5. Click "Download Selected" → "As ZIP"
6. Download patient's complete imaging set

### Use Case 2: Select Specific Images from Multiple Folders
1. Navigate to Folder view
2. Expand multiple patient folders
3. Click checkboxes on specific images
4. Images from different patients can be selected
5. Perform batch operations (download/delete)

### Use Case 3: Select Everything
1. Navigate to Folder view
2. Click "Select All" in header
3. All images from all folders selected
4. Useful for bulk operations

## Benefits

✅ **Faster Selection**: Select entire patient folders at once
✅ **Flexible**: Mix and match images from different folders
✅ **Visual Feedback**: Selected images show blue border
✅ **Consistent UX**: Same checkbox style in both views
✅ **Batch Operations**: Download or delete multiple images easily

## Technical Details

### Folder Checkbox Logic:
```typescript
// Check if all images in folder are selected
checked={filteredFolderImages.every(img => selectedImages.has(img.id))}

// Toggle all images in folder
onChange={() => {
  const allSelected = filteredFolderImages.every(img => selectedImages.has(img.id));
  const newSelection = new Set(selectedImages);
  filteredFolderImages.forEach(img => {
    if (allSelected) {
      newSelection.delete(img.id);  // Deselect all
    } else {
      newSelection.add(img.id);     // Select all
    }
  });
  setSelectedImages(newSelection);
}}
```

### Individual Image Checkbox:
```typescript
// Same as grid view
checked={selectedImages.has(image.id)}
onChange={() => handleToggleSelect(image.id)}
```

## Files Modified

1. **frontend/src/components/ImageGallery.tsx**
   - Added folder-level checkbox in folder header
   - Added individual checkboxes to folder images
   - Added selection state styling to folder images
   - Prevented click propagation on checkboxes

2. **frontend/src/components/ImageGallery.css**
   - Already has all necessary checkbox styles
   - No changes needed (reusing existing styles)

## Testing Checklist

- [ ] Folder checkbox visible in folder header
- [ ] Folder checkbox selects all images in folder
- [ ] Individual checkboxes visible in expanded folders
- [ ] Individual checkboxes work independently
- [ ] Selected images show blue border in folder view
- [ ] "Select All" in header works in folder view
- [ ] Batch download works with folder selections
- [ ] Batch delete works with folder selections
- [ ] Can mix selections from multiple folders
- [ ] Checkboxes don't interfere with folder expand/collapse
- [ ] Checkboxes visible in dark mode
- [ ] Works on mobile devices

## Screenshots Locations

Checkboxes now appear in:
1. ✅ Header (Select All) - Both views
2. ✅ Grid view - Each image card
3. ✅ Folder view - Folder headers
4. ✅ Folder view - Individual images inside folders

## Summary

Users can now select images in Folder view just like in Grid view, with the added convenience of folder-level selection for selecting all images belonging to a patient at once.
