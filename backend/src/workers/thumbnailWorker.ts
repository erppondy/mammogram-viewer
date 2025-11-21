import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../config/redis';
import { ThumbnailGenerationJob } from '../services/QueueService';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

const THUMBNAIL_SIZE = 200;

const processThumbnailGeneration = async (job: Job<ThumbnailGenerationJob>) => {
  const { imageId, filePath } = job.data;

  console.log(`Generating thumbnail for image ${imageId}`);
  await job.updateProgress(10);

  try {
    // Check if file exists
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    if (!fileExists) {
      throw new Error(`File not found: ${filePath}`);
    }

    await job.updateProgress(30);

    // Generate thumbnail path
    const ext = path.extname(filePath);
    const thumbnailPath = filePath.replace(ext, `_thumb${ext}`);

    // Generate thumbnail
    await sharp(filePath)
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toFile(thumbnailPath);

    await job.updateProgress(90);

    console.log(`Thumbnail generated for image ${imageId}`);
    await job.updateProgress(100);

    return {
      success: true,
      imageId,
      thumbnailPath,
      message: 'Thumbnail generated successfully',
    };
  } catch (error) {
    console.error(`Thumbnail generation failed for image ${imageId}:`, error);
    throw error;
  }
};

export const createThumbnailWorker = () => {
  const worker = new Worker<ThumbnailGenerationJob>(
    'thumbnail-generation',
    processThumbnailGeneration,
    {
      connection: createRedisConnection(),
      concurrency: 5, // Process up to 5 jobs concurrently
      limiter: {
        max: 20, // Max 20 jobs
        duration: 1000, // per second
      },
    }
  );

  worker.on('completed', (job) => {
    console.log(`Thumbnail worker completed job ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Thumbnail worker failed job ${job?.id}:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('Thumbnail worker error:', err);
  });

  return worker;
};
