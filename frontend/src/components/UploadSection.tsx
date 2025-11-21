import { useState, useRef } from 'react';
import api from '../services/api';

interface UploadSectionProps {
  onUploadComplete: () => void;
}

interface UploadProgress {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'failed';
  error?: string;
}

export default function UploadSection({ onUploadComplete }: UploadSectionProps) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploading = uploadQueue.some((u) => u.status === 'uploading');

  const uploadFile = async (file: File) => {
    const uploadId = Date.now().toString();
    const newUpload: UploadProgress = {
      id: uploadId,
      file,
      progress: 0,
      status: 'uploading',
    };

    setUploadQueue((prev) => [...prev, newUpload]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadQueue((prev) =>
              prev.map((u) =>
                u.id === uploadId ? { ...u, progress: percentCompleted } : u
              )
            );
          }
        },
      });

      setUploadQueue((prev) =>
        prev.map((u) =>
          u.id === uploadId ? { ...u, status: 'completed' as const } : u
        )
      );
      setSuccess(`File "${file.name}" uploaded successfully!`);
      onUploadComplete();
    } catch (err: any) {
      setUploadQueue((prev) =>
        prev.map((u) =>
          u.id === uploadId
            ? {
                ...u,
                status: 'failed' as const,
                error: err.response?.data?.error?.message || 'Upload failed',
              }
            : u
        )
      );
      setError(err.response?.data?.error?.message || 'Upload failed');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError('');
    setSuccess('');

    // Upload multiple files
    for (let i = 0; i < files.length; i++) {
      await uploadFile(files[i]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setError('');
      setSuccess('');

      for (let i = 0; i < files.length; i++) {
        await uploadFile(files[i]);
      }
    }
  };

  const handleClearCompleted = () => {
    setUploadQueue((prev) => prev.filter((u) => u.status === 'uploading'));
  };

  return (
    <div className="medical-card p-6 mb-8 scan-line-container">
      <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center">
        <svg className="w-6 h-6 mr-2 text-[var(--medical-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        Upload Mammogram
      </h2>

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          isDragging
            ? 'border-[var(--medical-primary)] bg-[var(--bg-tertiary)] border-glow'
            : 'border-[var(--border-color)] bg-[var(--bg-secondary)]'
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept=".dcm,.dicom,.aan,.jpg,.jpeg,.png,.tiff,.zip"
          className="hidden"
          id="file-upload"
          multiple
          disabled={isUploading}
        />
        <label
          htmlFor="file-upload"
          className={`cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="text-[var(--text-secondary)]">
            <svg
              className="mx-auto h-12 w-12 text-[var(--medical-primary)]"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm">
              <span className="font-medium text-[var(--medical-primary)] hover:text-[var(--medical-primary-dark)]">
                Click to upload
              </span>{' '}
              or drag and drop
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              DICOM, AAN, JPEG, PNG, TIFF, or ZIP files (multiple files supported)
            </p>
          </div>
        </label>
      </div>

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="data-label">
              Upload Queue ({uploadQueue.length})
            </h3>
            {uploadQueue.some((u) => u.status !== 'uploading') && (
              <button
                onClick={handleClearCompleted}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--medical-primary)] transition-colors"
              >
                Clear Completed
              </button>
            )}
          </div>
          {uploadQueue.map((upload) => (
            <div
              key={upload.id}
              className="border border-[var(--border-color)] rounded-lg p-3 bg-[var(--bg-tertiary)]"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-[var(--text-primary)] truncate flex-1">
                  {upload.file.name}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    upload.status === 'completed'
                      ? 'bg-green-900/30 text-green-400'
                      : upload.status === 'failed'
                      ? 'bg-red-900/30 text-red-400'
                      : 'bg-blue-900/30 text-[var(--medical-primary)]'
                  }`}
                >
                  {upload.status === 'completed'
                    ? 'Completed'
                    : upload.status === 'failed'
                    ? 'Failed'
                    : `${upload.progress}%`}
                </span>
              </div>
              {upload.status === 'uploading' && (
                <div className="w-full bg-[var(--bg-secondary)] rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-[var(--medical-primary)] to-[var(--medical-primary-dark)] h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}
              {upload.error && (
                <p className="text-xs text-red-400 mt-1">{upload.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
