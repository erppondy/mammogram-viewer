import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../config/redis';
import { DicomConversionJob } from '../services/QueueService';
import { dicomConverterService } from '../services/DicomConverterService';
import { imageRepository } from '../repositories/ImageRepository';
import path from 'path';
import fs from 'fs/promises';

const processDicomConversion = async (job: Job<DicomConversionJob>) => {
  const { imageId, filePath, originalName } = job.data;

  console.log(`Processing DICOM conversion for image ${imageId}`);
  await job.updateProgress(10);

  try {
    // Check if file exists
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    if (!fileExists) {
      throw new Error(`File not found: ${filePath}`);
    }

    await job.updateProgress(20);

    // Convert DICOM to PNG
    const pngPath = await dicomConverterService.convertDicomToPng(filePath);
    await job.updateProgress(70);

    // Update image record with converted path
    await imageRepository.updateConvertedPath(imageId, pngPath);
    await job.updateProgress(90);

    console.log(`DICOM conversion completed for image ${imageId}`);
    await job.updateProgress(100);

    return {
      success: true,
      imageId,
      pngPath,
      message: 'DICOM converted successfully',
    };
  } catch (error) {
    console.error(`DICOM conversion failed for image ${imageId}:`, error);
    throw error;
  }
};

export const createDicomWorker = () => {
  const worker = new Worker<DicomConversionJob>('dicom-conversion', processDicomConversion, {
    connection: createRedisConnection(),
    concurrency: 3, // Process up to 3 jobs concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 1000, // per second
    },
  });

  worker.on('completed', (job) => {
    console.log(`DICOM worker completed job ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`DICOM worker failed job ${job?.id}:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('DICOM worker error:', err);
  });

  return worker;
};
