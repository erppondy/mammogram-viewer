# Storage Service Documentation

## Overview

The Storage Service manages all file operations for the mammogram viewer application, including saving images, thumbnails, and handling temporary files for chunked uploads.

## Directory Structure

```
storage/
├── images/                    # Original uploaded images
│   └── user-{userId}/
│       └── {year}/
│           └── {month}/
│               └── {imageId}.{extension}
├── thumbnails/                # Generated thumbnails
│   └── user-{userId}/
│       └── {year}/
│           └── {month}/
│               └── {imageId}_thumb.jpg
└── temp/                      # Temporary files
    ├── uploads/               # Chunked upload sessions
    │   └── {sessionId}/
    │       └── chunk_*
    └── processing/            # File processing workspace
```

## Features

### File Management

- **Save Files**: Store images with automatic directory organization by user, year, and month
- **Retrieve Files**: Get files by their relative storage path
- **Delete Files**: Remove files from storage
- **Thumbnails**: Separate storage for JPEG thumbnails

### Chunked Upload Support

- **Save Chunks**: Store individual chunks during upload
- **Assemble Chunks**: Combine chunks into final file
- **Session Cleanup**: Remove temporary chunk files after upload

### Storage Monitoring

- **Storage Stats**: Get total size, file count, and available space
- **Space Checking**: Verify sufficient disk space before uploads
- **Automatic Cleanup**: Remove temporary files older than 24 hours

## Usage

### Initialize Storage

```typescript
import { storageService } from './services/StorageService';

// Initialize directory structure
await storageService.initialize();
```

### Save an Image

```typescript
const userId = 'user-123';
const imageId = 'image-456';
const imageBuffer = Buffer.from(/* image data */);
const extension = 'dcm';

const storagePath = await storageService.saveFile(
  userId,
  imageId,
  imageBuffer,
  extension
);

console.log('Image saved at:', storagePath);
// Output: images/user-user-123/2024/01/image-456.dcm
```

### Retrieve an Image

```typescript
const storagePath = 'images/user-user-123/2024/01/image-456.dcm';
const imageBuffer = await storageService.getFile(storagePath);
```

### Save a Thumbnail

```typescript
const userId = 'user-123';
const imageId = 'image-456';
const thumbnailBuffer = Buffer.from(/* thumbnail data */);

const thumbnailPath = await storageService.saveThumbnail(
  userId,
  imageId,
  thumbnailBuffer
);

console.log('Thumbnail saved at:', thumbnailPath);
// Output: thumbnails/user-user-123/2024/01/image-456_thumb.jpg
```

### Delete Files

```typescript
await storageService.deleteFile(storagePath);
await storageService.deleteFile(thumbnailPath);
```

### Chunked Upload Workflow

```typescript
// 1. Save chunks as they arrive
const sessionId = 'upload-session-123';
await storageService.saveChunk(sessionId, 0, chunk1Buffer);
await storageService.saveChunk(sessionId, 1, chunk2Buffer);
await storageService.saveChunk(sessionId, 2, chunk3Buffer);

// 2. Assemble chunks into final file
const totalChunks = 3;
const completeFile = await storageService.assembleChunks(sessionId, totalChunks);

// 3. Save the complete file
const storagePath = await storageService.saveFile(
  userId,
  imageId,
  completeFile,
  'dcm'
);

// 4. Clean up temporary chunks
await storageService.cleanupSession(sessionId);
```

### Check Storage Stats

```typescript
const stats = await storageService.getStorageStats();

console.log('Total size:', stats.totalSize, 'bytes');
console.log('File count:', stats.fileCount);
console.log('Available space:', stats.availableSpace, 'bytes');
```

### Check Available Space

```typescript
const requiredBytes = 100 * 1024 * 1024; // 100MB
const hasSpace = await storageService.hasEnoughSpace(requiredBytes);

if (!hasSpace) {
  throw new Error('Insufficient disk space');
}
```

### Manual Cleanup

```typescript
// Clean up files older than 24 hours
const deletedCount = await storageService.cleanupTempFiles(24);
console.log(`Deleted ${deletedCount} temporary files`);
```

## Automatic Cleanup

The storage service automatically cleans up temporary files every 24 hours when the server is running. This is configured in `src/index.ts`:

```typescript
setInterval(async () => {
  const deletedCount = await storageService.cleanupTempFiles(24);
  console.log(`Cleaned up ${deletedCount} temporary files`);
}, 24 * 60 * 60 * 1000);
```

## Manual Cleanup Script

You can also run cleanup manually:

```bash
npm run storage:cleanup
```

## Configuration

The storage root directory can be configured via environment variable:

```bash
# .env
STORAGE_ROOT=./storage
```

Default: `./storage` (relative to project root)

## File Permissions

- **Directories**: 750 (owner: rwx, group: r-x, others: none)
- **Files**: Default system permissions

## Best Practices

### 1. Always Check Space Before Upload

```typescript
const fileSize = 100 * 1024 * 1024; // 100MB
if (!(await storageService.hasEnoughSpace(fileSize))) {
  throw new Error('Insufficient storage space');
}
```

### 2. Clean Up After Processing

```typescript
try {
  // Process file
  await processFile(sessionId);
} finally {
  // Always clean up, even if processing fails
  await storageService.cleanupSession(sessionId);
}
```

### 3. Handle Errors Gracefully

```typescript
try {
  const file = await storageService.getFile(storagePath);
} catch (error) {
  if (error.message.includes('File not found')) {
    // Handle missing file
    return null;
  }
  throw error;
}
```

### 4. Monitor Storage Usage

```typescript
const stats = await storageService.getStorageStats();
const usagePercent = (stats.totalSize / stats.availableSpace) * 100;

if (usagePercent > 80) {
  console.warn('Storage usage above 80%');
  // Send alert, trigger cleanup, etc.
}
```

## Testing

Run storage service tests:

```bash
npm test -- StorageService
```

The test suite includes:
- Directory creation
- File save/retrieve/delete operations
- Thumbnail operations
- Chunk operations
- Storage statistics
- Cleanup functionality

## Troubleshooting

### Permission Denied

If you get permission errors:

```bash
# Ensure storage directory has correct permissions
chmod 750 storage
chmod 640 storage/images/**/*
```

### Disk Space Issues

Monitor available space:

```bash
df -h
```

Clean up old files:

```bash
npm run storage:cleanup
```

### Corrupted Chunks

If chunk assembly fails, clean up the session and retry:

```typescript
await storageService.cleanupSession(sessionId);
// Retry upload
```

## Performance Considerations

- **Large Files**: Files are streamed to disk to minimize memory usage
- **Concurrent Uploads**: Each session has its own directory to avoid conflicts
- **Cleanup**: Scheduled cleanup runs during low-traffic periods
- **Indexing**: File organization by user/year/month enables efficient cleanup and queries

## Security

- Storage directory is excluded from git (`.gitignore`)
- User files are isolated by user ID
- File paths are validated to prevent directory traversal
- Temporary files are automatically cleaned up
- No sensitive data in file paths

## Future Enhancements

- Compression for archived files
- Encryption at rest
- Cloud storage integration (S3, Azure Blob)
- Distributed filesystem support (GlusterFS, Ceph)
- Storage quotas per user
- Automatic archival of old files
