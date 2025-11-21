import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';
import { analyticsService } from '../services/AnalyticsService';

const router = Router();

// All analytics routes require authentication
router.use(authMiddleware);

// Get dashboard metrics (admin only)
router.get('/dashboard', requireAdmin, async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const metrics = await analyticsService.getDashboardMetrics(days);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

// Get user analytics (own data or admin can view any user)
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const requestingUserId = (req as any).user.userId;
    const isAdmin = (req as any).user.role === 'super_admin';

    // Users can only view their own analytics unless they're admin
    if (userId !== requestingUserId && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const days = parseInt(req.query.days as string) || 30;
    const analytics = await analyticsService.getUserAnalytics(userId, days);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
});

// Get image statistics (admin only)
router.get('/images/statistics', requireAdmin, async (req: Request, res: Response) => {
  try {
    const statistics = await analyticsService.getImageStatistics();
    res.json(statistics);
  } catch (error) {
    console.error('Error fetching image statistics:', error);
    res.status(500).json({ error: 'Failed to fetch image statistics' });
  }
});

// Get upload trends (admin only)
router.get('/uploads/trends', requireAdmin, async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const trends = await analyticsService.getUploadTrends(days);
    res.json(trends);
  } catch (error) {
    console.error('Error fetching upload trends:', error);
    res.status(500).json({ error: 'Failed to fetch upload trends' });
  }
});

// Get most viewed images (admin only)
router.get('/images/most-viewed', requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const images = await analyticsService.getMostViewedImages(limit);
    res.json(images);
  } catch (error) {
    console.error('Error fetching most viewed images:', error);
    res.status(500).json({ error: 'Failed to fetch most viewed images' });
  }
});

// Get system stats for date range (admin only)
router.get('/system/stats', requireAdmin, async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    const stats = await analyticsService.getSystemStats(startDate, endDate);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Failed to fetch system stats' });
  }
});

// Get latest system stats (admin only)
router.get('/system/stats/latest', requireAdmin, async (req: Request, res: Response) => {
  try {
    const stats = await analyticsService.getLatestSystemStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching latest system stats:', error);
    res.status(500).json({ error: 'Failed to fetch latest system stats' });
  }
});

// Get recent system activity (admin only)
router.get('/activity/recent', requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const activity = await analyticsService.getRecentSystemActivity(limit);
    res.json(activity);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

// Manually trigger system stats update (admin only)
router.post('/system/stats/update', requireAdmin, async (req: Request, res: Response) => {
  try {
    const date = req.body.date ? new Date(req.body.date) : new Date();
    await analyticsService.updateSystemStats(date);
    res.json({ message: 'System stats updated successfully' });
  } catch (error) {
    console.error('Error updating system stats:', error);
    res.status(500).json({ error: 'Failed to update system stats' });
  }
});

export default router;
