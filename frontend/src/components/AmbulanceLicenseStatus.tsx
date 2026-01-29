

export interface LicenseInfo {
  id: string;
  licenseKey: string;
  ambulanceName: string;
  status: 'active' | 'revoked';
  uploadQuota: number;
  uploadsUsed: number;
  uploadsRemaining: number;
  quotaUsagePercent: number;
  isQuotaLow: boolean;
}

interface AmbulanceLicenseStatusProps {
  license: LicenseInfo;
}

export default function AmbulanceLicenseStatus({ license }: AmbulanceLicenseStatusProps) {
  const getStatusColor = () => {
    if (license.status === 'revoked') {
      return 'text-red-400 border-red-500/50 bg-red-900/20';
    }
    return 'text-green-400 border-green-500/50 bg-green-900/20';
  };

  const getQuotaColor = () => {
    if (license.quotaUsagePercent >= 90) {
      return 'text-red-400';
    }
    if (license.quotaUsagePercent >= 80) {
      return 'text-yellow-400';
    }
    return 'text-green-400';
  };

  const getQuotaBarColor = () => {
    if (license.quotaUsagePercent >= 90) {
      return 'bg-gradient-to-r from-red-500 to-red-700';
    }
    if (license.quotaUsagePercent >= 80) {
      return 'bg-gradient-to-r from-yellow-500 to-yellow-700';
    }
    return 'bg-gradient-to-r from-green-500 to-green-700';
  };

  return (
    <div className="medical-card p-4 mb-4 scan-line-container">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--medical-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">License Status</h3>
        </div>
        <span className={`text-xs px-2 py-1 rounded border ${getStatusColor()}`}>
          {license.status.toUpperCase()}
        </span>
      </div>

      <div className="space-y-3">
        {/* Ambulance Name */}
        <div>
          <div className="text-xs text-[var(--text-muted)] mb-1">Ambulance</div>
          <div className="text-sm font-medium text-[var(--text-primary)]">{license.ambulanceName}</div>
        </div>

        {/* License Key */}
        <div>
          <div className="text-xs text-[var(--text-muted)] mb-1">License Key</div>
          <div className="text-xs font-mono text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-2 py-1 rounded">
            {license.licenseKey}
          </div>
        </div>

        {/* Upload Quota */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs text-[var(--text-muted)]">Upload Quota</div>
            <div className={`text-xs font-medium ${getQuotaColor()}`}>
              {license.uploadsUsed} / {license.uploadQuota}
            </div>
          </div>
          <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getQuotaBarColor()}`}
              style={{ width: `${Math.min(license.quotaUsagePercent, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="text-xs text-[var(--text-muted)]">
              {license.uploadsRemaining} remaining
            </div>
            <div className={`text-xs font-medium ${getQuotaColor()}`}>
              {license.quotaUsagePercent}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
