# Checkbox Locations Guide

## All Checkbox Locations in ImageGallery

### 1. Header "Select All" Checkbox ✅
**Location:** Top of page, next to "Your Images (X)" title  
**Function:** Selects/deselects ALL images across all views  
**Works in:** Both Grid and Folder views  
**Label:** "Select All" or "Deselect All"

```
┌─────────────────────────────────────────────────┐
│ [✓] Select All    Your Images (25)             │
│                                                 │
│ [Download Selected ▼] [Delete Selected]        │
└─────────────────────────────────────────────────┘
```

---

### 2. Grid View - Image Card Checkboxes ✅
**Location:** Top-left corner of each image card  
**Function:** Select individual images  
**Visual:** White wrapper with checkbox, blue when selected

```
Grid View:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ [✓]          │  │ [ ]          │  │ [✓]          │
│              │  │              │  │              │
│   📄 Image   │  │   📄 Image   │  │   📄 Image   │
│   file1.dcm  │  │   file2.dcm  │  │   file3.dcm  │
│              │  │              │  │              │
│ [View] [✏️] │  │ [View] [✏️] │  │ [View] [✏️] │
└──────────────┘  └──────────────┘  └──────────────┘
  SELECTED         NOT SELECTED      SELECTED
  (Blue border)    (Gray border)     (Blue border)
```

---

### 3. Folder View - Folder Header Checkbox ✅
**Location:** Next to folder icon in folder header  
**Function:** Selects/deselects ALL images in that specific folder  
**Tooltip:** "Select all images in folder" / "Deselect all images in folder"

```
Folder View:
┌─────────────────────────────────────────────────────────┐
│ [✓] 📁 Patient: John Doe                                │
│     5 images                                             │
│                          [📦 Download] [🗑️ Delete] [▶] │
└─────────────────────────────────────────────────────────┘
  ↑
  Folder checkbox - selects all 5 images in this folder
```

---

### 4. Folder View - Individual Image Checkboxes ✅
**Location:** Left side of each image inside expanded folder  
**Function:** Select individual images within a folder  
**Visual:** Same styling as grid view checkboxes

```
Expanded Folder:
┌─────────────────────────────────────────────────────────┐
│ [✓] 📁 Patient: John Doe                                │
│     5 images                          [Download] [▼]    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ [✓] 📄 mammogram1.dcm  [View] [✏️] [×]        │    │
│  └────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────┐    │
│  │ [✓] 📄 mammogram2.dcm  [View] [✏️] [×]        │    │
│  └────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────┐    │
│  │ [ ] 📄 mammogram3.dcm  [View] [✏️] [×]        │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└──────────────────────────────────────────────────────────┘
    ↑                                    ↑
    Individual checkboxes                Selected images
    for each image                       have blue border
```

---

## Complete Visual Flow

### Scenario: Select and Download Multiple Images from Folders

```
Step 1: Navigate to Folder View
┌─────────────────────────────────────────────────────────┐
│ [ ] Select All    Your Images (15)      [Folders] [Grid]│
├─────────────────────────────────────────────────────────┤
│                                                          │
│ [ ] 📁 Patient A - 5 images          [Download] [▶]    │
│ [ ] 📁 Patient B - 7 images          [Download] [▶]    │
│ [ ] 📁 Patient C - 3 images          [Download] [▶]    │
│                                                          │
└──────────────────────────────────────────────────────────┘

Step 2: Click folder checkbox to select all images in Patient A
┌─────────────────────────────────────────────────────────┐
│ [ ] Select All    Your Images (15)      [Folders] [Grid]│
├─────────────────────────────────────────────────────────┤
│                                                          │
│ [✓] 📁 Patient A - 5 images          [Download] [▼]    │
│ ├─ [✓] 📄 image1.dcm                                   │
│ ├─ [✓] 📄 image2.dcm                                   │
│ ├─ [✓] 📄 image3.dcm                                   │
│ ├─ [✓] 📄 image4.dcm                                   │
│ └─ [✓] 📄 image5.dcm                                   │
│                                                          │
│ [ ] 📁 Patient B - 7 images          [Download] [▶]    │
│ [ ] 📁 Patient C - 3 images          [Download] [▶]    │
│                                                          │
└──────────────────────────────────────────────────────────┘
                    ↓
            5 images selected!

Step 3: Expand Patient B and select specific images
┌─────────────────────────────────────────────────────────┐
│ [ ] Select All    Your Images (15)      [Folders] [Grid]│
│                                                          │
│ 7 selected    [Download Selected ▼] [Delete Selected]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ [✓] 📁 Patient A - 5 images (all selected)              │
│                                                          │
│ [ ] 📁 Patient B - 7 images          [Download] [▼]    │
│ ├─ [✓] 📄 scan1.dcm                                    │
│ ├─ [✓] 📄 scan2.dcm                                    │
│ ├─ [ ] 📄 scan3.dcm                                    │
│ └─ ...                                                  │
│                                                          │
│ [ ] 📁 Patient C - 3 images          [Download] [▶]    │
│                                                          │
└──────────────────────────────────────────────────────────┘
                    ↓
            7 images selected!

Step 4: Download selected images
┌─────────────────────────────────────────────────────────┐
│ 7 selected    [Download Selected ▼] [Delete Selected]   │
│                                                          │
│               ┌──────────────────────┐                  │
│               │ 📄 Individual Files  │                  │
│               │ 📦 As ZIP Archive    │ ← Click this     │
│               └──────────────────────┘                  │
└──────────────────────────────────────────────────────────┘
                    ↓
        images_1234567890.zip downloads!
```

