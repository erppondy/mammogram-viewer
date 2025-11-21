import { query } from '../config/database';
import { Image, CreateImageDTO } from '../models/Image';

export interface CursorPaginationResult<T> {
  data: T[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
}

export class ImageRepository {
  async create(data: CreateImageDTO): Promise<Image> {
    const result = await query(
      `INSERT INTO images (user_id, original_filename, file_format, file_size, storage_path, thumbnail_path)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.userId,
        data.originalFilename,
        data.fileFormat,
        data.fileSize,
        data.storagePath,
        data.thumbnailPath || null,
      ]
    );

    return this.mapRowToImage(result.rows[0]);
  }

  async findById(id: string): Promise<Image | null> {
    const result = await query('SELECT * FROM images WHERE id = $1', [id]);
    return result.rows.length > 0 ? this.mapRowToImage(result.rows[0]) : null;
  }

  async findByUserId(userId: string, limit: number = 50, offset: number = 0): Promise<Image[]> {
    const result = await query(
      'SELECT * FROM images WHERE user_id = $1 ORDER BY uploaded_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );
    return result.rows.map(row => this.mapRowToImage(row));
  }

  // Cursor-based pagination for better performance with large datasets
  async findByUserIdWithCursor(
    userId: number,
    limit: number = 20,
    cursor?: string,
    direction: 'next' | 'prev' = 'next'
  ): Promise<CursorPaginationResult<Image>> {
    let queryStr: string;
    let params: any[];

    // Fetch one extra to determine if there are more results
    const fetchLimit = limit + 1;

    if (!cursor) {
      // First page
      queryStr = `
        SELECT * FROM images 
        WHERE user_id = $1 
        ORDER BY uploaded_at DESC, id DESC 
        LIMIT $2
      `;
      params = [userId, fetchLimit];
    } else {
      // Decode cursor (format: timestamp_id)
      const [timestamp, id] = cursor.split('_');
      
      if (direction === 'next') {
        queryStr = `
          SELECT * FROM images 
          WHERE user_id = $1 
            AND (uploaded_at < $2 OR (uploaded_at = $2 AND id < $3))
          ORDER BY uploaded_at DESC, id DESC 
          LIMIT $4
        `;
        params = [userId, timestamp, parseInt(id), fetchLimit];
      } else {
        queryStr = `
          SELECT * FROM images 
          WHERE user_id = $1 
            AND (uploaded_at > $2 OR (uploaded_at = $2 AND id > $3))
          ORDER BY uploaded_at ASC, id ASC 
          LIMIT $4
        `;
        params = [userId, timestamp, parseInt(id), fetchLimit];
      }
    }

    const result = await query(queryStr, params);
    let rows = result.rows;

    // If going backwards, reverse the results
    if (direction === 'prev' && cursor) {
      rows = rows.reverse();
    }

    // Check if there are more results
    const hasMore = rows.length > limit;
    if (hasMore) {
      rows = rows.slice(0, limit);
    }

    const images = rows.map(row => this.mapRowToImage(row));

    // Generate cursors
    let nextCursor: string | null = null;
    let prevCursor: string | null = null;

    if (images.length > 0) {
      const lastImage = images[images.length - 1];
      const firstImage = images[0];
      
      nextCursor = hasMore ? `${lastImage.uploadedAt.toISOString()}_${lastImage.id}` : null;
      prevCursor = cursor ? `${firstImage.uploadedAt.toISOString()}_${firstImage.id}` : null;
    }

    return {
      data: images,
      nextCursor,
      prevCursor,
      hasMore,
    };
  }

  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM images WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async updateThumbnailPath(id: string, thumbnailPath: string): Promise<void> {
    await query('UPDATE images SET thumbnail_path = $1 WHERE id = $2', [thumbnailPath, id]);
  }

  async updateConvertedPath(id: number, convertedPath: string): Promise<void> {
    await query('UPDATE images SET converted_path = $1 WHERE id = $2', [convertedPath, id]);
  }

  private mapRowToImage(row: any): Image {
    return {
      id: row.id,
      userId: row.user_id,
      originalFilename: row.original_filename,
      fileFormat: row.file_format,
      fileSize: parseInt(row.file_size),
      storagePath: row.storage_path,
      thumbnailPath: row.thumbnail_path,
      uploadedAt: row.uploaded_at,
    };
  }
}

export const imageRepository = new ImageRepository();
