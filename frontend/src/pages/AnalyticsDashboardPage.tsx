import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { analyticsService, DashboardMetrics, ImageStatistics } from '../services/analyticsService';
import CustomLoader from '../components/CustomLoader';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AnalyticsDashboardPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [imageStats, setImageStats] = useState<ImageStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadData();
  }, [days]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [metricsData, statsData] = await Promise.all([
        analyticsService.getDashboardMetrics(days),
        analyticsService.getImageStatistics(),
      ]);
      setMetrics(metricsData);
      setImageStats(statsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <CustomLoader size={60} />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!metrics || !imageStats) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-red-600">Failed to load analytics data</p>
      </div>
    );
  }

  const latestStats = metrics.stats[metrics.stats.length - 1];

  // Prepare chart data
  const uploadsChartData = {
    labels: metrics.stats.map((s) => analyticsService.formatDate(s.stat_date)),
    datasets: [
      {
        label: 'New Uploads',
        data: metrics.stats.map((s) => s.new_images),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3,
      },
    ],
  };

  const activityChartData = {
    labels: metrics.stats.map((s) => analyticsService.formatDate(s.stat_date)),
    datasets: [
      {
        label: 'Views',
        data: metrics.stats.map((s) => s.total_views),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
      },
      {
        label: 'Uploads',
        data: metrics.stats.map((s) => s.total_uploads),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      },
      {
        label: 'Downloads',
        data: metrics.stats.map((s) => s.total_downloads),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.5)',
      },
    ],
  };

  const fileTypeChartData = {
    labels: imageStats.byType.map((t) => t.file_type.toUpperCase()),
    datasets: [
      {
        data: imageStats.byType.map((t) => t.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
      },
    ],
  };

  const storageChartData = {
    labels: metrics.stats.map((s) => analyticsService.formatDate(s.stat_date)),
    datasets: [
      {
        label: 'Storage Used (MB)',
        data: metrics.stats.map((s) => (s.storage_used / 1024 / 1024).toFixed(2)),
        borderColor: 'rgb(251, 191, 36)',
        backgroundColor: 'rgba(251, 191, 36, 0.5)',
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-sm text-gray-600">System performance and usage metrics</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 text-blue-600 hover:text-blue-800"
            >
              Admin Dashboard
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-blue-600 hover:text-blue-800"
            >
              My Images
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Time Range Selector */}
        <div className="mb-6 flex gap-2">
          {[7, 14, 30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded ${
                days === d
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {d} Days
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Images</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{latestStats.total_images}</p>
            <p className="text-sm text-green-600 mt-1">+{latestStats.new_images} this period</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{latestStats.total_users}</p>
            <p className="text-sm text-blue-600 mt-1">{latestStats.active_users} active</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Views</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{latestStats.total_views}</p>
            <p className="text-sm text-gray-600 mt-1">Image views</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Storage Used</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {analyticsService.formatBytes(latestStats.storage_used)}
            </p>
            <p className="text-sm text-gray-600 mt-1">Total storage</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Upload Trends</h3>
            <Line data={uploadsChartData} options={{ responsive: true }} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">User Activity</h3>
            <Line data={activityChartData} options={{ responsive: true }} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">File Type Distribution</h3>
            <div className="flex justify-center">
              <div style={{ maxWidth: '300px' }}>
                <Doughnut data={fileTypeChartData} options={{ responsive: true }} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Storage Growth</h3>
            <Line data={storageChartData} options={{ responsive: true }} />
          </div>
        </div>

        {/* File Type Statistics */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-semibold mb-4">File Type Statistics</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Avg Size
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {imageStats.byType.map((type) => (
                  <tr key={type.file_type}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {type.file_type.toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {type.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {analyticsService.formatBytes(type.total_size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {analyticsService.formatBytes(type.avg_size)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Most Viewed Images */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-semibold mb-4">Most Viewed Images</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Views
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.topImages.map((image) => (
                  <tr key={image.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {image.original_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {image.file_type.toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {image.view_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {metrics.recentActivity.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.username}</p>
                  <p className="text-xs text-gray-500">
                    {activity.activity_type} {activity.resource_type && `• ${activity.resource_type}`}
                  </p>
                </div>
                <p className="text-xs text-gray-400">
                  {analyticsService.formatDateTime(activity.created_at)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
