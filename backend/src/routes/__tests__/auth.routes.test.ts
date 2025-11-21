import request from 'supertest';
import express from 'express';
import authRoutes from '../auth.routes';
import { authService } from '../../services/AuthService';

jest.mock('../../services/AuthService');
jest.mock('../../middleware/auth', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    req.user = {
      id: 'user-123',
      email: 'test@example.com',
      fullName: 'Test User',
      professionalCredentials: 'MD',
      isVerified: true,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
    next();
  },
}));

const mockedAuthService = authService as jest.Mocked<typeof authService>;

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    const validRegistration = {
      email: 'test@example.com',
      password: 'Password123',
      fullName: 'Test User',
      professionalCredentials: 'MD',
    };

    it('should register a new user successfully', async () => {
      const mockResponse = {
        token: 'jwt_token',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User',
          professionalCredentials: 'MD',
          isVerified: false,
          createdAt: new Date(),
          lastLoginAt: null,
        },
      };

      mockedAuthService.register.mockResolvedValue(mockResponse);

      const response = await request(app).post('/api/auth/register').send(validRegistration);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBe('jwt_token');
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validRegistration,
          email: 'invalid-email',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 409 for existing email', async () => {
      mockedAuthService.register.mockRejectedValue(new Error('Email already registered'));

      const response = await request(app).post('/api/auth/register').send(validRegistration);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('EMAIL_EXISTS');
    });

    it('should return 400 for weak password', async () => {
      mockedAuthService.register.mockRejectedValue(
        new Error('Password must be at least 8 characters long')
      );

      const response = await request(app).post('/api/auth/register').send(validRegistration);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('WEAK_PASSWORD');
    });
  });

  describe('POST /api/auth/login', () => {
    const validLogin = {
      email: 'test@example.com',
      password: 'Password123',
    };

    it('should login user successfully', async () => {
      const mockResponse = {
        token: 'jwt_token',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User',
          professionalCredentials: 'MD',
          isVerified: true,
          createdAt: new Date(),
          lastLoginAt: new Date(),
        },
      };

      mockedAuthService.login.mockResolvedValue(mockResponse);

      const response = await request(app).post('/api/auth/login').send(validLogin);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBe('jwt_token');
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 for invalid credentials', async () => {
      mockedAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      const response = await request(app).post('/api/auth/login').send(validLogin);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/auth/verify', () => {
    it('should verify token and return user', async () => {
      const response = await request(app).get('/api/auth/verify');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.fullName).toBe('Test User');
    });
  });
});
