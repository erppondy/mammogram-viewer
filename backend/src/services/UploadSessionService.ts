import { uploadSessionRepository } from '../repositories/UploadSessionRepository';
import { storageService } from './StorageService';
import { UploadSession } from '../models/UploadSession';

export interface InitializeUploadDTO {
  userId: string;
  filename: string;
  fileSize: number;
  chunkSize?: number;
}

export class UploadSessionService {
  private readonly DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  /**
   * Initialize a new upload session
   */
  async initializeUpload(data: InitializeUploadDTO): Promise<UploadSession> {
    // Validate file size
    if (data.fileSize > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum limit of ${this.MAX_FILE_SIZE} bytes`);
    }

    if (data.fileSize <= 0) {
      throw new Error('File size must be greater than 0');
    }

    // Check available disk space
    const hasSpace = await storageService.hasEnoughSpace(data.fileSize);
    if (!hasSpace) {
      throw new Error('Insufficient disk space');
    }

    // Create upload session
    const session = await uploadSessionRepository.create({
      userId: data.userId,
      filename: data.filename,
      fileSize: data.fileSize,
      chunkSize: data.chunkSize || this.DEFAULT_CHUNK_SIZE,
    });

    // Create temporary directory for this session
    await storageService.ensureDirectory(storageService.getTempUploadPath(session.id));

    return session;
  }

  /**
   * Update upload progress
   */
  async updateProgress(sessionId: string, uploadedBytes: number): Promise<UploadSession> {
    const session = await uploadSessionRepository.findById(sessionId);
    if (!session) {
      throw new Error('Upload session not found');
    }

    if (session.status === 'completed' || session.status === 'failed') {
      throw new Error(`Cannot update ${session.status} session`);
    }

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      await this.failSession(sessionId, 'Session expired');
      throw new Error('Upload session expired');
    }

    const updatedSession = await uploadSessionRepository.update(sessionId, {
      uploadedBytes,
      status: uploadedBytes >= session.fileSize ? 'processing' : 'uploading',
    });

    if (!updatedSession) {
      throw new Error('Failed to update session');
    }

    return updatedSession;
  }

  /**
   * Complete upload session
   */
  async completeSession(sessionId: string): Promise<UploadSession> {
    const session = await uploadSessionRepository.findById(sessionId);
    if (!session) {
      throw new Error('Upload session not found');
    }

    const updatedSession = await uploadSessionRepository.update(sessionId, {
      status: 'completed',
    });

    if (!updatedSession) {
      throw new Error('Failed to complete session');
    }

    return updatedSession;
  }

  /**
   * Fail upload session
   */
  async failSession(sessionId: string, _reason?: string): Promise<UploadSession> {
    const session = await uploadSessionRepository.findById(sessionId);
    if (!session) {
      throw new Error('Upload session not found');
    }

    const updatedSession = await uploadSessionRepository.update(sessionId, {
      status: 'failed',
    });

    if (!updatedSession) {
      throw new Error('Failed to update session');
    }

    // Clean up temporary files
    await storageService.cleanupSession(sessionId);

    return updatedSession;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<UploadSession> {
    const session = await uploadSessionRepository.findById(sessionId);
    if (!session) {
      throw new Error('Upload session not found');
    }

    return session;
  }

  /**
   * Get user's upload sessions
   */
  async getUserSessions(userId: string, limit?: number): Promise<UploadSession[]> {
    return uploadSessionRepository.findByUserId(userId, limit);
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const expiredSessions = await uploadSessionRepository.findExpired();

    // Clean up temporary files for each expired session
    for (const session of expiredSessions) {
      try {
        await storageService.cleanupSession(session.id);
      } catch (error) {
        console.error(`Failed to cleanup session ${session.id}:`, error);
      }
    }

    // Delete expired session records
    return uploadSessionRepository.deleteExpired();
  }

  /**
   * Calculate total chunks for a file
   */
  calculateTotalChunks(fileSize: number, chunkSize?: number): number {
    const size = chunkSize || this.DEFAULT_CHUNK_SIZE;
    return Math.ceil(fileSize / size);
  }

  /**
   * Validate session ownership
   */
  async validateSessionOwnership(sessionId: string, userId: string): Promise<boolean> {
    const session = await uploadSessionRepository.findById(sessionId);
    if (!session) {
      return false;
    }

    return session.userId === userId;
  }
}

export const uploadSessionService = new UploadSessionService();
