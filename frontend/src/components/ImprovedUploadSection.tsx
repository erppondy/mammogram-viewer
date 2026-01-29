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
  const [patientId, setPatientId] = useState('');
  const [patientBirthDate, setPatientBirthDate] = useState('');
  const [patientSex, setPatientSex] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [studyDate, setStudyDate] = useState('');
  const [studyDescription, setStudyDescription] = useState('');
  const [modality, setModality] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  
  // File management
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileTypeInfo, setFileTypeInfo] = useState<FileTypeInfo[]>([]);
  
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

  // Update file type information when files change
  useEffect(() => {
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
    if (!files || files.length === 0) return;

    setError('');
    setSuccess('');
    const filesArray = Array.from(files);
    
    // Check for duplicates based on file name and size
    const duplicates: string[] = [];
    const newFiles: File[] = [];
    
    filesArray.forEach(newFile => {
      const isDuplicate = selectedFiles.some(existingFile => 
        existingFile.name === newFile.name && 
        existingFile.size === newFile.size
      );
      
      if (isDuplicate) {
        duplicates.push(newFile.name);
      } else {
        newFiles.push(newFile);
      }
    });
    
    // Show duplicate warning if any found
    if (duplicates.length > 0) {
      setError(`⚠️ Duplicate files detected and skipped: ${duplicates.join(', ')}`);
    }
    
    // Only add non-duplicate files
    if (newFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...newFiles]);
      
      if (duplicates.length === 0) {
        setSuccess(`✅ Added ${newFiles.length} file${newFiles.length !== 1 ? 's' : ''} successfully`);
      } else {
        setSuccess(`✅ Added ${newFiles.length} new file${newFiles.length !== 1 ? 's' : ''}, skipped ${duplicates.length} duplicate${duplicates.length !== 1 ? 's' : ''}`);
      }
    } else if (duplicates.length > 0) {
      setError(`❌ All selected files are duplicates. No new files added.`);
    }

    // Check for DICOM files in new files only
    const hasDicomExtension = newFiles.some(f => 
      f.name.toLowerCase().endsWith('.dcm') || 
      f.name.toLowerCase().endsWith('.dicom')
    );
    
    if (hasDicomExtension) {
      setHasDicomFiles(true);
    }

    // Reset file input
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
      const filesArray = Array.from(files);
      
      // Check for duplicates based on file name and size
      const duplicates: string[] = [];
      const newFiles: File[] = [];
      
      filesArray.forEach(newFile => {
        const isDuplicate = selectedFiles.some(existingFile => 
          existingFile.name === newFile.name && 
          existingFile.size === newFile.size
        );
        
        if (isDuplicate) {
          duplicates.push(newFile.name);
        } else {
          newFiles.push(newFile);
        }
      });
      
      // Show duplicate warning if any found
      if (duplicates.length > 0) {
        setError(`⚠️ Duplicate files detected and skipped: ${duplicates.join(', ')}`);
      }
      
      // Only add non-duplicate files
      if (newFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...newFiles]);
        
        if (duplicates.length === 0) {
          setSuccess(`✅ Added ${newFiles.length} file${newFiles.length !== 1 ? 's' : ''} successfully`);
        } else {
          setSuccess(`✅ Added ${newFiles.length} new file${newFiles.length !== 1 ? 's' : ''}, skipped ${duplicates.length} duplicate${duplicates.length !== 1 ? 's' : ''}`);
        }
      } else if (duplicates.length > 0) {
        setError(`❌ All dropped files are duplicates. No new files added.`);
      }

      // Check for DICOM files in new files only
      const hasDicomExtension = newFiles.some(f => 
        f.name.toLowerCase().endsWith('.dcm') || 
        f.name.toLowerCase().endsWith('.dicom')
      );
      
      if (hasDicomExtension) {
        setHasDicomFiles(true);
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
    if (metadata.patientId) setPatientId(metadata.patientId);
    if (metadata.patientBirthDate) setPatientBirthDate(metadata.patientBirthDate);
    if (metadata.patientSex) setPatientSex(metadata.patientSex);
    if (metadata.patientAge) setPatientAge(metadata.patientAge);
    if (metadata.studyDate) setStudyDate(metadata.studyDate);
    if (metadata.studyDescription) setStudyDescription(metadata.studyDescription);
    if (metadata.modality) setModality(metadata.modality);
    if (metadata.institutionName) setInstitutionName(metadata.institutionName);
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
  const uploadFile = async (file: File): Promise<void> => {
    const uploadId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    const newUpload: UploadProgress = {
      id: uploadId,
      file,
      progress: 0,
      status: 'extracting',
      statusMessage: 'Preparing upload...',
    };

    setUploadQueue((prev) => [...prev, newUpload]);
    
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
    formData.append('patientId', patientId);
    formData.append('patientBirthDate', patientBirthDate);
    formData.append('patientSex', patientSex);
    formData.append('patientAge', patientAge);
    formData.append('studyDate', studyDate);
    formData.append('studyDescription', studyDescription);
    formData.append('modality', modality);
    formData.append('institutionName', institutionName);
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
            
            setUploadQueue((prev) =>
              prev.map((u) =>
                u.id === uploadId ? { 
                  ...u, 
                  progress: percentCompleted
                } : u
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
    
    if (!patientName && !patientId) {
      setError('Please enter either Patient Name or Patient ID');
      return;
    }
    
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setError('');
    setSuccess('');

    // Initialize upload statistics
    setUploadStats({
      totalFiles: selectedFiles.length,
      completedFiles: 0,
      failedFiles: 0,
      totalSize: selectedFiles.reduce((sum, file) => sum + file.size, 0),
      uploadedSize: 0
    });

    // Track upload statistics
    let successCount = 0;
    let failureCount = 0;
    const failedFiles: string[] = [];

    // Upload files sequentially
    for (let i = 0; i < selectedFiles.length; i++) {
      try {
        await uploadFile(selectedFiles[i]);
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

    // Show final results
    if (failureCount === 0) {
      setSuccess(`✅ Successfully uploaded all ${successCount} file${successCount !== 1 ? 's' : ''} for patient: ${patientName || patientId}`);
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
      setPatientId('');
      setPatientBirthDate('');
      setPatientSex('');
      setPatientAge('');
      setStudyDate('');
      setStudyDescription('');
      setModality('');
      setInstitutionName('');
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
            <span className={`font-semibold ${
              licenseStatus.license.uploadsRemaining <= 0 
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
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 mb-4 ${
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
                </h4>
                <div className="flex gap-2">
                  {/* Show remove duplicates button if duplicates exist */}
                  {(() => {
                    const duplicateGroups = new Map<string, File[]>();
                    selectedFiles.forEach(file => {
                      const key = `${file.name}_${file.size}`;
                      if (!duplicateGroups.has(key)) {
                        duplicateGroups.set(key, []);
                      }
                      duplicateGroups.get(key)!.push(file);
                    });
                    const hasDuplicates = Array.from(duplicateGroups.values()).some(group => group.length > 1);
                    
                    return hasDuplicates && (
                      <button
                        onClick={() => {
                          // Keep only the first occurrence of each file (by name and size)
                          const seen = new Set<string>();
                          const uniqueFiles = selectedFiles.filter(file => {
                            const key = `${file.name}_${file.size}`;
                            if (seen.has(key)) {
                              return false;
                            }
                            seen.add(key);
                            return true;
                          });
                          setSelectedFiles(uniqueFiles);
                          setSuccess(`✅ Removed ${selectedFiles.length - uniqueFiles.length} duplicate file${selectedFiles.length - uniqueFiles.length !== 1 ? 's' : ''}`);
                        }}
                        className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
                      >
                        🧹 Remove Duplicates
                      </button>
                    );
                  })()}
                  <button
                    onClick={addMoreFiles}
                    className="text-xs text-[var(--medical-primary)] hover:text-[var(--medical-primary-dark)] transition-colors"
                  >
                    + Add More
                  </button>
                  <button
                    onClick={handleClearAllFiles}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto bg-[var(--bg-tertiary)] p-3 rounded-lg mb-4">
                {selectedFiles.map((file, index) => {
                  // Check if this file has duplicates (same name and size)
                  const duplicateCount = selectedFiles.filter(f => 
                    f.name === file.name && f.size === file.size
                  ).length;
                  const isDuplicate = duplicateCount > 1;
                  
                  return (
                    <div key={index} className={`flex items-center justify-between text-xs rounded border transition-all ${
                      isDuplicate 
                        ? 'bg-yellow-900/20 border-yellow-500/50 p-3' 
                        : 'bg-[var(--bg-secondary)] border-[var(--border-color)] p-3'
                    }`}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-lg">{getFileIcon(file.name)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="truncate text-[var(--text-primary)] font-medium">{file.name}</div>
                            {isDuplicate && (
                              <span className="text-xs px-1.5 py-0.5 bg-yellow-600/30 text-yellow-400 rounded border border-yellow-500/50" title="Duplicate file detected">
                                ⚠️ x{duplicateCount}
                              </span>
                            )}
                          </div>
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
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
              
              {/* File Summary */}
              <div className="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-color)]">
                <div className="flex justify-between items-center text-sm">
                  <div className="text-[var(--text-secondary)]">
                    📊 File Summary: {fileTypeInfo.map(info => 
                      `${info.count} ${info.extension.toUpperCase()}`
                    ).join(', ')}
                  </div>
                  <div className="text-[var(--text-primary)] font-medium">
                    💾 Total Size: {getTotalSize()}
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
              {(patientName || patientId) && (
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
                  Patient ID {patientId && <span className="text-[var(--medical-secondary)]">✓</span>}
                </label>
                <input
                  type="text"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder="Enter patient ID"
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

            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Institution Name</label>
              <input
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="Enter institution name"
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
            <div className="mb-6 p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-blue-400">Uploading Files</h3>
                    <p className="text-xs text-[var(--text-muted)]">Processing your medical images...</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-[var(--text-primary)]">
                    {uploadQueue.filter(u => u.status === 'completed').length}
                    <span className="text-sm text-[var(--text-muted)]">/{selectedFiles.length}</span>
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">files completed</div>
                </div>
              </div>
              
              <div className="relative">
                <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-blue-400 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out relative"
                    style={{ 
                      width: `${(uploadQueue.filter(u => u.status === 'completed').length / selectedFiles.length) * 100}%` 
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
                <div className="text-xs text-center text-[var(--text-secondary)] mt-2">
                  {Math.round((uploadQueue.filter(u => u.status === 'completed').length / selectedFiles.length) * 100)}% Complete
                </div>
              </div>
            </div>
          )}
          
          {/* Validation Messages */}
          {((!patientName && !patientId) || selectedFiles.length === 0) && (
            <div className="text-xs text-[var(--medical-accent)] mb-3 text-center space-y-1 p-3 bg-yellow-900/10 border border-yellow-500/30 rounded-lg">
              {!patientName && !patientId && (
                <p>⚠ Please enter Patient Name or ID</p>
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
              (!patientName && !patientId) || 
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
          <div className="bg-[var(--bg-secondary)] p-6 rounded-xl border border-[var(--border-color)] shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[var(--medical-primary)]/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-[var(--medical-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">Upload Queue</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{uploadQueue.length} file{uploadQueue.length !== 1 ? 's' : ''} in queue</p>
                </div>
              </div>
              {uploadQueue.some((u) => u.status !== 'uploading' && u.status !== 'queued') && (
                <GradientButton
                  onClick={handleClearCompleted}
                  variant="secondary"
                  size="sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear Completed
                </GradientButton>
              )}
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {uploadQueue.map((upload) => (
                <div
                  key={upload.id}
                  className={`border rounded-xl p-4 transition-all duration-300 ${
                    upload.status === 'completed'
                      ? 'border-green-500/50 bg-green-900/10'
                      : upload.status === 'failed'
                      ? 'border-red-500/50 bg-red-900/10'
                      : upload.status === 'extracting'
                      ? 'border-purple-500/50 bg-purple-900/10'
                      : 'border-blue-500/50 bg-blue-900/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                        upload.status === 'completed'
                          ? 'bg-green-500/20'
                          : upload.status === 'failed'
                          ? 'bg-red-500/20'
                          : upload.status === 'extracting'
                          ? 'bg-purple-500/20'
                          : 'bg-blue-500/20'
                      }`}>
                        {getFileIcon(upload.file.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[var(--text-primary)] truncate text-sm">
                          {upload.file.name}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          {formatFileSize(upload.file.size)}
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 ${
                      upload.status === 'completed'
                        ? 'bg-green-500/20 text-green-400'
                        : upload.status === 'failed'
                        ? 'bg-red-500/20 text-red-400'
                        : upload.status === 'extracting'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {upload.status === 'completed' && (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Completed
                        </>
                      )}
                      {upload.status === 'failed' && (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Failed
                        </>
                      )}
                      {upload.status === 'extracting' && (
                        <>
                          <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Processing
                        </>
                      )}
                      {upload.status === 'uploading' && (
                        <>
                          <svg className="w-3 h-3 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          {upload.progress}%
                        </>
                      )}
                    </div>
                  </div>
                  
                  {upload.statusMessage && upload.status !== 'completed' && upload.status !== 'failed' && (
                    <div className="mb-3">
                      <p className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                        <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {upload.statusMessage}
                      </p>
                    </div>
                  )}
                  
                  {(upload.status === 'uploading' || upload.status === 'extracting') && (
                    <div className="relative">
                      <div className="w-full bg-[var(--bg-secondary)] rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            upload.status === 'extracting'
                              ? 'bg-gradient-to-r from-purple-500 to-purple-600 animate-pulse'
                              : 'bg-gradient-to-r from-blue-500 to-blue-600'
                          }`}
                          style={{ width: upload.status === 'extracting' ? '60%' : `${upload.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {upload.error && (
                    <div className="mt-3 p-2 bg-red-900/20 border border-red-500/30 rounded-lg">
                      <p className="text-xs text-red-400 flex items-center gap-2">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {upload.error}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}