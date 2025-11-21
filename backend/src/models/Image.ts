export interface Image {
  id: string;
  userId: string;
  originalFilename: string;
  fileFormat: 'dicom' | 'aan' | 'jpeg' | 'png' | 'tiff' | 'zip' | 'unknown';
  fileSize: number;
  storagePath: string;
  thumbnailPath: string | null;
  uploadedAt: Date;
}

export interface ImageMetadata {
  id: string;
  imageId: string;
  patientId: string | null;
  patientName: string | null;
  studyDate: Date | null;
  studyDescription: string | null;
  modality: string | null;
  imageWidth: number;
  imageHeight: number;
  bitDepth: number;
  colorSpace: string;
  dicomTags: Record<string, any> | null;
  customTags: Record<string, any> | null;
}

export interface CreateImageDTO {
  userId: string;
  originalFilename: string;
  fileFormat: 'dicom' | 'aan' | 'jpeg' | 'png' | 'tiff' | 'zip' | 'unknown';
  fileSize: number;
  storagePath: string;
  thumbnailPath?: string;
}

export interface CreateMetadataDTO {
  imageId: string;
  patientId?: string;
  patientName?: string;
  studyDate?: Date;
  studyDescription?: string;
  modality?: string;
  imageWidth: number;
  imageHeight: number;
  bitDepth: number;
  colorSpace: string;
  dicomTags?: Record<string, any>;
  customTags?: Record<string, any>;
}
