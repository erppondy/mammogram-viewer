import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import annotationRepository from '../repositories/AnnotationRepository';
import { CreateAnnotationDTO, UpdateAnnotationDTO } from '../models/Annotation';

const router = Router();

// Create annotation
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const data: CreateAnnotationDTO = req.body;

    if (!data.image_id || !data.annotation_type || !data.coordinates) {
      return res.status(400).json({
        error: { message: 'Missing required fields: image_id, annotation_type, coordinates' }
      });
    }

    const annotation = await annotationRepository.create(userId, data);

    // Auto-export to AI training folder (non-blocking)
    setImmediate(async () => {
      try {
        const { annotationExportService } = await import('../services/AnnotationExportService');
        await annotationExportService.autoExportImage(data.image_id);
      } catch (error) {
        console.error('[Annotation] Auto-export failed:', error);
      }
    });

    res.status(201).json(annotation);
  } catch (error: any) {
    console.error('Error creating annotation:', error);
    res.status(500).json({ error: { message: 'Failed to create annotation' } });
  }
});

// Get annotations by image ID
router.get('/image/:imageId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const imageId = req.params.imageId;
    const annotations = await annotationRepository.findByImageId(imageId);
    res.json(annotations);
  } catch (error: any) {
    console.error('Error fetching annotations:', error);
    res.status(500).json({ error: { message: 'Failed to fetch annotations' } });
  }
});

// Get annotation by ID
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const annotation = await annotationRepository.findById(id);

    if (!annotation) {
      return res.status(404).json({ error: { message: 'Annotation not found' } });
    }

    res.json(annotation);
  } catch (error: any) {
    console.error('Error fetching annotation:', error);
    res.status(500).json({ error: { message: 'Failed to fetch annotation' } });
  }
});

// Update annotation
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const userId = (req as any).user.id;
    const data: UpdateAnnotationDTO = req.body;

    // Check if annotation exists and belongs to user
    const existing = await annotationRepository.findById(id);
    if (!existing) {
      return res.status(404).json({ error: { message: 'Annotation not found' } });
    }

    // Allow update if user is owner or admin
    const isAdmin = (req as any).user.role === 'admin';
    if (existing.user_id !== userId && !isAdmin) {
      return res.status(403).json({ error: { message: 'Not authorized to update this annotation' } });
    }

    const annotation = await annotationRepository.update(id, data);

    // Auto-export to AI training folder (non-blocking)
    setImmediate(async () => {
      try {
        const { annotationExportService } = await import('../services/AnnotationExportService');
        await annotationExportService.autoExportImage(existing.image_id);
      } catch (error) {
        console.error('[Annotation] Auto-export failed:', error);
      }
    });

    res.json(annotation);
  } catch (error: any) {
    console.error('Error updating annotation:', error);
    res.status(500).json({ error: { message: 'Failed to update annotation' } });
  }
});

// Delete annotation
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const userId = (req as any).user.id;

    // Check if annotation exists and belongs to user
    const existing = await annotationRepository.findById(id);
    if (!existing) {
      return res.status(404).json({ error: { message: 'Annotation not found' } });
    }

    // Allow delete if user is owner or admin
    const isAdmin = (req as any).user.role === 'admin';
    if (existing.user_id !== userId && !isAdmin) {
      return res.status(403).json({ error: { message: 'Not authorized to delete this annotation' } });
    }

    const imageId = existing.image_id;
    await annotationRepository.delete(id);

    // Auto-export to AI training folder (non-blocking) - will remove if no annotations left
    setImmediate(async () => {
      try {
        const { annotationExportService } = await import('../services/AnnotationExportService');
        await annotationExportService.autoExportImage(imageId);
      } catch (error) {
        console.error('[Annotation] Auto-export failed:', error);
      }
    });

    res.json({ message: 'Annotation deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting annotation:', error);
    res.status(500).json({ error: { message: 'Failed to delete annotation' } });
  }
});

// Get user's annotations
router.get('/user/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const annotations = await annotationRepository.findByUserId(userId);
    res.json(annotations);
  } catch (error: any) {
    console.error('Error fetching user annotations:', error);
    res.status(500).json({ error: { message: 'Failed to fetch annotations' } });
  }
});

export default router;
