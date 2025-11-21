import api from './api';

export interface DashboardMetrics {
  stats: SystemStats[];
  topImages: TopImage[];
  activityCounts: ActivityCount[];
  recentActivity: RecentActivity[];
}

export interface SystemStats {
  stat_date: string;
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

export interface TopImage {
  id: number;
  original_name: string;
  file_type: string;
  view_count: number;
}

export interface ActivityCount {
  activity_type: string;
  count: number;
  date: string;
}

export interface RecentActivity {
  id: number;
  user_id: number;
  username: string;
  email: string;
  activity_type: string;
  resource_type?: string;
  resource_id?: number;
  created_at: string;
}

export interface ImageStatistics {
  byType: TypeStatistics[];
  total: TotalStatistics;
}

export interface TypeStatistics {
  file_type: string;
  count: number;
  total_size: number;
  avg_size: number;
  min_size: number;
  max_size: number;
}

export interface TotalStatistics {
  total_count: number;
  total_size: number;
  avg_size: number;
}

export interface UploadTrend {
  date: string;
  count: number;
  total_size: number;
}

export interface UserAnalytics {
  activityCount: number;
  recentActivity: RecentActivity[];
  uploadCount: number;
  viewCount: number;
  period: number;
}

class AnalyticsService {
  async getDashboardMetrics(days: number = 30): Promise<DashboardMetrics> {
    const response = await api.get(`/analytics/dashboard?days=${days}`);
    return response.data;
  }

  async getUserAnalytics(userId: number, days: number = 30): Promise<UserAnalytics> {
    const response = await api.get(`/analytics/user/${userId}?days=${days}`);
    return response.data;
  }

  async getImageStatistics(): Promise<ImageStatistics> {
    const response = await api.get('/analytics/images/statistics');
    return response.data;
  }

  async getUploadTrends(days: number = 30): Promise<UploadTrend[]> {
    const response = await api.get(`/analytics/uploads/trends?days=${days}`);
    return response.data;
  }

  async getMostViewedImages(limit: number = 10): Promise<TopImage[]> {
    const response = await api.get(`/analytics/images/most-viewed?limit=${limit}`);
    return response.data;
  }

  async getSystemStats(startDate: string, endDate: string): Promise<SystemStats[]> {
    const response = await api.get(
      `/analytics/system/stats?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data;
  }

  async getLatestSystemStats(): Promise<SystemStats> {
    const response = await api.get('/analytics/system/stats/latest');
    return response.data;
  }

  async getRecentActivity(limit: number = 50): Promise<RecentActivity[]> {
    const response = await api.get(`/analytics/activity/recent?limit=${limit}`);
    return response.data;
  }

  async updateSystemStats(date?: string): Promise<void> {
    await api.post('/analytics/system/stats/update', { date });
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
}

export const analyticsService = new AnalyticsService();
