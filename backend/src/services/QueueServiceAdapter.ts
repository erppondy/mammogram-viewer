/**
 * Queue Service Adapter
 * Automatically uses in-memory queue (no Redis required)
 */

import { inMemoryQueueService } from './InMemoryQueueService';

export interface DicomConversionJob {
  imageId: number;
  userId: number;
  filePath: string;
  originalName: string;
}

export interface ThumbnailGenerationJob {
  imageId: number;
  userId: number;
  filePath: string;
}

class QueueServiceAdapter {
  async addDicomConversionJob(data: DicomConversionJob, priority: number = 0) {
    return await inMemoryQueueService.addDicomConversionJob(data, priority);
  }

  async addThumbnailGenerationJob(data: ThumbnailGenerationJob, priority: number = 0) {
    return await inMemoryQueueService.addThumbnailGenerationJob(data, priority);
  }

  async getJobStatus(jobId: string) {
    return await inMemoryQueueService.getJobStatus(jobId);
  }

  async getQueueStats() {
    return await inMemoryQueueService.getQueueStats();
  }

  async pauseQueue() {
    console.log('Pause not supported in in-memory queue');
  }

  async resumeQueue() {
    console.log('Resume not supported in in-memory queue');
  }

  async cleanQueue() {
    console.log('Clean not needed in in-memory queue (auto-cleanup enabled)');
  }

  getDicomQueue() {
    return inMemoryQueueService.getDicomQueue();
  }

  getThumbnailQueue() {
    return inMemoryQueueService.getThumbnailQueue();
  }

  async close() {
    await inMemoryQueueService.close();
  }
}

// Export singleton instance
export const queueService = new QueueServiceAdapter();
