import api from './api';

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
  expiresAt: string;
  daysUntilExpiry: number;
  
  // Activity metrics
  lastUploadAt: string | null;
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

export interface UploadActivity {
  date: string;
  uploadCount: number;
  storageBytes: number;
}

export interface StatsFilters {
  status?: string;
  ambulanceName?: string;
  minQuotaUsage?: number;
  maxQuotaUsage?: number;
  expiresWithinDays?: number;
}

class AmbulanceStatsService {
  async getAllAmbulanceStats(filters?: StatsFilters): Promise<AmbulanceStats[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.ambulanceName) params.append('ambulanceName', filters.ambulanceName);
    if (filters?.minQuotaUsage !== undefined) params.append('minQuotaUsage', filters.minQuotaUsage.toString());
    if (filters?.maxQuotaUsage !== undefined) params.append('maxQuotaUsage', filters.maxQuotaUsage.toString());
    if (filters?.expiresWithinDays !== undefined) params.append('expiresWithinDays', filters.expiresWithinDays.toString());

    const queryString = params.toString();
    const url = `/ambulance-stats${queryString ? `?${queryString}` : ''}`;

    const response = await api.get(url);
    return response.data.data || response.data;
  }

  async getAmbulanceStats(licenseId: string): Promise<AmbulanceStats> {
    const response = await api.get(`/ambulance-stats/${licenseId}`);
    return response.data.data || response.data;
  }

  async getSystemStats(): Promise<SystemStats> {
    const response = await api.get('/ambulance-stats/system');
    return response.data.data || response.data;
  }

  async getUploadActivity(licenseId: string, days: number = 30): Promise<UploadActivity[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const response = await api.get(`/ambulance-stats/${licenseId}/activity`, {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
    return response.data.data || response.data;
  }

  async exportStatsCSV(licenseId?: string): Promise<Blob> {
    const url = licenseId 
      ? `/ambulance-stats/${licenseId}/export/csv`
      : '/ambulance-stats/export/csv';
    
    const response = await api.get(url, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export const ambulanceStatsService = new AmbulanceStatsService();
