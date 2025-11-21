import { analyticsRepository } from '../repositories/AnalyticsRepository';

class AnalyticsService {
  // Track image view
  async trackImageView(imageId: number, userId: number, viewDuration?: number): Promise<void> {
    await analyticsRepository.trackImageView(imageId, userId, viewDuration);
  }

  // Track user activity
  async trackActivity(
    userId: number,
    activityType: 'login' | 'upload' | 'view' | 'download' | 'delete' | 'update',
    resourceType?: string,
    resourceId?: number,
    metadata?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await analyticsRepository.trackActivity(
      userId,
      activityType,
      resourceType,
      resourceId,
      metadata,
      ipAddress,
      userAgent
    );
  }

  // Get dashboard metrics
  async getDashboardMetrics(days: number = 30) {
    return await analyticsRepository.getDashboardMetrics(days);
  }

  // Get user analytics
  async getUserAnalytics(userId: number, days: number = 30) {
    return await analyticsRepository.getUserAnalytics(userId, days);
  }

  // Get image statistics
  async getImageStatistics() {
    return await analyticsRepository.getImageStatistics();
  }

  // Get upload trends
  async getUploadTrends(days: number = 30) {
    return await analyticsRepository.getUploadTrends(days);
  }

  // Get most viewed images
  async getMostViewedImages(limit: number = 10) {
    return await analyticsRepository.getMostViewedImages(limit);
  }

  // Get system stats for date range
  async getSystemStats(startDate: Date, endDate: Date) {
    return await analyticsRepository.getSystemStats(startDate, endDate);
  }

  // Get latest system stats
  async getLatestSystemStats() {
    return await analyticsRepository.getLatestSystemStats();
  }

  // Update system stats (should be run daily via cron)
  async updateSystemStats(date: Date = new Date()) {
    await analyticsRepository.updateSystemStats(date);
  }

  // Get activity by type
  async getActivityByType(activityType: string, startDate?: Date, endDate?: Date) {
    return await analyticsRepository.getActivityByType(activityType, startDate, endDate);
  }

  // Get recent system activity
  async getRecentSystemActivity(limit: number = 50) {
    return await analyticsRepository.getRecentSystemActivity(limit);
  }
}

export const analyticsService = new AnalyticsService();
