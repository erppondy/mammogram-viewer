import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { imageRepository } from '../repositories/ImageRepository';
import { metadataRepository } from '../repositories/MetadataRepository';
import { storageService } from '../services/StorageService';
import { trackActivity, trackImageView } from '../middleware/activityTracker';

const router = Router();

/**
 * GET /api/images/debug-license
 * Debug endpoint to check license sharing status
 */
router.get('/debug-license', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { query } = await import('../config/database');

    // Get user info
    const userInfo = await query(
      'SELECT id, email, full_name, license_id FROM users WHERE id = $1',
      [user.id]
    );

    // Get all images for this user
    const myImages = await query(
      'SELECT id, original_filename, user_id, license_id FROM images WHERE user_id = $1',
      [user.id]
    );

    // Get all images with same license (if user has license)
    let licenseImages = { rows: [] };
    if (user.licenseId) {
      licenseImages = await query(
        'SELECT id, original_filename, user_id, license_id FROM images WHERE license_id = $1',
        [user.licenseId]
      );
    }

    // Get all users with same license
    let licenseUsers = { rows: [] };
    if (user.licenseId) {
      licenseUsers = await query(
        'SELECT id, email, full_name, license_id FROM users WHERE license_id = $1',
        [user.licenseId]
      );
    }

    res.json({
      currentUser: userInfo.rows[0],
      myImages: myImages.rows,
      licenseImages: licenseImages.rows,
      licenseUsers: licenseUsers.rows,
      summary: {
        hasLicense: !!user.licenseId,
        licenseId: user.licenseId,
        myImageCount: myImages.rows.length,
        licenseImageCount: licenseImages.rows.length,
        licenseUserCount: licenseUsers.rows.length,
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch debug info' });
  }
});

/**
 * GET /api/images
 * Get images accessible to user (own images + license-shared images)
 */
router.get('/', authMiddleware, trackActivity('view', 'images'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string | undefined;
    const direction = (req.query.direction as 'next' | 'prev') || 'next';

    // If user has a license, show all images from that license
    // Otherwise, show only their own images
    if (user.licenseId) {
      // Support both cursor and offset pagination for backward compatibility
      if (req.query.useCursor === 'true' || cursor) {
        const result = await imageRepository.findByLicenseIdWithCursor(
          user.licenseId,
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
        const images = await imageRepository.findByLicenseId(user.licenseId, limit, offset);

        res.json({
          images,
          limit,
          offset,
        });
      }
    } else {
      // User without license - show only their own images
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
 * GET /api/images/by-patient
 * Get images grouped by patient (license-shared or user-only)
 */
router.get('/by-patient', authMiddleware, trackActivity('view', 'images'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { query } = await import('../config/database');

    // Get all images with patient metadata and uploader info
    // If user has license, show all images from that license
    // Otherwise, show only their own images
    let result;
    if (user.licenseId) {
      result = await query(
        `SELECT 
          i.id, 
          i.original_filename, 
          i.file_format, 
          i.file_size, 
          i.uploaded_at,
          i.thumbnail_path,
          i.user_id,
          i.license_id,
          u.email as uploader_email,
          u.full_name as uploader_name,
          COALESCE(m.patient_name, m.patient_id, 'Unknown Patient') as patient_folder,
          m.patient_name,
          m.patient_id
        FROM images i
        LEFT JOIN image_metadata m ON i.id = m.image_id
        LEFT JOIN users u ON i.user_id = u.id
        WHERE i.license_id = $1
        ORDER BY patient_folder, i.uploaded_at DESC`,
        [user.licenseId]
      );
    } else {
      result = await query(
        `SELECT 
          i.id, 
          i.original_filename, 
          i.file_format, 
          i.file_size, 
          i.uploaded_at,
          i.thumbnail_path,
          i.user_id,
          i.license_id,
          u.email as uploader_email,
          u.full_name as uploader_name,
          COALESCE(m.patient_name, m.patient_id, 'Unknown Patient') as patient_folder,
          m.patient_name,
          m.patient_id
        FROM images i
        LEFT JOIN image_metadata m ON i.id = m.image_id
        LEFT JOIN users u ON i.user_id = u.id
        WHERE i.user_id = $1
        ORDER BY patient_folder, i.uploaded_at DESC`,
        [user.id]
      );
    }

    // Group images by patient
    const patientGroups: Record<string, any> = {};
    
    result.rows.forEach((row: any) => {
      const folder = row.patient_folder;
      if (!patientGroups[folder]) {
        patientGroups[folder] = {
          patientName: row.patient_name,
          patientId: row.patient_id,
          images: [],
        };
      }
      
      patientGroups[folder].images.push({
        id: row.id,
        originalFilename: row.original_filename,
        fileFormat: row.file_format,
        fileSize: row.file_size,
        uploadedAt: row.uploaded_at,
        thumbnailPath: row.thumbnail_path,
        userId: row.user_id,
        uploaderEmail: row.uploader_email,
        uploaderName: row.uploader_name,
      });
    });

    res.json({
      patients: Object.entries(patientGroups).map(([folder, data]) => ({
        folder,
        patientName: data.patientName,
        patientId: data.patientId,
        imageCount: data.images.length,
        images: data.images,
      })),
    });
  } catch (error) {
    console.error('Error fetching images by patient:', error);
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

    // Check access: user owns the image OR shares the same license
    const hasAccess = image.userId === user.id || 
                     (user.licenseId && image.licenseId === user.licenseId);

    if (!hasAccess) {
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
    if (!image) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Image not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check access: user owns the image OR shares the same license
    const hasAccess = image.userId === user.id || 
                     (user.licenseId && image.licenseId === user.licenseId);

    if (!hasAccess) {
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

    // Check access: user owns the image OR shares the same license
    const hasAccess = image.userId === user.id || 
                     (user.licenseId && image.licenseId === user.licenseId);

    if (!hasAccess) {
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
        // Convert DICOM to PNG on-the-fly with optimization for large mammograms
        const { dicomConverterService } = await import('../services/DicomConverterService');
        const pngBuffer = await dicomConverterService.convertToPNG(fileBuffer, {
          maxWidth: 2048,  // Optimize for web viewing
          maxHeight: 2048,
          quality: 90
        });
        
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
    if (!image) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Image not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check access: user owns the image OR shares the same license
    const hasAccess = image.userId === user.id || 
                     (user.licenseId && image.licenseId === user.licenseId);

    if (!hasAccess) {
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
    if (!image) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Image not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check access: user owns the image OR shares the same license
    const hasAccess = image.userId === user.id || 
                     (user.licenseId && image.licenseId === user.licenseId);

    if (!hasAccess) {
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
 * Delete image (license-shared users can delete)
 */
router.delete('/:id', authMiddleware, trackActivity('delete', 'image'), async (req: Request, res: Response) => {
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

    // Check access: user owns the image OR shares the same license
    const hasAccess = image.userId === user.id || 
                     (user.licenseId && image.licenseId === user.licenseId);

    if (!hasAccess) {
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

/**
 * POST /api/images/download-zip
 * Download multiple images as ZIP
 */
router.post('/download-zip', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { imageIds } = req.body;

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Image IDs array is required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Verify all images are accessible to the user
    const images = await Promise.all(
      imageIds.map(id => imageRepository.findById(id))
    );

    const validImages = images.filter(img => {
      if (!img) return false;
      // User owns the image OR shares the same license
      return img.userId === user.id || 
             (user.licenseId && img.licenseId === user.licenseId);
    });

    if (validImages.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NO_IMAGES_FOUND',
          message: 'No valid images found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Create ZIP archive
    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 9 } });

    res.attachment(`images_${Date.now()}.zip`);
    res.setHeader('Content-Type', 'application/zip');

    archive.pipe(res);

    // Add each image to the archive
    const path = require('path');
    const storageRoot = process.env.STORAGE_PATH || './storage';
    
    for (const image of validImages) {
      if (image) {
        const filePath = path.join(storageRoot, image.storagePath);
        archive.file(filePath, { name: image.originalFilename });
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error('ZIP download error:', error);
    res.status(500).json({
      error: {
        code: 'ZIP_ERROR',
        message: 'Failed to create ZIP archive',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/images/folder/:folder/download-zip
 * Download all images in a folder as ZIP
 */
router.get('/folder/:folder/download-zip', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const folder = decodeURIComponent(req.params.folder);

    // Get all images in the folder accessible to this user
    let images;
    if (user.licenseId) {
      images = await imageRepository.findByLicenseIdAndFolder(user.licenseId, folder);
    } else {
      images = await imageRepository.findByUserIdAndFolder(user.id, folder);
    }

    if (images.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NO_IMAGES_FOUND',
          message: 'No images found in this folder',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Create ZIP archive
    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 9 } });

    res.attachment(`${folder}_${Date.now()}.zip`);
    res.setHeader('Content-Type', 'application/zip');

    archive.pipe(res);

    // Add each image to the archive
    const path = require('path');
    const storageRoot = process.env.STORAGE_PATH || './storage';
    
    for (const image of images) {
      const filePath = path.join(storageRoot, image.storagePath);
      archive.file(filePath, { name: image.originalFilename });
    }

    await archive.finalize();
  } catch (error) {
    console.error('Folder ZIP download error:', error);
    res.status(500).json({
      error: {
        code: 'ZIP_ERROR',
        message: 'Failed to create ZIP archive',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * DELETE /api/images/folder/:folder
 * Delete all images in a folder
 */
router.delete('/folder/:folder', authMiddleware, trackActivity('delete', 'folder'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const folder = decodeURIComponent(req.params.folder);

    // Get all images in the folder accessible to this user
    let images;
    if (user.licenseId) {
      images = await imageRepository.findByLicenseIdAndFolder(user.licenseId, folder);
    } else {
      images = await imageRepository.findByUserIdAndFolder(user.id, folder);
    }

    if (images.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NO_IMAGES_FOUND',
          message: 'No images found in this folder',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Delete all images
    for (const image of images) {
      // Delete files from storage
      await storageService.deleteFile(image.storagePath);
      if (image.thumbnailPath) {
        await storageService.deleteFile(image.thumbnailPath);
      }
      // Delete from database
      await imageRepository.delete(image.id);
    }

    res.json({
      success: true,
      message: `Deleted ${images.length} images from folder`,
      deletedCount: images.length,
    });
  } catch (error) {
    console.error('Folder delete error:', error);
    res.status(500).json({
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete folder',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
