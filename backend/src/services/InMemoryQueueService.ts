/**
 * In-Memory Queue Service (Redis-free alternative)
 * Provides async job processing without external dependencies
 */

import EventEmitter from 'events';

export interface Job<T = any> {
  id: string;
  type: string;
  data: T;
  priority: number;
  attempts: number;
  maxAttempts: number;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  error?: string;
  result?: any;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

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

type JobProcessor<T> = (job: Job<T>) => Promise<any>;

class InMemoryQueue<T = any> extends EventEmitter {
  private jobs: Map<string, Job<T>> = new Map();
  private waitingQueue: string[] = [];
  private activeJobs: Set<string> = new Set();
  private processor?: JobProcessor<T>;
  private concurrency: number;
  private processing: boolean = false;

  constructor(name: string, concurrency: number = 1) {
    super();
    this.concurrency = concurrency;
  }

  setProcessor(processor: JobProcessor<T>) {
    this.processor = processor;
  }

  async add(type: string, data: T, options: { priority?: number; jobId?: string } = {}): Promise<Job<T>> {
    const job: Job<T> = {
      id: options.jobId || `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      priority: options.priority || 0,
      attempts: 0,
      maxAttempts: 3,
      status: 'waiting',
      createdAt: new Date(),
    };

    this.jobs.set(job.id, job);
    this.waitingQueue.push(job.id);
    
    // Sort by priority (higher priority first)
    this.waitingQueue.sort((a, b) => {
      const jobA = this.jobs.get(a)!;
      const jobB = this.jobs.get(b)!;
      return jobB.priority - jobA.priority;
    });

    this.emit('added', job);
    
    // Start processing if not already running
    if (!this.processing) {
      this.startProcessing();
    }

    return job;
  }

  private async startProcessing() {
    if (this.processing) return;
    this.processing = true;

    while (this.waitingQueue.length > 0 || this.activeJobs.size > 0) {
      // Process jobs up to concurrency limit
      while (this.activeJobs.size < this.concurrency && this.waitingQueue.length > 0) {
        const jobId = this.waitingQueue.shift()!;
        const job = this.jobs.get(jobId);
        
        if (job && this.processor) {
          this.activeJobs.add(jobId);
          this.processJob(job).finally(() => {
            this.activeJobs.delete(jobId);
          });
        }
      }

      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.processing = false;
  }

  private async processJob(job: Job<T>) {
    if (!this.processor) return;

    job.status = 'active';
    job.startedAt = new Date();
    job.attempts++;

    try {
      console.log(`Processing job ${job.id} (attempt ${job.attempts}/${job.maxAttempts})`);
      const result = await this.processor(job);
      
      job.status = 'completed';
      job.result = result;
      job.completedAt = new Date();
      
      this.emit('completed', job);
      console.log(`Job ${job.id} completed successfully`);

      // Clean up old completed jobs (keep last 100)
      this.cleanupCompletedJobs();
    } catch (error) {
      console.error(`Job ${job.id} failed (attempt ${job.attempts}/${job.maxAttempts}):`, error);
      
      if (job.attempts < job.maxAttempts) {
        // Retry with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, job.attempts - 1), 10000);
        console.log(`Retrying job ${job.id} in ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        job.status = 'waiting';
        this.waitingQueue.push(job.id);
      } else {
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : String(error);
        job.completedAt = new Date();
        
        this.emit('failed', job, error);
        console.error(`Job ${job.id} failed permanently after ${job.attempts} attempts`);
      }
    }
  }

  private cleanupCompletedJobs() {
    const completedJobs = Array.from(this.jobs.values())
      .filter(j => j.status === 'completed')
      .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0));

    // Keep only last 100 completed jobs
    if (completedJobs.length > 100) {
      const toDelete = completedJobs.slice(100);
      toDelete.forEach(job => this.jobs.delete(job.id));
    }
  }

  async getJob(jobId: string): Promise<Job<T> | null> {
    return this.jobs.get(jobId) || null;
  }

  getWaitingCount(): number {
    return this.waitingQueue.length;
  }

  getActiveCount(): number {
    return this.activeJobs.size;
  }

  getCompletedCount(): number {
    return Array.from(this.jobs.values()).filter(j => j.status === 'completed').length;
  }

  getFailedCount(): number {
    return Array.from(this.jobs.values()).filter(j => j.status === 'failed').length;
  }

  async close() {
    this.processing = false;
    this.removeAllListeners();
  }
}

class InMemoryQueueService {
  private dicomQueue: InMemoryQueue<DicomConversionJob>;
  private thumbnailQueue: InMemoryQueue<ThumbnailGenerationJob>;

  constructor() {
    this.dicomQueue = new InMemoryQueue<DicomConversionJob>('dicom-conversion', 3);
    this.thumbnailQueue = new InMemoryQueue<ThumbnailGenerationJob>('thumbnail-generation', 5);

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.dicomQueue.on('completed', (job) => {
      console.log(`DICOM job ${job.id} completed`);
    });

    this.dicomQueue.on('failed', (job, error) => {
      console.error(`DICOM job ${job.id} failed:`, error);
    });

    this.thumbnailQueue.on('completed', (job) => {
      console.log(`Thumbnail job ${job.id} completed`);
    });

    this.thumbnailQueue.on('failed', (job, error) => {
      console.error(`Thumbnail job ${job.id} failed:`, error);
    });
  }

  setDicomProcessor(processor: JobProcessor<DicomConversionJob>) {
    this.dicomQueue.setProcessor(processor);
  }

  setThumbnailProcessor(processor: JobProcessor<ThumbnailGenerationJob>) {
    this.thumbnailQueue.setProcessor(processor);
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
    const job = await this.dicomQueue.getJob(jobId) || await this.thumbnailQueue.getJob(jobId);
    if (!job) return null;

    return {
      id: job.id,
      state: job.status,
      progress: job.status === 'completed' ? 100 : job.status === 'active' ? 50 : 0,
      attemptsMade: job.attempts,
      data: job.data,
      returnvalue: job.result,
      failedReason: job.error,
    };
  }

  async getQueueStats() {
    return {
      waiting: this.dicomQueue.getWaitingCount() + this.thumbnailQueue.getWaitingCount(),
      active: this.dicomQueue.getActiveCount() + this.thumbnailQueue.getActiveCount(),
      completed: this.dicomQueue.getCompletedCount() + this.thumbnailQueue.getCompletedCount(),
      failed: this.dicomQueue.getFailedCount() + this.thumbnailQueue.getFailedCount(),
      total: 0,
    };
  }

  getDicomQueue() {
    return this.dicomQueue;
  }

  getThumbnailQueue() {
    return this.thumbnailQueue;
  }

  async close() {
    await this.dicomQueue.close();
    await this.thumbnailQueue.close();
  }
}

export const inMemoryQueueService = new InMemoryQueueService();
