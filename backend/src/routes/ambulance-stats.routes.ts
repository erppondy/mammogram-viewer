import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';
import { ambulanceStatsService } from '../services/AmbulanceStatsService';

const router = Router();

/**
 * GET /api/ambulance-stats
 * Get statistics for all ambulances (admin only)
 */
router.get('/', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, sortBy, sortOrder } = req.query;

    const filters: any = {};
    if (status) filters.status = status as string;
    if (sortBy) filters.sortBy = sortBy as string;
    if (sortOrder) filters.sortOrder = sortOrder as string;

    const stats = await ambulanceStatsService.getAllAmbulanceStats(filters);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get all ambulance stats error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get ambulance statistics';

    res.status(500).json({
      error: {
        code: 'GET_STATS_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/ambulance-stats/system
 * Get system-wide statistics (admin only)
 */
router.get('/system', authMiddleware, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const systemStats = await ambulanceStatsService.getSystemStats();

    res.json({
      success: true,
      data: systemStats,
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get system statistics';

    res.status(500).json({
      error: {
        code: 'GET_SYSTEM_STATS_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/ambulance-stats/export/csv
 * Export all ambulance statistics to CSV (admin only)
 */
router.get('/export/csv', authMiddleware, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const csv = await ambulanceStatsService.exportStatsToCSV();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="ambulance-stats-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export stats CSV error:', error);
    const message = error instanceof Error ? error.message : 'Failed to export statistics';

    res.status(500).json({
      error: {
        code: 'EXPORT_CSV_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/ambulance-stats/:licenseId
 * Get statistics for a specific ambulance (admin only)
 */
router.get('/:licenseId', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { licenseId } = req.params;

    const stats = await ambulanceStatsService.getAmbulanceStats(licenseId);

    if (!stats) {
      return res.status(404).json({
        error: {
          code: 'LICENSE_NOT_FOUND',
          message: 'License not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get ambulance stats error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get ambulance statistics';

    res.status(500).json({
      error: {
        code: 'GET_AMBULANCE_STATS_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/ambulance-stats/:licenseId/activity
 * Get upload activity for a specific ambulance (admin only)
 */
router.get('/:licenseId/activity', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { licenseId } = req.params;
    const { startDate, endDate } = req.query;

    const dateRange = startDate && endDate 
      ? { startDate: new Date(startDate as string), endDate: new Date(endDate as string) }
      : undefined;

    const activity = await ambulanceStatsService.getAmbulanceUploadActivity(licenseId, dateRange);

    res.json({
      success: true,
      data: activity,
    });
  } catch (error) {
    console.error('Get ambulance activity error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get ambulance activity';

    res.status(500).json({
      error: {
        code: 'GET_ACTIVITY_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/ambulance-stats/:licenseId/export/csv
 * Export specific ambulance statistics to CSV (admin only)
 */
router.get('/:licenseId/export/csv', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { licenseId } = req.params;

    const csv = await ambulanceStatsService.exportStatsToCSV(licenseId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="ambulance-stats-${licenseId}-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export ambulance stats CSV error:', error);
    const message = error instanceof Error ? error.message : 'Failed to export ambulance statistics';

    res.status(500).json({
      error: {
        code: 'EXPORT_AMBULANCE_CSV_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/ambulance-stats/:licenseId/storage
 * Get storage usage for a specific ambulance (admin only)
 */
router.get('/:licenseId/storage', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { licenseId } = req.params;

    const storageUsage = await ambulanceStatsService.getAmbulanceStorageUsage(licenseId);

    res.json({
      success: true,
      data: storageUsage,
    });
  } catch (error) {
    console.error('Get ambulance storage error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get ambulance storage usage';

    res.status(500).json({
      error: {
        code: 'GET_STORAGE_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
