import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/AnalyticsService';

// Middleware to track user activity
export const trackActivity = (activityType: string, resourceType?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return next();
      }

      const resourceId = req.params.id ? parseInt(req.params.id) : undefined;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');

      // Track activity asynchronously (don't wait for it)
      analyticsService
        .trackActivity(
          user.userId,
          activityType as any,
          resourceType,
          resourceId,
          {
            method: req.method,
            path: req.path,
            query: req.query,
          },
          ipAddress,
          userAgent
        )
        .catch((error) => {
          console.error('Failed to track activity:', error);
        });

      next();
    } catch (error) {
      // Don't fail the request if activity tracking fails
      console.error('Activity tracking error:', error);
      next();
    }
  };
};

// Middleware to track image views
export const trackImageView = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const imageId = parseInt(req.params.id);

    if (user && imageId) {
      // Track view asynchronously
      analyticsService.trackImageView(imageId, user.userId).catch((error) => {
        console.error('Failed to track image view:', error);
      });
    }

    next();
  } catch (error) {
    console.error('Image view tracking error:', error);
    next();
  }
};
