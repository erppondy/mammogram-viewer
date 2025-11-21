import { Request, Response, NextFunction } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../auth';
import { authService } from '../../services/AuthService';

jest.mock('../../services/AuthService');

const mockedAuthService = authService as jest.Mocked<typeof authService>;

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      passwordHash: 'hash',
      fullName: 'Test User',
      professionalCredentials: 'MD',
      isVerified: true,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };

    it('should authenticate valid token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid_token',
      };

      mockedAuthService.verifyToken.mockResolvedValue(mockUser);

      await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toEqual(mockUser);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 401 if no token provided', async () => {
      mockRequest.headers = {};

      await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: expect.objectContaining({
          code: 'NO_TOKEN',
        }),
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token format', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token',
      };

      await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: expect.objectContaining({
          code: 'INVALID_TOKEN_FORMAT',
        }),
      });
    });

    it('should return 401 for expired token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer expired_token',
      };

      mockedAuthService.verifyToken.mockRejectedValue(new Error('Token expired'));

      await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: expect.objectContaining({
          code: 'TOKEN_EXPIRED',
        }),
      });
    });

    it('should return 401 for invalid token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid_token',
      };

      mockedAuthService.verifyToken.mockRejectedValue(new Error('Invalid token'));

      await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: expect.objectContaining({
          code: 'INVALID_TOKEN',
        }),
      });
    });

    it('should return 401 for session timeout', async () => {
      const oldDate = new Date(Date.now() - 31 * 60 * 1000); // 31 minutes ago
      const expiredUser = { ...mockUser, lastLoginAt: oldDate };

      mockRequest.headers = {
        authorization: 'Bearer valid_token',
      };

      mockedAuthService.verifyToken.mockResolvedValue(expiredUser);

      await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: expect.objectContaining({
          code: 'SESSION_EXPIRED',
        }),
      });
    });

    it('should allow access within session timeout', async () => {
      const recentDate = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      const activeUser = { ...mockUser, lastLoginAt: recentDate };

      mockRequest.headers = {
        authorization: 'Bearer valid_token',
      };

      mockedAuthService.verifyToken.mockResolvedValue(activeUser);

      await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toEqual(activeUser);
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('optionalAuthMiddleware', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      passwordHash: 'hash',
      fullName: 'Test User',
      professionalCredentials: 'MD',
      isVerified: true,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };

    it('should attach user if valid token provided', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid_token',
      };

      mockedAuthService.verifyToken.mockResolvedValue(mockUser);

      await optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toEqual(mockUser);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should continue without user if no token provided', async () => {
      mockRequest.headers = {};

      await optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should continue without user if token is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid_token',
      };

      mockedAuthService.verifyToken.mockRejectedValue(new Error('Invalid token'));

      await optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
    });
  });
});
