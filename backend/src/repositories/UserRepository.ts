import { query } from '../config/database';
import { User, CreateUserDTO, UpdateUserDTO } from '../models/User';

export class UserRepository {
  /**
   * Create a new user
   */
  async create(userData: CreateUserDTO & { passwordHash: string }): Promise<User> {
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, professional_credentials, role, status, license_id, ambulance_role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userData.email,
        userData.passwordHash,
        userData.fullName,
        userData.professionalCredentials || null,
        userData.role || 'user',
        userData.status || 'pending',
        userData.licenseId || null,
        userData.ambulanceRole || null,
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

    if (updates.email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }

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
   * Update user password
   */
  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
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
   * Find users by license ID
   */
  async findByLicenseId(licenseId: string, limit: number = 100, offset: number = 0): Promise<User[]> {
    const result = await query(
      'SELECT * FROM users WHERE license_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [licenseId, limit, offset]
    );

    return result.rows.map((row) => this.mapRowToUser(row));
  }

  /**
   * Count users by license ID
   */
  async countByLicenseId(licenseId: string): Promise<number> {
    const result = await query('SELECT COUNT(*) as count FROM users WHERE license_id = $1', [
      licenseId,
    ]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Associate user with a license
   */
  async associateWithLicense(
    userId: string,
    licenseId: string,
    ambulanceRole?: string
  ): Promise<User | null> {
    const result = await query(
      `UPDATE users 
       SET license_id = $1, ambulance_role = $2 
       WHERE id = $3 
       RETURNING *`,
      [licenseId, ambulanceRole || null, userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * Remove license association from user
   */
  async removeLicenseAssociation(userId: string): Promise<User | null> {
    const result = await query(
      `UPDATE users 
       SET license_id = NULL, ambulance_role = NULL 
       WHERE id = $1 
       RETURNING *`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * Update ambulance role for a user
   */
  async updateAmbulanceRole(userId: string, ambulanceRole: string): Promise<User | null> {
    const result = await query(
      `UPDATE users 
       SET ambulance_role = $1 
       WHERE id = $2 
       RETURNING *`,
      [ambulanceRole, userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * Count active users by license ID (logged in within last 30 days)
   */
  async countActiveUsersByLicenseId(licenseId: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count FROM users 
       WHERE license_id = $1 
       AND last_login_at > NOW() - INTERVAL '30 days'`,
      [licenseId]
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Find all users with licenses (ambulance users)
   */
  async findAllAmbulanceUsers(limit: number = 100, offset: number = 0): Promise<User[]> {
    const result = await query(
      'SELECT * FROM users WHERE license_id IS NOT NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    return result.rows.map((row) => this.mapRowToUser(row));
  }

  /**
   * Count all ambulance users
   */
  async countAmbulanceUsers(): Promise<number> {
    const result = await query('SELECT COUNT(*) as count FROM users WHERE license_id IS NOT NULL');
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
      licenseId: row.license_id || null,
      ambulanceRole: row.ambulance_role || null,
      createdAt: row.created_at,
      lastLoginAt: row.last_login_at,
    };
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
