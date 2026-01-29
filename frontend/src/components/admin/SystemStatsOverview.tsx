import React from 'react';
import { SystemStats } from '../../services/ambulanceStatsService';

interface SystemStatsOverviewProps {
  stats: SystemStats;
}

const SystemStatsOverview: React.FC<SystemStatsOverviewProps> = ({ stats }) => {
  const statCards = [
    {
      label: 'Total Licenses',
      value: stats.totalLicenses,
      subValue: `${stats.activeLicenses} active`,
      color: 'bg-blue-500',
      icon: '📋',
    },
    {
      label: 'Total Users',
      value: stats.totalAmbulanceUsers,
      subValue: `Avg ${(stats.totalAmbulanceUsers / (stats.totalLicenses || 1)).toFixed(1)} per ambulance`,
      color: 'bg-green-500',
      icon: '👥',
    },
    {
      label: 'Total Images',
      value: stats.totalImages.toLocaleString(),
      subValue: `Avg ${stats.averageImagesPerAmbulance.toFixed(0)} per ambulance`,
      color: 'bg-purple-500',
      icon: '🖼️',
    },
    {
      label: 'Total Storage',
      value: `${stats.totalStorageGB.toFixed(2)} GB`,
      subValue: `Avg ${stats.averageStoragePerAmbulance.toFixed(2)} GB per ambulance`,
      color: 'bg-orange-500',
      icon: '💾',
    },
    {
      label: 'Expired Licenses',
      value: stats.expiredLicenses,
      subValue: `${((stats.expiredLicenses / (stats.totalLicenses || 1)) * 100).toFixed(1)}% of total`,
      color: 'bg-yellow-500',
      icon: '⏰',
    },
    {
      label: 'Revoked Licenses',
      value: stats.revokedLicenses,
      subValue: `${((stats.revokedLicenses / (stats.totalLicenses || 1)) * 100).toFixed(1)}% of total`,
      color: 'bg-red-500',
      icon: '🚫',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {statCards.map((card) => (
        <div
          key={card.label}
          className="p-6 rounded-lg shadow-lg transition-all transform hover:scale-105"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.9)', 
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="text-3xl">{card.icon}</div>
            <div className={`${card.color} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
              {card.label}
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{card.value}</div>
          <div className="text-sm text-gray-600">{card.subValue}</div>
        </div>
      ))}
    </div>
  );
};

export default SystemStatsOverview;
