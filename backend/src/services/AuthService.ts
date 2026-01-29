import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/UserRepository';
import { CreateUserDTO, User, toUserResponse, UserResponse } from '../models/User';
import { licenseService } from './LicenseService';
import { AmbulanceLicense } from '../models/AmbulanceLicense';

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthToken {
  token: string;
  user: UserResponse;
  license?: LicenseStatus;
}

export interface RegistrationResponse {
  message: string;
  user: UserResponse;
  requiresApproval: boolean;
  license?: LicenseStatus;
}

export interface AmbulanceRegistrationDTO extends CreateUserDTO {
  licenseKey: string;
}

export interface LicenseStatus {
  licenseId: string;
  ambulanceName: string;
  status: string;
  uploadQuota: number;
  uploadsUsed: number;
  uploadsRemaining: number;
  quotaUsagePercent: number;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  status: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  async register(userData: CreateUserDTO): Promise<RegistrationResponse> {
    // Check if email already exists
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Validate email format
    if (!this.isValidEmail(userData.email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength
    if (!this.isValidPassword(userData.password)) {
      throw new Error(
        'Password must be at least 8 characters long and contain uppercase, lowercase, and numbers'
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);

    // Create user (status defaults to 'pending' from database)
    const user = await userRepository.create({
      ...userData,
      passwordHash,
    });

    // Return registration response with approval message
    return {
      message:
        'Registration successful! Your account is pending approval by an administrator. You will be able to log in once your account has been approved.',
      user: toUserResponse(user),
      requiresApproval: true,
    };
  }

  /**
   * Login user
   */
  async login(credentials: LoginDTO): Promise<AuthToken> {
    // Find user by email
    const user = await userRepository.findByEmail(credentials.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Validate user status
    this.validateUserStatus(user);

    // Check if ambulance user without license (revoked scenario)
    if (user.ambulanceRole && !user.licenseId) {
      throw new Error('LICENSE_REVOKED');
    }

    // Validate license if user has one (but skip for super_admin)
    let licenseStatus: LicenseStatus | undefined;
    if (user.licenseId && user.role !== 'super_admin') {
      const license = await licenseService.getLicenseById(user.licenseId);
      if (!license) {
        throw new Error('LICENSE_NOT_FOUND');
      }

      // Check license status
      if (license.status === 'revoked') {
        throw new Error('LICENSE_REVOKED');
      }

      if (license.status !== 'active') {
        throw new Error('LICENSE_INACTIVE');
      }

      licenseStatus = this.buildLicenseStatus(license);
    }

    // Update last login time
    await userRepository.updateLastLogin(user.id);

    // Generate token
    const token = this.generateToken(user);

    return {
      token,
      user: toUserResponse(user),
      license: licenseStatus,
    };
  }

  /**
   * Validate user status before allowing login
   */
  private validateUserStatus(user: User): void {
    switch (user.status) {
      case 'pending':
        throw new Error('ACCOUNT_PENDING');
      case 'rejected':
        const rejectionMessage = user.rejectionReason
          ? `ACCOUNT_REJECTED: ${user.rejectionReason}`
          : 'ACCOUNT_REJECTED';
        throw new Error(rejectionMessage);
      case 'deactivated':
        throw new Error('ACCOUNT_DEACTIVATED');
      case 'approved':
        // User is approved, allow login
        break;
      default:
        throw new Error('INVALID_ACCOUNT_STATUS');
    }
  }

  /**
   * Verify JWT token and return user
   */
  async verifyToken(token: string): Promise<User> {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;

      const user = await userRepository.findById(payload.userId);
      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Generate JWT token for user
   */
  private generateToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  private isValidPassword(password: string): boolean {
    // At least 8 characters
    return password.length >= 8;
  }

  /**
   * Hash password (utility method)
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Compare password with hash (utility method)
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Register ambulance user with license key
   */
  async registerAmbulanceUser(userData: AmbulanceRegistrationDTO): Promise<RegistrationResponse> {
    // Validate license key
    const licenseValidation = await licenseService.validateLicense(userData.licenseKey);
    if (!licenseValidation.isValid) {
      throw new Error(licenseValidation.error || 'Invalid license key');
    }

    const license = licenseValidation.license!;

    // Check if email already exists
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Validate email format
    if (!this.isValidEmail(userData.email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength
    if (!this.isValidPassword(userData.password)) {
      throw new Error(
        'Password must be at least 8 characters long and contain uppercase, lowercase, and numbers'
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);

    // Create user with license association
    const user = await userRepository.create({
      ...userData,
      passwordHash,
      licenseId: license.id,
      ambulanceRole: userData.ambulanceRole || 'operator',
      status: 'approved', // Ambulance users are auto-approved
    });

    // Build license status
    const licenseStatus = this.buildLicenseStatus(license);

    return {
      message: 'Registration successful! You can now log in with your credentials.',
      user: toUserResponse(user),
      requiresApproval: false,
      license: licenseStatus,
    };
  }

  /**
   * Get license status for a user
   */
  async getLicenseStatus(userId: string): Promise<LicenseStatus | null> {
    const user = await userRepository.findById(userId);
    if (!user || !user.licenseId) {
      return null;
    }

    const license = await licenseService.getLicenseById(user.licenseId);
    if (!license) {
      return null;
    }

    return this.buildLicenseStatus(license);
  }

  /**
   * Build license status object from license
   */
  private buildLicenseStatus(license: AmbulanceLicense): LicenseStatus {
    const uploadsRemaining = license.uploadQuota - license.uploadsUsed;
    const quotaUsagePercent = license.uploadQuota > 0 
      ? Math.round((license.uploadsUsed / license.uploadQuota) * 100 * 100) / 100
      : 0;

    return {
      licenseId: license.id,
      ambulanceName: license.ambulanceName,
      status: license.status,
      uploadQuota: license.uploadQuota,
      uploadsUsed: license.uploadsUsed,
      uploadsRemaining,
      quotaUsagePercent,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: { fullName?: string; email?: string }
  ): Promise<User> {
    // Get current user
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if email is being changed and if it's already in use
    if (updates.email && updates.email !== user.email) {
      const existingUser = await userRepository.findByEmail(updates.email);
      if (existingUser) {
        throw new Error('Email already in use');
      }

      // Validate email format
      if (!this.isValidEmail(updates.email)) {
        throw new Error('Invalid email format');
      }
    }

    // Update user
    const updatedUser = await userRepository.update(userId, updates);
    if (!updatedUser) {
      throw new Error('Failed to update user');
    }

    return updatedUser;
  }

  /**
   * Change user password (requires current password)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Get user
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password strength
    if (!this.isValidPassword(newPassword)) {
      throw new Error(
        'Password must be at least 8 characters long and contain uppercase, lowercase, and numbers'
      );
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new Error('New password must be different from current password');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await userRepository.updatePassword(userId, passwordHash);
  }

  /**
   * Reset user password (admin only - no current password required)
   */
  async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    // Get user
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Validate new password strength
    if (!this.isValidPassword(newPassword)) {
      throw new Error(
        'Password must be at least 8 characters long and contain uppercase, lowercase, and numbers'
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await userRepository.updatePassword(userId, passwordHash);
  }
}

// Export singleton instance
export const authService = new AuthService();
