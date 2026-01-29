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
  status: 'uploading' | 'completed' | 'failed' | 'extracting';
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

export default function UploadSection({ onUploadComplete }: UploadSectionProps) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadProgress[]>([]);
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patientBirthDate, setPatientBirthDate] = useState('');
  const [patientSex, setPatientSex] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [studyDate, setStudyDate] = useState('');
  const [studyDescription, setStudyDescription] = useState('');
  const [modality, setModality] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [useDicomMetadata, setUseDicomMetadata] = useState(false);
  const [dicomMetadata, setDicomMetadata] = useState<DicomMetadata | null>(null);
  const [isExtractingMetadata, setIsExtractingMetadata] = useState(false);
  const [hasDicomFiles, setHasDicomFiles] = useState(false);
  const [showDicomPrompt, setShowDicomPrompt] = useState(false);
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [uniquePatients, setUniquePatients] = useState<DicomMetadata[]>([]);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [isLoadingLicense, setIsLoadingLicense] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploading = uploadQueue.some((u) => u.status === 'uploading');
  
  // Check if license quota is exceeded
  const isQuotaExceeded = licenseStatus?.hasLicense && 
    licenseStatus.license && 
    licenseStatus.license.uploadsRemaining <= 0;
  
  // Check if license is expired or revoked
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
        // If license fetch fails, assume no license (regular user)
        setLicenseStatus({ hasLicense: false, license: null });
      } finally {
        setIsLoadingLicense(false);
      }
    };

    fetchLicenseStatus();
  }, []);

  const extractDicomMetadata = async (file: File): Promise<DicomMetadata | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('[UploadSection] Extracting metadata from:', file.name);
      console.log('[UploadSection] File size:', file.size, 'bytes');
      const response = await api.post('/upload/extract-metadata', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('[UploadSection] Metadata response:', response.data);
      
      if (response.data.success && response.data.data.isDicom) {
        const metadata = response.data.data.metadata;
        console.log('[UploadSection] DICOM metadata extracted:', metadata);
        return { ...metadata, fileName: file.name };
      }
      console.log('[UploadSection] File is not DICOM or no metadata');
      return null;
    } catch (err: any) {
      console.error('[UploadSection] Failed to extract DICOM metadata from', file.name);
      console.error('[UploadSection] Error details:', err.response?.data || err.message);
      return null;
    }
  };

  const extractAllDicomMetadata = async (files: File[]) => {
    setIsExtractingMetadata(true);
    setError('');
    
    console.log('[UploadSection] Starting DICOM metadata extraction for', files.length, 'files');
    
    try {
      const metadataPromises = files.map(file => extractDicomMetadata(file));
      const allMetadata = await Promise.all(metadataPromises);
      
      console.log('[UploadSection] Extracted metadata:', allMetadata);
      
      // Filter out null values (non-DICOM files)
      const dicomMetadataList = allMetadata.filter((m): m is DicomMetadata => m !== null);
      
      console.log('[UploadSection] DICOM files found:', dicomMetadataList.length);
      
      if (dicomMetadataList.length === 0) {
        // No DICOM files found
        console.log('[UploadSection] No DICOM files detected');
        setError('No DICOM metadata found in selected files');
        setHasDicomFiles(false);
        setDicomMetadata(null);
        setShowDicomPrompt(false);
        return;
      }
      
      // DICOM files found
      setHasDicomFiles(true);
      
      // Check if all files have the same patient
      const uniquePatientsMap = new Map<string, DicomMetadata>();
      
      dicomMetadataList.forEach(metadata => {
        const patientKey = `${metadata.patientName || 'UNKNOWN'}_${metadata.patientId || 'UNKNOWN'}`;
        if (!uniquePatientsMap.has(patientKey)) {
          uniquePatientsMap.set(patientKey, metadata);
        }
      });
      
      const uniquePatientsList = Array.from(uniquePatientsMap.values());
      
      console.log('[UploadSection] Unique patients:', uniquePatientsList.length);
      
      if (uniquePatientsList.length > 1) {
        // Multiple different patients detected
        console.log('[UploadSection] Multiple patients detected, showing selector');
        setUniquePatients(uniquePatientsList);
        setShowPatientSelector(true);
      } else {
        // Single patient or all same patient - automatically fill Step 3
        const metadata = dicomMetadataList[0];
        console.log('[UploadSection] Single patient detected, auto-filling with:', metadata);
        setDicomMetadata(metadata);
        setUseDicomMetadata(true);
        applyDicomMetadata(metadata);
        // Don't show the prompt, just auto-fill
        setShowDicomPrompt(false);
        setSuccess('✓ DICOM metadata extracted and form filled successfully!');
        console.log('[UploadSection] Auto-fill complete');
      }
    } catch (error) {
      console.error('[UploadSection] Error during metadata extraction:', error);
      setError('Failed to extract DICOM metadata. Please enter patient data manually.');
      // If extraction fails, just continue - user can enter data manually
      setHasDicomFiles(false);
    } finally {
      setIsExtractingMetadata(false);
    }
  };

  const applyDicomMetadata = (metadata: DicomMetadata) => {
    console.log('[UploadSection] Applying DICOM metadata:', metadata);
    if (metadata.patientName) {
      console.log('[UploadSection] Setting patient name:', metadata.patientName);
      setPatientName(metadata.patientName);
    }
    if (metadata.patientId) {
      console.log('[UploadSection] Setting patient ID:', metadata.patientId);
      setPatientId(metadata.patientId);
    }
    if (metadata.patientBirthDate) setPatientBirthDate(metadata.patientBirthDate);
    if (metadata.patientSex) setPatientSex(metadata.patientSex);
    if (metadata.patientAge) setPatientAge(metadata.patientAge);
    if (metadata.studyDate) setStudyDate(metadata.studyDate);
    if (metadata.studyDescription) setStudyDescription(metadata.studyDescription);
    if (metadata.modality) setModality(metadata.modality);
    if (metadata.institutionName) setInstitutionName(metadata.institutionName);
    console.log('[UploadSection] Metadata application complete');
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

  const handleCancelPatientSelection = () => {
    setUseDicomMetadata(false);
    setShowPatientSelector(false);
  };

  const uploadFile = async (file: File) => {
    const uploadId = Date.now().toString();
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
      // Small delay to show the message
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

  const handleStartUpload = async () => {
    console.log('Start upload clicked');
    console.log('Patient Name:', patientName);
    console.log('Patient ID:', patientId);
    console.log('Selected files:', selectedFiles.length);
    
    // Check license validity
    if (isLicenseInvalid) {
      setError('Your license is no longer valid. Please contact your administrator.');
      return;
    }
    
    // Check quota
    if (isQuotaExceeded) {
      setError('Upload quota exceeded. Please contact your administrator to increase your quota.');
      return;
    }
    
    // Check if upload would exceed quota
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

    for (let i = 0; i < selectedFiles.length; i++) {
      await uploadFile(selectedFiles[i]);
    }

    setSuccess(`Successfully uploaded ${selectedFiles.length} file(s) for patient: ${patientName || patientId}`);
    
    // Refresh license status after upload
    try {
      const updatedStatus = await authService.getLicenseStatus();
      setLicenseStatus(updatedStatus);
    } catch (err) {
      console.error('Failed to refresh license status:', err);
    }
    
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
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError('');
    setSuccess('');
    const filesArray = Array.from(files);
    setSelectedFiles(filesArray);

    // Auto-set expected image count to match selected files
    if (filesArray.length > 0) {
      setExpectedImageCount(filesArray.length.toString());
      console.log('[UploadSection] Auto-set expected image count to:', filesArray.length);
    }

    // Check if files have .dcm extension to show Extract button
    const hasDicomExtension = filesArray.some(f => 
      f.name.toLowerCase().endsWith('.dcm') || 
      f.name.toLowerCase().endsWith('.dicom')
    );
    
    if (hasDicomExtension) {
      console.log('[UploadSection] DICOM files detected by extension');
      setHasDicomFiles(true);
    } else {
      setHasDicomFiles(false);
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
      setSelectedFiles(filesArray);

      // Auto-set expected image count to match selected files
      if (filesArray.length > 0) {
        setExpectedImageCount(filesArray.length.toString());
        console.log('[UploadSection] Auto-set expected image count to:', filesArray.length);
      }

      // Check if files have .dcm extension to show Extract button
      const hasDicomExtension = filesArray.some(f => 
        f.name.toLowerCase().endsWith('.dcm') || 
        f.name.toLowerCase().endsWith('.dicom')
      );
      
      if (hasDicomExtension) {
        console.log('[UploadSection] DICOM files detected by extension');
        setHasDicomFiles(true);
      } else {
        setHasDicomFiles(false);
      }
    }
  };

  const handleClearCompleted = () => {
    setUploadQueue((prev) => prev.filter((u) => u.status === 'uploading'));
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

      {/* Quota Exceeded Error */}
      {isQuotaExceeded && (
        <div className="bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-semibold">Upload quota exceeded.</span>
          </div>
          <p className="text-sm mt-1 ml-7">
            You have reached your maximum upload limit. Please contact your administrator to increase your quota.
          </p>
        </div>
      )}

      {/* License Invalid Error */}
      {isLicenseInvalid && (
        <div className="bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="font-semibold">License {licenseStatus?.license?.status}.</span>
          </div>
          <p className="text-sm mt-1 ml-7">
            Your license is no longer valid. Please contact your administrator to renew or reactivate your license.
          </p>
        </div>
      )}

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

      {/* DICOM Data Prompt */}
      {showDicomPrompt && dicomMetadata && (
        <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-blue-400 font-medium mb-2">DICOM Metadata Detected</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                We found patient information in your DICOM file(s). Would you like to use this data?
              </p>
              <div className="bg-[var(--bg-tertiary)] p-3 rounded-lg mb-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  {dicomMetadata.patientName && (
                    <div>
                      <span className="text-[var(--text-muted)]">Patient Name:</span>
                      <span className="ml-2 text-[var(--text-primary)]">{dicomMetadata.patientName}</span>
                    </div>
                  )}
                  {dicomMetadata.patientId && (
                    <div>
                      <span className="text-[var(--text-muted)]">Patient ID:</span>
                      <span className="ml-2 text-[var(--text-primary)]">{dicomMetadata.patientId}</span>
                    </div>
                  )}
                  {dicomMetadata.patientSex && (
                    <div>
                      <span className="text-[var(--text-muted)]">Sex:</span>
                      <span className="ml-2 text-[var(--text-primary)]">{dicomMetadata.patientSex}</span>
                    </div>
                  )}
                  {dicomMetadata.patientAge && (
                    <div>
                      <span className="text-[var(--text-muted)]">Age:</span>
                      <span className="ml-2 text-[var(--text-primary)]">{dicomMetadata.patientAge}</span>
                    </div>
                  )}
                  {dicomMetadata.modality && (
                    <div>
                      <span className="text-[var(--text-muted)]">Modality:</span>
                      <span className="ml-2 text-[var(--text-primary)]">{dicomMetadata.modality}</span>
                    </div>
                  )}
                  {dicomMetadata.studyDate && (
                    <div>
                      <span className="text-[var(--text-muted)]">Study Date:</span>
                      <span className="ml-2 text-[var(--text-primary)]">{dicomMetadata.studyDate}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <GradientButton
                  onClick={handleUseDicomData}
                  variant="primary"
                  size="sm"
                >
                  Use DICOM Data
                </GradientButton>
                <GradientButton
                  onClick={handleUseManualEntry}
                  variant="secondary"
                  size="sm"
                >
                  Enter Manually
                </GradientButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multiple Patients Selector */}
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
                          {patient.fileName && <span className="text-[var(--text-muted)]">From: {patient.fileName}</span>}
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-[var(--medical-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
              <GradientButton
                onClick={handleCancelPatientSelection}
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

      {/* Upload Flow: Step 1 - Number of Images */}
      <div className="space-y-4">
          <div className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)]">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">
              Step 1: Number of Images
              {imageCountMatches && (
                <span className="ml-2 text-xs text-[var(--medical-secondary)]">✓ Matches selected files</span>
              )}
              {expectedImageCount && !imageCountMatches && selectedFiles.length > 0 && (
                <span className="ml-2 text-xs text-[var(--medical-accent)]">⚠ Mismatch</span>
              )}
            </h3>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">
                How many images do you want to upload? {expectedImageCount && <span className="text-[var(--medical-secondary)]">✓</span>}
              </label>
              <select
                value={expectedImageCount}
                onChange={(e) => {
                  setExpectedImageCount(e.target.value);
                  console.log('Expected image count:', e.target.value);
                }}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--medical-primary)] cursor-pointer"
              >
                <option value="">Select number of images</option>
                {Array.from({ length: 50 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'image' : 'images'}
                  </option>
                ))}
              </select>
              {expectedImageCount && selectedFiles.length > 0 && (
                <p className={`text-xs mt-1 ${imageCountMatches ? 'text-[var(--medical-secondary)]' : 'text-[var(--medical-accent)]'}`}>
                  {imageCountMatches 
                    ? `✓ Perfect! ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''} selected`
                    : `Expected: ${expectedImageCount}, Selected: ${selectedFiles.length}`
                  }
                </p>
              )}
            </div>
          </div>

          {/* Step 2: File Selection */}
          <div className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)]">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">
              Step 2: Select Files
              {selectedFiles.length > 0 && (
                <span className="ml-2 text-xs text-[var(--text-muted)]">({selectedFiles.length} selected)</span>
              )}
            </h3>

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
          </div>

            {selectedFiles.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">Selected Files:</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto bg-[var(--bg-tertiary)] p-3 rounded-lg">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="text-xs text-[var(--text-secondary)] flex justify-between">
                      <span className="truncate flex-1">{file.name}</span>
                      <span className="ml-2 text-[var(--text-muted)]">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isExtractingMetadata && (
              <div className="mt-3 text-xs text-[var(--medical-primary)] flex items-center gap-2 bg-blue-900/10 p-3 rounded-lg">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Extracting DICOM metadata from files...
              </div>
            )}
          </div>

          {/* Step 3: Patient Information (after DICOM prompt) */}
          <div className="bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-[var(--text-primary)]">
                Step 3: Patient Information
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

            {/* Extract DICOM Data Button */}
            {hasDicomFiles && selectedFiles.length > 0 && !useDicomMetadata && (
              <div className="mb-3">
                <GradientButton
                  onClick={() => extractAllDicomMetadata(selectedFiles)}
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
                      Extracting DICOM Data...
                    </>
                  ) : (
                    <>
                      📋 Extract DICOM Data
                    </>
                  )}
                </GradientButton>
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">
                    Birth Date
                  </label>
                  <input
                    type="date"
                    value={patientBirthDate}
                    onChange={(e) => setPatientBirthDate(e.target.value)}
                    disabled={useDicomMetadata}
                    className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--medical-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">
                    Sex
                  </label>
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
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">
                    Age
                  </label>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">
                    Study Date
                  </label>
                  <input
                    type="date"
                    value={studyDate}
                    onChange={(e) => setStudyDate(e.target.value)}
                    disabled={useDicomMetadata}
                    className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--medical-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">
                    Modality
                  </label>
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
                <label className="block text-sm text-[var(--text-secondary)] mb-1">
                  Study Description
                </label>
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
                <label className="block text-sm text-[var(--text-secondary)] mb-1">
                  Institution Name
                </label>
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

        <div>
          {((!patientName && !patientId) || !expectedImageCount || selectedFiles.length === 0 || !imageCountMatches) && (
            <div className="text-xs text-[var(--medical-accent)] mb-2 text-center space-y-1">
              {!patientName && !patientId && (
                <p>⚠ Please enter Patient Name or ID</p>
              )}
              {!expectedImageCount && (
                <p>⚠ Please specify the number of images</p>
              )}
              {expectedImageCount && selectedFiles.length === 0 && (
                <p>⚠ Please select {expectedImageCount} file{parseInt(expectedImageCount) !== 1 ? 's' : ''}</p>
              )}
              {expectedImageCount && selectedFiles.length > 0 && !imageCountMatches && (
                <p>⚠ Selected files ({selectedFiles.length}) must match expected count ({expectedImageCount})</p>
              )}
            </div>
          )}
          <GradientButton
            onClick={handleStartUpload}
            disabled={
              (!patientName && !patientId) || 
              !expectedImageCount || 
              selectedFiles.length === 0 || 
              !imageCountMatches || 
              isUploading || 
              isQuotaExceeded || 
              isLicenseInvalid ||
              isLoadingLicense
            }
            variant="primary"
            size="md"
            fullWidth
          >
            {isLoadingLicense 
              ? 'Loading...' 
              : isQuotaExceeded 
              ? 'Quota Exceeded' 
              : isLicenseInvalid 
              ? 'License Invalid' 
              : isUploading 
              ? 'Uploading...' 
              : imageCountMatches 
              ? `Upload ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}` 
              : 'Upload'}
          </GradientButton>
        </div>

        {/* Upload Queue */}
        {uploadQueue.length > 0 && (
          <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="data-label">
              Upload Queue ({uploadQueue.length})
            </h3>
            {uploadQueue.some((u) => u.status !== 'uploading') && (
              <GradientButton
                onClick={handleClearCompleted}
                variant="secondary"
                size="xs"
              >
                Clear Completed
              </GradientButton>
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
                      : upload.status === 'extracting'
                      ? 'bg-purple-900/30 text-purple-400'
                      : 'bg-blue-900/30 text-[var(--medical-primary)]'
                  }`}
                >
                  {upload.status === 'completed'
                    ? '✓ Completed'
                    : upload.status === 'failed'
                    ? '✗ Failed'
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
                <div className="w-full bg-[var(--bg-secondary)] rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      upload.status === 'extracting'
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
      )}
    </div>
  );
}