---

## Checkbox Behavior Summary

| Checkbox Location | What It Selects | Visual Feedback |
|------------------|-----------------|-----------------|
| **Header "Select All"** | All images in current view | Count badge appears |
| **Grid View - Image Card** | Single image | Blue border on card |
| **Folder Header** | All images in that folder | All checkboxes in folder checked |
| **Folder - Individual Image** | Single image in folder | Blue border on image row |

---

## Selection States

### Checkbox States:
- ⬜ **Unchecked**: White box with gray border
- ☑️ **Checked**: Blue box with white checkmark
- 🔵 **Hover**: Blue border with glow effect

### Image States:
- **Not Selected**: Gray border, normal background
- **Selected**: Blue border, highlighted background
- **Hover**: Border color changes to blue

---

## Common Use Cases

### Use Case 1: Download All Images from One Patient
1. Go to Folder view
2. Click checkbox next to patient folder
3. Click "Download Selected" → "As ZIP Archive"
4. Done! All patient images in one ZIP file

### Use Case 2: Select Specific Images from Multiple Patients
1. Go to Folder view
2. Expand multiple patient folders
3. Click individual image checkboxes
4. Click "Download Selected" → "As ZIP Archive"
5. Done! Selected images from different patients in one ZIP

### Use Case 3: Select Everything
1. Click "Select All" checkbox in header
2. All images across all folders selected
3. Perform batch operation (download/delete)

### Use Case 4: Delete Old Images
1. Go to Grid or Folder view
2. Select images to delete (individual or folder-level)
3. Click "Delete Selected"
4. Confirm deletion
5. Done! Images removed and quota updated

---

## Troubleshooting

**Q: Checkboxes not visible?**
- Refresh the page
- Check browser zoom level (should be 100%)
- Try different browser
- Clear browser cache

**Q: Checkbox doesn't respond to clicks?**
- Make sure you're clicking the checkbox itself, not the label
- Check if page is fully loaded
- Try clicking again

**Q: Selected images don't show blue border?**
- Check if CSS file is loaded
- Refresh the page
- Check browser console for errors

**Q: "Download Selected" button doesn't appear?**
- Make sure at least one image is selected
- Check if images are actually selected (blue border)
- Refresh the page

---

## Technical Details

### Checkbox CSS Class:
```css
.image-gallery-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #6b7280;
  border-radius: 4px;
  cursor: pointer;
}

.image-gallery-checkbox:checked {
  background-color: var(--medical-primary);
  border-color: var(--medical-primary);
}
```

### Selection State Management:
```typescript
// Individual image selection
const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

// Toggle single image
const handleToggleSelect = (imageId: string) => {
  const newSelection = new Set(selectedImages);
  if (newSelection.has(imageId)) {
    newSelection.delete(imageId);
  } else {
    newSelection.add(imageId);
  }
  setSelectedImages(newSelection);
};

// Select all in folder
const allSelected = folderImages.every(img => selectedImages.has(img.id));
folderImages.forEach(img => {
  if (allSelected) {
    newSelection.delete(img.id);
  } else {
    newSelection.add(img.id);
  }
});
```

---

## Summary

✅ **4 types of checkboxes** available  
✅ **Works in both Grid and Folder views**  
✅ **Clear visual feedback** (blue borders, checkmarks)  
✅ **Flexible selection** (individual, folder-level, or all)  
✅ **Batch operations** (download ZIP, delete multiple)  

All checkboxes are now visible and functional!
