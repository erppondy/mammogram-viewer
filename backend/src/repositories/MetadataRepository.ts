import { query } from '../config/database';
import { ImageMetadata, CreateMetadataDTO } from '../models/Image';

export class MetadataRepository {
  async create(data: CreateMetadataDTO): Promise<ImageMetadata> {
    const result = await query(
      `INSERT INTO image_metadata (
        image_id, patient_id, patient_name, study_date, study_description,
        modality, image_width, image_height, bit_depth, color_space,
        dicom_tags, custom_tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        data.imageId,
        data.patientId || null,
        data.patientName || null,
        data.studyDate || null,
        data.studyDescription || null,
        data.modality || null,
        data.imageWidth,
        data.imageHeight,
        data.bitDepth,
        data.colorSpace,
        data.dicomTags ? JSON.stringify(data.dicomTags) : null,
        data.customTags ? JSON.stringify(data.customTags) : null,
      ]
    );

    return this.mapRowToMetadata(result.rows[0]);
  }

  async findByImageId(imageId: string): Promise<ImageMetadata | null> {
    const result = await query('SELECT * FROM image_metadata WHERE image_id = $1', [imageId]);
    return result.rows.length > 0 ? this.mapRowToMetadata(result.rows[0]) : null;
  }

  async search(filters: {
    patientId?: string;
    patientName?: string;
    studyDate?: Date;
    modality?: string;
  }): Promise<ImageMetadata[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (filters.patientId) {
      conditions.push(`patient_id = $${paramCount++}`);
      values.push(filters.patientId);
    }

    if (filters.patientName) {
      conditions.push(`patient_name ILIKE $${paramCount++}`);
      values.push(`%${filters.patientName}%`);
    }

    if (filters.studyDate) {
      conditions.push(`study_date = $${paramCount++}`);
      values.push(filters.studyDate);
    }

    if (filters.modality) {
      conditions.push(`modality = $${paramCount++}`);
      values.push(filters.modality);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(`SELECT * FROM image_metadata ${whereClause}`, values);

    return result.rows.map(row => this.mapRowToMetadata(row));
  }

  private mapRowToMetadata(row: any): ImageMetadata {
    return {
      id: row.id,
      imageId: row.image_id,
      patientId: row.patient_id,
      patientName: row.patient_name,
      studyDate: row.study_date,
      studyDescription: row.study_description,
      modality: row.modality,
      imageWidth: row.image_width,
      imageHeight: row.image_height,
      bitDepth: row.bit_depth,
      colorSpace: row.color_space,
      dicomTags: row.dicom_tags,
      customTags: row.custom_tags,
    };
  }
}

export const metadataRepository = new MetadataRepository();
