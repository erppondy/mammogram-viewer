import { Request, Response, NextFunction } from 'express';
import { licenseService } from '../services/LicenseService';

// Extend Express Request type to include license
declare global {
  namespace Express {
    interface Request {
      license?: any;
    }
  }
}

/**
 * License validation middleware
 * Validates that the authenticated user has a valid, active license
 * Must be used after authMiddleware
 */
export async function licensedUserMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check if user has a license associated
    if (!user.licenseId) {
      return res.status(403).json({
        error: {
          code: 'NO_LICENSE',
          message: 'No license associated with user account',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Get and validate license
    const license = await licenseService.getLicenseById(user.licenseId);

    if (!license) {
      return res.status(403).json({
        error: {
          code: 'INVALID_LICENSE',
          message: 'License not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check license status
    if (license.status !== 'active') {
      return res.status(403).json({
        error: {
          code: 'INACTIVE_LICENSE',
          message: `License is ${license.status}`,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Attach license to request
    req.license = license;
    next();
  } catch (error) {
    console.error('License validation error:', error);
    res.status(500).json({
      error: {
        code: 'LICENSE_VALIDATION_ERROR',
        message: 'Failed to validate license',
        timestamp: new Date().toISOString(),
      },
    });
  }
}

/**
 * Quota check middleware
 * Validates that the license has not exceeded its upload quota
 * Must be used after licensedUserMiddleware
 */
export async function quotaCheckMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const license = req.license;

    if (!license) {
      return res.status(403).json({
        error: {
          code: 'NO_LICENSE',
          message: 'License validation required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check if quota is exceeded
    if (license.uploadsUsed >= license.uploadQuota) {
      return res.status(429).json({
        error: {
          code: 'QUOTA_EXCEEDED',
          message: 'Upload quota has been exceeded',
          data: {
            quota: license.uploadQuota,
            used: license.uploadsUsed,
          },
          timestamp: new Date().toISOString(),
        },
      });
    }

    next();
  } catch (error) {
    console.error('Quota check error:', error);
    res.status(500).json({
      error: {
        code: 'QUOTA_CHECK_ERROR',
        message: 'Failed to check quota',
        timestamp: new Date().toISOString(),
      },
    });
  }
}

/**
 * Optional license middleware
 * Attaches license if user has one, but doesn't require it
 * Must be used after authMiddleware
 */
export async function optionalLicenseMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const user = req.user;

    if (user && user.licenseId) {
      const license = await licenseService.getLicenseById(user.licenseId);
      if (license && license.status === 'active' && new Date() <= new Date(license.expiresAt)) {
        req.license = license;
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional license
    next();
  }
}
