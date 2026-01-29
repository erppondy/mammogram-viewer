import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import reportRepository from '../repositories/ReportRepository';
import { CreateReportDTO, UpdateReportDTO, FinalizeReportDTO } from '../models/Report';

const router = Router();

// Create report
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const radiologistId = (req as any).user.id;
    const data: CreateReportDTO = req.body;

    if (!data.image_ids || data.image_ids.length === 0) {
      return res.status(400).json({ 
        error: { message: 'At least one image_id is required' }
      });
    }

    const report = await reportRepository.create(radiologistId, data);
    res.status(201).json(report);
  } catch (error: any) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: { message: 'Failed to create report' } });
  }
});

// Get all reports (with pagination)
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const reports = await reportRepository.findAll(limit, offset);
    res.json(reports);
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: { message: 'Failed to fetch reports' } });
  }
});

// Get report by ID
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const report = await reportRepository.findById(id);
    
    if (!report) {
      return res.status(404).json({ error: { message: 'Report not found' } });
    }

    res.json(report);
  } catch (error: any) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: { message: 'Failed to fetch report' } });
  }
});

// Get reports by image ID
router.get('/image/:imageId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const imageId = req.params.imageId;
    const reports = await reportRepository.findByImageId(imageId);
    res.json(reports);
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: { message: 'Failed to fetch reports' } });
  }
});

// Get reports by patient ID
router.get('/patient/:patientId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const patientId = req.params.patientId;
    const reports = await reportRepository.findByPatientId(patientId);
    res.json(reports);
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: { message: 'Failed to fetch reports' } });
  }
});

// Get user's reports
router.get('/user/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const reports = await reportRepository.findByRadiologistId(userId);
    res.json(reports);
  } catch (error: any) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({ error: { message: 'Failed to fetch reports' } });
  }
});

// Update report
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const userId = (req as any).user.id;
    const data: UpdateReportDTO = req.body;

    // Check if report exists
    const existing = await reportRepository.findById(id);
    if (!existing) {
      return res.status(404).json({ error: { message: 'Report not found' } });
    }

    // Only allow update if report is in draft status or user is admin
    const isAdmin = (req as any).user.role === 'admin';
    if (existing.status !== 'draft' && !isAdmin) {
      return res.status(403).json({ 
        error: { message: 'Cannot update finalized report' } 
      });
    }

    // Only allow update if user is owner or admin
    if (existing.radiologist_id !== userId && !isAdmin) {
      return res.status(403).json({ 
        error: { message: 'Not authorized to update this report' } 
      });
    }

    const report = await reportRepository.update(id, data);
    res.json(report);
  } catch (error: any) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: { message: 'Failed to update report' } });
  }
});

// Finalize report
router.post('/:id/finalize', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const userId = (req as any).user.id;
    const data: FinalizeReportDTO = req.body;

    // Check if report exists
    const existing = await reportRepository.findById(id);
    if (!existing) {
      return res.status(404).json({ error: { message: 'Report not found' } });
    }

    // Only allow finalize if user is owner or admin
    const isAdmin = (req as any).user.role === 'admin';
    if (existing.radiologist_id !== userId && !isAdmin) {
      return res.status(403).json({ 
        error: { message: 'Not authorized to finalize this report' } 
      });
    }

    // Check if already finalized
    if (existing.status === 'finalized' || existing.status === 'signed') {
      return res.status(400).json({ 
        error: { message: 'Report is already finalized' } 
      });
    }

    const report = await reportRepository.finalize(id, data.signature_data);
    res.json(report);
  } catch (error: any) {
    console.error('Error finalizing report:', error);
    res.status(500).json({ error: { message: 'Failed to finalize report' } });
  }
});

// Delete report
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const userId = (req as any).user.id;

    // Check if report exists
    const existing = await reportRepository.findById(id);
    if (!existing) {
      return res.status(404).json({ error: { message: 'Report not found' } });
    }

    // Only allow delete if user is owner or admin
    const isAdmin = (req as any).user.role === 'admin';
    if (existing.radiologist_id !== userId && !isAdmin) {
      return res.status(403).json({ 
        error: { message: 'Not authorized to delete this report' } 
      });
    }

    // Only allow delete if report is in draft status
    if (existing.status !== 'draft' && !isAdmin) {
      return res.status(403).json({ 
        error: { message: 'Cannot delete finalized report' } 
      });
    }

    await reportRepository.delete(id);
    res.json({ message: 'Report deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: { message: 'Failed to delete report' } });
  }
});

export default router;
