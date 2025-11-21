/**
 * In-Memory Workers (Redis-free alternative)
 * Processes jobs using the in-memory queue
 */

import { inMemoryQueueService } from '../services/InMemoryQueueService';
import { dicomConverterService } from '../services/DicomConverterService';
import { imageRepository } from '../repositories/ImageRepository';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

const THUMBNAIL_SIZE = 200;

// DICOM Conversion Processor
const processDicomConversion = async (job: any) => {
  const { imageId, filePath, originalName } = job.data;

  console.log(`Processing DICOM conversion for image ${imageId}`);

  try {
    // Check if file exists
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    if (!fileExists) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Convert DICOM to PNG
    const pngPath = await dicomConverterService.convertDicomToPng(filePath);

    // Update image record with converted path
    await imageRepository.updateConvertedPath(imageId, pngPath);

    console.log(`DICOM conversion completed for image ${imageId}`);

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

// Thumbnail Generation Processor
const processThumbnailGeneration = async (job: any) => {
  const { imageId, filePath } = job.data;

  console.log(`Generating thumbnail for image ${imageId}`);

  try {
    // Check if file exists
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    if (!fileExists) {
      throw new Error(`File not found: ${filePath}`);
    }

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

    console.log(`Thumbnail generated for image ${imageId}`);

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

// Initialize workers
export function initializeInMemoryWorkers() {
  console.log('Initializing in-memory workers...');
  
  inMemoryQueueService.setDicomProcessor(processDicomConversion);
  inMemoryQueueService.setThumbnailProcessor(processThumbnailGeneration);
  
  console.log('✓ In-memory DICOM conversion worker ready (3 concurrent)');
  console.log('✓ In-memory thumbnail generation worker ready (5 concurrent)');
  console.log('Workers are processing jobs in the background');
}

export { inMemoryQueueService };
