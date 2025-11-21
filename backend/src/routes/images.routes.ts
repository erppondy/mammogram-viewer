import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { imageRepository } from '../repositories/ImageRepository';
import { metadataRepository } from '../repositories/MetadataRepository';
import { storageService } from '../services/StorageService';
import { trackActivity, trackImageView } from '../middleware/activityTracker';

const router = Router();

/**
 * GET /api/images
 * Get user's images with cursor-based pagination
 */
router.get('/', authMiddleware, trackActivity('view', 'images'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string | undefined;
    const direction = (req.query.direction as 'next' | 'prev') || 'next';

    // Support both cursor and offset pagination for backward compatibility
    if (req.query.useCursor === 'true' || cursor) {
      const result = await imageRepository.findByUserIdWithCursor(
        user.id,
        limit,
        cursor,
        direction
      );

      res.json({
        images: result.data,
        nextCursor: result.nextCursor,
        prevCursor: result.prevCursor,
        hasMore: result.hasMore,
        limit,
      });
    } else {
      // Legacy offset pagination
      const offset = parseInt(req.query.offset as string) || 0;
      const images = await imageRepository.findByUserId(user.id, limit, offset);

      res.json({
        images,
        limit,
        offset,
      });
    }
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch images',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/images/:id
 * Get single image details
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const image = await imageRepository.findById(id);
    if (!image) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Image not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (image.userId !== user.id) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.json({
      success: true,
      data: image,
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch image',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/images/:id/metadata
 * Get image metadata
 */
router.get('/:id/metadata', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const image = await imageRepository.findById(id);
    if (!image || image.userId !== user.id) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Image not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const metadata = await metadataRepository.findByImageId(id);

    res.json(metadata || {});
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch metadata',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/images/:id/file
 * View image file (converts DICOM to PNG on-the-fly for viewing, no caching)
 */
router.get('/:id/file', authMiddleware, trackImageView, trackActivity('view', 'image'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const image = await imageRepository.findById(id);
    
    if (!image) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Image not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (image.userId !== user.id) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Image not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const fileBuffer = await storageService.getFile(image.storagePath);

    // Check if it's a DICOM file - convert to PNG for viewing (no caching)
    const isDicom = image.fileFormat.toLowerCase() === 'dicom' || image.fileFormat.toLowerCase() === 'dcm';
    
    if (isDicom) {
      try {
        // Convert DICOM to PNG on-the-fly (no caching to disk)
        const { dicomConverterService } = await import('../services/DicomConverterService');
        const pngBuffer = await dicomConverterService.convertToPNG(fileBuffer);
        
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `inline; filename="${image.originalFilename}.png"`);
        res.setHeader('Cache-Control', 'private, max-age=3600'); // Browser cache only
        res.send(pngBuffer);
        return;
      } catch (conversionError) {
        console.error('DICOM conversion error:', conversionError);
        
        // If conversion fails, try thumbnail
        if (image.thumbnailPath) {
          try {
            const thumbnailBuffer = await storageService.getThumbnail(image.thumbnailPath);
            res.setHeader('Content-Type', 'image/jpeg');
            res.send(thumbnailBuffer);
            return;
          } catch (thumbError) {
            console.error('Thumbnail also failed:', thumbError);
          }
        }
        
        // Last resort: placeholder
        const placeholderSVG = `<svg width="600" height="600" xmlns="http://www.w3.org/2000/svg"><rect width="600" height="600" fill="#1f2937"/><text x="300" y="280" font-family="Arial" font-size="48" fill="#9ca3af" text-anchor="middle">📋</text><text x="300" y="330" font-family="Arial" font-size="20" fill="#9ca3af" text-anchor="middle">DICOM File</text><text x="300" y="360" font-family="Arial" font-size="14" fill="#6b7280" text-anchor="middle">Conversion failed - Download to view</text></svg>`;
        res.setHeader('Content-Type', 'image/svg+xml');
        res.send(placeholderSVG);
        return;
      }
    }

    // Serve non-DICOM files
    const contentTypeMap: Record<string, string> = {
      jpeg: 'image/jpeg',
      jpg: 'image/jpeg',
      png: 'image/png',
      tiff: 'image/tiff',
      dicom: 'application/dicom',
      dcm: 'application/dicom',
    };

    const contentType = contentTypeMap[image.fileFormat.toLowerCase()] || 'application/octet-stream';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${image.originalFilename}"`);
    res.send(fileBuffer);
  } catch (error) {
    console.error('File serving error:', error);
    res.status(500).json({
      error: {
        code: 'FILE_ERROR',
        message: 'Failed to serve image file',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/images/:id/thumbnail
 * Get image thumbnail
 */
router.get('/:id/thumbnail', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const image = await imageRepository.findById(id);
    if (!image || image.userId !== user.id) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Image not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (!image.thumbnailPath) {
      return res.status(404).json({
        error: {
          code: 'NO_THUMBNAIL',
          message: 'Thumbnail not available',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const thumbnailBuffer = await storageService.getThumbnail(image.thumbnailPath);

    res.setHeader('Content-Type', 'image/jpeg');
    res.send(thumbnailBuffer);
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'THUMBNAIL_ERROR',
        message: 'Failed to fetch thumbnail',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/images/:id/download
 * Download image file (force download)
 */
router.get('/:id/download', authMiddleware, trackActivity('download', 'image'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const image = await imageRepository.findById(id);
    if (!image || image.userId !== user.id) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Image not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const fileBuffer = await storageService.getFile(image.storagePath);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${image.originalFilename}"`);
    res.send(fileBuffer);
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'DOWNLOAD_ERROR',
        message: 'Failed to download image',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * DELETE /api/images/:id
 * Delete image
 */
router.delete('/:id', authMiddleware, trackActivity('delete', 'image'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const image = await imageRepository.findById(id);
    if (!image || image.userId !== user.id) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Image not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Delete files from storage
    await storageService.deleteFile(image.storagePath);
    if (image.thumbnailPath) {
      await storageService.deleteFile(image.thumbnailPath);
    }

    // Delete from database (cascade will delete metadata)
    await imageRepository.delete(id);

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete image',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/images/search
 * Search images by metadata
 */
router.get('/search', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { patientId, patientName, studyDate, modality } = req.query;

    const metadata = await metadataRepository.search({
      patientId: patientId as string,
      patientName: patientName as string,
      studyDate: studyDate ? new Date(studyDate as string) : undefined,
      modality: modality as string,
    });

    res.json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'SEARCH_ERROR',
        message: 'Failed to search images',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
