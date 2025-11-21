import { Queue, QueueEvents } from 'bullmq';
import { createRedisConnection } from '../config/redis';

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

class QueueService {
  private dicomQueue: Queue<DicomConversionJob>;
  private thumbnailQueue: Queue<ThumbnailGenerationJob>;
  private queueEvents: QueueEvents;

  constructor() {
    const connection = createRedisConnection();

    this.dicomQueue = new Queue<DicomConversionJob>('dicom-conversion', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 1000,
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
    });

    this.thumbnailQueue = new Queue<ThumbnailGenerationJob>('thumbnail-generation', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: {
          age: 24 * 3600,
          count: 1000,
        },
        removeOnFail: {
          age: 7 * 24 * 3600,
        },
      },
    });

    this.queueEvents = new QueueEvents('dicom-conversion', { connection: createRedisConnection() });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.queueEvents.on('completed', ({ jobId }) => {
      console.log(`Job ${jobId} completed successfully`);
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`Job ${jobId} failed:`, failedReason);
    });
  }

  async addDicomConversionJob(data: DicomConversionJob, priority: number = 0) {
    const job = await this.dicomQueue.add('convert-dicom', data, {
      priority,
      jobId: `dicom-${data.imageId}`,
    });
    console.log(`Added DICOM conversion job ${job.id} for image ${data.imageId}`);
    return job;
  }

  async addThumbnailGenerationJob(data: ThumbnailGenerationJob, priority: number = 0) {
    const job = await this.thumbnailQueue.add('generate-thumbnail', data, {
      priority,
      jobId: `thumbnail-${data.imageId}`,
    });
    console.log(`Added thumbnail generation job ${job.id} for image ${data.imageId}`);
    return job;
  }

  async getJobStatus(jobId: string) {
    const job = await this.dicomQueue.getJob(jobId);
    if (!job) return null;

    const state = await job.getState();
    return {
      id: job.id,
      state,
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      data: job.data,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
    };
  }

  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.dicomQueue.getWaitingCount(),
      this.dicomQueue.getActiveCount(),
      this.dicomQueue.getCompletedCount(),
      this.dicomQueue.getFailedCount(),
      this.dicomQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  async pauseQueue() {
    await this.dicomQueue.pause();
    await this.thumbnailQueue.pause();
  }

  async resumeQueue() {
    await this.dicomQueue.resume();
    await this.thumbnailQueue.resume();
  }

  async cleanQueue() {
    await this.dicomQueue.clean(24 * 3600 * 1000, 1000, 'completed');
    await this.dicomQueue.clean(7 * 24 * 3600 * 1000, 1000, 'failed');
  }

  getDicomQueue() {
    return this.dicomQueue;
  }

  getThumbnailQueue() {
    return this.thumbnailQueue;
  }

  async close() {
    await this.queueEvents.close();
    await this.dicomQueue.close();
    await this.thumbnailQueue.close();
  }
}

export const queueService = new QueueService();
