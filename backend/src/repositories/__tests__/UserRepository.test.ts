import { UserRepository } from '../UserRepository';
import { query } from '../../config/database';

// Mock the database module
jest.mock('../../config/database');

const mockedQuery = query as jest.MockedFunction<typeof query>;

describe('UserRepository', () => {
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = new UserRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        fullName: 'Test User',
        professionalCredentials: 'MD',
      };

      const mockResult = {
        rows: [
          {
            id: 'user-123',
            email: 'test@example.com',
            password_hash: 'hashed_password',
            full_name: 'Test User',
            professional_credentials: 'MD',
            is_verified: false,
            created_at: new Date(),
            last_login_at: null,
          },
        ],
        rowCount: 1,
      };

      mockedQuery.mockResolvedValue(mockResult as any);

      const user = await userRepository.create(userData);

      expect(user.email).toBe('test@example.com');
      expect(user.fullName).toBe('Test User');
      expect(user.professionalCredentials).toBe('MD');
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        ['test@example.com', 'hashed_password', 'Test User', 'MD']
      );
    });

    it('should create user without professional credentials', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        fullName: 'Test User',
      };

      const mockResult = {
        rows: [
          {
            id: 'user-123',
            email: 'test@example.com',
            password_hash: 'hashed_password',
            full_name: 'Test User',
            professional_credentials: null,
            is_verified: false,
            created_at: new Date(),
            last_login_at: null,
          },
        ],
        rowCount: 1,
      };

      mockedQuery.mockResolvedValue(mockResult as any);

      const user = await userRepository.create(userData);

      expect(user.professionalCredentials).toBeNull();
      expect(mockedQuery).toHaveBeenCalledWith(expect.any(String), [
        'test@example.com',
        'hashed_password',
        'Test User',
        null,
      ]);
    });
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      const mockResult = {
        rows: [
          {
            id: 'user-123',
            email: 'test@example.com',
            password_hash: 'hashed_password',
            full_name: 'Test User',
            professional_credentials: 'MD',
            is_verified: true,
            created_at: new Date(),
            last_login_at: new Date(),
          },
        ],
        rowCount: 1,
      };

      mockedQuery.mockResolvedValue(mockResult as any);

      const user = await userRepository.findById('user-123');

      expect(user).not.toBeNull();
      expect(user?.id).toBe('user-123');
      expect(user?.email).toBe('test@example.com');
      expect(mockedQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', ['user-123']);
    });

    it('should return null if user not found', async () => {
      mockedQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const user = await userRepository.findById('nonexistent');

      expect(user).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockResult = {
        rows: [
          {
            id: 'user-123',
            email: 'test@example.com',
            password_hash: 'hashed_password',
            full_name: 'Test User',
            professional_credentials: 'MD',
            is_verified: true,
            created_at: new Date(),
            last_login_at: new Date(),
          },
        ],
        rowCount: 1,
      };

      mockedQuery.mockResolvedValue(mockResult as any);

      const user = await userRepository.findByEmail('test@example.com');

      expect(user).not.toBeNull();
      expect(user?.email).toBe('test@example.com');
      expect(mockedQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE email = $1', [
        'test@example.com',
      ]);
    });

    it('should return null if user not found', async () => {
      mockedQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const user = await userRepository.findByEmail('nonexistent@example.com');

      expect(user).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const updates = {
        fullName: 'Updated Name',
        professionalCredentials: 'MD, PhD',
      };

      const mockResult = {
        rows: [
          {
            id: 'user-123',
            email: 'test@example.com',
            password_hash: 'hashed_password',
            full_name: 'Updated Name',
            professional_credentials: 'MD, PhD',
            is_verified: false,
            created_at: new Date(),
            last_login_at: null,
          },
        ],
        rowCount: 1,
      };

      mockedQuery.mockResolvedValue(mockResult as any);

      const user = await userRepository.update('user-123', updates);

      expect(user).not.toBeNull();
      expect(user?.fullName).toBe('Updated Name');
      expect(user?.professionalCredentials).toBe('MD, PhD');
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET'),
        expect.arrayContaining(['Updated Name', 'MD, PhD', 'user-123'])
      );
    });

    it('should return existing user if no updates provided', async () => {
      const mockResult = {
        rows: [
          {
            id: 'user-123',
            email: 'test@example.com',
            password_hash: 'hashed_password',
            full_name: 'Test User',
            professional_credentials: 'MD',
            is_verified: false,
            created_at: new Date(),
            last_login_at: null,
          },
        ],
        rowCount: 1,
      };

      mockedQuery.mockResolvedValue(mockResult as any);

      const user = await userRepository.update('user-123', {});

      expect(user).not.toBeNull();
      expect(mockedQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', ['user-123']);
    });

    it('should return null if user not found', async () => {
      mockedQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const user = await userRepository.update('nonexistent', { fullName: 'New Name' });

      expect(user).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete user and return true', async () => {
      mockedQuery.mockResolvedValue({ rows: [], rowCount: 1 } as any);

      const result = await userRepository.delete('user-123');

      expect(result).toBe(true);
      expect(mockedQuery).toHaveBeenCalledWith('DELETE FROM users WHERE id = $1', ['user-123']);
    });

    it('should return false if user not found', async () => {
      mockedQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const result = await userRepository.delete('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('emailExists', () => {
    it('should return true if email exists', async () => {
      mockedQuery.mockResolvedValue({ rows: [{ exists: true }], rowCount: 1 } as any);

      const exists = await userRepository.emailExists('test@example.com');

      expect(exists).toBe(true);
      expect(mockedQuery).toHaveBeenCalledWith('SELECT 1 FROM users WHERE email = $1', [
        'test@example.com',
      ]);
    });

    it('should return false if email does not exist', async () => {
      mockedQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const exists = await userRepository.emailExists('nonexistent@example.com');

      expect(exists).toBe(false);
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      mockedQuery.mockResolvedValue({ rows: [], rowCount: 1 } as any);

      await userRepository.updateLastLogin('user-123');

      expect(mockedQuery).toHaveBeenCalledWith(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
        ['user-123']
      );
    });
  });

  describe('findAll', () => {
    it('should return all users with pagination', async () => {
      const mockResult = {
        rows: [
          {
            id: 'user-1',
            email: 'user1@example.com',
            password_hash: 'hash1',
            full_name: 'User 1',
            professional_credentials: null,
            is_verified: false,
            created_at: new Date(),
            last_login_at: null,
          },
          {
            id: 'user-2',
            email: 'user2@example.com',
            password_hash: 'hash2',
            full_name: 'User 2',
            professional_credentials: 'MD',
            is_verified: true,
            created_at: new Date(),
            last_login_at: new Date(),
          },
        ],
        rowCount: 2,
      };

      mockedQuery.mockResolvedValue(mockResult as any);

      const users = await userRepository.findAll(10, 0);

      expect(users).toHaveLength(2);
      expect(users[0].email).toBe('user1@example.com');
      expect(users[1].email).toBe('user2@example.com');
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users ORDER BY created_at DESC LIMIT'),
        [10, 0]
      );
    });
  });

  describe('count', () => {
    it('should return total user count', async () => {
      mockedQuery.mockResolvedValue({ rows: [{ count: '42' }], rowCount: 1 } as any);

      const count = await userRepository.count();

      expect(count).toBe(42);
      expect(mockedQuery).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM users');
    });
  });
});
