# Batch Folder Operations Feature

## Overview

Added the ability to select multiple patient folders and perform batch operations (download/delete) on them.

## New Features

### 1. Folder Selection Checkboxes
- **Location**: Next to each folder icon in folder view
- **Purpose**: Select entire folders for batch operations
- **Visual Feedback**: Selected folders get blue border and background highlight

### 2. "Select All Folders" Checkbox
- **Location**: Header next to "Your Images" title (in folder view)
- **Function**: Selects/deselects ALL patient folders at once
- **Label**: Changes between "Select All Folders" and "Deselect All Folders"

### 3. Batch Folder Actions
When folders are selected, batch action buttons appear in the header:
- **📦 Download Folders**: Downloads all selected folders as separate ZIP files
- **🗑️ Delete Folders**: Deletes all selected folders and their images

## User Interface

### Folder View Header (when folders selected):
```
Your Images (50)  [✓] Select All Folders

[3 folders selected]  [📦 Download Folders]  [🗑️ Delete Folders]
```

### Folder List:
```
[✓] 📁 Patient John Doe
     5 images
     [📦 Download] [🗑️ Delete Folder] [▶]

[✓] 📁 Patient Jane Smith  
     3 images
     [📦 Download] [🗑️ Delete Folder] [▶]

[ ] 📁 Patient Bob Johnson
     7 images
     [📦 Download] [🗑️ Delete Folder] [▶]
```

## Use Cases

### Use Case 1: Download Multiple Patient Records
**Scenario**: Doctor needs to download imaging data for 5 patients for a research study

**Steps**:
1. Navigate to Gallery → Folder View
2. Click checkboxes next to 5 patient folders
3. Click "📦 Download Folders" button
4. Each folder downloads as a separate ZIP file
5. All patient data downloaded in seconds

### Use Case 2: Bulk Delete Old Records
**Scenario**: Cleanup old patient records from 6 months ago

**Steps**:
1. Navigate to Gallery → Folder View
2. Filter by date (6+ months old)
3. Click "Select All Folders" checkbox
4. Click "🗑️ Delete Folders" button
5. Confirm deletion
6. All old records removed at once

### Use Case 3: Selective Folder Management
**Scenario**: Download specific patients, delete others

**Steps**:
1. Select folders to download (check 3 folders)
2. Click "Download Folders"
3. Wait for downloads to complete
4. Deselect downloaded folders
5. Select folders to delete (check 2 folders)
6. Click "Delete Folders"
7. Confirm deletion

## Technical Implementation

### State Management
```typescript
const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
```

### Functions Added

**handleToggleFolderSelect(folder: string)**
- Toggles selection of a single folder
- Updates selectedFolders state

**handleSelectAllFolders()**
- Selects/deselects all folders
- Checks if all folders are selected to determine action

**handleBatchFolderDownload()**
- Downloads all selected folders as ZIP files
- Adds small delay between downloads (500ms)
- Shows success message
- Clears selection after completion

**handleBatchFolderDelete()**
- Deletes all selected folders and their images
- Shows confirmation dialog
- Makes API calls for each folder
- Refreshes image list
- Shows success message

### API Endpoints Used

**Download**: `GET /api/images/folder/:folder/download-zip`
- Existing endpoint
- Called once per selected folder

**Delete**: `DELETE /api/images/folder/:folder`
- Existing endpoint
- Called once per selected folder

## Visual Feedback

### Selected Folder:
- Blue border (`border-[var(--medical-primary)]`)
- Light blue background (`bg-[var(--bg-tertiary)]`)
- Shadow effect (`shadow-md`)
- Checkbox shows blue checkmark

### Unselected Folder:
- Gray border (`border-[var(--border-color)]`)
- White/dark background (`bg-[var(--bg-secondary)]`)
- No shadow
- Empty checkbox

### Batch Actions Container:
- Styled container with background
- Shows count: "3 folders selected"
- Action buttons grouped together
- Only visible when folders are selected

## Behavior Details

### Download Behavior:
- Downloads happen sequentially (not parallel)
- 500ms delay between downloads to avoid browser issues
- Each folder downloads as: `{folder_name}_{timestamp}.zip`
- Success alert shows total count
- Selection cleared after completion

### Delete Behavior:
- Confirmation dialog shows count
- Deletes happen sequentially
- Each folder deletion removes all its images
- Success alert shows total count
- Image list refreshes automatically
- Selection cleared after completion

### Selection Behavior:
- Folder checkbox independent of image checkboxes
- Can select folders without expanding them
- Selection persists when expanding/collapsing folders
- Selection cleared after batch operations
- Visual highlight makes selection obvious

## Differences from Image Selection

| Feature | Image Selection | Folder Selection |
|---------|----------------|------------------|
| Checkbox Location | On each image card | On each folder header |
| Select All Label | "Select All Images" | "Select All Folders" |
| Batch Actions | Download/Delete images | Download/Delete folders |
| Count Display | "X images selected" | "X folders selected" |
| View Mode | Grid view | Folder view |
| Download Format | Single ZIP or individual | Multiple ZIPs (one per folder) |

## Files Modified

1. **frontend/src/components/ImageGallery.tsx**
   - Added `selectedFolders` state
   - Added folder selection functions
   - Added batch folder operation functions
   - Updated folder header with checkbox
   - Added conditional UI for folder vs image selection
   - Added batch folder action buttons

2. **frontend/src/components/ImageGallery.css**
   - No changes needed (reuses existing checkbox styles)

## Testing Checklist

- [ ] Folder checkboxes visible in folder view
- [ ] Can select individual folders
- [ ] "Select All Folders" works
- [ ] Selected folders show blue highlight
- [ ] Batch actions appear when folders selected
- [ ] Download Folders downloads all selected
- [ ] Delete Folders deletes all selected
- [ ] Confirmation dialog shows correct count
- [ ] Success messages show correct count
- [ ] Selection cleared after operations
- [ ] Can switch between folder and image selection
- [ ] Works with filtered folders
- [ ] Works on mobile devices

## Benefits

✅ **Time Saving**: Download/delete multiple patient records at once
✅ **Efficient**: No need to click each folder individually
✅ **Clear Visual Feedback**: Selected folders clearly highlighted
✅ **Safe**: Confirmation dialog prevents accidental deletion
✅ **Flexible**: Can select any combination of folders
✅ **Consistent UX**: Same checkbox style as image selection

## Future Enhancements

Potential improvements:
- Add "Move Folders" functionality
- Add "Merge Folders" option
- Add folder tagging/categorization
- Add folder sharing between users
- Add folder export to external storage
- Add folder archiving (instead of delete)
- Add undo functionality for folder deletion
- Add progress bar for batch operations
