import React, { useState, useEffect } from 'react';
import { AmbulanceStats, UploadActivity, ambulanceStatsService } from '../../services/ambulanceStatsService';
import { adminService } from '../../services/adminService';
import QuotaUsageIndicator from './QuotaUsageIndicator';
import StorageUsageChart from './StorageUsageChart';
import UploadActivityChart from './UploadActivityChart';
import GradientButton from '../GradientButton';
import CustomLoader from '../CustomLoader';

interface AmbulanceDetailsDashboardProps {
  licenseId: string;
  onClose: () => void;
}

const AmbulanceDetailsDashboard: React.FC<AmbulanceDetailsDashboardProps> = ({
  licenseId,
  onClose,
}) => {
  const [stats, setStats] = useState<AmbulanceStats | null>(null);
  const [activities, setActivities] = useState<UploadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityDays, setActivityDays] = useState(30);
  const [showImages, setShowImages] = useState(false);
  const [images, setImages] = useState<any[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [licenseId, activityDays]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, activitiesData] = await Promise.all([
        ambulanceStatsService.getAmbulanceStats(licenseId),
        ambulanceStatsService.getUploadActivity(licenseId, activityDays),
      ]);
      setStats(statsData);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error fetching ambulance details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await ambulanceStatsService.exportStatsCSV(licenseId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ambulance-stats-${stats?.ambulanceName || licenseId}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting stats:', error);
    }
  };

  const handleViewImages = async () => {
    if (showImages) {
      setShowImages(false);
      return;
    }

    try {
      setImagesLoading(true);
      const response = await adminService.getImagesByLicense(licenseId, 20, 0);
      setImages(response.images);
      setShowImages(true);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setImagesLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <CustomLoader size={60} />
          <div className="text-center mt-4 text-gray-700">Loading details...</div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      expired: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Expired' },
      revoked: { bg: 'bg-red-100', text: 'text-red-800', label: 'Revoked' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">{stats.ambulanceName}</h2>
              <div className="flex items-center gap-3">
                {getStatusBadge(stats.licenseStatus)}
                <span className="text-sm opacity-90">License ID: {licenseId.substring(0, 16)}...</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 font-medium mb-1">Total Images</div>
              <div className="text-3xl font-bold text-blue-700">{stats.totalImages.toLocaleString()}</div>
              <div className="text-xs text-blue-500 mt-1">+{stats.uploadsToday} today</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600 font-medium mb-1">Total Storage</div>
              <div className="text-3xl font-bold text-green-700">{stats.totalStorageGB.toFixed(2)} GB</div>
              <div className="text-xs text-green-500 mt-1">{stats.totalStorageMB.toFixed(0)} MB</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-purple-600 font-medium mb-1">Total Users</div>
              <div className="text-3xl font-bold text-purple-700">{stats.totalUsers}</div>
              <div className="text-xs text-purple-500 mt-1">{stats.activeUsers} active</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-orange-600 font-medium mb-1">Expires In</div>
              <div className="text-3xl font-bold text-orange-700">{stats.daysUntilExpiry}</div>
              <div className="text-xs text-orange-500 mt-1">days</div>
            </div>
          </div>

          {/* Quota Usage */}
          <div className="p-6 rounded-lg shadow-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Quota</h3>
            <QuotaUsageIndicator
              quotaUsagePercent={stats.quotaUsagePercent}
              uploadsUsed={stats.uploadsUsed}
              uploadQuota={stats.uploadQuota}
              size="lg"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StorageUsageChart
              totalStorageGB={stats.totalStorageGB}
              totalImages={stats.totalImages}
              uploadsUsed={stats.uploadsUsed}
              uploadQuota={stats.uploadQuota}
            />
            
            <div className="p-6 rounded-lg shadow-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-gray-700">Uploads Today</span>
                  <span className="text-lg font-bold text-blue-600">{stats.uploadsToday}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-gray-700">Uploads This Week</span>
                  <span className="text-lg font-bold text-green-600">{stats.uploadsThisWeek}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm text-gray-700">Uploads This Month</span>
                  <span className="text-lg font-bold text-purple-600">{stats.uploadsThisMonth}</span>
                </div>
                {stats.lastUploadAt && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Last Upload</span>
                    <span className="text-sm font-medium text-gray-600">
                      {formatDate(stats.lastUploadAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Chart */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setActivityDays(7)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    activityDays === 7
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setActivityDays(30)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    activityDays === 30
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  30 Days
                </button>
                <button
                  onClick={() => setActivityDays(90)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    activityDays === 90
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  90 Days
                </button>
              </div>
            </div>
            <UploadActivityChart
              activities={activities}
              title={`Upload Activity (Last ${activityDays} Days)`}
            />
          </div>

          {/* Images Section */}
          <div className="p-6 rounded-lg shadow-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Images</h3>
              <GradientButton onClick={handleViewImages} variant="info" size="sm">
                {showImages ? 'Hide Images' : 'View Images'}
              </GradientButton>
            </div>
            
            {showImages && (
              <div>
                {imagesLoading ? (
                  <div className="flex justify-center py-8">
                    <CustomLoader size={40} />
                  </div>
                ) : images.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600 mb-3">
                      Showing {images.length} most recent images
                    </div>
                    <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                      {images.map((image: any) => (
                        <div key={image.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{image.originalFilename}</div>
                            <div className="text-xs text-gray-500">
                              {image.fileFormat.toUpperCase()} • {(image.fileSize / 1024 / 1024).toFixed(2)} MB • 
                              {new Date(image.uploadedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No images found for this license
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <GradientButton onClick={handleExport} variant="info" size="sm">
              📊 Export CSV
            </GradientButton>
            <GradientButton onClick={onClose} variant="secondary" size="sm">
              Close
            </GradientButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmbulanceDetailsDashboard;
