import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { annotationExportService } from '../services/AnnotationExportService';
import archiver from 'archiver';
import * as fs from 'fs';
import * as path from 'path';
import annotationRepository from '../repositories/AnnotationRepository';

const router = Router();

/**
 * POST /api/export/coco
 * Export annotations in COCO format for AI training
 */
router.post('/coco', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const { imageIds } = _req.body;

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'imageIds array is required and must not be empty',
        },
      });
    }

    console.log('[Export] Starting COCO export for', imageIds.length, 'images');

    // Export to COCO format
    const exportPath = await annotationExportService.exportToCOCO(imageIds);

    // Create ZIP archive
    const zipPath = `${exportPath}.zip`;
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log('[Export] ZIP created:', archive.pointer(), 'bytes');
      
      // Send ZIP file
      res.download(zipPath, path.basename(zipPath), (err: Error | null) => {
        if (err) {
          console.error('[Export] Error sending file:', err);
        }
        
        // Cleanup
        fs.unlink(zipPath, () => {});
        fs.rm(exportPath, { recursive: true, force: true }, () => {});
      });
    });

    archive.on('error', (err: Error) => {
      throw err;
    });

    archive.pipe(output);
    archive.directory(exportPath, path.basename(exportPath));
    archive.finalize();

  } catch (error) {
    console.error('[Export] Error:', error);
    res.status(500).json({
      error: {
        code: 'EXPORT_FAILED',
        message: error instanceof Error ? error.message : 'Failed to export annotations',
      },
    });
  }
});

/**
 * POST /api/export/coco/all
 * Export all annotated images in COCO format
 */
router.post('/coco/all', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Get all images with annotations for this user
    const annotations = await annotationRepository.findByUserId(user.id);
    
    // Get unique image IDs
    const imageIds = [...new Set(annotations.map((a: any) => a.image_id as string))];

    if (imageIds.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NO_ANNOTATIONS',
          message: 'No annotated images found',
        },
      });
    }

    console.log('[Export] Exporting all annotated images:', imageIds.length);

    // Export to COCO format
    const exportPath = await annotationExportService.exportToCOCO(imageIds);

    // Create ZIP archive
    const zipPath = `${exportPath}.zip`;
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log('[Export] ZIP created:', archive.pointer(), 'bytes');
      
      // Send ZIP file
      res.download(zipPath, path.basename(zipPath), (err: Error | null) => {
        if (err) {
          console.error('[Export] Error sending file:', err);
        }
        
        // Cleanup
        fs.unlink(zipPath, () => {});
        fs.rm(exportPath, { recursive: true, force: true }, () => {});
      });
    });

    archive.on('error', (err: Error) => {
      throw err;
    });

    archive.pipe(output);
    archive.directory(exportPath, path.basename(exportPath));
    archive.finalize();

  } catch (error) {
    console.error('[Export] Error:', error);
    res.status(500).json({
      error: {
        code: 'EXPORT_FAILED',
        message: error instanceof Error ? error.message : 'Failed to export annotations',
      },
    });
  }
});

export default router;
