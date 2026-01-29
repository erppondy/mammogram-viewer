import api from './api';

export interface LicenseTemplate {
  id: string;
  templateName: string;
  description: string | null;
  defaultDurationDays: number;
  defaultUploadQuota: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateDTO {
  templateName: string;
  description?: string;
  defaultDurationDays: number;
  defaultUploadQuota: number;
}

export interface UpdateTemplateDTO {
  templateName?: string;
  description?: string;
  defaultDurationDays?: number;
  defaultUploadQuota?: number;
  isActive?: boolean;
}

class LicenseTemplateService {
  async createTemplate(data: CreateTemplateDTO): Promise<LicenseTemplate> {
    const response = await api.post('/license-templates', data);
    return response.data.data || response.data;
  }

  async getAllTemplates(activeOnly?: boolean): Promise<LicenseTemplate[]> {
    const params = activeOnly ? '?activeOnly=true' : '';
    const response = await api.get(`/license-templates${params}`);
    return response.data.data || response.data;
  }

  async getTemplateById(id: string): Promise<LicenseTemplate> {
    const response = await api.get(`/license-templates/${id}`);
    return response.data.data || response.data;
  }

  async updateTemplate(id: string, data: UpdateTemplateDTO): Promise<LicenseTemplate> {
    const response = await api.put(`/license-templates/${id}`, data);
    return response.data.data || response.data;
  }

  async deleteTemplate(id: string): Promise<void> {
    await api.delete(`/license-templates/${id}`);
  }
}

export const licenseTemplateService = new LicenseTemplateService();
