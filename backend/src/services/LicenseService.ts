import { randomBytes } from 'crypto';
import { query } from '../config/database';
import { licenseRepository } from '../repositories/LicenseRepository';
import { licenseAuditRepository } from '../repositories/LicenseAuditRepository';
import { licenseTemplateRepository } from '../repositories/LicenseTemplateRepository';
import {
  AmbulanceLicense,
  CreateLicenseDTO,
  UpdateLicenseDTO,
  RevokeLicenseDTO,
  LicenseFilters,
} from '../models/AmbulanceLicense';

export interface LicenseValidation {
  isValid: boolean;
  license?: AmbulanceLicense;
  error?: string;
}

export class LicenseService {
  /**
   * Generate a unique license key in format: AMB-XXXX-XXXX-XXXX-XXXX
   */
  generateLicenseKey(): string {
    const segments = 4;
    const segmentLength = 4;
    const parts: string[] = [];

    for (let i = 0; i < segments; i++) {
      const bytes = randomBytes(2);
      const segment = bytes.toString('hex').toUpperCase().substring(0, segmentLength);
      parts.push(segment);
    }

    return `AMB-${parts.join('-')}`;
  }

  /**
   * Create a new ambulance license
   */
  async createLicense(data: CreateLicenseDTO, adminId: string): Promise<AmbulanceLicense> {
    // Apply template if provided
    let licenseData = { ...data };
    if (data.templateId) {
      const template = await licenseTemplateRepository.findById(data.templateId);
      if (!template) {
        throw new Error('License template not found');
      }
      if (!template.isActive) {
        throw new Error('License template is not active');
      }

      // Apply template defaults if not explicitly provided
      if (!data.uploadQuota) {
        licenseData.uploadQuota = template.defaultUploadQuota;
      }
    }

    // Validate required fields
    if (!licenseData.ambulanceName) {
      throw new Error('Ambulance name is required');
    }
    if (!licenseData.ambulanceContactEmail) {
      throw new Error('Ambulance contact email is required');
    }
    if (!licenseData.uploadQuota || licenseData.uploadQuota <= 0) {
      throw new Error('Upload quota must be greater than 0');
    }

    // Generate unique license key
    let licenseKey: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      licenseKey = this.generateLicenseKey();
      const existing = await licenseRepository.findByKey(licenseKey);
      if (!existing) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique license key');
    }

