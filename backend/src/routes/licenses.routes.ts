import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';
import { licenseService } from '../services/LicenseService';
import { validate } from '../middleware/validation';

const router = Router();

// Validation rules
const createLicenseValidation = validate([
  { field: 'ambulanceName', required: true, type: 'string', minLength: 2 },
  { field: 'ambulanceContactEmail', required: true, type: 'email' },
  { field: 'ambulanceContactPhone', required: false, type: 'string' },
  { field: 'ambulanceAddress', required: false, type: 'string' },
  { field: 'uploadQuota', required: true, type: 'number', custom: (v) => v >= 1, message: 'Upload quota must be at least 1' },
  { field: 'templateId', required: false, type: 'string' },
]);

const updateLicenseValidation = validate([
  { field: 'ambulanceName', required: false, type: 'string', minLength: 2 },
  { field: 'ambulanceContactEmail', required: false, type: 'email' },
  { field: 'ambulanceContactPhone', required: false, type: 'string' },
  { field: 'ambulanceAddress', required: false, type: 'string' },
  { field: 'uploadQuota', required: false, type: 'number', custom: (v) => v >= 1, message: 'Upload quota must be at least 1' },
  { field: 'expiresAt', required: false, type: 'string' },
]);

const revokeLicenseValidation = validate([
  { field: 'reason', required: true, type: 'string', minLength: 5 },
]);

const updateQuotaValidation = validate([
  { field: 'newQuota', required: true, type: 'number', custom: (v) => v >= 1, message: 'Quota must be at least 1' },
]);

/**
 * POST /api/licenses
 * Create a new ambulance license (admin only)
 */
router.post('/', authMiddleware, requireAdmin, createLicenseValidation, async (req: Request, res: Response) => {
  try {
    const adminUser = req.user;
    const licenseData = req.body;

    const license = await licenseService.createLicense(licenseData, adminUser.id);

    res.status(201).json({
      success: true,
      data: license,
    });
  } catch (error) {
    console.error('Create license error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create license';

    if (message.includes('already exists')) {
      return res.status(409).json({
        error: {
          code: 'DUPLICATE_LICENSE',
          message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.status(500).json({
      error: {
        code: 'CREATE_LICENSE_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/licenses
 * List all licenses with optional filtering (admin only)
 */
router.get('/', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, ambulanceName, page = '1', limit = '50' } = req.query;

    const filters: any = {};
    if (status) filters.status = status as string;
    if (ambulanceName) filters.ambulanceName = ambulanceName as string;
    filters.page = parseInt(page as string);
    filters.limit = parseInt(limit as string);

    const licenses = await licenseService.getAllLicenses(filters);

    res.json({
      success: true,
      data: licenses,
    });
  } catch (error) {
    console.error('List licenses error:', error);
    const message = error instanceof Error ? error.message : 'Failed to list licenses';

    res.status(500).json({
      error: {
        code: 'LIST_LICENSES_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/licenses/:id
 * Get license details by ID (admin only)
 */
router.get('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const license = await licenseService.getLicenseById(id);

    if (!license) {
      return res.status(404).json({
        error: {
          code: 'LICENSE_NOT_FOUND',
          message: 'License not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.json({
      success: true,
      data: license,
    });
  } catch (error) {
    console.error('Get license error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get license';

    res.status(500).json({
      error: {
        code: 'GET_LICENSE_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * PUT /api/licenses/:id
 * Update license details (admin only)
 */
router.put('/:id', authMiddleware, requireAdmin, updateLicenseValidation, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminUser = req.user;
    const updateData = req.body;

    const license = await licenseService.updateLicense(id, updateData, adminUser.id);

    res.json({
      success: true,
      data: license,
    });
  } catch (error) {
    console.error('Update license error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update license';

    if (message.includes('not found')) {
      return res.status(404).json({
        error: {
          code: 'LICENSE_NOT_FOUND',
          message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.status(500).json({
      error: {
        code: 'UPDATE_LICENSE_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * DELETE /api/licenses/:id/revoke
 * Revoke a license (admin only)
 */
router.delete('/:id/revoke', authMiddleware, requireAdmin, revokeLicenseValidation, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminUser = req.user;
    const { reason } = req.body;

    await licenseService.revokeLicense(id, { reason }, adminUser.id);

    res.json({
      success: true,
      message: 'License revoked successfully',
    });
  } catch (error) {
    console.error('Revoke license error:', error);
    const message = error instanceof Error ? error.message : 'Failed to revoke license';

    if (message.includes('not found')) {
      return res.status(404).json({
        error: {
          code: 'LICENSE_NOT_FOUND',
          message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (message.includes('already revoked')) {
      return res.status(400).json({
        error: {
          code: 'ALREADY_REVOKED',
          message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.status(500).json({
      error: {
        code: 'REVOKE_LICENSE_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/licenses/:id/extend
 * Extend license expiration date (admin only)
 */
router.post('/:id/extend', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminUser = req.user;
    const { additionalDays, newExpiryDate } = req.body;

    if (!additionalDays && !newExpiryDate) {
      return res.status(400).json({
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'Either additionalDays or newExpiryDate is required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const license = await licenseService.getLicenseById(id);
    if (!license) {
      return res.status(404).json({
        error: {
          code: 'LICENSE_NOT_FOUND',
          message: 'License not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    let expiresAt: Date;
    if (newExpiryDate) {
      expiresAt = new Date(newExpiryDate);
    } else {
      expiresAt = new Date(license.expiresAt);
      expiresAt.setDate(expiresAt.getDate() + parseInt(additionalDays));
    }

    const updatedLicense = await licenseService.updateLicense(id, { expiresAt }, adminUser.id);

    res.json({
      success: true,
      data: updatedLicense,
    });
  } catch (error) {
    console.error('Extend license error:', error);
    const message = error instanceof Error ? error.message : 'Failed to extend license';

    res.status(500).json({
      error: {
        code: 'EXTEND_LICENSE_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * PUT /api/licenses/:id/quota
 * Update license upload quota (admin only)
 */
router.put('/:id/quota', authMiddleware, requireAdmin, updateQuotaValidation, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminUser = req.user;
    const { newQuota } = req.body;

    await licenseService.updateQuota(id, parseInt(newQuota), adminUser.id);

    const updatedLicense = await licenseService.getLicenseById(id);

    res.json({
      success: true,
      data: updatedLicense,
    });
  } catch (error) {
    console.error('Update quota error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update quota';

    if (message.includes('not found')) {
      return res.status(404).json({
        error: {
          code: 'LICENSE_NOT_FOUND',
          message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.status(500).json({
      error: {
        code: 'UPDATE_QUOTA_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/licenses/:id/audit-log
 * Get audit log for a license (admin only)
 */
router.get('/:id/audit-log', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const auditLogs = await licenseService.getAuditLog(id);

    res.json({
      success: true,
      data: auditLogs,
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get audit log';

    res.status(500).json({
      error: {
        code: 'GET_AUDIT_LOG_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/licenses/validate/:key
 * Validate a license key (public endpoint)
 */
router.get('/validate/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    const validation = await licenseService.validateLicense(key);

    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    console.error('Validate license error:', error);
    const message = error instanceof Error ? error.message : 'Failed to validate license';

    res.status(500).json({
      error: {
        code: 'VALIDATE_LICENSE_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
