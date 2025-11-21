import { pool } from '../config/database';

export interface ImageView {
  id: number;
  image_id: number;
  user_id: number;
  viewed_at: Date;
  view_duration?: number;
}

export interface UserActivity {
  id: number;
  user_id: number;
  activity_type: string;
  resource_type?: string;
  resource_id?: number;
  metadata?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface SystemStats {
  stat_date: Date;
  total_users: number;
  active_users: number;
  new_users: number;
  total_images: number;
  new_images: number;
  total_views: number;
  total_uploads: number;
  total_downloads: number;
  storage_used: number;
  dicom_count: number;
  aan_count: number;
  jpeg_count: number;
  png_count: number;
  tiff_count: number;
  other_count: number;
}

class AnalyticsRepository {
  // Image Views
  async trackImageView(imageId: number, userId: number, viewDuration?: number): Promise<void> {
    await pool.query(
      'INSERT INTO image_views (image_id, user_id, view_duration) VALUES ($1, $2, $3)',
      [imageId, userId, viewDuration]
    );
  }

  async getImageViewCount(imageId: number): Promise<number> {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM image_views WHERE image_id = $1',
      [imageId]
    );
    return parseInt(result.rows[0].count);
  }

  async getMostViewedImages(limit: number = 10): Promise<any[]> {
    const result = await pool.query(
      `SELECT i.id, i.original_name, i.file_type, COUNT(iv.id) as view_count
       FROM images i
       LEFT JOIN image_views iv ON i.id = iv.image_id
       GROUP BY i.id
       ORDER BY view_count DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  // User Activity
  async trackActivity(
    userId: number,
    activityType: string,
    resourceType?: string,
    resourceId?: number,
    metadata?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await pool.query(
      `INSERT INTO user_activity 
       (user_id, activity_type, resource_type, resource_id, metadata, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, activityType, resourceType, resourceId, JSON.stringify(metadata), ipAddress, userAgent]
    );
  }

  async getUserActivityCount(userId: number, startDate?: Date, endDate?: Date): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM user_activity WHERE user_id = $1';
    const params: any[] = [userId];

    if (startDate) {
      params.push(startDate);
      query += ` AND created_at >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      query += ` AND created_at <= $${params.length}`;
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  }

  async getRecentActivity(userId: number, limit: number = 50): Promise<UserActivity[]> {
    const result = await pool.query(
      `SELECT * FROM user_activity 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  async getActivityByType(activityType: string, startDate?: Date, endDate?: Date): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM user_activity WHERE activity_type = $1';
    const params: any[] = [activityType];

    if (startDate) {
      params.push(startDate);
      query += ` AND created_at >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      query += ` AND created_at <= $${params.length}`;
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  }

  // System Stats
  async updateSystemStats(date: Date): Promise<void> {
    await pool.query('SELECT update_system_stats($1)', [date]);
  }

  async getSystemStats(startDate: Date, endDate: Date): Promise<SystemStats[]> {
    const result = await pool.query(
      `SELECT * FROM system_stats 
       WHERE stat_date >= $1 AND stat_date <= $2 
       ORDER BY stat_date ASC`,
      [startDate, endDate]
    );
    return result.rows;
  }

  async getLatestSystemStats(): Promise<SystemStats | null> {
    const result = await pool.query(
      'SELECT * FROM system_stats ORDER BY stat_date DESC LIMIT 1'
    );
    return result.rows[0] || null;
  }

  // Dashboard Metrics
  async getDashboardMetrics(days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      stats,
      topImages,
      activityCounts,
      recentActivity,
    ] = await Promise.all([
      this.getSystemStats(startDate, new Date()),
      this.getMostViewedImages(10),
      this.getActivityCounts(startDate, new Date()),
      this.getRecentSystemActivity(50),
    ]);

    return {
      stats,
      topImages,
      activityCounts,
      recentActivity,
    };
  }

  async getActivityCounts(startDate: Date, endDate: Date): Promise<any> {
    const result = await pool.query(
      `SELECT 
        activity_type,
        COUNT(*) as count,
        DATE(created_at) as date
       FROM user_activity
       WHERE created_at >= $1 AND created_at <= $2
       GROUP BY activity_type, DATE(created_at)
       ORDER BY date ASC`,
      [startDate, endDate]
    );
    return result.rows;
  }

  async getRecentSystemActivity(limit: number = 50): Promise<any[]> {
    const result = await pool.query(
      `SELECT 
        ua.*,
        u.username,
        u.email
       FROM user_activity ua
       JOIN users u ON ua.user_id = u.id
       ORDER BY ua.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  // User Analytics
  async getUserAnalytics(userId: number, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      activityCount,
      recentActivity,
      uploadCount,
      viewCount,
    ] = await Promise.all([
      this.getUserActivityCount(userId, startDate),
      this.getRecentActivity(userId, 20),
      this.getActivityByType('upload', startDate),
      pool.query(
        'SELECT COUNT(*) as count FROM image_views WHERE user_id = $1 AND viewed_at >= $2',
        [userId, startDate]
      ),
    ]);

    return {
      activityCount,
      recentActivity,
      uploadCount,
      viewCount: parseInt(viewCount.rows[0].count),
      period: days,
    };
  }

  // Image Statistics
  async getImageStatistics(): Promise<any> {
    const result = await pool.query(`
      SELECT 
        file_type,
        COUNT(*) as count,
        SUM(file_size) as total_size,
        AVG(file_size) as avg_size,
        MIN(file_size) as min_size,
        MAX(file_size) as max_size
      FROM images
      GROUP BY file_type
      ORDER BY count DESC
    `);

    const totalResult = await pool.query(`
      SELECT 
        COUNT(*) as total_count,
        SUM(file_size) as total_size,
        AVG(file_size) as avg_size
      FROM images
    `);

    return {
      byType: result.rows,
      total: totalResult.rows[0],
    };
  }

  async getUploadTrends(days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await pool.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        SUM(file_size) as total_size
       FROM images
       WHERE created_at >= $1
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [startDate]
    );

    return result.rows;
  }
}

export const analyticsRepository = new AnalyticsRepository();
