export interface LicenseTemplate {
  id: string;
  templateName: string;
  description: string | null;
  defaultDurationDays: number;
  defaultUploadQuota: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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

/**
 * Convert LicenseTemplate to response format
 */
export function toTemplateResponse(template: LicenseTemplate): LicenseTemplate {
  return {
    id: template.id,
    templateName: template.templateName,
    description: template.description,
    defaultDurationDays: template.defaultDurationDays,
    defaultUploadQuota: template.defaultUploadQuota,
    isActive: template.isActive,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}
