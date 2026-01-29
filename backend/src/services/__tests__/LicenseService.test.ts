import { LicenseService } from '../LicenseService';
import { licenseRepository } from '../../repositories/LicenseRepository';
import { licenseAuditRepository } from '../../repositories/LicenseAuditRepository';

jest.mock('../../repositories/LicenseRepository');
jest.mock('../../repositories/LicenseAuditRepository');
jest.mock('../../repositories/LicenseTemplateRepository');

const mockedLicenseRepository = licenseRepository as jest.Mocked<typeof licenseRepository>;
const mockedLicenseAuditRepository = licenseAuditRepository as jest.Mocked<typeof licenseAuditRepository>;

describe('LicenseService', () => {
  let licenseService: LicenseService;

  beforeEach(() => {
    licenseService = new LicenseService();
    jest.clearAllMocks();
  });

  describe('generateLicenseKey', () => {
    it('should generate a license key in correct format', () => {
      const key = licenseService.generateLicenseKey();
      
      expect(key).toMatch(/^AMB-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);
    });

    it('should generate unique keys', () => {
      const keys = new Set();
      for (let i = 0; i < 100; i++) {
        keys.add(licenseService.generateLicenseKey());
      }
      
      expect(keys.size).toBe(100);
    });
  });

  describe('createLicense', () => {
    const validLicenseData = {
      ambulanceName: 'Test Ambulance',
      ambulanceContactEmail: 'test@ambulance.com',
      uploadQuota: 1000,
      durationDays: 365,
    };

    const mockLicense = {
      id: 'license-123',
      licenseKey: 'AMB-1234-5678-9ABC-DEF0',
      ambulanceName: 'Test Ambulance',
      ambulanceContactEmail: 'test@ambulance.com',
      ambulanceContactPhone: null,
      ambulanceAddress: null,
      status: 'active' as const,
      uploadQuota: 1000,
      uploadsUsed: 0,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      revokedAt: null,
      createdBy: 'admin-123',
      revokedBy: null,
      revocationReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a license successfully', async () => {
      mockedLicenseRepository.findByKey.mockResolvedValue(null);
      mockedLicenseRepository.create.mockResolvedValue(mockLicense);
      mockedLicenseAuditRepository.create.mockResolvedValue({} as any);

      const result = await licenseService.createLicense(validLicenseData, 'admin-123');

      expect(result).toEqual(mockLicense);
      expect(mockedLicenseRepository.create).toHaveBeenCalled();
      expect(mockedLicenseAuditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          licenseId: mockLicense.id,
          action: 'created',
          changedBy: 'admin-123',
        })
      );
    });

    it('should throw error if ambulance name is missing', async () => {
      const invalidData = { ...validLicenseData, ambulanceName: '' };

      await expect(licenseService.createLicense(invalidData, 'admin-123')).rejects.toThrow(
        'Ambulance name is required'
      );
    });

    it('should throw error if upload quota is invalid', async () => {
      const invalidData = { ...validLicenseData, uploadQuota: 0 };

      await expect(licenseService.createLicense(invalidData, 'admin-123')).rejects.toThrow(
        'Upload quota must be greater than 0'
      );
    });
  });

  describe('validateLicense', () => {
    it('should return valid for active license', async () => {
      const mockLicense = {
        id: 'license-123',
        licenseKey: 'AMB-1234-5678-9ABC-DEF0',
        status: 'active' as const,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      } as any;

      mockedLicenseRepository.findByKey.mockResolvedValue(mockLicense);

      const result = await licenseService.validateLicense('AMB-1234-5678-9ABC-DEF0');

      expect(result.isValid).toBe(true);
      expect(result.license).toEqual(mockLicense);
    });

    it('should return invalid for non-existent license', async () => {
      mockedLicenseRepository.findByKey.mockResolvedValue(null);

      const result = await licenseService.validateLicense('INVALID-KEY');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid license key');
    });

    it('should return invalid for revoked license', async () => {
      const mockLicense = {
        id: 'license-123',
        status: 'revoked' as const,
      } as any;

      mockedLicenseRepository.findByKey.mockResolvedValue(mockLicense);

      const result = await licenseService.validateLicense('AMB-1234-5678-9ABC-DEF0');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('License has been revoked');
    });

    it('should return invalid for expired license', async () => {
      const mockLicense = {
        id: 'license-123',
        status: 'active' as const,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      } as any;

      mockedLicenseRepository.findByKey.mockResolvedValue(mockLicense);

      const result = await licenseService.validateLicense('AMB-1234-5678-9ABC-DEF0');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('License has expired');
    });
  });

  describe('checkQuotaAvailable', () => {
    it('should return true when quota is available', async () => {
      const mockLicense = {
        id: 'license-123',
        uploadQuota: 1000,
        uploadsUsed: 500,
      } as any;

      mockedLicenseRepository.findById.mockResolvedValue(mockLicense);

      const result = await licenseService.checkQuotaAvailable('license-123');

      expect(result).toBe(true);
    });

    it('should return false when quota is exceeded', async () => {
      const mockLicense = {
        id: 'license-123',
        uploadQuota: 1000,
        uploadsUsed: 1000,
      } as any;

      mockedLicenseRepository.findById.mockResolvedValue(mockLicense);

      const result = await licenseService.checkQuotaAvailable('license-123');

      expect(result).toBe(false);
    });

    it('should return false when license not found', async () => {
      mockedLicenseRepository.findById.mockResolvedValue(null);

      const result = await licenseService.checkQuotaAvailable('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('incrementUploadCount', () => {
    it('should increment upload count successfully', async () => {
      const mockLicense = {
        id: 'license-123',
        uploadQuota: 1000,
        uploadsUsed: 500,
      } as any;

      mockedLicenseRepository.findById.mockResolvedValue(mockLicense);
      mockedLicenseRepository.incrementUploadCount.mockResolvedValue(undefined);

      await licenseService.incrementUploadCount('license-123');

      expect(mockedLicenseRepository.incrementUploadCount).toHaveBeenCalledWith('license-123');
    });

    it('should throw error when quota exceeded', async () => {
      const mockLicense = {
        id: 'license-123',
        uploadQuota: 1000,
        uploadsUsed: 1000,
      } as any;

      mockedLicenseRepository.findById.mockResolvedValue(mockLicense);

      await expect(licenseService.incrementUploadCount('license-123')).rejects.toThrow(
        'Upload quota exceeded'
      );
    });
  });
});
