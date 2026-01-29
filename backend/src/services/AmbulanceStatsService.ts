import { ambulanceStatsRepository } from '../repositories/AmbulanceStatsRepository';
import { licenseRepository } from '../repositories/LicenseRepository';
import { AmbulanceStats, SystemStats, StorageUsage } from '../models/AmbulanceStats';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface StatsFilters {
  status?: string;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class AmbulanceStatsService {
  /**
   * Get comprehensive statistics for a specific ambulance
   */
  async getAmbulanceStats(licenseId: string): Promise<AmbulanceStats> {
    const stats = await ambulanceStatsRepository.getAmbulanceStats(licenseId);
    if (!stats) {
      throw new Error('License not found');
    }

    return stats;
  }

  /**
   * Get storage usage details for an ambulance
   */
  async getAmbulanceStorageUsage(licenseId: string): Promise<StorageUsage> {
    const license = await licenseRepository.findById(licenseId);
    if (!license) {
      throw new Error('License not found');
    }

    const storageStats = await ambulanceStatsRepository.getStorageUsage(licenseId);
    
    return {
      licenseId,
      totalBytes: storageStats.totalBytes,
      totalMB: storageStats.totalMB,
      totalGB: storageStats.totalGB,
      imageCount: storageStats.imageCount,
    };
  }

  /**
   * Get upload activity for an ambulance over a date range
   */
  async getAmbulanceUploadActivity(
    licenseId: string,
    dateRange?: DateRange
  ): Promise<Array<{ date: string; count: number }>> {
    const license = await licenseRepository.findById(licenseId);
    if (!license) {
      throw new Error('License not found');
    }

    // Default to last 30 days if no range provided
    const endDate = dateRange?.endDate || new Date();
    const startDate = dateRange?.startDate || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    return ambulanceStatsRepository.getUploadActivity(licenseId, startDate, endDate);
  }

  /**
   * Get system-wide statistics across all ambulances
   */
  async getSystemStats(): Promise<SystemStats> {
    return ambulanceStatsRepository.getSystemStats();
  }

  /**
   * Get statistics for all ambulances with optional filters
   */
  async getAllAmbulanceStats(filters?: StatsFilters): Promise<AmbulanceStats[]> {
    // Get all stats from repository
    let allStats = await ambulanceStatsRepository.getAllAmbulanceStats();

    // Apply filters
    if (filters?.status) {
      allStats = allStats.filter(stat => stat.licenseStatus === filters.status);
    }

    if (filters?.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      allStats = allStats.filter(stat => 
        stat.ambulanceName.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting if specified
    if (filters?.sortBy) {
      allStats.sort((a, b) => {
        const aValue = (a as any)[filters.sortBy!];
        const bValue = (b as any)[filters.sortBy!];
        
        if (aValue === bValue) return 0;
        
        const comparison = aValue > bValue ? 1 : -1;
        return filters.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return allStats;
  }

  /**
   * Export statistics to CSV format
   */
  async exportStatsToCSV(licenseId?: string): Promise<Buffer> {
    let stats: AmbulanceStats[];
    
    if (licenseId) {
      const singleStat = await this.getAmbulanceStats(licenseId);
      stats = [singleStat];
    } else {
      stats = await this.getAllAmbulanceStats();
    }

    // Build CSV content
    const headers = [
      'License ID',
      'Ambulance Name',
      'Status',
      'Total Images',
      'Storage (GB)',
      'Total Users',
      'Upload Quota',
      'Uploads Used',
      'Quota Usage %',
      'Days Until Expiry',
      'Last Upload',
    ];

    const rows = stats.map(stat => [
      stat.licenseId,
      stat.ambulanceName,
      stat.licenseStatus,
      stat.totalImages,
      stat.totalStorageGB,
      stat.totalUsers,
      stat.uploadQuota,
      stat.uploadsUsed,
      stat.quotaUsagePercent,
      stat.daysUntilExpiry,
      stat.lastUploadAt ? stat.lastUploadAt.toISOString() : 'Never',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return Buffer.from(csvContent, 'utf-8');
  }

  /**
   * Get ambulances approaching quota limit
   */
  async getAmbulancesNearQuota(thresholdPercent: number = 80): Promise<AmbulanceStats[]> {
    const allStats = await this.getAllAmbulanceStats({ status: 'active' });
    
    return allStats.filter(stat => stat.quotaUsagePercent >= thresholdPercent);
  }

  /**
   * Get ambulances expiring soon
   */
  async getAmbulancesExpiringSoon(daysThreshold: number = 7): Promise<AmbulanceStats[]> {
    const allStats = await this.getAllAmbulanceStats({ status: 'active' });
    
    return allStats.filter(stat => stat.daysUntilExpiry <= daysThreshold && stat.daysUntilExpiry > 0);
  }
}

// Export singleton instance
export const ambulanceStatsService = new AmbulanceStatsService();
