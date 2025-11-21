import { Request, Response, NextFunction } from 'express';

/**
 * Admin authorization middleware
 * Requires user to be authenticated and have super_admin role
 * Must be used after authMiddleware
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;

    // Check if user is authenticated
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Verify user role is super_admin
    if (user.role !== 'super_admin') {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Authorization check failed',
        timestamp: new Date().toISOString(),
      },
    });
  }
}
