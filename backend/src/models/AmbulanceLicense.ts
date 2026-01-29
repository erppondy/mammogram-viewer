export type LicenseStatus = 'active' | 'expired' | 'revoked';

export interface AmbulanceLicense {
  id: string;
  licenseKey: string;
  ambulanceName: string;
  ambulanceContactEmail: string;
  ambulanceContactPhone: string | null;
  ambulanceAddress: string | null;
  
  status: LicenseStatus;
  uploadQuota: number;
  uploadsUsed: number;
  
  issuedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  
  createdBy: string | null;
  revokedBy: string | null;
  revocationReason: string | null;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLicenseDTO {
  ambulanceName: string;
  ambulanceContactEmail: string;
  ambulanceContactPhone?: string;
  ambulanceAddress?: string;
  uploadQuota: number;
  templateId?: string;
}

export interface UpdateLicenseDTO {
  ambulanceName?: string;
  ambulanceContactEmail?: string;
  ambulanceContactPhone?: string;
  ambulanceAddress?: string;
  uploadQuota?: number;
  expiresAt?: Date;
}

export interface RevokeLicenseDTO {
  reason: string;
}

export interface LicenseValidation {
  isValid: boolean;
  license?: AmbulanceLicense;
  error?: string;
}

export interface LicenseFilters {
  status?: LicenseStatus;
  ambulanceName?: string;
  expiresAfter?: Date;
  expiresBefore?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Convert AmbulanceLicense to response format
 */
export function toLicenseResponse(license: AmbulanceLicense): AmbulanceLicense {
  return {
    id: license.id,
    licenseKey: license.licenseKey,
    ambulanceName: license.ambulanceName,
    ambulanceContactEmail: license.ambulanceContactEmail,
    ambulanceContactPhone: license.ambulanceContactPhone,
    ambulanceAddress: license.ambulanceAddress,
    status: license.status,
    uploadQuota: license.uploadQuota,
    uploadsUsed: license.uploadsUsed,
    issuedAt: license.issuedAt,
    expiresAt: license.expiresAt,
    revokedAt: license.revokedAt,
    createdBy: license.createdBy,
    revokedBy: license.revokedBy,
    revocationReason: license.revocationReason,
    createdAt: license.createdAt,
    updatedAt: license.updatedAt,
  };
}
