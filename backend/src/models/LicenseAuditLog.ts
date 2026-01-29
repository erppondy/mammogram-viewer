export type AuditAction = 'created' | 'modified' | 'revoked' | 'extended' | 'quota_updated' | 'status_changed';

export interface LicenseAuditLog {
  id: string;
  licenseId: string;
  action: AuditAction;
  changedBy: string | null;
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  reason: string | null;
  createdAt: Date;
}

export interface CreateAuditLogDTO {
  licenseId: string;
  action: AuditAction;
  changedBy?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  reason?: string;
}

/**
 * Convert LicenseAuditLog to response format
 */
export function toAuditLogResponse(log: LicenseAuditLog): LicenseAuditLog {
  return {
    id: log.id,
    licenseId: log.licenseId,
    action: log.action,
    changedBy: log.changedBy,
    oldValues: log.oldValues,
    newValues: log.newValues,
    reason: log.reason,
    createdAt: log.createdAt,
  };
}
