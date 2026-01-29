export interface AmbulanceStats {
  licenseId: string;
  ambulanceName: string;
  licenseStatus: string;
  
  // Usage metrics
  totalImages: number;
  totalStorageBytes: number;
  totalStorageMB: number;
  totalStorageGB: number;
  
  // User metrics
  totalUsers: number;
  activeUsers: number;
  
  // Quota metrics
  uploadQuota: number;
  uploadsUsed: number;
  uploadsRemaining: number;
  quotaUsagePercent: number;
  
  // Date metrics
  expiresAt: Date;
  daysUntilExpiry: number;
  
  // Activity metrics
  lastUploadAt: Date | null;
  uploadsToday: number;
  uploadsThisWeek: number;
  uploadsThisMonth: number;
}

export interface SystemStats {
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  revokedLicenses: number;
  
  totalAmbulanceUsers: number;
  totalImages: number;
  totalStorageGB: number;
  
  averageImagesPerAmbulance: number;
  averageStoragePerAmbulance: number;
}

export interface StorageUsage {
  licenseId: string;
  totalBytes: number;
  totalMB: number;
  totalGB: number;
  imageCount: number;
}

export interface UploadActivity {
  date: Date;
  uploadCount: number;
  storageBytes: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface StatsFilters {
  status?: string;
  ambulanceName?: string;
  minQuotaUsage?: number;
  maxQuotaUsage?: number;
  expiresWithinDays?: number;
}

/**
 * Convert AmbulanceStats to response format
 */
export function toStatsResponse(stats: AmbulanceStats): AmbulanceStats {
  return {
    licenseId: stats.licenseId,
    ambulanceName: stats.ambulanceName,
    licenseStatus: stats.licenseStatus,
    totalImages: stats.totalImages,
    totalStorageBytes: stats.totalStorageBytes,
    totalStorageMB: stats.totalStorageMB,
    totalStorageGB: stats.totalStorageGB,
    totalUsers: stats.totalUsers,
    activeUsers: stats.activeUsers,
    uploadQuota: stats.uploadQuota,
    uploadsUsed: stats.uploadsUsed,
    uploadsRemaining: stats.uploadsRemaining,
    quotaUsagePercent: stats.quotaUsagePercent,
    expiresAt: stats.expiresAt,
    daysUntilExpiry: stats.daysUntilExpiry,
    lastUploadAt: stats.lastUploadAt,
    uploadsToday: stats.uploadsToday,
    uploadsThisWeek: stats.uploadsThisWeek,
    uploadsThisMonth: stats.uploadsThisMonth,
  };
}

/**
 * Convert SystemStats to response format
 */
export function toSystemStatsResponse(stats: SystemStats): SystemStats {
  return {
    totalLicenses: stats.totalLicenses,
    activeLicenses: stats.activeLicenses,
    expiredLicenses: stats.expiredLicenses,
    revokedLicenses: stats.revokedLicenses,
    totalAmbulanceUsers: stats.totalAmbulanceUsers,
    totalImages: stats.totalImages,
    totalStorageGB: stats.totalStorageGB,
    averageImagesPerAmbulance: stats.averageImagesPerAmbulance,
    averageStoragePerAmbulance: stats.averageStoragePerAmbulance,
  };
}
