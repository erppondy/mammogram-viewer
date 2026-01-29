import { Router, Request, Response } from 'express';
import { authService } from '../services/AuthService';
import { validate } from '../middleware/validation';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Validation rules
const registerValidation = validate([
  { field: 'email', required: true, type: 'email' },
  {
    field: 'password',
    required: true,
    type: 'string',
    minLength: 8,
    message: 'Password must be at least 8 characters long',
  },
  { field: 'fullName', required: true, type: 'string', minLength: 2 },
  { field: 'professionalCredentials', required: false, type: 'string' },
]);

const loginValidation = validate([
  { field: 'email', required: true, type: 'email' },
  { field: 'password', required: true, type: 'string' },
]);

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', registerValidation, async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, professionalCredentials } = req.body;

    const result = await authService.register({
      email,
      password,
      fullName,
      professionalCredentials,
    });

    res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';

    if (message === 'Email already registered') {
      return res.status(409).json({
        error: {
          code: 'EMAIL_EXISTS',
          message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (message.includes('Password must be')) {
      return res.status(400).json({
        error: {
          code: 'WEAK_PASSWORD',
          message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.status(500).json({
      error: {
        code: 'REGISTRATION_ERROR',
        message: 'Failed to register user',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', loginValidation, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', email);
    console.log('IP:', req.ip || req.connection.remoteAddress);
    console.log('User-Agent:', req.headers['user-agent']);
    console.log('Origin:', req.headers.origin);
    console.log('Timestamp:', new Date().toISOString());

    const result = await authService.login({ email, password });
    
    console.log('Login successful for:', email);
    console.log('===================');

    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    
    console.error('=== LOGIN FAILED ===');
    console.error('Email:', req.body.email);
    console.error('IP:', req.ip || req.connection.remoteAddress);
    console.error('Error:', message);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('===================');

    if (message === 'Invalid credentials') {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (message === 'ACCOUNT_PENDING') {
      return res.status(403).json({
        error: {
          code: 'ACCOUNT_PENDING',
          message:
            'Your account is pending approval by an administrator. Please wait for approval before logging in.',
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (message.startsWith('ACCOUNT_REJECTED')) {
      const reason = message.includes(':') ? message.split(': ')[1] : null;
      return res.status(403).json({
        error: {
          code: 'ACCOUNT_REJECTED',
          message: reason
            ? `Your account has been rejected. Reason: ${reason}`
            : 'Your account has been rejected by an administrator.',
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (message === 'ACCOUNT_DEACTIVATED') {
      return res.status(403).json({
        error: {
          code: 'ACCOUNT_DEACTIVATED',
          message: 'Your account has been deactivated. Please contact an administrator.',
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.status(500).json({
      error: {
        code: 'LOGIN_ERROR',
        message: 'Failed to login',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/auth/verify
 * Verify JWT token and return user info
 */
router.get('/verify', authMiddleware, async (req: Request, res: Response) => {
  try {
    // User is already attached to req by authMiddleware
    const user = (req as any).user;

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      professionalCredentials: user.professionalCredentials,
      isVerified: user.isVerified,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'VERIFICATION_ERROR',
        message: 'Failed to verify token',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      professionalCredentials: user.professionalCredentials,
      isVerified: user.isVerified,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'PROFILE_ERROR',
        message: 'Failed to get profile',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update current user profile
 */
router.put('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { fullName, email } = req.body;

    // Validate input
    if (!fullName || fullName.trim().length < 2) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Full name must be at least 2 characters long',
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid email address',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Update user profile
    const updatedUser = await authService.updateProfile(user.id, {
      fullName: fullName.trim(),
      email: email.trim(),
    });

    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      professionalCredentials: updatedUser.professionalCredentials,
      isVerified: updatedUser.isVerified,
      role: updatedUser.role,
      status: updatedUser.status,
      createdAt: updatedUser.createdAt,
      lastLoginAt: updatedUser.lastLoginAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update profile';

    if (message === 'Email already in use') {
      return res.status(409).json({
        error: {
          code: 'EMAIL_EXISTS',
          message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.status(500).json({
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update profile',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * PUT /api/auth/change-password
 * Change current user's password
 */
router.put('/change-password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'Current password, new password, and confirm password are required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: {
          code: 'PASSWORD_MISMATCH',
          message: 'New password and confirm password do not match',
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 8 characters long',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Change password
    await authService.changePassword(user.id, currentPassword, newPassword);

    res.json({
      message: 'Password changed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to change password';

    if (message === 'Current password is incorrect') {
      return res.status(401).json({
        error: {
          code: 'INVALID_PASSWORD',
          message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (message === 'New password must be different from current password') {
      return res.status(400).json({
        error: {
          code: 'SAME_PASSWORD',
          message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (message.includes('Password must be')) {
      return res.status(400).json({
        error: {
          code: 'WEAK_PASSWORD',
          message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.status(500).json({
      error: {
        code: 'PASSWORD_CHANGE_ERROR',
        message: 'Failed to change password',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * POST /api/auth/register/ambulance
 * Register a new ambulance user with license key
 */
router.post('/register/ambulance', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, professionalCredentials, licenseKey, ambulanceRole } = req.body;

    // Validate required fields
    if (!email || !password || !fullName || !licenseKey) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'Email, password, full name, and license key are required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_EMAIL',
          message: 'Invalid email address',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 8 characters long',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const result = await authService.registerAmbulanceUser({
      email,
      password,
      fullName,
      professionalCredentials,
      licenseKey,
      ambulanceRole: ambulanceRole || 'operator',
    });

    res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';

    if (message === 'Email already registered') {
      return res.status(409).json({
        error: {
          code: 'EMAIL_EXISTS',
          message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (message.includes('Invalid license key')) {
      return res.status(400).json({
        error: {
          code: 'INVALID_LICENSE_KEY',
          message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (message.includes('License revoked')) {
      return res.status(400).json({
        error: {
          code: 'LICENSE_REVOKED',
          message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.status(500).json({
      error: {
        code: 'REGISTRATION_ERROR',
        message: 'Failed to register ambulance user',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/auth/license-status
 * Get current user's license status
 */
router.get('/license-status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user.licenseId) {
      return res.json({
        success: true,
        data: {
          hasLicense: false,
          license: null,
        },
      });
    }

    const { licenseService } = await import('../services/LicenseService');
    const license = await licenseService.getLicenseById(user.licenseId);

    if (!license) {
      return res.json({
        success: true,
        data: {
          hasLicense: false,
          license: null,
        },
      });
    }

    // Calculate days until expiry
    const now = new Date();
    const expiryDate = new Date(license.expiresAt);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      data: {
        hasLicense: true,
        license: {
          id: license.id,
          licenseKey: license.licenseKey,
          ambulanceName: license.ambulanceName,
          status: license.status,
          uploadQuota: license.uploadQuota,
          uploadsUsed: license.uploadsUsed,
          uploadsRemaining: license.uploadQuota - license.uploadsUsed,
          quotaUsagePercent: Math.round((license.uploadsUsed / license.uploadQuota) * 100),
          expiresAt: license.expiresAt,
          daysUntilExpiry,
          isExpiringSoon: daysUntilExpiry <= 7 && daysUntilExpiry > 0,
          isQuotaLow: (license.uploadsUsed / license.uploadQuota) >= 0.8,
        },
      },
    });
  } catch (error) {
    console.error('Get license status error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get license status';

    res.status(500).json({
      error: {
        code: 'LICENSE_STATUS_ERROR',
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
