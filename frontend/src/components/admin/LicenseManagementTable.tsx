import React, { useState } from 'react';
import { AmbulanceLicense } from '../../services/licenseService';

interface LicenseManagementTableProps {
  licenses: AmbulanceLicense[];
  onEdit: (license: AmbulanceLicense) => void;
  onRevoke: (license: AmbulanceLicense) => void;
  onViewDetails: (license: AmbulanceLicense) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: 'active' | 'expired' | 'revoked' | null;
  onStatusFilterChange: (status: 'active' | 'expired' | 'revoked' | null) => void;
}

const LicenseManagementTable: React.FC<LicenseManagementTableProps> = ({
  licenses,
  onEdit,
  onRevoke,
  onViewDetails,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}) => {
  const [sortField, setSortField] = useState<keyof AmbulanceLicense>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-yellow-100 text-yellow-800',
      revoked: 'bg-red-100 text-red-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const handleSort = (field: keyof AmbulanceLicense) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedLicenses = [...licenses].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getQuotaPercentage = (used: number, total: number) => {
    return Math.round((used / total) * 100);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)' }}>
      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="Search by ambulance name or license key..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
        />
        <select
          value={statusFilter || ''}
          onChange={(e) => onStatusFilterChange(e.target.value as any || null)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="revoked">Revoked</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('ambulanceName')}
              >
                Ambulance Name {sortField === 'ambulanceName' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                License Key
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quota Usage
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('expiresAt')}
              >
                Expiry {sortField === 'expiresAt' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedLicenses.map((license) => {
              const daysUntilExpiry = getDaysUntilExpiry(license.expiresAt);
              const quotaPercentage = getQuotaPercentage(license.uploadsUsed, license.uploadQuota);
              
              return (
                <tr key={license.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{license.ambulanceName}</div>
                    <div className="text-sm text-gray-500">{license.ambulanceContactEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-900">{license.licenseKey}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(license.status)}`}
                    >
                      {license.status}
                    </span>
                    {license.status === 'revoked' && license.revocationReason && (
                      <div className="text-xs text-red-600 mt-1">{license.revocationReason}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {license.uploadsUsed} / {license.uploadQuota}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className={`h-2 rounded-full ${
                          quotaPercentage >= 90 ? 'bg-red-500' :
                          quotaPercentage >= 70 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(quotaPercentage, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{quotaPercentage}% used</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(license.expiresAt).toLocaleDateString()}
                    </div>
                    {license.status === 'active' && (
                      <div className={`text-xs mt-1 ${
                        daysUntilExpiry < 7 ? 'text-red-600' :
                        daysUntilExpiry < 30 ? 'text-yellow-600' :
                        'text-gray-500'
                      }`}>
                        {daysUntilExpiry > 0 ? `${daysUntilExpiry} days left` : 'Expired'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => onViewDetails(license)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                    {license.status !== 'revoked' && (
                      <>
                        <button
                          onClick={() => onEdit(license)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onRevoke(license)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Revoke
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {sortedLicenses.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No licenses found
          </div>
        )}
      </div>
    </div>
  );
};

export default LicenseManagementTable;
