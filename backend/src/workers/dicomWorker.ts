// DICOM Worker using BullMQ - Currently not used (using inMemoryWorkers instead)
// Uncomment and install bullmq if you want to use Redis-based workers

// import { Worker, Job } from 'bullmq';
// import { createRedisConnection } from '../config/redis';
// import { DicomConversionJob } from '../services/QueueService';
// import { dicomConverterService } from '../services/DicomConverterService';
// import { imageRepository } from '../repositories/ImageRepository';
// import path from 'path';
// import fs from 'fs/promises';

/* eslint-disable @typescript-eslint/no-unused-vars */
// Placeholder function for future DICOM conversion worker
// const _processDicomConversion = async (_job: any) => {
  // const { imageId, filePath } = job.data;
  // console.log(`Processing DICOM conversion for image ${imageId}`);
  // await job.updateProgress(10);
  // try {
  //   const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
  //   if (!fileExists) {
  //     throw new Error(`File not found: ${filePath}`);
  //   }
  //   await job.updateProgress(20);
  //   const fileBuffer = await fs.readFile(filePath);
  //   const pngBuffer = await dicomConverterService.convertToPNG(fileBuffer);
  //   const pngPath = filePath.replace(/\.(dcm|dicom)$/i, '.png');
  //   await fs.writeFile(pngPath, pngBuffer);
  //   await job.updateProgress(70);
  //   await imageRepository.updateConvertedPath(imageId, pngPath);
  //   await job.updateProgress(90);
  //   console.log(`DICOM conversion completed for image ${imageId}`);
  //   await job.updateProgress(100);
  //   return {
  //     success: true,
  //     imageId,
  //     pngPath,
  //     message: 'DICOM converted successfully',
  //   };
  // } catch (error) {
  //   console.error(`DICOM conversion failed for image ${imageId}:`, error);
  //   throw error;
  // }
//   throw new Error('DICOM worker not configured. Using in-memory workers instead.');
// };

export const createDicomWorker = (): any => {
  // const worker = new Worker<DicomConversionJob>('dicom-conversion', processDicomConversion, {
  //   connection: createRedisConnection(),
  //   concurrency: 3,
  //   limiter: {
  //     max: 10,
  //     duration: 1000,
  //   },
  // });

  // worker.on('completed', (job: any) => {
  //   console.log(`DICOM worker completed job ${job.id}`);
  // });

  // worker.on('failed', (job: any, err: any) => {
  //   console.error(`DICOM worker failed job ${job?.id}:`, err.message);
  // });

  // worker.on('error', (err: any) => {
  //   console.error('DICOM worker error:', err);
  // });

  // return worker;
  
  console.log('DICOM worker not configured. Using in-memory workers instead.');
  return null;
  return null;
};
