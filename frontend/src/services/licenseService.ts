import api from './api';

export interface AmbulanceLicense {
  id: string;
  licenseKey: string;
  ambulanceName: string;
  ambulanceContactEmail: string;
  ambulanceContactPhone: string | null;
  ambulanceAddress: string | null;
  status: 'active' | 'expired' | 'revoked';
  uploadQuota: number;
  uploadsUsed: number;
  issuedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  createdBy: string;
  revokedBy: string | null;
  revocationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLicenseDTO {
  ambulanceName: string;
  ambulanceContactEmail: string;
  ambulanceContactPhone?: string;
  ambulanceAddress?: string;
  uploadQuota: number;
  durationDays: number;
  templateId?: string;
}

export interface UpdateLicenseDTO {
  ambulanceName?: string;
  ambulanceContactEmail?: string;
  ambulanceContactPhone?: string;
  ambulanceAddress?: string;
  uploadQuota?: number;
  expiresAt?: string;
}

export interface RevokeLicenseDTO {
  reason: string;
}

export interface LicenseAuditLog {
  id: string;
  licenseId: string;
  action: string;
  changedBy: string;
  oldValues: any;
  newValues: any;
  reason: string | null;
  createdAt: string;
}

export interface LicenseFilters {
  status?: 'active' | 'expired' | 'revoked';
  search?: string;
}

class LicenseService {
  async createLicense(data: CreateLicenseDTO): Promise<AmbulanceLicense> {
    const response = await api.post('/licenses', data);
    return response.data.data || response.data;
  }

  async getAllLicenses(filters?: LicenseFilters): Promise<AmbulanceLicense[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    const url = `/licenses${queryString ? `?${queryString}` : ''}`;

    const response = await api.get(url);
    return response.data.data || response.data;
  }

  async getLicenseById(id: string): Promise<AmbulanceLicense> {
    const response = await api.get(`/licenses/${id}`);
    return response.data.data || response.data;
  }

  async updateLicense(id: string, data: UpdateLicenseDTO): Promise<AmbulanceLicense> {
    const response = await api.put(`/licenses/${id}`, data);
    return response.data.data || response.data;
  }

  async revokeLicense(id: string, data: RevokeLicenseDTO): Promise<void> {
    await api.delete(`/licenses/${id}/revoke`, { data });
  }

  async extendLicense(id: string, durationDays: number): Promise<AmbulanceLicense> {
    const response = await api.post(`/licenses/${id}/extend`, { additionalDays: durationDays });
    return response.data.data || response.data;
  }

  async updateQuota(id: string, newQuota: number): Promise<AmbulanceLicense> {
    const response = await api.put(`/licenses/${id}/quota`, { newQuota });
    return response.data.data || response.data;
  }

  async getAuditLog(licenseId: string): Promise<LicenseAuditLog[]> {
    const response = await api.get(`/licenses/${licenseId}/audit-log`);
    return response.data.data || response.data;
  }

  async validateLicenseKey(licenseKey: string): Promise<{
    isValid: boolean;
    error?: string;
    license?: {
      ambulanceName: string;
      status: string;
      expiresAt: string;
      uploadQuota: number;
      uploadsUsed: number;
    };
  }> {
    const response = await api.get(`/licenses/validate/${licenseKey}`);
    return response.data.data || response.data;
  }
}

export const licenseService = new LicenseService();
