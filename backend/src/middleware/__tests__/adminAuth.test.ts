import { Request, Response, NextFunction } from 'express';
import { requireAdmin } from '../adminAuth';

describe('requireAdmin middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  describe('Authentication checks', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;

      await requireAdmin(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: expect.any(String),
        },
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if user is null', async () => {
      mockRequest.user = null;

      await requireAdmin(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: expect.any(String),
        },
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('Authorization checks', () => {
    it('should return 403 if user role is not super_admin', async () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'user',
        status: 'approved',
      };

      await requireAdmin(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
          timestamp: expect.any(String),
        },
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 if user has no role', async () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com',
        status: 'approved',
      };

      await requireAdmin(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
          timestamp: expect.any(String),
        },
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('Success cases', () => {
    it('should call next() if user is super_admin', async () => {
      mockRequest.user = {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'super_admin',
        status: 'approved',
      };

      await requireAdmin(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should allow super_admin regardless of other user properties', async () => {
      mockRequest.user = {
        id: 'admin-456',
        email: 'superadmin@example.com',
        role: 'super_admin',
        status: 'approved',
        fullName: 'Super Admin',
        isVerified: true,
      };

      await requireAdmin(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should return 500 if an unexpected error occurs', async () => {
      // Mock a scenario where accessing user.role throws an error
      Object.defineProperty(mockRequest, 'user', {
        get: () => {
          throw new Error('Unexpected error');
        },
      });

      await requireAdmin(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'SERVER_ERROR',
          message: 'Authorization check failed',
          timestamp: expect.any(String),
        },
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should reject user with role as empty string', async () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com',
        role: '',
        status: 'approved',
      };

      await requireAdmin(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should be case-sensitive for role check', async () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'SUPER_ADMIN', // Wrong case
        status: 'approved',
      };

      await requireAdmin(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject admin role (only super_admin allowed)', async () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'admin', // Not super_admin
        status: 'approved',
      };

      await requireAdmin(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
