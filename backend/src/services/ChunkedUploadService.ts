import { storageService } from './StorageService';
import { uploadSessionService } from './UploadSessionService';

export interface ChunkUploadResult {
  sessionId: string;
  chunkIndex: number;
  uploadedBytes: number;
  totalBytes: number;
  isComplete: boolean;
}

export class ChunkedUploadService {
  /**
   * Process uploaded chunk
   */
  async processChunk(
    sessionId: string,
    chunkIndex: number,
    chunkBuffer: Buffer,
    userId: string
  ): Promise<ChunkUploadResult> {
    // Validate session ownership
    const isOwner = await uploadSessionService.validateSessionOwnership(sessionId, userId);
    if (!isOwner) {
      throw new Error('Unauthorized access to upload session');
    }

    // Get session
    const session = await uploadSessionService.getSession(sessionId);

    // Validate session status
    if (session.status === 'completed') {
      throw new Error('Upload already completed');
    }

    if (session.status === 'failed') {
      throw new Error('Upload session has failed');
    }

    // Check if session expired
    if (new Date() > session.expiresAt) {
      await uploadSessionService.failSession(sessionId, 'Session expired');
      throw new Error('Upload session expired');
    }

    // Save chunk to temporary storage
    await storageService.saveChunk(sessionId, chunkIndex, chunkBuffer);

    // Update progress
    const uploadedBytes = session.uploadedBytes + chunkBuffer.length;
    await uploadSessionService.updateProgress(sessionId, uploadedBytes);

    const isComplete = uploadedBytes >= session.fileSize;

    return {
      sessionId,
      chunkIndex,
      uploadedBytes,
      totalBytes: session.fileSize,
      isComplete,
    };
  }

  /**
   * Finalize upload by assembling all chunks
   */
  async finalizeUpload(sessionId: string, userId: string): Promise<Buffer> {
    // Validate session ownership
    const isOwner = await uploadSessionService.validateSessionOwnership(sessionId, userId);
    if (!isOwner) {
      throw new Error('Unauthorized access to upload session');
    }

    // Get session
    const session = await uploadSessionService.getSession(sessionId);

    // Validate all bytes uploaded
    if (session.uploadedBytes < session.fileSize) {
      throw new Error('Upload incomplete. Not all chunks received.');
    }

    // Calculate total chunks
    const totalChunks = uploadSessionService.calculateTotalChunks(
      session.fileSize,
      session.chunkSize
    );

    // Assemble chunks
    const completeFile = await storageService.assembleChunks(sessionId, totalChunks);

    // Verify file size
    if (completeFile.length !== session.fileSize) {
      await uploadSessionService.failSession(sessionId, 'File size mismatch');
      throw new Error('Assembled file size does not match expected size');
    }

    return completeFile;
  }

  /**
   * Get upload progress
   */
  async getProgress(sessionId: string, userId: string): Promise<{
    uploadedBytes: number;
    totalBytes: number;
    percentage: number;
    status: string;
  }> {
    // Validate session ownership
    const isOwner = await uploadSessionService.validateSessionOwnership(sessionId, userId);
    if (!isOwner) {
      throw new Error('Unauthorized access to upload session');
    }

    const session = await uploadSessionService.getSession(sessionId);

    const percentage = (session.uploadedBytes / session.fileSize) * 100;

    return {
      uploadedBytes: session.uploadedBytes,
      totalBytes: session.fileSize,
      percentage: Math.round(percentage * 100) / 100,
      status: session.status,
    };
  }

  /**
   * Resume upload - get list of missing chunks
   */
  async getMissingChunks(sessionId: string, userId: string): Promise<number[]> {
    // Validate session ownership
    const isOwner = await uploadSessionService.validateSessionOwnership(sessionId, userId);
    if (!isOwner) {
      throw new Error('Unauthorized access to upload session');
    }

    const session = await uploadSessionService.getSession(sessionId);
    const totalChunks = uploadSessionService.calculateTotalChunks(
      session.fileSize,
      session.chunkSize
    );

    const missingChunks: number[] = [];
    const sessionPath = storageService.getTempUploadPath(sessionId);

    // Check which chunks exist
    const fs = require('fs');
    const path = require('path');

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(sessionPath, `chunk_${i}`);
      if (!fs.existsSync(chunkPath)) {
        missingChunks.push(i);
      }
    }

    return missingChunks;
  }
}

export const chunkedUploadService = new ChunkedUploadService();
