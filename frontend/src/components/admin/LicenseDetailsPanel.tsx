import React, { useState, useEffect } from 'react';
import { AmbulanceLicense, LicenseAuditLog, licenseService } from '../../services/licenseService';

interface LicenseDetailsPanelProps {
  isOpen: boolean;
  license: AmbulanceLicense | null;
  onClose: () => void;
}

const LicenseDetailsPanel: React.FC<LicenseDetailsPanelProps> = ({
  isOpen,
  license,
  onClose,
}) => {
  const [auditLogs, setAuditLogs] = useState<LicenseAuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && license) {
      loadAuditLogs();
    }
  }, [isOpen, license]);

  const loadAuditLogs = async () => {
    if (!license) return;
    
    try {
      setLoading(true);
      const logs = await licenseService.getAuditLog(license.id);
      setAuditLogs(logs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !license) return null;

  const getDaysUntilExpiry = () => {
    const now = new Date();
    const expiry = new Date(license.expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getQuotaPercentage = () => {
    return Math.round((license.uploadsUsed / license.uploadQuota) * 100);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-yellow-100 text-yellow-800',
      revoked: 'bg-red-100 text-red-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getActionBadge = (action: string) => {
    const badges: Record<string, string> = {
      created: 'bg-blue-100 text-blue-800',
      modified: 'bg-yellow-100 text-yellow-800',
      revoked: 'bg-red-100 text-red-800',
      extended: 'bg-green-100 text-green-800',
      quota_updated: 'bg-purple-100 text-purple-800',
    };
    return badges[action] || 'bg-gray-100 text-gray-800';
  };

  const daysUntilExpiry = getDaysUntilExpiry();
  const quotaPercentage = getQuotaPercentage();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-2xl font-semibold text-gray-900">License Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status Overview */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">{license.ambulanceName}</h4>
              <p className="text-sm text-gray-600 font-mono">{license.licenseKey}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(license.status)}`}>
              {license.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Quota Usage */}
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">Quota Usage</div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {license.uploadsUsed} / {license.uploadQuota}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full ${
                  quotaPercentage >= 90 ? 'bg-red-500' :
                  quotaPercentage >= 70 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(quotaPercentage, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-500">{quotaPercentage}% used</div>
          </div>

          {/* Expiry */}
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">Expiry Date</div>
            <div className="text-lg font-bold text-gray-900 mb-2">
              {new Date(license.expiresAt).toLocaleDateString()}
            </div>
            {license.status === 'active' && (
              <div className={`text-sm ${
                daysUntilExpiry < 7 ? 'text-red-600' :
                daysUntilExpiry < 30 ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {daysUntilExpiry > 0 ? `${daysUntilExpiry} days remaining` : 'Expired'}
              </div>
            )}
          </div>

          {/* Issued Date */}
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">Issued Date</div>
            <div className="text-lg font-bold text-gray-900 mb-2">
              {new Date(license.issuedAt).toLocaleDateString()}
            </div>
            <div className="text-sm text-gray-500">
              {Math.floor((Date.now() - new Date(license.issuedAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm text-gray-600">Email</div>
              <div className="text-gray-900">{license.ambulanceContactEmail}</div>
            </div>
            {license.ambulanceContactPhone && (
              <div>
                <div className="text-sm text-gray-600">Phone</div>
                <div className="text-gray-900">{license.ambulanceContactPhone}</div>
              </div>
            )}
            {license.ambulanceAddress && (
              <div className="md:col-span-2">
                <div className="text-sm text-gray-600">Address</div>
                <div className="text-gray-900">{license.ambulanceAddress}</div>
              </div>
            )}
          </div>
        </div>

        {/* Revocation Info */}
        {license.status === 'revoked' && license.revocationReason && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-lg font-semibold text-red-900 mb-2">Revocation Details</h4>
            <div className="text-sm text-red-800 mb-2">
              <span className="font-semibold">Revoked on:</span> {license.revokedAt ? new Date(license.revokedAt).toLocaleString() : 'N/A'}
            </div>
            <div className="text-sm text-red-800">
              <span className="font-semibold">Reason:</span> {license.revocationReason}
            </div>
          </div>
        )}

        {/* Audit History */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Audit History</h4>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading audit logs...</div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No audit logs available</div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getActionBadge(log.action)}`}>
                        {log.action.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-600">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  {log.reason && (
                    <div className="text-sm text-gray-700 mb-2">
                      <span className="font-semibold">Reason:</span> {log.reason}
                    </div>
                  )}
                  
                  {log.oldValues && log.newValues && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600 font-semibold mb-1">Previous Values:</div>
                        <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto">
                          {JSON.stringify(log.oldValues, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <div className="text-gray-600 font-semibold mb-1">New Values:</div>
                        <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto">
                          {JSON.stringify(log.newValues, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LicenseDetailsPanel;
