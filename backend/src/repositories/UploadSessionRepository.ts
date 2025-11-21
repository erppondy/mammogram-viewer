import { query } from '../config/database';
import {
  UploadSession,
  CreateUploadSessionDTO,
  UpdateUploadSessionDTO,
} from '../models/UploadSession';

export class UploadSessionRepository {
  /**
   * Create a new upload session
   */
  async create(data: CreateUploadSessionDTO): Promise<UploadSession> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    const result = await query(
      `INSERT INTO upload_sessions (user_id, filename, file_size, chunk_size, status, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [data.userId, data.filename, data.fileSize, data.chunkSize, 'pending', expiresAt]
    );

    return this.mapRowToSession(result.rows[0]);
  }

  /**
   * Find session by ID
   */
  async findById(id: string): Promise<UploadSession | null> {
    const result = await query('SELECT * FROM upload_sessions WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToSession(result.rows[0]);
  }

  /**
   * Update session
   */
  async update(id: string, updates: UpdateUploadSessionDTO): Promise<UploadSession | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.uploadedBytes !== undefined) {
      fields.push(`uploaded_bytes = $${paramCount++}`);
      values.push(updates.uploadedBytes);
    }

    if (updates.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await query(
      `UPDATE upload_sessions SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToSession(result.rows[0]);
  }

  /**
   * Delete session
   */
  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM upload_sessions WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Find sessions by user ID
   */
  async findByUserId(userId: string, limit: number = 50): Promise<UploadSession[]> {
    const result = await query(
      'SELECT * FROM upload_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit]
    );

    return result.rows.map((row) => this.mapRowToSession(row));
  }

  /**
   * Find expired sessions
   */
  async findExpired(): Promise<UploadSession[]> {
    const result = await query(
      'SELECT * FROM upload_sessions WHERE expires_at < CURRENT_TIMESTAMP AND status != $1',
      ['completed']
    );

    return result.rows.map((row) => this.mapRowToSession(row));
  }

  /**
   * Delete expired sessions
   */
  async deleteExpired(): Promise<number> {
    const result = await query(
      'DELETE FROM upload_sessions WHERE expires_at < CURRENT_TIMESTAMP AND status != $1',
      ['completed']
    );

    return result.rowCount ?? 0;
  }

  /**
   * Map database row to UploadSession model
   */
  private mapRowToSession(row: any): UploadSession {
    return {
      id: row.id,
      userId: row.user_id,
      filename: row.filename,
      fileSize: parseInt(row.file_size),
      uploadedBytes: parseInt(row.uploaded_bytes),
      chunkSize: row.chunk_size,
      status: row.status,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    };
  }
}

export const uploadSessionRepository = new UploadSessionRepository();
