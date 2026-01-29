interface UploadQuotaWarningProps {
  uploadsRemaining: number;
  uploadQuota: number;
  quotaUsagePercent: number;
}

export default function UploadQuotaWarning({
  uploadsRemaining,
  uploadQuota,
  quotaUsagePercent,
}: UploadQuotaWarningProps) {
  // Only show warning when quota usage is >= 80%
  if (quotaUsagePercent < 80) {
    return null;
  }

  const isUrgent = quotaUsagePercent >= 90;

  return (
    <div
      className={`border rounded-lg p-4 mb-4 ${
        isUrgent
          ? 'bg-red-900/20 border-red-500/50'
          : 'bg-yellow-900/20 border-yellow-500/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <svg
          className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
            isUrgent ? 'text-red-400' : 'text-yellow-400'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div className="flex-1">
          <h3
            className={`font-medium mb-1 ${
              isUrgent ? 'text-red-400' : 'text-yellow-400'
            }`}
          >
            {isUrgent ? 'Upload Quota Almost Exhausted' : 'Upload Quota Running Low'}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-2">
            {isUrgent ? (
              <>
                You have only <span className="font-semibold text-red-400">{uploadsRemaining}</span> upload
                {uploadsRemaining !== 1 ? 's' : ''} remaining out of {uploadQuota}.
              </>
            ) : (
              <>
                You have <span className="font-semibold text-yellow-400">{uploadsRemaining}</span> upload
                {uploadsRemaining !== 1 ? 's' : ''} remaining out of {uploadQuota}.
              </>
            )}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Please contact your administrator to increase your upload quota before it runs out.
          </p>
        </div>
      </div>
    </div>
  );
}
