import React from 'react';

interface StorageUsageChartProps {
  totalStorageGB: number;
  totalImages: number;
  uploadsUsed: number;
  uploadQuota: number;
}

const StorageUsageChart: React.FC<StorageUsageChartProps> = ({
  totalStorageGB,
  totalImages,
  uploadsUsed,
  uploadQuota,
}) => {
  const averageSizePerImage = totalImages > 0 ? (totalStorageGB * 1024) / totalImages : 0;
  const quotaUsagePercent = uploadQuota > 0 ? (uploadsUsed / uploadQuota) * 100 : 0;

  return (
    <div className="p-6 rounded-lg shadow-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Usage</h3>
      
      <div className="space-y-6">
        {/* Total Storage */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Total Storage</span>
            <span className="text-lg font-bold text-blue-600">{totalStorageGB.toFixed(2)} GB</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Image Count */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Total Images</span>
            <span className="text-lg font-bold text-purple-600">{totalImages.toLocaleString()}</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-400 to-purple-600"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Quota Usage */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Upload Quota</span>
            <span className="text-lg font-bold text-green-600">
              {uploadsUsed.toLocaleString()} / {uploadQuota.toLocaleString()}
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                quotaUsagePercent >= 90
                  ? 'bg-gradient-to-r from-red-400 to-red-600'
                  : quotaUsagePercent >= 70
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                  : 'bg-gradient-to-r from-green-400 to-green-600'
              }`}
              style={{ width: `${Math.min(quotaUsagePercent, 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {quotaUsagePercent.toFixed(1)}% used
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{averageSizePerImage.toFixed(2)}</div>
            <div className="text-xs text-gray-600 mt-1">MB per image</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{uploadQuota - uploadsUsed}</div>
            <div className="text-xs text-gray-600 mt-1">Uploads remaining</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorageUsageChart;
