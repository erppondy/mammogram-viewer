import { query } from '../config/database';
import {
  AmbulanceLicense,
  CreateLicenseDTO,
  UpdateLicenseDTO,
  LicenseFilters,
} from '../models/AmbulanceLicense';

export class LicenseRepository {
  /**
   * Create a new ambulance license
   */
  async create(
    licenseData: CreateLicenseDTO & { licenseKey: string; expiresAt: Date },
    createdBy: string
  ): Promise<AmbulanceLicense> {
    const result = await query(
      `INSERT INTO ambulance_licenses (
        license_key, ambulance_name, ambulance_contact_email, 
        ambulance_contact_phone, ambulance_address, upload_quota, 
        expires_at, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        licenseData.licenseKey,
        licenseData.ambulanceName,
        licenseData.ambulanceContactEmail,
        licenseData.ambulanceContactPhone || null,
        licenseData.ambulanceAddress || null,
        licenseData.uploadQuota,
        licenseData.expiresAt,
        createdBy,
      ]
    );

    return this.mapRowToLicense(result.rows[0]);
  }

  /**
   * Find license by ID
   */
  async findById(id: string): Promise<AmbulanceLicense | null> {
    const result = await query('SELECT * FROM ambulance_licenses WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToLicense(result.rows[0]);
  }

  /**
   * Find license by license key
   */
  async findByKey(licenseKey: string): Promise<AmbulanceLicense | null> {
    const result = await query('SELECT * FROM ambulance_licenses WHERE license_key = $1', [
      licenseKey,
    ]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToLicense(result.rows[0]);
  }

  /**
   * Find all licenses with optional filtering
   */
  async findAll(filters?: LicenseFilters): Promise<AmbulanceLicense[]> {
    let sql = 'SELECT * FROM ambulance_licenses WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (filters?.status) {
      sql += ` AND status = $${paramCount++}`;
      params.push(filters.status);
    }

    if (filters?.ambulanceName) {
      sql += ` AND ambulance_name ILIKE $${paramCount++}`;
      params.push(`%${filters.ambulanceName}%`);
    }

    if (filters?.expiresAfter) {
      sql += ` AND expires_at > $${paramCount++}`;
      params.push(filters.expiresAfter);
    }

    if (filters?.expiresBefore) {
      sql += ` AND expires_at < $${paramCount++}`;
      params.push(filters.expiresBefore);
    }

    sql += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      sql += ` LIMIT $${paramCount++}`;
      params.push(filters.limit);
    }

    if (filters?.offset) {
      sql += ` OFFSET $${paramCount++}`;
      params.push(filters.offset);
    }

    const result = await query(sql, params);
    return result.rows.map((row) => this.mapRowToLicense(row));
  }

  /**
   * Update license
   */
  async update(id: string, updates: UpdateLicenseDTO): Promise<AmbulanceLicense | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.ambulanceName !== undefined) {
      fields.push(`ambulance_name = $${paramCount++}`);
      values.push(updates.ambulanceName);
    }

    if (updates.ambulanceContactEmail !== undefined) {
      fields.push(`ambulance_contact_email = $${paramCount++}`);
      values.push(updates.ambulanceContactEmail);
    }

    if (updates.ambulanceContactPhone !== undefined) {
      fields.push(`ambulance_contact_phone = $${paramCount++}`);
      values.push(updates.ambulanceContactPhone);
    }

    if (updates.ambulanceAddress !== undefined) {
      fields.push(`ambulance_address = $${paramCount++}`);
      values.push(updates.ambulanceAddress);
    }

    if (updates.uploadQuota !== undefined) {
      fields.push(`upload_quota = $${paramCount++}`);
      values.push(updates.uploadQuota);
    }

    if (updates.expiresAt !== undefined) {
      fields.push(`expires_at = $${paramCount++}`);
      values.push(updates.expiresAt);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE ambulance_licenses SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToLicense(result.rows[0]);
  }

  /**
   * Update license status
   */
  async updateStatus(
    id: string,
    status: 'active' | 'expired' | 'revoked'
  ): Promise<AmbulanceLicense | null> {
    const result = await query(
      `UPDATE ambulance_licenses 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToLicense(result.rows[0]);
  }

  /**
   * Revoke license
   */
  async revoke(id: string, revokedBy: string, reason: string): Promise<AmbulanceLicense | null> {
    const result = await query(
      `UPDATE ambulance_licenses 
       SET status = 'revoked', 
           revoked_at = CURRENT_TIMESTAMP, 
           revoked_by = $1, 
           revocation_reason = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 
       RETURNING *`,
      [revokedBy, reason, id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToLicense(result.rows[0]);
  }

  /**
   * Increment upload count
   */
  async incrementUploadCount(id: string): Promise<void> {
    await query(
      `UPDATE ambulance_licenses 
       SET uploads_used = uploads_used + 1, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [id]
    );
  }

  /**
   * Update upload quota
   */
  async updateQuota(id: string, newQuota: number): Promise<AmbulanceLicense | null> {
    const result = await query(
      `UPDATE ambulance_licenses 
       SET upload_quota = $1, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [newQuota, id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToLicense(result.rows[0]);
  }

  /**
   * Find expired licenses that are still marked as active
   */
  async findExpiredLicenses(): Promise<AmbulanceLicense[]> {
    const result = await query(
      `SELECT * FROM ambulance_licenses 
       WHERE status = 'active' 
       AND expires_at < CURRENT_TIMESTAMP`
    );

    return result.rows.map((row) => this.mapRowToLicense(row));
  }

  /**
   * Count licenses by status
   */
  async countByStatus(status?: string): Promise<number> {
    let sql = 'SELECT COUNT(*) as count FROM ambulance_licenses';
    const params: any[] = [];

    if (status) {
      sql += ' WHERE status = $1';
      params.push(status);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Check if license key exists
   */
  async keyExists(licenseKey: string): Promise<boolean> {
    const result = await query('SELECT 1 FROM ambulance_licenses WHERE license_key = $1', [
      licenseKey,
    ]);
    return result.rows.length > 0;
  }

  /**
   * Map database row to AmbulanceLicense model
   */
  private mapRowToLicense(row: any): AmbulanceLicense {
    return {
      id: row.id,
      licenseKey: row.license_key,
      ambulanceName: row.ambulance_name,
      ambulanceContactEmail: row.ambulance_contact_email,
      ambulanceContactPhone: row.ambulance_contact_phone,
      ambulanceAddress: row.ambulance_address,
      status: row.status,
      uploadQuota: row.upload_quota,
      uploadsUsed: row.uploads_used,
      issuedAt: row.issued_at,
      expiresAt: row.expires_at,
      revokedAt: row.revoked_at,
      createdBy: row.created_by,
      revokedBy: row.revoked_by,
      revocationReason: row.revocation_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// Export singleton instance
export const licenseRepository = new LicenseRepository();
