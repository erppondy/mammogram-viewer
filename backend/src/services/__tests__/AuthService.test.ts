import { AuthService } from '../AuthService';
import { userRepository } from '../../repositories/UserRepository';
import { UserRole, UserStatus } from '../../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

jest.mock('../../repositories/UserRepository');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockedUserRepository = userRepository as jest.Mocked<typeof userRepository>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'Password123',
      fullName: 'Test User',
      professionalCredentials: 'MD',
    };

    it('should register a new user successfully with pending status', async () => {
      mockedUserRepository.findByEmail.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashed_password' as never);
      mockedUserRepository.create.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        fullName: 'Test User',
        professionalCredentials: 'MD',
        isVerified: false,
        role: 'user' as UserRole,
        status: 'pending' as UserStatus,
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        createdAt: new Date(),
        lastLoginAt: null,
      });

      const result = await authService.register(validUserData);

      expect(result.message).toContain('pending approval');
      expect(result.requiresApproval).toBe(true);
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.fullName).toBe('Test User');
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('Password123', 12);
    });

    it('should throw error if email already exists', async () => {
      mockedUserRepository.findByEmail.mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com',
        passwordHash: 'hash',
        fullName: 'Existing User',
        professionalCredentials: null,
        isVerified: false,
        role: 'user' as UserRole,
        status: 'approved' as UserStatus,
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        createdAt: new Date(),
        lastLoginAt: null,
      });

      await expect(authService.register(validUserData)).rejects.toThrow('Email already registered');
    });

    it('should throw error for invalid email format', async () => {
      mockedUserRepository.findByEmail.mockResolvedValue(null);

      const invalidEmailData = { ...validUserData, email: 'invalid-email' };

      await expect(authService.register(invalidEmailData)).rejects.toThrow('Invalid email format');
    });

    it('should throw error for weak password', async () => {
      mockedUserRepository.findByEmail.mockResolvedValue(null);

      const weakPasswordData = { ...validUserData, password: 'weak' };

      await expect(authService.register(weakPasswordData)).rejects.toThrow(
        'Password must be at least 8 characters'
      );
    });
  });

  describe('login', () => {
    const loginCredentials = {
      email: 'test@example.com',
      password: 'Password123',
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      fullName: 'Test User',
      professionalCredentials: 'MD',
      isVerified: true,
      role: 'user' as UserRole,
      status: 'approved' as UserStatus,
      approvedBy: 'admin-1',
      approvedAt: new Date(),
      rejectionReason: null,
      createdAt: new Date(),
      lastLoginAt: null,
    };

    it('should login approved user successfully', async () => {
      mockedUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedUserRepository.updateLastLogin.mockResolvedValue(undefined);
      mockedJwt.sign.mockReturnValue('jwt_token' as never);

      const result = await authService.login(loginCredentials);

      expect(result.token).toBe('jwt_token');
      expect(result.user.email).toBe('test@example.com');
      expect(mockedUserRepository.updateLastLogin).toHaveBeenCalledWith('user-123');
    });

    it('should throw error if user not found', async () => {
      mockedUserRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.login(loginCredentials)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if password is incorrect', async () => {
      mockedUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(authService.login(loginCredentials)).rejects.toThrow('Invalid credentials');
    });

    it('should throw ACCOUNT_PENDING error for pending users', async () => {
      const pendingUser = { ...mockUser, status: 'pending' as UserStatus };
      mockedUserRepository.findByEmail.mockResolvedValue(pendingUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      await expect(authService.login(loginCredentials)).rejects.toThrow('ACCOUNT_PENDING');
    });

    it('should throw ACCOUNT_REJECTED error for rejected users', async () => {
      const rejectedUser = { ...mockUser, status: 'rejected' as UserStatus, rejectionReason: null };
      mockedUserRepository.findByEmail.mockResolvedValue(rejectedUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      await expect(authService.login(loginCredentials)).rejects.toThrow('ACCOUNT_REJECTED');
    });

    it('should throw ACCOUNT_REJECTED with reason for rejected users with reason', async () => {
      const rejectedUser = {
        ...mockUser,
        status: 'rejected' as UserStatus,
        rejectionReason: 'Invalid credentials provided',
      };
      mockedUserRepository.findByEmail.mockResolvedValue(rejectedUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      await expect(authService.login(loginCredentials)).rejects.toThrow(
        'ACCOUNT_REJECTED: Invalid credentials provided'
      );
    });

    it('should throw ACCOUNT_DEACTIVATED error for deactivated users', async () => {
      const deactivatedUser = { ...mockUser, status: 'deactivated' as UserStatus };
      mockedUserRepository.findByEmail.mockResolvedValue(deactivatedUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      await expect(authService.login(loginCredentials)).rejects.toThrow('ACCOUNT_DEACTIVATED');
    });
  });

  describe('verifyToken', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      fullName: 'Test User',
      professionalCredentials: 'MD',
      isVerified: true,
      role: 'user' as UserRole,
      status: 'approved' as UserStatus,
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      createdAt: new Date(),
      lastLoginAt: null,
    };

    it('should verify valid token and return user', async () => {
      const payload = { userId: 'user-123', email: 'test@example.com' };
      mockedJwt.verify.mockReturnValue(payload as never);
      mockedUserRepository.findById.mockResolvedValue(mockUser);

      const user = await authService.verifyToken('valid_token');

      expect(user.id).toBe('user-123');
      expect(user.email).toBe('test@example.com');
    });

    it('should throw error for expired token', async () => {
      mockedJwt.verify.mockImplementation(() => {
        throw new jwt.TokenExpiredError('Token expired', new Date());
      });

      await expect(authService.verifyToken('expired_token')).rejects.toThrow('Token expired');
    });

    it('should throw error for invalid token', async () => {
      mockedJwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      await expect(authService.verifyToken('invalid_token')).rejects.toThrow('Invalid token');
    });

    it('should throw error if user not found', async () => {
      const payload = { userId: 'nonexistent', email: 'test@example.com' };
      mockedJwt.verify.mockReturnValue(payload as never);
      mockedUserRepository.findById.mockResolvedValue(null);

      await expect(authService.verifyToken('valid_token')).rejects.toThrow('User not found');
    });
  });

  describe('hashPassword', () => {
    it('should hash password', async () => {
      mockedBcrypt.hash.mockResolvedValue('hashed_password' as never);

      const hash = await authService.hashPassword('password123');

      expect(hash).toBe('hashed_password');
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 12);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const result = await authService.comparePassword('password123', 'hashed_password');

      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const result = await authService.comparePassword('wrong_password', 'hashed_password');

      expect(result).toBe(false);
    });
  });
});
