// Thumbnail Worker using BullMQ - Currently not used (using inMemoryWorkers instead)
// Uncomment and install bullmq if you want to use Redis-based workers

// import { Worker, Job } from 'bullmq';
// import { createRedisConnection } from '../config/redis';
// import { ThumbnailGenerationJob } from '../services/QueueService';
// import sharp from 'sharp';
// import path from 'path';
// import fs from 'fs/promises';

// const THUMBNAIL_SIZE = 200;

/* eslint-disable @typescript-eslint/no-unused-vars */
// // const _processThumbnailGeneration = async (_job: any) => {
//   throw new Error('Thumbnail worker not configured. Using in-memory workers instead.');
// };

export const createThumbnailWorker = (): any => {
  // const worker = new Worker<ThumbnailGenerationJob>('thumbnail-generation', processThumbnailGeneration, {
  //   connection: createRedisConnection(),
  //   concurrency: 5,
  //   limiter: {
  //     max: 20,
  //     duration: 1000,
  //   },
  // });

  // worker.on('completed', (job: any) => {
  //   console.log(`Thumbnail worker completed job ${job.id}`);
  // });

  // worker.on('failed', (job: any, err: any) => {
  //   console.error(`Thumbnail worker failed job ${job?.id}:`, err.message);
  // });

  // worker.on('error', (err: any) => {
  //   console.error('Thumbnail worker error:', err);
  // });

  // return worker;
  
  console.log('Thumbnail worker not configured. Using in-memory workers instead.');
  return null;
};
