import React from 'react';
import { SystemStats } from '../../services/adminService';

interface AdminStatsProps {
  stats: SystemStats;
  onFilterByStatus: (status: 'pending' | 'approved' | 'rejected' | 'deactivated' | null) => void;
}

const AdminStats: React.FC<AdminStatsProps> = ({ stats, onFilterByStatus }) => {
  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      status: null,
    },
    {
      label: 'Pending',
      value: stats.pendingUsers,
      color: 'bg-yellow-500',
      hoverColor: 'hover:bg-yellow-600',
      status: 'pending' as const,
    },
    {
      label: 'Approved',
      value: stats.approvedUsers,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      status: 'approved' as const,
    },
    {
      label: 'Rejected',
      value: stats.rejectedUsers,
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
      status: 'rejected' as const,
    },
    {
      label: 'Deactivated',
      value: stats.deactivatedUsers,
      color: 'bg-gray-500',
      hoverColor: 'hover:bg-gray-600',
      status: 'deactivated' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      {statCards.map((card) => (
        <button
          key={card.label}
          onClick={() => onFilterByStatus(card.status)}
          className={`${card.color} ${card.hoverColor} text-white p-6 rounded-lg shadow-lg transition-all cursor-pointer transform hover:scale-105`}
          style={{ backgroundColor: card.color.includes('blue') ? 'rgba(59, 130, 246, 0.85)' : 
                   card.color.includes('yellow') ? 'rgba(234, 179, 8, 0.85)' :
                   card.color.includes('green') ? 'rgba(34, 197, 94, 0.85)' :
                   card.color.includes('red') ? 'rgba(239, 68, 68, 0.85)' :
                   'rgba(107, 114, 128, 0.85)', backdropFilter: 'blur(10px)' }}
        >
          <div className="text-3xl font-bold mb-2">{card.value}</div>
          <div className="text-sm opacity-90">{card.label}</div>
        </button>
      ))}
    </div>
  );
};

export default AdminStats;
