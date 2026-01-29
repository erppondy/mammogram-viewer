import pool from '../config/database';
import { Annotation, CreateAnnotationDTO, UpdateAnnotationDTO } from '../models/Annotation';

export class AnnotationRepository {
  async create(userId: string, data: CreateAnnotationDTO): Promise<Annotation> {
    const query = `
      INSERT INTO annotations (
        image_id, user_id, annotation_type, coordinates, 
        color, severity_level, category, finding_name, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      data.image_id,
      userId,
      data.annotation_type,
      JSON.stringify(data.coordinates),
      data.color || '#ff0000',
      data.severity_level,
      data.category,
      data.finding_name,
      data.notes
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findById(id: string): Promise<Annotation | null> {
    const query = 'SELECT * FROM annotations WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async findByImageId(imageId: string): Promise<Annotation[]> {
    const query = `
      SELECT a.*, u.full_name as user_name
      FROM annotations a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.image_id = $1
      ORDER BY a.created_at DESC
    `;
    const result = await pool.query(query, [imageId]);
    return result.rows;
  }

  async findByUserId(userId: string): Promise<Annotation[]> {
    const query = `
      SELECT * FROM annotations 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  async update(id: string, data: UpdateAnnotationDTO): Promise<Annotation | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.annotation_type !== undefined) {
      fields.push(`annotation_type = $${paramCount++}`);
      values.push(data.annotation_type);
    }
    if (data.coordinates !== undefined) {
      fields.push(`coordinates = $${paramCount++}`);
      values.push(JSON.stringify(data.coordinates));
    }
    if (data.color !== undefined) {
      fields.push(`color = $${paramCount++}`);
      values.push(data.color);
    }
    if (data.severity_level !== undefined) {
      fields.push(`severity_level = $${paramCount++}`);
      values.push(data.severity_level);
    }
    if (data.category !== undefined) {
      fields.push(`category = $${paramCount++}`);
      values.push(data.category);
    }
    if (data.finding_name !== undefined) {
      fields.push(`finding_name = $${paramCount++}`);
      values.push(data.finding_name);
    }
    if (data.notes !== undefined) {
      fields.push(`notes = $${paramCount++}`);
      values.push(data.notes);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE annotations 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM annotations WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async deleteByImageId(imageId: string): Promise<boolean> {
    const query = 'DELETE FROM annotations WHERE image_id = $1';
    const result = await pool.query(query, [imageId]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export default new AnnotationRepository();
