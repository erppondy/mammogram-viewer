import React from 'react';
import { UploadActivity } from '../../services/ambulanceStatsService';

interface UploadActivityChartProps {
  activities: UploadActivity[];
  title?: string;
}

const UploadActivityChart: React.FC<UploadActivityChartProps> = ({
  activities,
  title = 'Upload Activity (Last 30 Days)',
}) => {
  if (activities.length === 0) {
    return (
      <div className="p-6 rounded-lg shadow-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8 text-gray-500">No upload activity data available</div>
      </div>
    );
  }

  const maxUploads = Math.max(...activities.map((a) => a.uploadCount), 1);
  const maxStorage = Math.max(...activities.map((a) => a.storageBytes), 1);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  return (
    <div className="p-6 rounded-lg shadow-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      {/* Chart */}
      <div className="space-y-2 mb-6">
        {activities.map((activity, index) => {
          const uploadHeight = (activity.uploadCount / maxUploads) * 100;
          const storageHeight = (activity.storageBytes / maxStorage) * 100;

          return (
            <div key={index} className="flex items-center gap-3">
              <div className="text-xs text-gray-600 w-12 text-right">
                {formatDate(activity.date)}
              </div>
              <div className="flex-1 flex gap-2 items-end" style={{ height: '40px' }}>
                {/* Upload count bar */}
                <div className="flex-1 relative group">
                  <div
                    className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all hover:from-blue-600 hover:to-blue-500"
                    style={{ height: `${uploadHeight}%`, minHeight: activity.uploadCount > 0 ? '4px' : '0' }}
                  />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {activity.uploadCount} uploads
                  </div>
                </div>
                {/* Storage bar */}
                <div className="flex-1 relative group">
                  <div
                    className="bg-gradient-to-t from-green-500 to-green-400 rounded-t transition-all hover:from-green-600 hover:to-green-500"
                    style={{ height: `${storageHeight}%`, minHeight: activity.storageBytes > 0 ? '4px' : '0' }}
                  />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {formatBytes(activity.storageBytes)}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-600 w-16">
                {activity.uploadCount > 0 ? `${activity.uploadCount}` : '-'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-6 justify-center pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-t from-blue-500 to-blue-400 rounded"></div>
          <span className="text-xs text-gray-600">Upload Count</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-t from-green-500 to-green-400 rounded"></div>
          <span className="text-xs text-gray-600">Storage Size</span>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {activities.reduce((sum, a) => sum + a.uploadCount, 0)}
          </div>
          <div className="text-xs text-gray-600 mt-1">Total Uploads</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {formatBytes(activities.reduce((sum, a) => sum + a.storageBytes, 0))}
          </div>
          <div className="text-xs text-gray-600 mt-1">Total Storage</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {(activities.reduce((sum, a) => sum + a.uploadCount, 0) / activities.length).toFixed(1)}
          </div>
          <div className="text-xs text-gray-600 mt-1">Avg per Day</div>
        </div>
      </div>
    </div>
  );
};

export default UploadActivityChart;
