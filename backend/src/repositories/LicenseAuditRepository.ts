import { query } from '../config/database';
import { LicenseAuditLog, CreateAuditLogDTO } from '../models/LicenseAuditLog';

export class LicenseAuditRepository {
  /**
   * Create a new audit log entry
   */
  async create(auditData: CreateAuditLogDTO): Promise<LicenseAuditLog> {
    const result = await query(
      `INSERT INTO license_audit_log (
        license_id, action, changed_by, old_values, new_values, reason
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        auditData.licenseId,
        auditData.action,
        auditData.changedBy || null,
        auditData.oldValues ? JSON.stringify(auditData.oldValues) : null,
        auditData.newValues ? JSON.stringify(auditData.newValues) : null,
        auditData.reason || null,
      ]
    );

    return this.mapRowToAuditLog(result.rows[0]);
  }

  /**
   * Find audit logs by license ID
   */
  async findByLicenseId(
    licenseId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<LicenseAuditLog[]> {
    const result = await query(
      `SELECT * FROM license_audit_log 
       WHERE license_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [licenseId, limit, offset]
    );

    return result.rows.map((row) => this.mapRowToAuditLog(row));
  }

  /**
   * Find audit logs by action type
   */
  async findByAction(
    action: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<LicenseAuditLog[]> {
    const result = await query(
      `SELECT * FROM license_audit_log 
       WHERE action = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [action, limit, offset]
    );

    return result.rows.map((row) => this.mapRowToAuditLog(row));
  }

  /**
   * Find audit logs by user who made the change
   */
  async findByChangedBy(
    changedBy: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<LicenseAuditLog[]> {
    const result = await query(
      `SELECT * FROM license_audit_log 
       WHERE changed_by = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [changedBy, limit, offset]
    );

    return result.rows.map((row) => this.mapRowToAuditLog(row));
  }

  /**
   * Find audit logs within a date range
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    limit: number = 100,
    offset: number = 0
  ): Promise<LicenseAuditLog[]> {
    const result = await query(
      `SELECT * FROM license_audit_log 
       WHERE created_at >= $1 AND created_at <= $2 
       ORDER BY created_at DESC 
       LIMIT $3 OFFSET $4`,
      [startDate, endDate, limit, offset]
    );

    return result.rows.map((row) => this.mapRowToAuditLog(row));
  }

  /**
   * Find all audit logs with optional filters
   */
  async findAll(
    filters?: {
      licenseId?: string;
      action?: string;
      changedBy?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit: number = 100,
    offset: number = 0
  ): Promise<LicenseAuditLog[]> {
    let sql = 'SELECT * FROM license_audit_log WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (filters?.licenseId) {
      sql += ` AND license_id = $${paramCount++}`;
      params.push(filters.licenseId);
    }

    if (filters?.action) {
      sql += ` AND action = $${paramCount++}`;
      params.push(filters.action);
    }

    if (filters?.changedBy) {
      sql += ` AND changed_by = $${paramCount++}`;
      params.push(filters.changedBy);
    }

    if (filters?.startDate) {
      sql += ` AND created_at >= $${paramCount++}`;
      params.push(filters.startDate);
    }

    if (filters?.endDate) {
      sql += ` AND created_at <= $${paramCount++}`;
      params.push(filters.endDate);
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    return result.rows.map((row) => this.mapRowToAuditLog(row));
  }

  /**
   * Count audit logs for a license
   */
  async countByLicenseId(licenseId: string): Promise<number> {
    const result = await query(
      'SELECT COUNT(*) as count FROM license_audit_log WHERE license_id = $1',
      [licenseId]
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Count audit logs by action
   */
  async countByAction(action: string): Promise<number> {
    const result = await query(
      'SELECT COUNT(*) as count FROM license_audit_log WHERE action = $1',
      [action]
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Delete old audit logs (for cleanup)
   */
  async deleteOlderThan(date: Date): Promise<number> {
    const result = await query('DELETE FROM license_audit_log WHERE created_at < $1', [date]);
    return result.rowCount ?? 0;
  }

  /**
   * Map database row to LicenseAuditLog model
   */
  private mapRowToAuditLog(row: any): LicenseAuditLog {
    return {
      id: row.id,
      licenseId: row.license_id,
      action: row.action,
      changedBy: row.changed_by,
      oldValues: row.old_values,
      newValues: row.new_values,
      reason: row.reason,
      createdAt: row.created_at,
    };
  }
}

// Export singleton instance
export const licenseAuditRepository = new LicenseAuditRepository();
