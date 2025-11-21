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

    const result = await authService.login({ email, password });

    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';

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

export default router;
