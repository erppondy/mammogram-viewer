export interface UploadSession {
  id: string;
  userId: string;
  filename: string;
  fileSize: number;
  uploadedBytes: number;
  chunkSize: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  expiresAt: Date;
}

export interface CreateUploadSessionDTO {
  userId: string;
  filename: string;
  fileSize: number;
  chunkSize: number;
}

export interface UpdateUploadSessionDTO {
  uploadedBytes?: number;
  status?: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
}
