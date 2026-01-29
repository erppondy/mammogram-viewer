import { query } from '../config/database';
import { AmbulanceStats, SystemStats } from '../models/AmbulanceStats';

export class AmbulanceStatsRepository {
  /**
   * Get comprehensive statistics for a specific ambulance license
   */
  async getAmbulanceStats(licenseId: string): Promise<AmbulanceStats | null> {
    const result = await query(
      `SELECT 
        al.id as license_id,
        al.ambulance_name,
        al.status as license_status,
        al.upload_quota,
        al.uploads_used,
        al.expires_at,
        
        -- Image statistics
        COUNT(DISTINCT i.id) as total_images,
        COALESCE(SUM(i.file_size), 0) as total_storage_bytes,
        
        -- User statistics
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT CASE WHEN u.last_login_at > NOW() - INTERVAL '30 days' THEN u.id END) as active_users,
        
        -- Activity statistics
        MAX(i.uploaded_at) as last_upload_at,
        COUNT(DISTINCT CASE WHEN i.uploaded_at::date = CURRENT_DATE THEN i.id END) as uploads_today,
        COUNT(DISTINCT CASE WHEN i.uploaded_at > NOW() - INTERVAL '7 days' THEN i.id END) as uploads_this_week,
        COUNT(DISTINCT CASE WHEN i.uploaded_at > NOW() - INTERVAL '30 days' THEN i.id END) as uploads_this_month
        
      FROM ambulance_licenses al
      LEFT JOIN users u ON u.license_id = al.id
      LEFT JOIN images i ON i.license_id = al.id
      WHERE al.id = $1
      GROUP BY al.id, al.ambulance_name, al.status, al.upload_quota, al.uploads_used, al.expires_at`,
      [licenseId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToAmbulanceStats(result.rows[0]);
  }

  /**
   * Get statistics for all ambulances
   */
  async getAllAmbulanceStats(): Promise<AmbulanceStats[]> {
    const result = await query(
      `SELECT 
        al.id as license_id,
        al.ambulance_name,
        al.status as license_status,
        al.upload_quota,
        al.uploads_used,
        al.expires_at,
        
        -- Image statistics
        COUNT(DISTINCT i.id) as total_images,
        COALESCE(SUM(i.file_size), 0) as total_storage_bytes,
        
        -- User statistics
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT CASE WHEN u.last_login_at > NOW() - INTERVAL '30 days' THEN u.id END) as active_users,
        
        -- Activity statistics
        MAX(i.uploaded_at) as last_upload_at,
        COUNT(DISTINCT CASE WHEN i.uploaded_at::date = CURRENT_DATE THEN i.id END) as uploads_today,
        COUNT(DISTINCT CASE WHEN i.uploaded_at > NOW() - INTERVAL '7 days' THEN i.id END) as uploads_this_week,
        COUNT(DISTINCT CASE WHEN i.uploaded_at > NOW() - INTERVAL '30 days' THEN i.id END) as uploads_this_month
        
      FROM ambulance_licenses al
      LEFT JOIN users u ON u.license_id = al.id
      LEFT JOIN images i ON i.license_id = al.id
      GROUP BY al.id, al.ambulance_name, al.status, al.upload_quota, al.uploads_used, al.expires_at
      ORDER BY al.ambulance_name ASC`
    );

    return result.rows.map((row) => this.mapRowToAmbulanceStats(row));
  }

  /**
   * Get storage usage for a specific ambulance
   */
  async getStorageUsage(licenseId: string): Promise<{
    totalBytes: number;
    totalMB: number;
    totalGB: number;
    imageCount: number;
  }> {
    const result = await query(
      `SELECT 
        COUNT(id) as image_count,
        COALESCE(SUM(file_size), 0) as total_bytes
      FROM images
      WHERE license_id = $1`,
      [licenseId]
    );

    const row = result.rows[0];
    const totalBytes = parseInt(row.total_bytes) || 0;

    return {
      totalBytes,
      totalMB: totalBytes / (1024 * 1024),
      totalGB: totalBytes / (1024 * 1024 * 1024),
      imageCount: parseInt(row.image_count) || 0,
    };
  }

  /**
   * Get upload activity for a specific ambulance within a date range
   */
  async getUploadActivity(
    licenseId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{ date: string; count: number }>> {
    let sql = `
      SELECT 
        DATE(uploaded_at) as date,
        COUNT(*) as count
      FROM images
      WHERE license_id = $1
    `;
    const params: any[] = [licenseId];
    let paramCount = 2;

    if (startDate) {
      sql += ` AND uploaded_at >= $${paramCount++}`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND uploaded_at <= $${paramCount++}`;
      params.push(endDate);
    }

    sql += ' GROUP BY DATE(uploaded_at) ORDER BY date DESC';

    const result = await query(sql, params);

    return result.rows.map((row) => ({
      date: row.date,
      count: parseInt(row.count),
    }));
  }

  /**
   * Get system-wide statistics across all ambulances
   */
  async getSystemStats(): Promise<SystemStats> {
    const result = await query(
      `SELECT 
        -- License statistics
        COUNT(DISTINCT al.id) as total_licenses,
        COUNT(DISTINCT CASE WHEN al.status = 'active' THEN al.id END) as active_licenses,
        COUNT(DISTINCT CASE WHEN al.status = 'expired' THEN al.id END) as expired_licenses,
        COUNT(DISTINCT CASE WHEN al.status = 'revoked' THEN al.id END) as revoked_licenses,
        
        -- User statistics
        COUNT(DISTINCT u.id) as total_ambulance_users,
        
        -- Image statistics
        COUNT(DISTINCT i.id) as total_images,
        COALESCE(SUM(i.file_size), 0) as total_storage_bytes
        
      FROM ambulance_licenses al
      LEFT JOIN users u ON u.license_id = al.id
      LEFT JOIN images i ON i.license_id = al.id`
    );

    const row = result.rows[0];
    const totalStorageBytes = parseInt(row.total_storage_bytes) || 0;
    const totalLicenses = parseInt(row.total_licenses) || 0;
    const totalImages = parseInt(row.total_images) || 0;

    return {
      totalLicenses,
      activeLicenses: parseInt(row.active_licenses) || 0,
      expiredLicenses: parseInt(row.expired_licenses) || 0,
      revokedLicenses: parseInt(row.revoked_licenses) || 0,
      totalAmbulanceUsers: parseInt(row.total_ambulance_users) || 0,
      totalImages,
      totalStorageGB: totalStorageBytes / (1024 * 1024 * 1024),
      averageImagesPerAmbulance: totalLicenses > 0 ? totalImages / totalLicenses : 0,
      averageStoragePerAmbulance:
        totalLicenses > 0 ? totalStorageBytes / (1024 * 1024 * 1024) / totalLicenses : 0,
    };
  }

  /**
   * Get user count for a specific license
   */
  async getUserCount(licenseId: string): Promise<number> {
    const result = await query('SELECT COUNT(*) as count FROM users WHERE license_id = $1', [
      licenseId,
    ]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get image count for a specific license
   */
  async getImageCount(licenseId: string): Promise<number> {
    const result = await query('SELECT COUNT(*) as count FROM images WHERE license_id = $1', [
      licenseId,
    ]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get licenses approaching quota limit (e.g., > 80% used)
   */
  async getLicensesApproachingQuota(threshold: number = 0.8): Promise<AmbulanceStats[]> {
    const result = await query(
      `SELECT 
        al.id as license_id,
        al.ambulance_name,
        al.status as license_status,
        al.upload_quota,
        al.uploads_used,
        al.expires_at,
        
        COUNT(DISTINCT i.id) as total_images,
        COALESCE(SUM(i.file_size), 0) as total_storage_bytes,
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT CASE WHEN u.last_login_at > NOW() - INTERVAL '30 days' THEN u.id END) as active_users,
        MAX(i.uploaded_at) as last_upload_at,
        COUNT(DISTINCT CASE WHEN i.uploaded_at::date = CURRENT_DATE THEN i.id END) as uploads_today,
        COUNT(DISTINCT CASE WHEN i.uploaded_at > NOW() - INTERVAL '7 days' THEN i.id END) as uploads_this_week,
        COUNT(DISTINCT CASE WHEN i.uploaded_at > NOW() - INTERVAL '30 days' THEN i.id END) as uploads_this_month
        
      FROM ambulance_licenses al
      LEFT JOIN users u ON u.license_id = al.id
      LEFT JOIN images i ON i.license_id = al.id
      WHERE al.status = 'active'
      AND al.uploads_used::float / al.upload_quota >= $1
      GROUP BY al.id, al.ambulance_name, al.status, al.upload_quota, al.uploads_used, al.expires_at
      ORDER BY (al.uploads_used::float / al.upload_quota) DESC`,
      [threshold]
    );

    return result.rows.map((row) => this.mapRowToAmbulanceStats(row));
  }

  /**
   * Get licenses expiring soon (within specified days)
   */
  async getLicensesExpiringSoon(days: number = 7): Promise<AmbulanceStats[]> {
    const result = await query(
      `SELECT 
        al.id as license_id,
        al.ambulance_name,
        al.status as license_status,
        al.upload_quota,
        al.uploads_used,
        al.expires_at,
        
        COUNT(DISTINCT i.id) as total_images,
        COALESCE(SUM(i.file_size), 0) as total_storage_bytes,
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT CASE WHEN u.last_login_at > NOW() - INTERVAL '30 days' THEN u.id END) as active_users,
        MAX(i.uploaded_at) as last_upload_at,
        COUNT(DISTINCT CASE WHEN i.uploaded_at::date = CURRENT_DATE THEN i.id END) as uploads_today,
        COUNT(DISTINCT CASE WHEN i.uploaded_at > NOW() - INTERVAL '7 days' THEN i.id END) as uploads_this_week,
        COUNT(DISTINCT CASE WHEN i.uploaded_at > NOW() - INTERVAL '30 days' THEN i.id END) as uploads_this_month
        
      FROM ambulance_licenses al
      LEFT JOIN users u ON u.license_id = al.id
      LEFT JOIN images i ON i.license_id = al.id
      WHERE al.status = 'active'
      AND al.expires_at <= NOW() + INTERVAL '${days} days'
      AND al.expires_at > NOW()
      GROUP BY al.id, al.ambulance_name, al.status, al.upload_quota, al.uploads_used, al.expires_at
      ORDER BY al.expires_at ASC`
    );

    return result.rows.map((row) => this.mapRowToAmbulanceStats(row));
  }

  /**
   * Map database row to AmbulanceStats model
   */
  private mapRowToAmbulanceStats(row: any): AmbulanceStats {
    const totalStorageBytes = parseInt(row.total_storage_bytes) || 0;
    const uploadQuota = parseInt(row.upload_quota) || 1;
    const uploadsUsed = parseInt(row.uploads_used) || 0;
    const expiresAt = new Date(row.expires_at);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      licenseId: row.license_id,
      ambulanceName: row.ambulance_name,
      licenseStatus: row.license_status,
      totalImages: parseInt(row.total_images) || 0,
      totalStorageBytes,
      totalStorageMB: totalStorageBytes / (1024 * 1024),
      totalStorageGB: totalStorageBytes / (1024 * 1024 * 1024),
      totalUsers: parseInt(row.total_users) || 0,
      activeUsers: parseInt(row.active_users) || 0,
      uploadQuota,
      uploadsUsed,
      uploadsRemaining: Math.max(0, uploadQuota - uploadsUsed),
      quotaUsagePercent: (uploadsUsed / uploadQuota) * 100,
      expiresAt,
      daysUntilExpiry,
      lastUploadAt: row.last_upload_at ? new Date(row.last_upload_at) : null,
      uploadsToday: parseInt(row.uploads_today) || 0,
      uploadsThisWeek: parseInt(row.uploads_this_week) || 0,
      uploadsThisMonth: parseInt(row.uploads_this_month) || 0,
    };
  }
}

// Export singleton instance
export const ambulanceStatsRepository = new AmbulanceStatsRepository();
