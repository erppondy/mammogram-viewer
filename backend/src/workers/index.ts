import dotenv from 'dotenv';
import { createDicomWorker } from './dicomWorker';
import { createThumbnailWorker } from './thumbnailWorker';
import { testRedisConnection } from '../config/redis';

dotenv.config();

async function startWorkers() {
  console.log('Starting background workers...');

  // Test Redis connection
  const redisConnected = await testRedisConnection();
  if (!redisConnected) {
    console.error('Failed to connect to Redis. Workers cannot start.');
    process.exit(1);
  }

  // Create workers
  const dicomWorker = createDicomWorker();
  const thumbnailWorker = createThumbnailWorker();

  console.log('✓ DICOM conversion worker started');
  console.log('✓ Thumbnail generation worker started');
  console.log('Workers are ready to process jobs');

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\nShutting down workers...');
    if (dicomWorker && 'close' in dicomWorker) await dicomWorker.close();
    if (thumbnailWorker && 'close' in thumbnailWorker) await thumbnailWorker.close();
    console.log('Workers shut down successfully');
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startWorkers().catch((error) => {
  console.error('Failed to start workers:', error);
  process.exit(1);
});
