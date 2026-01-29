import { query } from '../config/database';
import {
  LicenseTemplate,
  CreateTemplateDTO,
  UpdateTemplateDTO,
} from '../models/LicenseTemplate';

export class LicenseTemplateRepository {
  /**
   * Create a new license template
   */
  async create(templateData: CreateTemplateDTO): Promise<LicenseTemplate> {
    const result = await query(
      `INSERT INTO license_templates (
        template_name, description, default_duration_days, default_upload_quota
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [
        templateData.templateName,
        templateData.description || null,
        templateData.defaultDurationDays,
        templateData.defaultUploadQuota,
      ]
    );

    return this.mapRowToTemplate(result.rows[0]);
  }

  /**
   * Find template by ID
   */
  async findById(id: string): Promise<LicenseTemplate | null> {
    const result = await query('SELECT * FROM license_templates WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTemplate(result.rows[0]);
  }

  /**
   * Find template by name
   */
  async findByName(templateName: string): Promise<LicenseTemplate | null> {
    const result = await query('SELECT * FROM license_templates WHERE template_name = $1', [
      templateName,
    ]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTemplate(result.rows[0]);
  }

  /**
   * Find all templates
   */
  async findAll(activeOnly: boolean = false): Promise<LicenseTemplate[]> {
    let sql = 'SELECT * FROM license_templates';

    if (activeOnly) {
      sql += ' WHERE is_active = true';
    }

    sql += ' ORDER BY template_name ASC';

    const result = await query(sql);
    return result.rows.map((row) => this.mapRowToTemplate(row));
  }

  /**
   * Update template
   */
  async update(id: string, updates: UpdateTemplateDTO): Promise<LicenseTemplate | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.templateName !== undefined) {
      fields.push(`template_name = $${paramCount++}`);
      values.push(updates.templateName);
    }

    if (updates.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }

    if (updates.defaultDurationDays !== undefined) {
      fields.push(`default_duration_days = $${paramCount++}`);
      values.push(updates.defaultDurationDays);
    }

    if (updates.defaultUploadQuota !== undefined) {
      fields.push(`default_upload_quota = $${paramCount++}`);
      values.push(updates.defaultUploadQuota);
    }

    if (updates.isActive !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(updates.isActive);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE license_templates SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTemplate(result.rows[0]);
  }

  /**
   * Delete template
   */
  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM license_templates WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Check if template name exists
   */
  async nameExists(templateName: string, excludeId?: string): Promise<boolean> {
    let sql = 'SELECT 1 FROM license_templates WHERE template_name = $1';
    const params: any[] = [templateName];

    if (excludeId) {
      sql += ' AND id != $2';
      params.push(excludeId);
    }

    const result = await query(sql, params);
    return result.rows.length > 0;
  }

  /**
   * Count templates
   */
  async count(activeOnly: boolean = false): Promise<number> {
    let sql = 'SELECT COUNT(*) as count FROM license_templates';

    if (activeOnly) {
      sql += ' WHERE is_active = true';
    }

    const result = await query(sql);
    return parseInt(result.rows[0].count);
  }

  /**
   * Map database row to LicenseTemplate model
   */
  private mapRowToTemplate(row: any): LicenseTemplate {
    return {
      id: row.id,
      templateName: row.template_name,
      description: row.description,
      defaultDurationDays: row.default_duration_days,
      defaultUploadQuota: row.default_upload_quota,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// Export singleton instance
export const licenseTemplateRepository = new LicenseTemplateRepository();
