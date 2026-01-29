import React from 'react';

interface QuotaUsageIndicatorProps {
  quotaUsagePercent: number;
  uploadsUsed: number;
  uploadQuota: number;
  size?: 'sm' | 'md' | 'lg';
}

const QuotaUsageIndicator: React.FC<QuotaUsageIndicatorProps> = ({
  quotaUsagePercent,
  uploadsUsed,
  uploadQuota,
  size = 'md',
}) => {
  const getColor = () => {
    if (quotaUsagePercent >= 90) return { bg: 'bg-red-500', text: 'text-red-700' };
    if (quotaUsagePercent >= 70) return { bg: 'bg-yellow-500', text: 'text-yellow-700' };
    return { bg: 'bg-green-500', text: 'text-green-700' };
  };

  const getHeight = () => {
    if (size === 'sm') return 'h-2';
    if (size === 'lg') return 'h-6';
    return 'h-4';
  };

  const getTextSize = () => {
    if (size === 'sm') return 'text-xs';
    if (size === 'lg') return 'text-base';
    return 'text-sm';
  };

  const color = getColor();
  const height = getHeight();
  const textSize = getTextSize();

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className={`${textSize} font-medium ${color.text}`}>
          {uploadsUsed.toLocaleString()} / {uploadQuota.toLocaleString()}
        </span>
        <span className={`${textSize} font-bold ${color.text}`}>
          {quotaUsagePercent.toFixed(1)}%
        </span>
      </div>
      <div className={`w-full ${height} bg-gray-200 rounded-full overflow-hidden`}>
        <div
          className={`${height} ${color.bg} transition-all duration-300 ease-out`}
          style={{ width: `${Math.min(quotaUsagePercent, 100)}%` }}
        />
      </div>
      {quotaUsagePercent >= 90 && (
        <div className="mt-1 text-xs text-red-600 font-medium">
          ⚠️ Critical: Quota almost exhausted
        </div>
      )}
      {quotaUsagePercent >= 70 && quotaUsagePercent < 90 && (
        <div className="mt-1 text-xs text-yellow-600 font-medium">
          ⚠️ Warning: High quota usage
        </div>
      )}
    </div>
  );
};

export default QuotaUsageIndicator;
