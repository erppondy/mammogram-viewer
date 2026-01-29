import { licenseTemplateRepository } from '../repositories/LicenseTemplateRepository';
import {
  LicenseTemplate,
  CreateTemplateDTO,
  UpdateTemplateDTO,
} from '../models/LicenseTemplate';
import { CreateLicenseDTO } from '../models/AmbulanceLicense';

export class LicenseTemplateService {
  /**
   * Create a new license template
   */
  async createTemplate(data: CreateTemplateDTO): Promise<LicenseTemplate> {
    // Validate required fields
    if (!data.templateName || data.templateName.trim() === '') {
      throw new Error('Template name is required');
    }

    if (!data.defaultDurationDays || data.defaultDurationDays <= 0) {
      throw new Error('Default duration must be greater than 0 days');
    }

    if (!data.defaultUploadQuota || data.defaultUploadQuota <= 0) {
      throw new Error('Default upload quota must be greater than 0');
    }

    // Check if template name already exists
    const existing = await licenseTemplateRepository.findByName(data.templateName);
    if (existing) {
      throw new Error('Template name already exists');
    }

    // Create template
    const template = await licenseTemplateRepository.create(data);
    return template;
  }

  /**
   * Get template by ID
   */
  async getTemplateById(id: string): Promise<LicenseTemplate | null> {
    return licenseTemplateRepository.findById(id);
  }

  /**
   * Get all templates
   */
  async getAllTemplates(activeOnly: boolean = false): Promise<LicenseTemplate[]> {
    return licenseTemplateRepository.findAll(activeOnly);
  }

  /**
   * Update template
   */
  async updateTemplate(id: string, data: UpdateTemplateDTO): Promise<LicenseTemplate> {
    const existingTemplate = await licenseTemplateRepository.findById(id);
    if (!existingTemplate) {
      throw new Error('Template not found');
    }

    // Validate fields if provided
    if (data.defaultDurationDays !== undefined && data.defaultDurationDays <= 0) {
      throw new Error('Default duration must be greater than 0 days');
    }

    if (data.defaultUploadQuota !== undefined && data.defaultUploadQuota <= 0) {
      throw new Error('Default upload quota must be greater than 0');
    }

    // Check if new template name conflicts with existing
    if (data.templateName && data.templateName !== existingTemplate.templateName) {
      const existing = await licenseTemplateRepository.findByName(data.templateName);
      if (existing) {
        throw new Error('Template name already exists');
      }
    }

    // Update template
    const updatedTemplate = await licenseTemplateRepository.update(id, data);
    if (!updatedTemplate) {
      throw new Error('Failed to update template');
    }

    return updatedTemplate;
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string): Promise<void> {
    const template = await licenseTemplateRepository.findById(id);
    if (!template) {
      throw new Error('Template not found');
    }

    await licenseTemplateRepository.delete(id);
  }

  /**
   * Apply template to license data
   */
  async applyTemplate(
    templateId: string,
    licenseData: Partial<CreateLicenseDTO>
  ): Promise<CreateLicenseDTO> {
    const template = await licenseTemplateRepository.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    if (!template.isActive) {
      throw new Error('Template is not active');
    }

    // Apply template defaults, but allow overrides from licenseData
    return {
      ambulanceName: licenseData.ambulanceName || '',
      ambulanceContactEmail: licenseData.ambulanceContactEmail || '',
      ambulanceContactPhone: licenseData.ambulanceContactPhone,
      ambulanceAddress: licenseData.ambulanceAddress,
      uploadQuota: licenseData.uploadQuota || template.defaultUploadQuota,
      durationDays: licenseData.durationDays || template.defaultDurationDays,
      templateId,
    };
  }

  /**
   * Activate or deactivate template
   */
  async setTemplateActive(id: string, isActive: boolean): Promise<LicenseTemplate> {
    const template = await licenseTemplateRepository.findById(id);
    if (!template) {
      throw new Error('Template not found');
    }

    const updatedTemplate = await licenseTemplateRepository.update(id, { isActive });
    if (!updatedTemplate) {
      throw new Error('Failed to update template');
    }

    return updatedTemplate;
  }
}

// Export singleton instance
export const licenseTemplateService = new LicenseTemplateService();