    // Set expiration date far in the future (100 years) since expiry feature is removed
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 100);

    // Create license
    const license = await licenseRepository.create({
      licenseKey,
      ambulanceName: licenseData.ambulanceName,
      ambulanceContactEmail: licenseData.ambulanceContactEmail,
      ambulanceContactPhone: licenseData.ambulanceContactPhone,
      ambulanceAddress: licenseData.ambulanceAddress,
      uploadQuota: licenseData.uploadQuota,
      expiresAt,
    }, adminId);

    // Log audit entry
    await licenseAuditRepository.create({
      licenseId: license.id,
      action: 'created',
      changedBy: adminId,
      newValues: {
        ambulanceName: license.ambulanceName,
        uploadQuota: license.uploadQuota,
      },
    });

    return license;
  }

  /**
   * Get license by ID
   */
  async getLicenseById(id: string): Promise<AmbulanceLicense | null> {
    return licenseRepository.findById(id);
  }

  /**
   * Get license by key
   */
  async getLicenseByKey(key: string): Promise<AmbulanceLicense | null> {
    return licenseRepository.findByKey(key);
  }

  /**
   * Get all licenses with optional filters
   */
  async getAllLicenses(filters?: LicenseFilters): Promise<AmbulanceLicense[]> {
    return licenseRepository.findAll(filters);
  }

  /**
   * Update license
   */
  async updateLicense(
    id: string,
    data: UpdateLicenseDTO,
    adminId: string
  ): Promise<AmbulanceLicense> {
    const existingLicense = await licenseRepository.findById(id);
    if (!existingLicense) {
      throw new Error('License not found');
    }

    // Validate expiration date if provided
    if (data.expiresAt && new Date(data.expiresAt) <= new Date()) {
      throw new Error('Expiration date must be in the future');
    }

    // Validate upload quota if provided
    if (data.uploadQuota !== undefined && data.uploadQuota < 0) {
      throw new Error('Upload quota cannot be negative');
    }

    // Update license
    const updatedLicense = await licenseRepository.update(id, data);
    if (!updatedLicense) {
      throw new Error('Failed to update license');
    }

    // Log audit entry
    const oldValues: Record<string, any> = {};
    const newValues: Record<string, any> = {};

    if (data.ambulanceName && data.ambulanceName !== existingLicense.ambulanceName) {
      oldValues.ambulanceName = existingLicense.ambulanceName;
      newValues.ambulanceName = data.ambulanceName;
    }
    if (data.uploadQuota !== undefined && data.uploadQuota !== existingLicense.uploadQuota) {
      oldValues.uploadQuota = existingLicense.uploadQuota;
      newValues.uploadQuota = data.uploadQuota;
    }
    if (data.expiresAt && data.expiresAt !== existingLicense.expiresAt) {
      oldValues.expiresAt = existingLicense.expiresAt;
      newValues.expiresAt = data.expiresAt;
    }

    if (Object.keys(newValues).length > 0) {
      await licenseAuditRepository.create({
        licenseId: id,
        action: 'modified',
        changedBy: adminId,
        oldValues,
        newValues,
      });
    }

    return updatedLicense;
  }

  /**
   * Revoke a license
   */
  async revokeLicense(id: string, data: RevokeLicenseDTO, adminId: string): Promise<void> {
    const license = await licenseRepository.findById(id);
    if (!license) {
      throw new Error('License not found');
    }

    if (license.status === 'revoked') {
      throw new Error('License is already revoked');
    }

    // Revoke license
    await licenseRepository.revoke(id, adminId, data.reason);

    // Nullify license_id for all users with this license
    await query(
      'UPDATE users SET license_id = NULL WHERE license_id = $1',
      [id]
    );

    // Log audit entry
    await licenseAuditRepository.create({
      licenseId: id,
      action: 'revoked',
      changedBy: adminId,
      reason: data.reason,
      oldValues: { status: license.status },
      newValues: { status: 'revoked' },
    });
  }

  /**
   * Validate a license key
   */
  async validateLicense(licenseKey: string): Promise<LicenseValidation> {
    const license = await licenseRepository.findByKey(licenseKey);

    if (!license) {
      return {
        isValid: false,
        error: 'Invalid license key',
      };
    }

    if (license.status === 'revoked') {
      return {
        isValid: false,
        license,
        error: 'License has been revoked',
      };
    }

    if (license.status !== 'active') {
      return {
        isValid: false,
        license,
        error: 'License is not active',
      };
    }

    return {
      isValid: true,
      license,
    };
  }

  /**
   * Check if license has available quota
   */
  async checkQuotaAvailable(licenseId: string): Promise<boolean> {
    const license = await licenseRepository.findById(licenseId);
    if (!license) {
      return false;
    }

    return license.uploadsUsed < license.uploadQuota;
  }

  /**
   * Increment upload count for a license
   */
  async incrementUploadCount(licenseId: string): Promise<void> {
    const license = await licenseRepository.findById(licenseId);
    if (!license) {
      throw new Error('License not found');
    }

    if (license.status === 'revoked') {
      throw new Error('License has been revoked');
    }

    if (license.status === 'expired') {
      throw new Error('License has expired');
    }

    if (license.uploadsUsed >= license.uploadQuota) {
      throw new Error('Upload quota exceeded');
    }

    await licenseRepository.incrementUploadCount(licenseId);
  }

  /**
   * Update license quota
   */
  async updateQuota(licenseId: string, newQuota: number, adminId: string): Promise<void> {
    if (newQuota < 0) {
      throw new Error('Quota cannot be negative');
    }

    const license = await licenseRepository.findById(licenseId);
    if (!license) {
      throw new Error('License not found');
    }

    await licenseRepository.update(licenseId, { uploadQuota: newQuota });

    // Log audit entry
    await licenseAuditRepository.create({
      licenseId,
      action: 'quota_updated',
      changedBy: adminId,
      oldValues: { uploadQuota: license.uploadQuota },
      newValues: { uploadQuota: newQuota },
    });
  }

  /**
   * Extend license expiration
   */
  async extendLicense(licenseId: string, additionalDays: number, adminId: string): Promise<void> {
    if (additionalDays <= 0) {
      throw new Error('Additional days must be greater than 0');
    }

    const license = await licenseRepository.findById(licenseId);
    if (!license) {
      throw new Error('License not found');
    }

    const newExpiresAt = new Date(license.expiresAt);
    newExpiresAt.setDate(newExpiresAt.getDate() + additionalDays);

    await licenseRepository.update(licenseId, { expiresAt: newExpiresAt });

    // If license was expired, reactivate it
    if (license.status === 'expired') {
      await licenseRepository.updateStatus(licenseId, 'active');
    }

    // Log audit entry
    await licenseAuditRepository.create({
      licenseId,
      action: 'extended',
      changedBy: adminId,
      oldValues: { expiresAt: license.expiresAt },
      newValues: { expiresAt: newExpiresAt },
    });
  }

  /**
   * Expire licenses that have passed their expiration date (background job)
   */
  async expireLicenses(): Promise<number> {
    const expiredLicenses = await licenseRepository.findExpiredLicenses();

    let count = 0;
    for (const license of expiredLicenses) {
      if (license.status === 'active') {
        await licenseRepository.updateStatus(license.id, 'expired');
        
        // Log audit entry (system action, no changedBy)
        await licenseAuditRepository.create({
          licenseId: license.id,
          action: 'status_changed',
          oldValues: { status: 'active' },
          newValues: { status: 'expired' },
          reason: 'Automatic expiration',
        });
        
        count++;
      }
    }

    return count;
  }

  /**
   * Get audit log for a license
   */
  async getAuditLog(licenseId: string) {
    return await licenseAuditRepository.findByLicenseId(licenseId);
  }
}

// Export singleton instance
export const licenseService = new LicenseService();
