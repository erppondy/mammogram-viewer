import { AdminService } from '../AdminService';
import { query } from '../../config/database';

jest.mock('../../config/database');

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('AdminService', () => {
  let adminService: AdminService;

  beforeEach(() => {
    adminService = new AdminService();
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    const mockUsers = [
      {
        id: 'user-1',
        email: 'user1@example.com',
        password_hash: 'hash1',
        full_name: 'User One',
        professional_credentials: 'MD',
        is_verified: true,
        role: 'user',
        status: 'approved',
        approved_by: 'admin-1',
        approved_at: new Date('2024-01-01'),
        rejection_reason: null,
        created_at: new Date('2024-01-01'),
        last_login_at: new Date('2024-01-02'),
      },
      {
        id: 'user-2',
        email: 'user2@example.com',
        password_hash: 'hash2',
        full_name: 'User Two',
        professional_credentials: null,
        is_verified: false,
        role: 'user',
        status: 'pending',
        approved_by: null,
        approved_at: null,
        rejection_reason: null,
        created_at: new Date('2024-01-02'),
        last_login_at: null,
      },
    ];

    it('should return all users without filters', async () => {
      mockQuery.mockResolvedValue({ rows: mockUsers, rowCount: 2 } as any);

      const result = await adminService.getAllUsers();

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE 1=1 ORDER BY created_at DESC',
        []
      );
      expect(result).toHaveLength(2);
      expect(result[0].email).toBe('user1@example.com');
      expect(result[0]).not.toHaveProperty('passwordHash');
    });

    it('should filter users by status', async () => {
      mockQuery.mockResolvedValue({ rows: [mockUsers[1]], rowCount: 1 } as any);

      const result = await adminService.getAllUsers({ status: 'pending' });

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE 1=1 AND status = $1 ORDER BY created_at DESC',
        ['pending']
      );
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('pending');
    });

    it('should filter users by role', async () => {
      const superAdminUser = { ...mockUsers[0], role: 'super_admin' };
      mockQuery.mockResolvedValue({ rows: [superAdminUser], rowCount: 1 } as any);

      const result = await adminService.getAllUsers({ role: 'super_admin' });

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE 1=1 AND role = $1 ORDER BY created_at DESC',
        ['super_admin']
      );
      expect(result).toHaveLength(1);
    });

    it('should filter users by search term (email)', async () => {
      mockQuery.mockResolvedValue({ rows: [mockUsers[0]], rowCount: 1 } as any);

      const result = await adminService.getAllUsers({ search: 'user1' });

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE 1=1 AND (email ILIKE $1 OR full_name ILIKE $1) ORDER BY created_at DESC',
        ['%user1%']
      );
      expect(result).toHaveLength(1);
    });

    it('should filter users by search term (full name)', async () => {
      mockQuery.mockResolvedValue({ rows: [mockUsers[0]], rowCount: 1 } as any);

      const result = await adminService.getAllUsers({ search: 'User One' });

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE 1=1 AND (email ILIKE $1 OR full_name ILIKE $1) ORDER BY created_at DESC',
        ['%User One%']
      );
      expect(result).toHaveLength(1);
    });

    it('should apply multiple filters', async () => {
      mockQuery.mockResolvedValue({ rows: [mockUsers[1]], rowCount: 1 } as any);

      const result = await adminService.getAllUsers({
        status: 'pending',
        role: 'user',
        search: 'user2',
      });

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE 1=1 AND status = $1 AND role = $2 AND (email ILIKE $3 OR full_name ILIKE $3) ORDER BY created_at DESC',
        ['pending', 'user', '%user2%']
      );
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no users found', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const result = await adminService.getAllUsers({ status: 'rejected' });

      expect(result).toHaveLength(0);
    });

    it('should not include password hash in response', async () => {
      mockQuery.mockResolvedValue({ rows: mockUsers, rowCount: 2 } as any);

      const result = await adminService.getAllUsers();

      result.forEach((user) => {
        expect(user).not.toHaveProperty('passwordHash');
        expect(user).not.toHaveProperty('password_hash');
      });
    });
  });

  describe('getPendingUsers', () => {
    const mockPendingUsers = [
      {
        id: 'user-1',
        email: 'pending1@example.com',
        password_hash: 'hash1',
        full_name: 'Pending One',
        professional_credentials: 'MD',
        is_verified: false,
        role: 'user',
        status: 'pending',
        approved_by: null,
        approved_at: null,
        rejection_reason: null,
        created_at: new Date('2024-01-01'),
        last_login_at: null,
      },
      {
        id: 'user-2',
        email: 'pending2@example.com',
        password_hash: 'hash2',
        full_name: 'Pending Two',
        professional_credentials: null,
        is_verified: false,
        role: 'user',
        status: 'pending',
        approved_by: null,
        approved_at: null,
        rejection_reason: null,
        created_at: new Date('2024-01-02'),
        last_login_at: null,
      },
    ];

    it('should return all pending users', async () => {
      mockQuery.mockResolvedValue({ rows: mockPendingUsers, rowCount: 2 } as any);

      const result = await adminService.getPendingUsers();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE status = $1'),
        ['pending']
      );
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('pending');
      expect(result[1].status).toBe('pending');
    });

    it('should order pending users by creation date (oldest first)', async () => {
      mockQuery.mockResolvedValue({ rows: mockPendingUsers, rowCount: 2 } as any);

      await adminService.getPendingUsers();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at ASC'),
        ['pending']
      );
    });

    it('should return empty array when no pending users', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const result = await adminService.getPendingUsers();

      expect(result).toHaveLength(0);
    });

    it('should not include password hash in response', async () => {
      mockQuery.mockResolvedValue({ rows: mockPendingUsers, rowCount: 2 } as any);

      const result = await adminService.getPendingUsers();

      result.forEach((user) => {
        expect(user).not.toHaveProperty('passwordHash');
        expect(user).not.toHaveProperty('password_hash');
      });
    });
  });

  describe('getSystemStats', () => {
    it('should return system statistics', async () => {
      const mockStats = {
        total_users: '10',
        pending_users: '3',
        approved_users: '5',
        rejected_users: '1',
        deactivated_users: '1',
      };

      mockQuery.mockResolvedValue({ rows: [mockStats], rowCount: 1 } as any);

      const result = await adminService.getSystemStats();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*) as total_users')
      );
      expect(result).toEqual({
        totalUsers: 10,
        pendingUsers: 3,
        approvedUsers: 5,
        rejectedUsers: 1,
        deactivatedUsers: 1,
      });
    });

    it('should return zero counts when no users exist', async () => {
      const mockStats = {
        total_users: '0',
        pending_users: '0',
        approved_users: '0',
        rejected_users: '0',
        deactivated_users: '0',
      };

      mockQuery.mockResolvedValue({ rows: [mockStats], rowCount: 1 } as any);

      const result = await adminService.getSystemStats();

      expect(result).toEqual({
        totalUsers: 0,
        pendingUsers: 0,
        approvedUsers: 0,
        rejectedUsers: 0,
        deactivatedUsers: 0,
      });
    });

    it('should use COUNT FILTER for status-specific counts', async () => {
      const mockStats = {
        total_users: '5',
        pending_users: '2',
        approved_users: '2',
        rejected_users: '1',
        deactivated_users: '0',
      };

      mockQuery.mockResolvedValue({ rows: [mockStats], rowCount: 1 } as any);

      await adminService.getSystemStats();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("COUNT(*) FILTER (WHERE status = 'pending')")
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("COUNT(*) FILTER (WHERE status = 'approved')")
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("COUNT(*) FILTER (WHERE status = 'rejected')")
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("COUNT(*) FILTER (WHERE status = 'deactivated')")
      );
    });
  });

  describe('approveUser', () => {
    const adminId = 'admin-123';
    const userId = 'user-456';

    const mockPendingUser = {
      id: userId,
      email: 'pending@example.com',
      password_hash: 'hash',
      full_name: 'Pending User',
      professional_credentials: 'MD',
      is_verified: false,
      role: 'user',
      status: 'pending',
      approved_by: null,
      approved_at: null,
      rejection_reason: null,
      created_at: new Date('2024-01-01'),
      last_login_at: null,
    };

    it('should approve a pending user', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockPendingUser], rowCount: 1 } as any) // SELECT user
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // UPDATE user

      await adminService.approveUser(userId, adminId);

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery).toHaveBeenNthCalledWith(1, 'SELECT * FROM users WHERE id = $1', [userId]);
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('UPDATE users'),
        ['approved', adminId, userId]
      );
    });

    it('should approve a rejected user', async () => {
      const rejectedUser = { ...mockPendingUser, status: 'rejected', rejection_reason: 'Test reason' };
      mockQuery
        .mockResolvedValueOnce({ rows: [rejectedUser], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      await adminService.approveUser(userId, adminId);

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('UPDATE users'),
        ['approved', adminId, userId]
      );
    });

    it('should set approved_by and approved_at fields', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockPendingUser], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      await adminService.approveUser(userId, adminId);

      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('approved_by = $2'),
        ['approved', adminId, userId]
      );
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('approved_at = NOW()'),
        ['approved', adminId, userId]
      );
    });

    it('should clear rejection_reason when approving', async () => {
      const rejectedUser = { ...mockPendingUser, status: 'rejected', rejection_reason: 'Previous rejection' };
      mockQuery
        .mockResolvedValueOnce({ rows: [rejectedUser], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      await adminService.approveUser(userId, adminId);

      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('rejection_reason = NULL'),
        ['approved', adminId, userId]
      );
    });

    it('should throw USER_NOT_FOUND when user does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      await expect(adminService.approveUser(userId, adminId)).rejects.toThrow('USER_NOT_FOUND');

      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should throw INVALID_STATUS_TRANSITION when user is already approved', async () => {
      const approvedUser = { ...mockPendingUser, status: 'approved' };
      mockQuery.mockResolvedValueOnce({ rows: [approvedUser], rowCount: 1 } as any);

      await expect(adminService.approveUser(userId, adminId)).rejects.toThrow('INVALID_STATUS_TRANSITION');

      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should throw INVALID_STATUS_TRANSITION when user is deactivated', async () => {
      const deactivatedUser = { ...mockPendingUser, status: 'deactivated' };
      mockQuery.mockResolvedValueOnce({ rows: [deactivatedUser], rowCount: 1 } as any);

      await expect(adminService.approveUser(userId, adminId)).rejects.toThrow('INVALID_STATUS_TRANSITION');

      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should throw CANNOT_MODIFY_SELF when admin tries to approve themselves', async () => {
      const selfUser = { ...mockPendingUser, id: adminId };
      mockQuery.mockResolvedValueOnce({ rows: [selfUser], rowCount: 1 } as any);

      await expect(adminService.approveUser(adminId, adminId)).rejects.toThrow('CANNOT_MODIFY_SELF');

      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('rejectUser', () => {
    const adminId = 'admin-123';
    const userId = 'user-456';

    const mockPendingUser = {
      id: userId,
      email: 'pending@example.com',
      password_hash: 'hash',
      full_name: 'Pending User',
      professional_credentials: 'MD',
      is_verified: false,
      role: 'user',
      status: 'pending',
      approved_by: null,
      approved_at: null,
      rejection_reason: null,
      created_at: new Date('2024-01-01'),
      last_login_at: null,
    };

    it('should reject a pending user with reason', async () => {
      const reason = 'Invalid credentials';
      mockQuery
        .mockResolvedValueOnce({ rows: [mockPendingUser], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      await adminService.rejectUser(userId, adminId, reason);

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery).toHaveBeenNthCalledWith(1, 'SELECT * FROM users WHERE id = $1', [userId]);
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('UPDATE users'),
        ['rejected', adminId, reason, userId]
      );
    });

    it('should reject a pending user without reason', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockPendingUser], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      await adminService.rejectUser(userId, adminId);

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('UPDATE users'),
        ['rejected', adminId, null, userId]
      );
    });

    it('should reject an approved user', async () => {
      const approvedUser = { ...mockPendingUser, status: 'approved' };
      const reason = 'Violated terms of service';
      mockQuery
        .mockResolvedValueOnce({ rows: [approvedUser], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      await adminService.rejectUser(userId, adminId, reason);

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('UPDATE users'),
        ['rejected', adminId, reason, userId]
      );
    });

    it('should set approved_by and approved_at fields when rejecting', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockPendingUser], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      await adminService.rejectUser(userId, adminId, 'Test reason');

      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('approved_by = $2'),
        ['rejected', adminId, 'Test reason', userId]
      );
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('approved_at = NOW()'),
        ['rejected', adminId, 'Test reason', userId]
      );
    });

    it('should set rejection_reason field', async () => {
      const reason = 'Incomplete information';
      mockQuery
        .mockResolvedValueOnce({ rows: [mockPendingUser], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      await adminService.rejectUser(userId, adminId, reason);

      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('rejection_reason = $3'),
        ['rejected', adminId, reason, userId]
      );
    });

    it('should throw USER_NOT_FOUND when user does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      await expect(adminService.rejectUser(userId, adminId, 'Test')).rejects.toThrow('USER_NOT_FOUND');

      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should throw INVALID_STATUS_TRANSITION when user is already rejected', async () => {
      const rejectedUser = { ...mockPendingUser, status: 'rejected' };
      mockQuery.mockResolvedValueOnce({ rows: [rejectedUser], rowCount: 1 } as any);

      await expect(adminService.rejectUser(userId, adminId, 'Test')).rejects.toThrow('INVALID_STATUS_TRANSITION');

      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should throw INVALID_STATUS_TRANSITION when user is deactivated', async () => {
      const deactivatedUser = { ...mockPendingUser, status: 'deactivated' };
      mockQuery.mockResolvedValueOnce({ rows: [deactivatedUser], rowCount: 1 } as any);

      await expect(adminService.rejectUser(userId, adminId, 'Test')).rejects.toThrow('INVALID_STATUS_TRANSITION');

      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should throw CANNOT_MODIFY_SELF when admin tries to reject themselves', async () => {
      const selfUser = { ...mockPendingUser, id: adminId };
      mockQuery.mockResolvedValueOnce({ rows: [selfUser], rowCount: 1 } as any);

      await expect(adminService.rejectUser(adminId, adminId, 'Test')).rejects.toThrow('CANNOT_MODIFY_SELF');

      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should handle empty string reason as null', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockPendingUser], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      await adminService.rejectUser(userId, adminId, '');

      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('UPDATE users'),
        ['rejected', adminId, null, userId]
      );
    });
  });

  describe('deactivateUser', () => {
    const adminId = 'admin-123';
    const userId = 'user-456';

    const mockApprovedUser = {
      id: userId,
      email: 'approved@example.com',
      password_hash: 'hash',
      full_name: 'Approved User',
      professional_credentials: 'MD',
      is_verified: true,
      role: 'user',
      status: 'approved',
      approved_by: 'admin-999',
      approved_at: new Date('2024-01-01'),
      rejection_reason: null,
      created_at: new Date('2024-01-01'),
      last_login_at: new Date('2024-01-02'),
    };

    it('should deactivate an approved user', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockApprovedUser], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      await adminService.deactivateUser(userId, adminId);

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery).toHaveBeenNthCalledWith(1, 'SELECT * FROM users WHERE id = $1', [userId]);
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('UPDATE users'),
        ['deactivated', userId]
      );
    });

    it('should throw USER_NOT_FOUND when user does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      await expect(adminService.deactivateUser(userId, adminId)).rejects.toThrow('USER_NOT_FOUND');

      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should throw CANNOT_MODIFY_SELF when admin tries to deactivate themselves', async () => {
      const selfUser = { ...mockApprovedUser, id: adminId };
      mockQuery.mockResolvedValueOnce({ rows: [selfUser], rowCount: 1 } as any);

      await expect(adminService.deactivateUser(adminId, adminId)).rejects.toThrow('CANNOT_MODIFY_SELF');

      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should throw INVALID_STATUS_TRANSITION when user is pending', async () => {
      const pendingUser = { ...mockApprovedUser, status: 'pending' };
      mockQuery.mockResolvedValueOnce({ rows: [pendingUser], rowCount: 1 } as any);

      await expect(adminService.deactivateUser(userId, adminId)).rejects.toThrow('INVALID_STATUS_TRANSITION');

      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should throw INVALID_STATUS_TRANSITION when user is rejected', async () => {
      const rejectedUser = { ...mockApprovedUser, status: 'rejected' };
      mockQuery.mockResolvedValueOnce({ rows: [rejectedUser], rowCount: 1 } as any);

      await expect(adminService.deactivateUser(userId, adminId)).rejects.toThrow('INVALID_STATUS_TRANSITION');

      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should throw INVALID_STATUS_TRANSITION when user is already deactivated', async () => {
      const deactivatedUser = { ...mockApprovedUser, status: 'deactivated' };
      mockQuery.mockResolvedValueOnce({ rows: [deactivatedUser], rowCount: 1 } as any);

      await expect(adminService.deactivateUser(userId, adminId)).rejects.toThrow('INVALID_STATUS_TRANSITION');

      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('activateUser', () => {
    const adminId = 'admin-123';
    const userId = 'user-456';

    const mockDeactivatedUser = {
      id: userId,
      email: 'deactivated@example.com',
      password_hash: 'hash',
      full_name: 'Deactivated User',
      professional_credentials: 'MD',
      is_verified: true,
      role: 'user',
      status: 'deactivated',
      approved_by: 'admin-999',
      approved_at: new Date('2024-01-01'),
      rejection_reason: null,
      created_at: new Date('2024-01-01'),
      last_login_at: new Date('2024-01-02'),
    };

    it('should activate a deactivated user', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockDeactivatedUser], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      await adminService.activateUser(userId, adminId);

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery).toHaveBeenNthCalledWith(1, 'SELECT * FROM users WHERE id = $1', [userId]);
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('UPDATE users'),
        ['approved', adminId, userId]
      );
    });

    it('should set approved_by and approved_at when activating', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockDeactivatedUser], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      await adminService.activateUser(userId, adminId);

      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('approved_by = $2'),
        ['approved', adminId, userId]
      );
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('approved_at = NOW()'),
        ['approved', adminId, userId]
      );
    });

    it('should throw USER_NOT_FOUND when user does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      await expect(adminService.activateUser(userId, adminId)).rejects.toThrow('USER_NOT_FOUND');

      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should throw CANNOT_MODIFY_SELF when admin tries to activate themselves', async () => {
      const selfUser = { ...mockDeactivatedUser, id: adminId };
      mockQuery.mockResolvedValueOnce({ rows: [selfUser], rowCount: 1 } as any);

      await expect(adminService.activateUser(adminId, adminId)).rejects.toThrow('CANNOT_MODIFY_SELF');

      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should throw INVALID_STATUS_TRANSITION when user is pending', async () => {
      const pendingUser = { ...mockDeactivatedUser, status: 'pending' };
      mockQuery.mockResolvedValueOnce({ rows: [pendingUser], rowCount: 1 } as any);

      await expect(adminService.activateUser(userId, adminId)).rejects.toThrow('INVALID_STATUS_TRANSITION');

      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should throw INVALID_STATUS_TRANSITION when user is already approved', async () => {
      const approvedUser = { ...mockDeactivatedUser, status: 'approved' };
      mockQuery.mockResolvedValueOnce({ rows: [approvedUser], rowCount: 1 } as any);

      await expect(adminService.activateUser(userId, adminId)).rejects.toThrow('INVALID_STATUS_TRANSITION');

      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should throw INVALID_STATUS_TRANSITION when user is rejected', async () => {
      const rejectedUser = { ...mockDeactivatedUser, status: 'rejected' };
      mockQuery.mockResolvedValueOnce({ rows: [rejectedUser], rowCount: 1 } as any);

      await expect(adminService.activateUser(userId, adminId)).rejects.toThrow('INVALID_STATUS_TRANSITION');

      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteUser', () => {
    const adminId = 'admin-123';
    const userId = 'user-456';

    const mockUser = {
      id: userId,
      email: 'user@example.com',
      password_hash: 'hash',
      full_name: 'Test User',
      professional_credentials: 'MD',
      is_verified: true,
      role: 'user',
      status: 'approved',
      approved_by: 'admin-999',
      approved_at: new Date('2024-01-01'),
      rejection_reason: null,
      created_at: new Date('2024-01-01'),
      last_login_at: new Date('2024-01-02'),
    };

    it('should delete a user', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockUser], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      await adminService.deleteUser(userId, adminId);

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery).toHaveBeenNthCalledWith(1, 'SELECT * FROM users WHERE id = $1', [userId]);
      expect(mockQuery).toHaveBeenNthCalledWith(2, 'DELETE FROM users WHERE id = $1', [userId]);
    });

    it('should delete a user with any status', async () => {
      const statuses: Array<'pending' | 'approved' | 'rejected' | 'deactivated'> = [
        'pending',
        'approved',
        'rejected',
        'deactivated',
      ];

      for (const status of statuses) {
        jest.clearAllMocks();
        const userWithStatus = { ...mockUser, status };
        mockQuery
          .mockResolvedValueOnce({ rows: [userWithStatus], rowCount: 1 } as any)
          .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

        await adminService.deleteUser(userId, adminId);

        expect(mockQuery).toHaveBeenCalledTimes(2);
        expect(mockQuery).toHaveBeenNthCalledWith(2, 'DELETE FROM users WHERE id = $1', [userId]);
      }
    });

    it('should throw USER_NOT_FOUND when user does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      await expect(adminService.deleteUser(userId, adminId)).rejects.toThrow('USER_NOT_FOUND');

      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should throw CANNOT_MODIFY_SELF when admin tries to delete themselves', async () => {
      const selfUser = { ...mockUser, id: adminId };
      mockQuery.mockResolvedValueOnce({ rows: [selfUser], rowCount: 1 } as any);

      await expect(adminService.deleteUser(adminId, adminId)).rejects.toThrow('CANNOT_MODIFY_SELF');

      expect(mockQuery).toHaveBeenCalledTimes(1);
    });
  });
});
