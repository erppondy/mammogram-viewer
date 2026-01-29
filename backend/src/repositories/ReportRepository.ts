import pool from '../config/database';
import { Report, CreateReportDTO, UpdateReportDTO } from '../models/Report';

export class ReportRepository {
  async create(radiologistId: string, data: CreateReportDTO): Promise<Report> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO reports (
          patient_name, patient_id, patient_age, patient_gender,
          image_ids, radiologist_id, findings, diagnosis, 
          recommendations, bi_rads_score, report_template_id, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      
      const values = [
        data.patient_name,
        data.patient_id,
        data.patient_age,
        data.patient_gender,
        JSON.stringify(data.image_ids),
        radiologistId,
        data.findings ? JSON.stringify(data.findings) : null,
        data.diagnosis,
        data.recommendations,
        data.bi_rads_score,
        data.report_template_id,
        'draft'
      ];

      const result = await client.query(query, values);
      const report = result.rows[0];

      // Insert into junction table
      for (const imageId of data.image_ids) {
        await client.query(
          'INSERT INTO report_images (report_id, image_id) VALUES ($1, $2)',
          [report.id, imageId]
        );
      }

      await client.query('COMMIT');
      return report;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<Report | null> {
    const query = `
      SELECT r.*, u.full_name as radiologist_name, u.email as radiologist_email
      FROM reports r
      LEFT JOIN users u ON r.radiologist_id = u.id
      WHERE r.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async findByImageId(imageId: string): Promise<Report[]> {
    const query = `
      SELECT DISTINCT r.*, u.full_name as radiologist_name
      FROM reports r
      LEFT JOIN users u ON r.radiologist_id = u.id
      LEFT JOIN report_images ri ON r.id = ri.report_id
      WHERE ri.image_id = $1
      ORDER BY r.created_at DESC
    `;
    const result = await pool.query(query, [imageId]);
    return result.rows;
  }

  async findByPatientId(patientId: string): Promise<Report[]> {
    const query = `
      SELECT r.*, u.full_name as radiologist_name
      FROM reports r
      LEFT JOIN users u ON r.radiologist_id = u.id
      WHERE r.patient_id = $1
      ORDER BY r.created_at DESC
    `;
    const result = await pool.query(query, [patientId]);
    return result.rows;
  }

  async findByRadiologistId(radiologistId: string): Promise<Report[]> {
    const query = `
      SELECT * FROM reports 
      WHERE radiologist_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [radiologistId]);
    return result.rows;
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<Report[]> {
    const query = `
      SELECT r.*, u.full_name as radiologist_name
      FROM reports r
      LEFT JOIN users u ON r.radiologist_id = u.id
      ORDER BY r.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  async update(id: string, data: UpdateReportDTO): Promise<Report | null> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (data.patient_name !== undefined) {
        fields.push(`patient_name = $${paramCount++}`);
        values.push(data.patient_name);
      }
      if (data.patient_id !== undefined) {
        fields.push(`patient_id = $${paramCount++}`);
        values.push(data.patient_id);
      }
      if (data.patient_age !== undefined) {
        fields.push(`patient_age = $${paramCount++}`);
        values.push(data.patient_age);
      }
      if (data.patient_gender !== undefined) {
        fields.push(`patient_gender = $${paramCount++}`);
        values.push(data.patient_gender);
      }
      if (data.image_ids !== undefined) {
        fields.push(`image_ids = $${paramCount++}`);
        values.push(JSON.stringify(data.image_ids));
        
        // Update junction table
        await client.query('DELETE FROM report_images WHERE report_id = $1', [id]);
        for (const imageId of data.image_ids) {
          await client.query(
            'INSERT INTO report_images (report_id, image_id) VALUES ($1, $2)',
            [id, imageId]
          );
        }
      }
      if (data.findings !== undefined) {
        fields.push(`findings = $${paramCount++}`);
        values.push(JSON.stringify(data.findings));
      }
      if (data.diagnosis !== undefined) {
        fields.push(`diagnosis = $${paramCount++}`);
        values.push(data.diagnosis);
      }
      if (data.recommendations !== undefined) {
        fields.push(`recommendations = $${paramCount++}`);
        values.push(data.recommendations);
      }
      if (data.bi_rads_score !== undefined) {
        fields.push(`bi_rads_score = $${paramCount++}`);
        values.push(data.bi_rads_score);
      }
      if (data.status !== undefined) {
        fields.push(`status = $${paramCount++}`);
        values.push(data.status);
      }

      if (fields.length === 0) {
        await client.query('COMMIT');
        return this.findById(id);
      }

      values.push(id);
      const query = `
        UPDATE reports 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, values);
      await client.query('COMMIT');
      return result.rows[0] || null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async finalize(id: string, signatureData?: string): Promise<Report | null> {
    const query = `
      UPDATE reports 
      SET status = 'finalized', 
          finalized_at = CURRENT_TIMESTAMP,
          signature_data = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [signatureData, id]);
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM reports WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export default new ReportRepository();
