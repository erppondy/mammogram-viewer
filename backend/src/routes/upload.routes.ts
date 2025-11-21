import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth';
import { uploadSessionService } from '../services/UploadSessionService';
import { chunkedUploadService } from '../services/ChunkedUploadService';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
});

/**
 * POST /api/upload
 * Simple single-file upload endpoint
 */
router.post('/', authMiddleware, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        error: {
          code: 'NO_FILE',
          message: 'No file provided',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Import required services
    const { fileValidationService } = await import('../services/FileValidationService');
    const { imageRepository } = await import('../repositories/ImageRepository');
    const { storageService } = await import('../services/StorageService');
    const { v4: uuidv4 } = await import('uuid');

    // Validate file
    const validation = await fileValidationService.validateFile(file.buffer, file.originalname);
    
    if (!validation.isValid) {
      return res.status(400).json({
        error: {
          code: 'INVALID_FILE',
          message: validation.error || 'Invalid file',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Generate image ID
    const imageId = uuidv4();
    const detectedFormat = validation.format || 'unknown';
    const fileExtension = detectedFormat !== 'unknown' ? detectedFormat : (file.originalname.split('.').pop() || 'bin');

    console.log(`File uploaded: ${file.originalname}, Detected format: ${detectedFormat}, Extension: ${fileExtension}`);

    // Save file to storage
    const storagePath = await storageService.saveFile(
      user.id,
      imageId,
      file.buffer,
      fileExtension
    );

    // Create database record
    const image = await imageRepository.create({
      userId: user.id,
      originalFilename: file.originalname,
      fileFormat: detectedFormat,
      fileSize: file.size,
      storagePath,
    });

    // Generate thumbnail (async, don't wait)
    storageService.generateThumbnail(user.id, imageId, file.buffer, fileExtension)
      .then(async (thumbnailPath) => {
        await imageRepository.updateThumbnailPath(image.id, thumbnailPath);
      })
      .catch((err) => {
        console.error('Thumbnail generation failed:', err);
      });

    res.status(201).json({
      success: true,
      data: {
        id: image.id,
        filename: image.originalFilename,
        format: image.fileFormat,
        size: image.fileSize,
        uploadedAt: image.uploadedAt,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : 'Upload failed';

    res.status(500).json({
      error: {
        code: 'UPLOAD_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/upload/initialize
 * Initialize a new upload session
 */
router.post('/initialize', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { filename, fileSize, chunkSize } = req.body;

    if (!filename || !fileSize) {
      return res.status(400).json({
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'filename and fileSize are required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const session = await uploadSessionService.initializeUpload({
      userId: user.id,
      filename,
      fileSize: parseInt(fileSize),
      chunkSize: chunkSize ? parseInt(chunkSize) : undefined,
    });

    const totalChunks = uploadSessionService.calculateTotalChunks(session.fileSize, session.chunkSize);

    res.status(201).json({
      success: true,
      data: {
        sessionId: session.id,
        chunkSize: session.chunkSize,
        totalChunks,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to initialize upload';

    if (message.includes('exceeds maximum limit')) {
      return res.status(413).json({
        error: {
          code: 'FILE_TOO_LARGE',
          message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (message.includes('Insufficient disk space')) {
      return res.status(507).json({
        error: {
          code: 'INSUFFICIENT_STORAGE',
          message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.status(500).json({
      error: {
        code: 'UPLOAD_INIT_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/upload/chunk
 * Upload a file chunk
 */
router.post('/chunk', authMiddleware, upload.single('chunk'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { sessionId, chunkIndex } = req.body;
    const chunkFile = req.file;

    if (!sessionId || chunkIndex === undefined || !chunkFile) {
      return res.status(400).json({
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'sessionId, chunkIndex, and chunk file are required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const result = await chunkedUploadService.processChunk(
      sessionId,
      parseInt(chunkIndex),
      chunkFile.buffer,
      user.id
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload chunk';

    if (message.includes('Unauthorized')) {
      return res.status(403).json({
        error: {
          code: 'UNAUTHORIZED',
          message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (message.includes('expired')) {
      return res.status(410).json({
        error: {
          code: 'SESSION_EXPIRED',
          message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.status(500).json({
      error: {
        code: 'CHUNK_UPLOAD_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/upload/finalize
 * Finalize upload and process file
 */
router.post('/finalize', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'sessionId is required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // This will be completed in later tasks when we add file processing
    // For now, just assemble the file
    const completeFile = await chunkedUploadService.finalizeUpload(sessionId, user.id);

    // Mark session as completed
    await uploadSessionService.completeSession(sessionId);

    res.json({
      success: true,
      data: {
        sessionId,
        fileSize: completeFile.length,
        message: 'Upload completed successfully',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to finalize upload';

    res.status(500).json({
      error: {
        code: 'FINALIZE_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/upload/progress/:sessionId
 * Get upload progress
 */
router.get('/progress/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { sessionId } = req.params;

    const progress = await chunkedUploadService.getProgress(sessionId, user.id);

    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get progress';

    res.status(500).json({
      error: {
        code: 'PROGRESS_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/upload/resume/:sessionId
 * Get missing chunks for resumable upload
 */
router.get('/resume/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { sessionId } = req.params;

    const missingChunks = await chunkedUploadService.getMissingChunks(sessionId, user.id);

    res.json({
      success: true,
      data: {
        sessionId,
        missingChunks,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get missing chunks';

    res.status(500).json({
      error: {
        code: 'RESUME_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
