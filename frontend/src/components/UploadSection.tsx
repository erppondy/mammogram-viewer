import { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import GradientButton from './GradientButton';
import { authService, LicenseStatus } from '../services/authService';
import UploadQuotaWarning from './UploadQuotaWarning';

interface UploadSectionProps {
  onUploadComplete: () => void;
}

interface UploadProgress {
  id: string;
  file: File;
  progress: number;
  status: 'queued' | 'uploading' | 'completed' | 'failed' | 'extracting';
  error?: string;
  statusMessage?: string;
}

interface DicomMetadata {
  patientName?: string;
  patientId?: string;
  patientBirthDate?: string;
  patientSex?: string;
  patientAge?: string;
  studyDate?: string;
  studyDescription?: string;
  modality?: string;
  institutionName?: string;
  fileName?: string;
}

interface FileTypeInfo {
  extension: string;
  count: number;
  totalSize: number;
}

export default function ImprovedUploadSection({ onUploadComplete }: UploadSectionProps) {
  // Core state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadProgress[]>([]);

  // Patient information
  const [patientName, setPatientName] = useState('');
  const [hmisId, setHmisId] = useState('');
  const [patientBirthDate, setPatientBirthDate] = useState('');
  const [patientSex, setPatientSex] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [studyDate, setStudyDate] = useState('');
  const [studyDescription, setStudyDescription] = useState('');
  const [modality, setModality] = useState('');

  // File management
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileTypeInfo, setFileTypeInfo] = useState<FileTypeInfo[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [duplicateFiles, setDuplicateFiles] = useState<string[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  // DICOM handling
  const [useDicomMetadata, setUseDicomMetadata] = useState(false);
  const [dicomMetadata, setDicomMetadata] = useState<DicomMetadata | null>(null);
  const [isExtractingMetadata, setIsExtractingMetadata] = useState(false);
  const [hasDicomFiles, setHasDicomFiles] = useState(false);
  const [showDicomPrompt, setShowDicomPrompt] = useState(false);
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [uniquePatients, setUniquePatients] = useState<DicomMetadata[]>([]);

  // License management
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [isLoadingLicense, setIsLoadingLicense] = useState(true);

  // Upload statistics
  const [uploadStats, setUploadStats] = useState({
    totalFiles: 0,
    completedFiles: 0,
    failedFiles: 0,
    totalSize: 0,
    uploadedSize: 0
  });

  // Upload progress modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [modalStats, setModalStats] = useState({
    currentFile: '',
    filesCompleted: 0,
    totalFiles: 0,
    totalSize: 0,
    uploadedSize: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Computed values
  const isUploading = uploadQueue.some((u) => u.status === 'uploading');
  const isQuotaExceeded = licenseStatus?.hasLicense &&
    licenseStatus.license &&
    licenseStatus.license.uploadsRemaining <= 0;
  const isLicenseInvalid = licenseStatus?.hasLicense &&
    licenseStatus.license &&
    (licenseStatus.license.status === 'expired' || licenseStatus.license.status === 'revoked');

  // Fetch license status on component mount
  useEffect(() => {
    const fetchLicenseStatus = async () => {
      try {
        setIsLoadingLicense(true);
        const status = await authService.getLicenseStatus();
        setLicenseStatus(status);
      } catch (err) {
        console.error('Failed to fetch license status:', err);
        setLicenseStatus({ hasLicense: false, license: null });
      } finally {
        setIsLoadingLicense(false);
      }
    };

    fetchLicenseStatus();
  }, []);

  // Update file type information when files change (debounced)
  useEffect(() => {
    if (selectedFiles.length === 0) {
      setFileTypeInfo([]);
      return;
    }

    // Debounce file processing to avoid UI freezing
    const timeoutId = setTimeout(() => {
      setIsProcessingFiles(true);

      // Use requestIdleCallback for better performance
      const processFiles = () => {
        const typeMap = new Map<string, { count: number; totalSize: number }>();

        selectedFiles.forEach(file => {
          const extension = file.name.split('.').pop()?.toLowerCase() || 'unknown';
          const current = typeMap.get(extension) || { count: 0, totalSize: 0 };
          typeMap.set(extension, {
            count: current.count + 1,
            totalSize: current.totalSize + file.size
          });
        });

        const typeInfo: FileTypeInfo[] = Array.from(typeMap.entries()).map(([ext, info]) => ({
          extension: ext,
          count: info.count,
          totalSize: info.totalSize
        }));

        setFileTypeInfo(typeInfo);
        setIsProcessingFiles(false);
      };

      // Use requestIdleCallback if available, otherwise setTimeout
      if (window.requestIdleCallback) {
        window.requestIdleCallback(processFiles);
      } else {
        setTimeout(processFiles, 0);
      }
    }, 100); // 100ms debounce

    return () => clearTimeout(timeoutId);
  }, [selectedFiles]);

  // File management functions
  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleClearAllFiles = () => {
    setSelectedFiles([]);
    setHasDicomFiles(false);
    setDicomMetadata(null);
    setUseDicomMetadata(false);
    setShowDicomPrompt(false);
    setShowPatientSelector(false);
  };

  const addMoreFiles = () => {
    fileInputRef.current?.click();
  };

  // File selection handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log('File selection event triggered');
    console.log('Number of files selected:', files?.length || 0);

    if (!files || files.length === 0) {
      console.log('No files selected or files is null');
      return;
    }

    console.log('Files selected:', Array.from(files).map(f => f.name));

    setError('');
    setSuccess('');

    // Show processing state for large file selections
    if (files.length > 4) {
      setIsProcessingFiles(true);
    }

    // Process files in chunks to avoid UI blocking
    const processFilesInChunks = async (fileList: FileList) => {
      const filesArray: File[] = [];
      const chunkSize = 10; // Process 10 files at a time

      for (let i = 0; i < fileList.length; i += chunkSize) {
        const chunk = Array.from(fileList).slice(i, i + chunkSize);
        filesArray.push(...chunk);

        // Yield control back to the browser
        if (i + chunkSize < fileList.length) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      return filesArray;
    };

    try {
      const filesArray = await processFilesInChunks(files);
      console.log('Processed files array:', filesArray.length);

      // Add to existing files instead of replacing
      setSelectedFiles(prev => {
        const newFiles = [...prev, ...filesArray];
        console.log('Total files after adding:', newFiles.length);
        return newFiles;
      });

      // Check for DICOM files (optimized)
      const hasDicomExtension = filesArray.some(f => {
        const name = f.name.toLowerCase();
        return name.endsWith('.dcm') || name.endsWith('.dicom');
      });

      if (hasDicomExtension) {
        setHasDicomFiles(true);
      }

      // Reset file input to allow selecting same files again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error processing files:', error);
      setError('Error processing selected files. Please try again.');
    } finally {
      setIsProcessingFiles(false);
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

      // Show processing state for large file drops
      if (files.length > 4) {
        setIsProcessingFiles(true);
      }

      try {
        // Process files in chunks for better performance
        const processFilesInChunks = async (fileList: FileList) => {
          const filesArray: File[] = [];
          const chunkSize = 10;

          for (let i = 0; i < fileList.length; i += chunkSize) {
            const chunk = Array.from(fileList).slice(i, i + chunkSize);
            filesArray.push(...chunk);

            // Yield control back to the browser
            if (i + chunkSize < fileList.length) {
              await new Promise(resolve => setTimeout(resolve, 0));
            }
          }

          return filesArray;
        };

        const filesArray = await processFilesInChunks(files);

        // Add to existing files
        setSelectedFiles(prev => [...prev, ...filesArray]);

        // Check for DICOM files (optimized)
        const hasDicomExtension = filesArray.some(f => {
          const name = f.name.toLowerCase();
          return name.endsWith('.dcm') || name.endsWith('.dicom');
        });

        if (hasDicomExtension) {
          setHasDicomFiles(true);
        }
      } catch (error) {
        console.error('Error processing dropped files:', error);
        setError('Error processing dropped files. Please try again.');
      } finally {
        setIsProcessingFiles(false);
      }
    }
  };

  // DICOM metadata extraction
  const extractDicomMetadata = async (file: File): Promise<DicomMetadata | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload/extract-metadata', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success && response.data.data.isDicom) {
        const metadata = response.data.data.metadata;
        return { ...metadata, fileName: file.name };
      }
      return null;
    } catch (err: any) {
      console.error('Failed to extract DICOM metadata from', file.name);
      return null;
    }
  };

  const extractAllDicomMetadata = async () => {
    setIsExtractingMetadata(true);
    setError('');

    try {
      const dicomFiles = selectedFiles.filter(f =>
        f.name.toLowerCase().endsWith('.dcm') ||
        f.name.toLowerCase().endsWith('.dicom')
      );

      const metadataPromises = dicomFiles.map(file => extractDicomMetadata(file));
      const allMetadata = await Promise.all(metadataPromises);

      const dicomMetadataList = allMetadata.filter((m): m is DicomMetadata => m !== null);

      if (dicomMetadataList.length === 0) {
        setError('No DICOM metadata found in selected files');
        return;
      }

      // Check for unique patients
      const uniquePatientsMap = new Map<string, DicomMetadata>();

      dicomMetadataList.forEach(metadata => {
        const patientKey = `${metadata.patientName || 'UNKNOWN'}_${metadata.patientId || 'UNKNOWN'}`;
        if (!uniquePatientsMap.has(patientKey)) {
          uniquePatientsMap.set(patientKey, metadata);
        }
      });

      const uniquePatientsList = Array.from(uniquePatientsMap.values());

      if (uniquePatientsList.length > 1) {
        setUniquePatients(uniquePatientsList);
        setShowPatientSelector(true);
      } else {
        const metadata = dicomMetadataList[0];
        setDicomMetadata(metadata);
        setUseDicomMetadata(true);
        applyDicomMetadata(metadata);
        setSuccess('✓ DICOM metadata extracted and form filled successfully!');
      }
    } catch (error) {
      console.error('Error during metadata extraction:', error);
      setError('Failed to extract DICOM metadata. Please enter patient data manually.');
    } finally {
      setIsExtractingMetadata(false);
    }
  };

  const applyDicomMetadata = (metadata: DicomMetadata) => {
    if (metadata.patientName) setPatientName(metadata.patientName);
    if (metadata.patientId) setHmisId(metadata.patientId);
    if (metadata.patientBirthDate) setPatientBirthDate(metadata.patientBirthDate);
    if (metadata.patientSex) setPatientSex(metadata.patientSex);
    if (metadata.patientAge) setPatientAge(metadata.patientAge);
    if (metadata.studyDate) setStudyDate(metadata.studyDate);
    if (metadata.studyDescription) setStudyDescription(metadata.studyDescription);
    if (metadata.modality) setModality(metadata.modality);
  };

  const handleUseDicomData = () => {
    if (dicomMetadata) {
      setUseDicomMetadata(true);
      applyDicomMetadata(dicomMetadata);
      setShowDicomPrompt(false);
    }
  };

  const handleUseManualEntry = () => {
    setUseDicomMetadata(false);
    setShowDicomPrompt(false);
  };

  const handleSelectPatient = (metadata: DicomMetadata) => {
    setDicomMetadata(metadata);
    setUseDicomMetadata(true);
    applyDicomMetadata(metadata);
    setShowPatientSelector(false);
  };

  // Upload functions
  const uploadFile = async (file: File, fileIndex: number): Promise<void> => {
    const uploadId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

    const newUpload: UploadProgress = {
      id: uploadId,
      file,
      progress: 0,
      status: 'extracting',
      statusMessage: 'Preparing upload...',
    };

    setUploadQueue((prev) => [...prev, newUpload]);

    // Update modal with current file
    setModalStats(prev => ({
      ...prev,
      currentFile: file.name,
      filesCompleted: fileIndex
    }));

    // Show extracting status for DICOM files
    const isDicomFile = file.name.toLowerCase().endsWith('.dcm') || file.name.toLowerCase().endsWith('.dicom');
    if (isDicomFile) {
      setUploadQueue((prev) =>
        prev.map((u) =>
          u.id === uploadId ? { ...u, statusMessage: 'Extracting DICOM metadata...' } : u
        )
      );
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Update to uploading status
    setUploadQueue((prev) =>
      prev.map((u) =>
        u.id === uploadId ? { ...u, status: 'uploading' as const, statusMessage: 'Uploading...' } : u
      )
    );

    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientName', patientName);
    formData.append('patientId', hmisId);
    formData.append('patientBirthDate', patientBirthDate);
    formData.append('patientSex', patientSex);
    formData.append('patientAge', patientAge);
    formData.append('studyDate', studyDate);
    formData.append('studyDescription', studyDescription);
    formData.append('modality', modality);
    formData.append('metadataSource', useDicomMetadata && hasDicomFiles ? 'dicom' : 'manual');

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

            // Update individual file progress
            setUploadQueue((prev) =>
              prev.map((u) =>
                u.id === uploadId ? {
                  ...u,
                  progress: percentCompleted
                } : u
              )
            );

            // Update modal stats
            setModalStats(prev => {
              const newUploadedSize = prev.uploadedSize - (prev.uploadedSize % file.size) + progressEvent.loaded;
              return {
                ...prev,
                uploadedSize: newUploadedSize
              };
            });
          }
        },
      });

      setUploadQueue((prev) =>
        prev.map((u) =>
          u.id === uploadId ? { ...u, status: 'completed' as const } : u
        )
      );

      // Update modal - file completed
      setModalStats(prev => ({
        ...prev,
        filesCompleted: fileIndex + 1
      }));

    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Upload failed';
      setUploadQueue((prev) =>
        prev.map((u) =>
          u.id === uploadId
            ? {
              ...u,
              status: 'failed' as const,
              error: errorMessage,
            }
            : u
        )
      );
      throw new Error(errorMessage);
    }
  };

  const handleStartUpload = async () => {
    // Validation
    if (isLicenseInvalid) {
      setError('Your license is no longer valid. Please contact your administrator.');
      return;
    }

    if (isQuotaExceeded) {
      setError('Upload quota exceeded. Please contact your administrator to increase your quota.');
      return;
    }

    if (licenseStatus?.hasLicense && licenseStatus.license) {
      const remainingQuota = licenseStatus.license.uploadsRemaining;
      if (selectedFiles.length > remainingQuota) {
        setError(`Cannot upload ${selectedFiles.length} files. Only ${remainingQuota} upload${remainingQuota !== 1 ? 's' : ''} remaining in your quota.`);
        return;
      }
    }

    if (!patientName && !hmisId) {
      setError('Please enter either Patient Name or HMIS ID');
      return;
    }

    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setError('');
    setSuccess('');

    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);

    // Initialize upload statistics
    setUploadStats({
      totalFiles: selectedFiles.length,
      completedFiles: 0,
      failedFiles: 0,
      totalSize,
      uploadedSize: 0
    });

    // Initialize modal stats
    setModalStats({
      currentFile: '',
      filesCompleted: 0,
      totalFiles: selectedFiles.length,
      totalSize,
      uploadedSize: 0
    });

    // Show upload modal
    setShowUploadModal(true);

    // Track upload statistics
    let successCount = 0;
    let failureCount = 0;
    const failedFiles: string[] = [];

    // Upload files sequentially
    for (let i = 0; i < selectedFiles.length; i++) {
      try {
        await uploadFile(selectedFiles[i], i);
        successCount++;

        // Update statistics
        setUploadStats(prev => ({
          ...prev,
          completedFiles: successCount,
          uploadedSize: prev.uploadedSize + selectedFiles[i].size
        }));

        // Show intermediate progress for large batches
        if (selectedFiles.length > 5 && (i + 1) % 5 === 0) {
          setSuccess(`Uploaded ${i + 1} of ${selectedFiles.length} files...`);
        }
      } catch (error) {
        failureCount++;
        failedFiles.push(selectedFiles[i].name);
        console.error(`Failed to upload ${selectedFiles[i].name}:`, error);

        setUploadStats(prev => ({
          ...prev,
          failedFiles: failureCount
        }));
      }
    }

    // Hide upload modal after completion
    setTimeout(() => {
      setShowUploadModal(false);
    }, 2000);

    // Show final results
    if (failureCount === 0) {
      setSuccess(`✅ Successfully uploaded all ${successCount} file${successCount !== 1 ? 's' : ''} for patient: ${patientName || hmisId}`);
    } else if (successCount > 0) {
      setSuccess(`⚠️ Uploaded ${successCount} file${successCount !== 1 ? 's' : ''} successfully. ${failureCount} file${failureCount !== 1 ? 's' : ''} failed.`);
      setError(`Failed files: ${failedFiles.join(', ')}`);
    } else {
      setError(`❌ All ${failureCount} file${failureCount !== 1 ? 's' : ''} failed to upload. Please check your files and try again.`);
    }

    // Refresh license status after upload
    try {
      const updatedStatus = await authService.getLicenseStatus();
      setLicenseStatus(updatedStatus);
    } catch (err) {
      console.error('Failed to refresh license status:', err);
    }

    // Only clear form if at least some uploads succeeded
    if (successCount > 0) {
      setSelectedFiles([]);
      setPatientName('');
      setHmisId('');
      setPatientBirthDate('');
      setPatientSex('');
      setPatientAge('');
      setStudyDate('');
      setStudyDescription('');
      setModality('');
      setDicomMetadata(null);
      setHasDicomFiles(false);
      onUploadComplete();
    }
  };

  const handleClearCompleted = () => {
    setUploadQueue((prev) => prev.filter((u) => u.status === 'uploading' || u.status === 'queued'));
  };

  // Utility functions
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'dcm':
      case 'dicom':
        return '🏥';
      case 'jpg':
      case 'jpeg':
        return '🖼️';
      case 'png':
        return '🖼️';
      case 'tiff':
      case 'tif':
        return '🖼️';
      case 'zip':
        return '📦';
      default:
        return '📄';
    }
  };

  const getTotalSize = (): string => {
    const total = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    return formatFileSize(total);
  };

  return (
    <div className="medical-card p-6 mb-8 scan-line-container">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] flex items-center">
          <svg className="w-6 h-6 mr-2 text-[var(--medical-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload X-Ray Images
        </h2>

        {/* Display remaining quota for ambulance users */}
        {licenseStatus?.hasLicense && licenseStatus.license && (
          <div className="text-sm">
            <span className="text-[var(--text-muted)]">Quota: </span>
            <span className={`font-semibold ${licenseStatus.license.uploadsRemaining <= 0
              ? 'text-red-400'
              : licenseStatus.license.quotaUsagePercent >= 80
                ? 'text-yellow-400'
                : 'text-green-400'
              }`}>
              {licenseStatus.license.uploadsRemaining}
            </span>
            <span className="text-[var(--text-muted)]"> / {licenseStatus.license.uploadQuota} remaining</span>
          </div>
        )}
      </div>

      {/* Upload Quota Warning */}
      {licenseStatus?.hasLicense && licenseStatus.license && licenseStatus.license.quotaUsagePercent >= 80 && (
        <UploadQuotaWarning
          uploadsRemaining={licenseStatus.license.uploadsRemaining}
          uploadQuota={licenseStatus.license.uploadQuota}
          quotaUsagePercent={licenseStatus.license.quotaUsagePercent}
        />
      )}

      {/* Error and Success Messages */}
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

      {/* DICOM Patient Selector */}
      {showPatientSelector && uniquePatients.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-yellow-400 font-medium mb-2">Multiple Patients Detected</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                Your selected files contain data for {uniquePatients.length} different patients. Please select which patient's data to use:
              </p>
              <div className="space-y-2 mb-3">
                {uniquePatients.map((patient, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectPatient(patient)}
                    className="w-full bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--medical-primary)] rounded-lg p-3 text-left transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-[var(--text-primary)] mb-1">
                          {patient.patientName || 'Unknown Name'}
                          {patient.patientId && <span className="text-[var(--text-muted)] ml-2">ID: {patient.patientId}</span>}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] space-x-3">
                          {patient.patientSex && <span>Sex: {patient.patientSex}</span>}
                          {patient.patientAge && <span>Age: {patient.patientAge}</span>}
                          {patient.modality && <span>Modality: {patient.modality}</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <GradientButton
                onClick={() => setShowPatientSelector(false)}
                variant="secondary"
                size="sm"
                fullWidth
              >
                Cancel - Enter Manually
              </GradientButton>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Step 1: File Selection */}
        <div className="bg-[var(--bg-secondary)] p-6 rounded-lg border border-[var(--border-color)]">
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">
            📤 Step 1: Upload Images
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Upload all images for this study (DICOM, JPEG, PNG, ZIP supported). Any number allowed.
          </p>



          {/* Drag & Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 mb-4 ${isDragging
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
            />
            <label htmlFor="file-upload" className="cursor-pointer">
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
                    Click to select files
                  </span>{' '}
                  or drag and drop
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  DICOM, AAN, JPEG, PNG, TIFF, or ZIP files (multiple files supported)
                </p>
              </div>
            </label>
          </div>

          {/* Selected Files Display */}
          {selectedFiles.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium text-[var(--text-primary)]">
                  Selected Files ({selectedFiles.length} image{selectedFiles.length !== 1 ? 's' : ''}):
                  {isProcessingFiles && (
                    <span className="ml-2 text-xs text-[var(--medical-primary)]">
                      <svg className="animate-spin h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  )}
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={addMoreFiles}
                    className="text-xs text-[var(--medical-primary)] hover:text-[var(--medical-primary-dark)] transition-colors"
                    disabled={isProcessingFiles}
                  >
                    + Add More
                  </button>
                  <button
                    onClick={handleClearAllFiles}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    disabled={isProcessingFiles}
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto bg-[var(--bg-tertiary)] p-3 rounded-lg mb-4">
                {selectedFiles.length > 20 ? (
                  // For large numbers of files, show a simplified list
                  <div className="text-center py-4">
                    <div className="text-sm text-[var(--text-primary)] mb-2">
                      {selectedFiles.length} files selected
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      File list hidden for performance. Use "Clear All" to remove all files.
                    </div>
                  </div>
                ) : (
                  // For smaller numbers, show the full list
                  selectedFiles.map((file, index) => (
                    <div key={`${file.name}-${file.size}-${index}`} className="flex items-center justify-between text-xs bg-[var(--bg-secondary)] p-3 rounded border border-[var(--border-color)]">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-lg">{getFileIcon(file.name)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-[var(--text-primary)] font-medium">{file.name}</div>
                          <div className="text-[var(--text-muted)] flex gap-3">
                            <span>{formatFileSize(file.size)}</span>
                            <span>{file.type || 'Unknown type'}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="ml-2 text-red-400 hover:text-red-300 transition-colors p-1"
                        title="Remove file"
                        disabled={isProcessingFiles}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* File Summary */}
              <div className="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-color)]">
                <div className="flex justify-between items-center text-sm">
                  <div className="text-[var(--text-secondary)]">
                    📊 File Summary: {isProcessingFiles ? (
                      <span className="text-[var(--medical-primary)]">
                        <svg className="animate-spin h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Calculating...
                      </span>
                    ) : (
                      fileTypeInfo.map(info =>
                        `${info.count} ${info.extension.toUpperCase()}`
                      ).join(', ')
                    )}
                  </div>
                  <div className="text-[var(--text-primary)] font-medium">
                    💾 Total Size: {isProcessingFiles ? 'Calculating...' : getTotalSize()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Patient Information */}
        <div className="bg-[var(--bg-secondary)] p-6 rounded-lg border border-[var(--border-color)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-[var(--text-primary)]">
              👤 Step 2: Patient Information
              {(patientName || hmisId) && (
                <span className="ml-2 text-xs text-[var(--medical-secondary)]">✓</span>
              )}
            </h3>

            {useDicomMetadata && hasDicomFiles && (
              <span className="text-xs px-2 py-1 bg-blue-900/30 text-blue-400 rounded">
                Using DICOM Data
              </span>
            )}
          </div>

          {/* DICOM Auto-Detection */}
          {hasDicomFiles && selectedFiles.length > 0 && !useDicomMetadata && (
            <div className="mb-4 p-4 bg-blue-900/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-lg">🔍</span>
                <div>
                  <h4 className="text-sm font-medium text-blue-400">DICOM Auto-Detection</h4>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {selectedFiles.filter(f => f.name.toLowerCase().endsWith('.dcm') || f.name.toLowerCase().endsWith('.dicom')).length} DICOM files detected
                  </p>
                </div>
              </div>
              <GradientButton
                onClick={extractAllDicomMetadata}
                variant="info"
                size="sm"
                disabled={isExtractingMetadata}
                fullWidth
              >
                {isExtractingMetadata ? (
                  <>
                    <svg className="animate-spin h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Extracting Patient Data...
                  </>
                ) : (
                  <>
                    📋 Extract Patient Data from DICOM
                  </>
                )}
              </GradientButton>
            </div>
          )}

          {/* Patient Information Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">
                  Patient Name {patientName && <span className="text-[var(--medical-secondary)]">✓</span>}
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter patient name"
                  disabled={useDicomMetadata}
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--medical-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">
                  HMIS ID {hmisId && <span className="text-[var(--medical-secondary)]">✓</span>}
                </label>
                <input
                  type="text"
                  value={hmisId}
                  onChange={(e) => setHmisId(e.target.value)}
                  placeholder="Enter HMIS ID"
                  disabled={useDicomMetadata}
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--medical-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Birth Date</label>
                <input
                  type="date"
                  value={patientBirthDate}
                  onChange={(e) => setPatientBirthDate(e.target.value)}
                  disabled={useDicomMetadata}
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--medical-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Sex</label>
                <select
                  value={patientSex}
                  onChange={(e) => setPatientSex(e.target.value)}
                  disabled={useDicomMetadata}
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--medical-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Age</label>
                <input
                  type="text"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  placeholder="e.g., 45Y"
                  disabled={useDicomMetadata}
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--medical-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Study Date</label>
                <input
                  type="date"
                  value={studyDate}
                  onChange={(e) => setStudyDate(e.target.value)}
                  disabled={useDicomMetadata}
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--medical-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Modality</label>
                <input
                  type="text"
                  value={modality}
                  onChange={(e) => setModality(e.target.value)}
                  placeholder="e.g., MG, CR, DX"
                  disabled={useDicomMetadata}
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--medical-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Study Description</label>
              <input
                type="text"
                value={studyDescription}
                onChange={(e) => setStudyDescription(e.target.value)}
                placeholder="Enter study description"
                disabled={useDicomMetadata}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--medical-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Upload Button and Progress */}
        <div>
          {/* Batch Upload Progress */}
          {isUploading && selectedFiles.length > 1 && (
            <div className="mb-4 p-4 bg-blue-900/10 border border-blue-500/30 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-blue-400 font-medium">🚀 Batch Upload Progress</span>
                <span className="text-xs text-[var(--text-muted)]">
                  {uploadQueue.filter(u => u.status === 'completed').length} / {selectedFiles.length} completed
                </span>
              </div>
              <div className="w-full bg-[var(--bg-secondary)] rounded-full h-3 mb-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${(uploadQueue.filter(u => u.status === 'completed').length / selectedFiles.length) * 100}%`
                  }}
                />
              </div>
              <div className="text-xs text-center text-[var(--text-secondary)] mt-2">
                {Math.round((uploadQueue.filter(u => u.status === 'completed').length / selectedFiles.length) * 100)}% Complete
              </div>
            </div>
          )}

          {/* Validation Messages */}
          {((!patientName && !hmisId) || selectedFiles.length === 0) && (
            <div className="text-xs text-[var(--medical-accent)] mb-3 text-center space-y-1 p-3 bg-yellow-900/10 border border-yellow-500/30 rounded-lg">
              {!patientName && !hmisId && (
                <p>⚠ Please enter Patient Name or HMIS ID</p>
              )}
              {selectedFiles.length === 0 && (
                <p>⚠ Please select at least one file</p>
              )}
            </div>
          )}

          {/* Upload Button */}
          <GradientButton
            onClick={handleStartUpload}
            disabled={
              (!patientName && !hmisId) ||
              selectedFiles.length === 0 ||
              isUploading ||
              isQuotaExceeded ||
              isLicenseInvalid ||
              isLoadingLicense
            }
            variant="primary"
            size="lg"
            fullWidth
          >
            {isLoadingLicense
              ? 'Loading...'
              : isQuotaExceeded
                ? 'Quota Exceeded'
                : isLicenseInvalid
                  ? 'License Invalid'
                  : isUploading
                    ? `Uploading... (${uploadQueue.filter(u => u.status === 'completed').length}/${selectedFiles.length})`
                    : selectedFiles.length > 0
                      ? `🚀 Upload ${selectedFiles.length} Image${selectedFiles.length !== 1 ? 's' : ''}`
                      : 'Upload Images'}
          </GradientButton>
        </div>

        {/* Upload Queue */}
        {uploadQueue.length > 0 && (
          <div className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-[var(--text-primary)]">
                📋 Upload Queue ({uploadQueue.length})
              </h3>
              {uploadQueue.some((u) => u.status !== 'uploading' && u.status !== 'queued') && (
                <GradientButton
                  onClick={handleClearCompleted}
                  variant="secondary"
                  size="xs"
                >
                  Clear Completed
                </GradientButton>
              )}
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {uploadQueue.map((upload) => (
                <div
                  key={upload.id}
                  className="border border-[var(--border-color)] rounded-lg p-3 bg-[var(--bg-tertiary)]"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-sm">{getFileIcon(upload.file.name)}</span>
                      <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {upload.file.name}
                      </span>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${upload.status === 'completed'
                        ? 'bg-green-900/30 text-green-400'
                        : upload.status === 'failed'
                          ? 'bg-red-900/30 text-red-400'
                          : upload.status === 'extracting'
                            ? 'bg-purple-900/30 text-purple-400'
                            : 'bg-blue-900/30 text-[var(--medical-primary)]'
                        }`}
                    >
                      {upload.status === 'completed'
                        ? '✅ Completed'
                        : upload.status === 'failed'
                          ? '❌ Failed'
                          : upload.status === 'extracting'
                            ? '📋 Extracting...'
                            : `${upload.progress}%`}
                    </span>
                  </div>

                  {upload.statusMessage && upload.status !== 'completed' && upload.status !== 'failed' && (
                    <p className="text-xs text-[var(--text-secondary)] mb-2">
                      {upload.statusMessage}
                    </p>
                  )}

                  {(upload.status === 'uploading' || upload.status === 'extracting') && (
                    <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${upload.status === 'extracting'
                          ? 'bg-gradient-to-r from-purple-500 to-purple-700 animate-pulse'
                          : 'bg-gradient-to-r from-[var(--medical-primary)] to-[var(--medical-primary-dark)]'
                          }`}
                        style={{ width: upload.status === 'extracting' ? '50%' : `${upload.progress}%` }}
                      />
                    </div>
                  )}

                  {upload.error && (
                    <p className="text-xs text-red-400 mt-1">{upload.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload Progress Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-8 max-w-lg w-full mx-4 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[var(--medical-primary)]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[var(--medical-primary)] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                Uploading Medical Images
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Processing your files securely...
              </p>
            </div>

            {/* Overall Progress */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-[var(--text-primary)]">Upload Progress</span>
                <span className="text-sm text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-1 rounded">
                  {modalStats.filesCompleted} / {modalStats.totalFiles} files
                </span>
              </div>
              <div className="w-full bg-[var(--bg-secondary)] rounded-full h-4 mb-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[var(--medical-primary)] via-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500 ease-out relative"
                  style={{
                    width: `${modalStats.totalFiles > 0 ? (modalStats.filesCompleted / modalStats.totalFiles) * 100 : 0}%`
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-[var(--medical-primary)]">
                  {Math.round(modalStats.totalFiles > 0 ? (modalStats.filesCompleted / modalStats.totalFiles) * 100 : 0)}%
                </span>
                <span className="text-sm text-[var(--text-secondary)] ml-1">Complete</span>
              </div>
            </div>

            {/* Current File */}
            {modalStats.currentFile && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-blue-400 font-medium mb-1">Currently Processing</div>
                    <div className="text-sm text-[var(--text-primary)] truncate font-medium">
                      {modalStats.currentFile}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Total Size */}
              <div className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)]">
                <div className="text-xs text-[var(--text-muted)] mb-2">Total Size</div>
                <div className="text-lg font-semibold text-[var(--text-primary)]">
                  {formatFileSize(modalStats.totalSize)}
                </div>
              </div>

              {/* Uploaded Size */}
              <div className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)]">
                <div className="text-xs text-[var(--text-muted)] mb-2">Uploaded</div>
                <div className="text-lg font-semibold text-green-400">
                  {formatFileSize(modalStats.uploadedSize)}
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="text-center pt-4 border-t border-[var(--border-color)]">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-6 py-2 text-sm bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg transition-all duration-200 hover:border-[var(--medical-primary)]"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <svg className="w-4 h-4 inline mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  'Hide Progress'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}