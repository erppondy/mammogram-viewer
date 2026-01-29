# ZIP Download Feature

Added comprehensive download options for images and folders.

## Features

### 1. Batch Download Options
When multiple images are selected, users can choose:
- **📄 Individual Files** - Downloads each file separately in original format
- **📦 As ZIP Archive** - Downloads all selected images in a single ZIP file

### 2. Folder Download
Each folder now has a "📦 Download ZIP" button that:
- Downloads all images in the folder as a single ZIP archive
- Preserves original filenames
- Named as `{folder_name}_{timestamp}.zip`

### 3. Delete Multiple Images
- Select multiple images using checkboxes
- Click "Delete Selected" to remove them all at once

## User Interface

### Batch Actions (when images are selected)
- Shows count of selected images
- Dropdown menu for download options
- Delete button for batch deletion

### Folder View
- Each folder header shows:
  - Folder name (Patient Name/ID)
  - Image count
  - Download ZIP button
  - Expand/collapse arrow

## Backend Endpoints

### POST /api/images/download-zip
Downloads multiple images as ZIP
- Body: `{ imageIds: string[] }`
- Returns: ZIP file stream

### GET /api/images/folder/:folder/download-zip
Downloads entire folder as ZIP
- Param: folder name (URL encoded)
- Returns: ZIP file stream

## Installation

Backend requires the `archiver` package:
```bash
cd backend
npm install archiver
npm install --save-dev @types/archiver
```

## Technical Details

- Uses `archiver` library for ZIP creation
- Streams files directly to response (memory efficient)
- Validates user ownership before allowing downloads
- Compression level: 9 (maximum)
- Original filenames preserved in ZIP
