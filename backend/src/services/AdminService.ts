import { query } from '../config/database';
import { User, UserResponse, UserRole, UserStatus, toUserResponse } from '../models/User';

export interface UserFilters {
  status?: UserStatus;
  role?: UserRole;
  search?: string;
}

export interface SystemStats {
  totalUsers: number;
  pendingUsers: number;
  approvedUsers: number;
  rejectedUsers: number;
  deactivatedUsers: number;
}

export class AdminService {
  /**
   * Get all users with optional filtering
   */
  async getAllUsers(filters?: UserFilters): Promise<UserResponse[]> {
    let sql = 'SELECT * FROM users WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    // Apply status filter
    if (filters?.status) {
      sql += ` AND status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    // Apply role filter
    if (filters?.role) {
      sql += ` AND role = $${paramCount}`;
      params.push(filters.role);
      paramCount++;
    }

    // Apply search filter (email or full name)
    if (filters?.search) {
      sql += ` AND (email ILIKE $${paramCount} OR full_name ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    return result.rows.map((row) => toUserResponse(this.mapRowToUser(row)));
  }

  /**
   * Get all pending users
   */
  async getPendingUsers(): Promise<UserResponse[]> {
    const result = await query(
      `SELECT * FROM users 
       WHERE status = $1 
       ORDER BY created_at ASC`,
      ['pending']
    );

    return result.rows.map((row) => toUserResponse(this.mapRowToUser(row)));
  }

  /**
   * Get system statistics
   */
  async getSystemStats(): Promise<SystemStats> {
    const result = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_users,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_users,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_users,
        COUNT(*) FILTER (WHERE status = 'deactivated') as deactivated_users
      FROM users
    `);

    const row = result.rows[0];

    return {
      totalUsers: parseInt(row.total_users),
      pendingUsers: parseInt(row.pending_users),
      approvedUsers: parseInt(row.approved_users),
      rejectedUsers: parseInt(row.rejected_users),
      deactivatedUsers: parseInt(row.deactivated_users),
    };
  }

  /**
   * Approve a user
   * @param userId - ID of the user to approve
   * @param adminId - ID of the admin performing the approval
   * @throws Error if user not found or invalid status transition
   */
  async approveUser(userId: string, adminId: string): Promise<void> {
    // Get the user to validate status
    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length === 0) {
      throw new Error('USER_NOT_FOUND');
    }

    const user = this.mapRowToUser(userResult.rows[0]);

    // Validate status transition - can only approve pending or rejected users
    if (user.status !== 'pending' && user.status !== 'rejected') {
      throw new Error('INVALID_STATUS_TRANSITION');
    }

    // Cannot approve self
    if (userId === adminId) {
      throw new Error('CANNOT_MODIFY_SELF');
    }

    // Update user status to approved
    await query(
      `UPDATE users 
       SET status = $1, 
           approved_by = $2, 
           approved_at = NOW(),
           rejection_reason = NULL
       WHERE id = $3`,
      ['approved', adminId, userId]
    );
  }

  /**
   * Reject a user
   * @param userId - ID of the user to reject
   * @param adminId - ID of the admin performing the rejection
   * @param reason - Optional reason for rejection
   * @throws Error if user not found or invalid status transition
   */
  async rejectUser(userId: string, adminId: string, reason?: string): Promise<void> {
    // Get the user to validate status
    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length === 0) {
      throw new Error('USER_NOT_FOUND');
    }

    const user = this.mapRowToUser(userResult.rows[0]);

    // Validate status transition - can only reject pending or approved users
    if (user.status !== 'pending' && user.status !== 'approved') {
      throw new Error('INVALID_STATUS_TRANSITION');
    }

    // Cannot reject self
    if (userId === adminId) {
      throw new Error('CANNOT_MODIFY_SELF');
    }

    // Normalize empty string to null
    const normalizedReason = reason && reason.trim() !== '' ? reason : null;

    // Update user status to rejected
    await query(
      `UPDATE users 
       SET status = $1, 
           approved_by = $2, 
           approved_at = NOW(),
           rejection_reason = $3
       WHERE id = $4`,
      ['rejected', adminId, normalizedReason, userId]
    );
  }

  /**
   * Deactivate a user
   * @param userId - ID of the user to deactivate
   * @param adminId - ID of the admin performing the deactivation
   * @throws Error if user not found or cannot modify self
   */
  async deactivateUser(userId: string, adminId: string): Promise<void> {
    // Get the user to validate
    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length === 0) {
      throw new Error('USER_NOT_FOUND');
    }

    const user = this.mapRowToUser(userResult.rows[0]);

    // Cannot deactivate self
    if (userId === adminId) {
      throw new Error('CANNOT_MODIFY_SELF');
    }

    // Can only deactivate approved users
    if (user.status !== 'approved') {
      throw new Error('INVALID_STATUS_TRANSITION');
    }

    // Update user status to deactivated
    await query(
      `UPDATE users 
       SET status = $1
       WHERE id = $2`,
      ['deactivated', userId]
    );
  }

  /**
   * Activate a user (reactivate from deactivated status)
   * @param userId - ID of the user to activate
   * @param adminId - ID of the admin performing the activation
   * @throws Error if user not found or cannot modify self
   */
  async activateUser(userId: string, adminId: string): Promise<void> {
    // Get the user to validate
    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length === 0) {
      throw new Error('USER_NOT_FOUND');
    }

    const user = this.mapRowToUser(userResult.rows[0]);

    // Cannot activate self
    if (userId === adminId) {
      throw new Error('CANNOT_MODIFY_SELF');
    }

    // Can only activate deactivated users
    if (user.status !== 'deactivated') {
      throw new Error('INVALID_STATUS_TRANSITION');
    }

    // Update user status to approved
    await query(
      `UPDATE users 
       SET status = $1,
           approved_by = $2,
           approved_at = NOW()
       WHERE id = $3`,
      ['approved', adminId, userId]
    );
  }

  /**
   * Delete a user and all associated data
   * @param userId - ID of the user to delete
   * @param adminId - ID of the admin performing the deletion
   * @throws Error if user not found or cannot modify self
   */
  async deleteUser(userId: string, adminId: string): Promise<void> {
    // Get the user to validate
    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length === 0) {
      throw new Error('USER_NOT_FOUND');
    }

    // Cannot delete self
    if (userId === adminId) {
      throw new Error('CANNOT_MODIFY_SELF');
    }

    // Delete user (cascade will handle related data)
    await query('DELETE FROM users WHERE id = $1', [userId]);
  }

  /**
   * Map database row to User model
   */
  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      fullName: row.full_name,
      professionalCredentials: row.professional_credentials,
      isVerified: row.is_verified,
      role: row.role,
      status: row.status,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      rejectionReason: row.rejection_reason,
      createdAt: row.created_at,
      lastLoginAt: row.last_login_at,
    };
  }
}

// Export singleton instance
export const adminService = new AdminService();
