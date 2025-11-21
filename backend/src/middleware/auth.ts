import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/AuthService';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: {
          code: 'NO_TOKEN',
          message: 'No authentication token provided',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Extract token (format: "Bearer <token>")
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Invalid token format. Expected: Bearer <token>',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const token = parts[1];

    // Verify token and get user
    const user = await authService.verifyToken(token);

    // Check session timeout (30 minutes of inactivity)
    if (user.lastLoginAt) {
      const lastLogin = new Date(user.lastLoginAt).getTime();
      const now = Date.now();
      const thirtyMinutes = 30 * 60 * 1000;

      if (now - lastLogin > thirtyMinutes) {
        return res.status(401).json({
          error: {
            code: 'SESSION_EXPIRED',
            message: 'Session expired due to inactivity',
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';

    if (message === 'Token expired') {
      return res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (message === 'Invalid token' || message === 'User not found') {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token',
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.status(500).json({
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error',
        timestamp: new Date().toISOString(),
      },
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is provided, but doesn't require it
 */
export async function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      const token = parts[1];
      const user = await authService.verifyToken(token);
      req.user = user;
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
}
