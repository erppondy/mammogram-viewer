import { query } from '../config/database';
import { User, CreateUserDTO, UpdateUserDTO } from '../models/User';

export class UserRepository {
  /**
   * Create a new user
   */
  async create(userData: CreateUserDTO & { passwordHash: string }): Promise<User> {
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, professional_credentials, role, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userData.email,
        userData.passwordHash,
        userData.fullName,
        userData.professionalCredentials || null,
        userData.role || 'user',
        userData.status || 'pending',
      ]
    );

    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * Update user
   */
  async update(id: string, updates: UpdateUserDTO): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.fullName !== undefined) {
      fields.push(`full_name = $${paramCount++}`);
      values.push(updates.fullName);
    }

    if (updates.professionalCredentials !== undefined) {
      fields.push(`professional_credentials = $${paramCount++}`);
      values.push(updates.professionalCredentials);
    }

    if (updates.isVerified !== undefined) {
      fields.push(`is_verified = $${paramCount++}`);
      values.push(updates.isVerified);
    }

    if (updates.lastLoginAt !== undefined) {
      fields.push(`last_login_at = $${paramCount++}`);
      values.push(updates.lastLoginAt);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM users WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const result = await query('SELECT 1 FROM users WHERE email = $1', [email]);
    return result.rows.length > 0;
  }

  /**
   * Update last login time
   */
  async updateLastLogin(id: string): Promise<void> {
    await query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
  }

  /**
   * Get all users (for admin purposes)
   */
  async findAll(limit: number = 100, offset: number = 0): Promise<User[]> {
    const result = await query('SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2', [
      limit,
      offset,
    ]);

    return result.rows.map((row) => this.mapRowToUser(row));
  }

  /**
   * Count total users
   */
  async count(): Promise<number> {
    const result = await query('SELECT COUNT(*) as count FROM users');
    return parseInt(result.rows[0].count);
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
export const userRepository = new UserRepository();
