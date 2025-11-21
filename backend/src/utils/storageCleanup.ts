import { storageService } from '../services/StorageService';

/**
 * Run storage cleanup task
 * This should be scheduled to run periodically (e.g., daily via cron)
 */
export async function runStorageCleanup(): Promise<void> {
  console.log('Starting storage cleanup...');

  try {
    const deletedCount = await storageService.cleanupTempFiles(24);
    console.log(`Storage cleanup complete. Deleted ${deletedCount} temporary files.`);

    const stats = await storageService.getStorageStats();
    console.log('Storage statistics:', {
      totalSize: `${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`,
      fileCount: stats.fileCount,
      availableSpace: `${(stats.availableSpace / 1024 / 1024 / 1024).toFixed(2)} GB`,
    });
  } catch (error) {
    console.error('Storage cleanup failed:', error);
    throw error;
  }
}

// Run cleanup if this file is executed directly
if (require.main === module) {
  runStorageCleanup()
    .then(() => {
      console.log('Cleanup task completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Cleanup task failed:', error);
      process.exit(1);
    });
}
