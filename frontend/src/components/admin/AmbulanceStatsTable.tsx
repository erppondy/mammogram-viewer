import React, { useState } from 'react';
import { AmbulanceStats } from '../../services/ambulanceStatsService';
import QuotaUsageIndicator from './QuotaUsageIndicator';
import GradientButton from '../GradientButton';

interface AmbulanceStatsTableProps {
  stats: AmbulanceStats[];
  onViewDetails: (licenseId: string) => void;
  onExport: () => void;
}

type SortField = 'ambulanceName' | 'totalImages' | 'totalStorageGB' | 'quotaUsagePercent' | 'daysUntilExpiry';
type SortDirection = 'asc' | 'desc';

const AmbulanceStatsTable: React.FC<AmbulanceStatsTableProps> = ({
  stats,
  onViewDetails,
  onExport,
}) => {
  const [sortField, setSortField] = useState<SortField>('ambulanceName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const filteredStats = stats.filter((stat) => {
    const matchesSearch = stat.ambulanceName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || stat.licenseStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedStats = [...filteredStats].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'ambulanceName') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      expired: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Expired' },
      revoked: { bg: 'bg-red-100', text: 'text-red-800', label: 'Revoked' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getExpiryWarning = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) return <span className="text-red-600 font-semibold">Expired</span>;
    if (daysUntilExpiry <= 7) return <span className="text-red-600 font-semibold">{daysUntilExpiry}d ⚠️</span>;
    if (daysUntilExpiry <= 30) return <span className="text-yellow-600 font-semibold">{daysUntilExpiry}d</span>;
    return <span className="text-gray-700">{daysUntilExpiry}d</span>;
  };

  return (
    <div className="rounded-lg shadow-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
      {/* Header with filters and export */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 items-center flex-1">
            <input
              type="text"
              placeholder="Search ambulances..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
          <GradientButton onClick={onExport} variant="info" size="sm">
            📊 Export CSV
          </GradientButton>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('ambulanceName')}
              >
                Ambulance {getSortIcon('ambulanceName')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('totalImages')}
              >
                Images {getSortIcon('totalImages')}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('totalStorageGB')}
              >
                Storage {getSortIcon('totalStorageGB')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Users
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('quotaUsagePercent')}
              >
                Quota Usage {getSortIcon('quotaUsagePercent')}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('daysUntilExpiry')}
              >
                Expires In {getSortIcon('daysUntilExpiry')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedStats.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No ambulances found
                </td>
              </tr>
            ) : (
              sortedStats.map((stat) => (
                <tr key={stat.licenseId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900">{stat.ambulanceName}</div>
                    <div className="text-xs text-gray-500">{stat.licenseId.substring(0, 8)}...</div>
                  </td>
                  <td className="px-4 py-4">
                    {getStatusBadge(stat.licenseStatus)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900">{stat.totalImages.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">
                      {stat.uploadsToday > 0 && `+${stat.uploadsToday} today`}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900">{stat.totalStorageGB.toFixed(2)} GB</div>
                    <div className="text-xs text-gray-500">{stat.totalStorageMB.toFixed(0)} MB</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900">{stat.totalUsers}</div>
                    <div className="text-xs text-gray-500">{stat.activeUsers} active</div>
                  </td>
                  <td className="px-4 py-4" style={{ minWidth: '200px' }}>
                    <QuotaUsageIndicator
                      quotaUsagePercent={stat.quotaUsagePercent}
                      uploadsUsed={stat.uploadsUsed}
                      uploadQuota={stat.uploadQuota}
                      size="sm"
                    />
                  </td>
                  <td className="px-4 py-4">
                    {getExpiryWarning(stat.daysUntilExpiry)}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => onViewDetails(stat.licenseId)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      View Details →
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with summary */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-600">
          Showing {sortedStats.length} of {stats.length} ambulances
        </div>
      </div>
    </div>
  );
};

export default AmbulanceStatsTable;
