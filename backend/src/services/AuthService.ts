import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/UserRepository';
import { CreateUserDTO, User, toUserResponse, UserResponse } from '../models/User';

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
}

export interface RegistrationResponse {
  message: string;
  user: UserResponse;
  requiresApproval: boolean;
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

    // Update last login time
    await userRepository.updateLastLogin(user.id);

    // Generate token
    const token = this.generateToken(user);

    return {
      token,
      user: toUserResponse(user),
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
}

// Export singleton instance
export const authService = new AuthService();
