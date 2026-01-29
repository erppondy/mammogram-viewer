import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ImageViewer from './ImageViewer';
import DicomViewer from './DicomViewer';
import FilterPanel, { FilterOptions } from './FilterPanel';
import LazyImage from './LazyImage';
import CustomLoader from './CustomLoader';
import GradientButton from './GradientButton';
import { exportService } from '../services/exportService';
import './ImageGallery.css';

interface Image {
  id: string;
  originalFilename: string;
  fileFormat: string;
  fileSize: number;
  uploadedAt: string;
  thumbnailPath?: string;
  userId?: string;
  uploaderEmail?: string;
  uploaderName?: string;
}

interface PatientFolder {
  folder: string;
  patientName?: string;
  patientId?: string;
  imageCount: number;
  images: Image[];
}

export default function ImageGallery() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientFolder[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'folders' | 'grid'>('folders');
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [uploaderFilter, setUploaderFilter] = useState<'all' | 'mine' | 'shared'>('all');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isDoctor, setIsDoctor] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    fileFormat: 'all',
    dateFrom: '',
    dateTo: '',
    sortBy: 'date',
    sortOrder: 'desc',
  });

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const response = await api.get('/images/by-patient');
      setPatients(response.data.patients || []);
      
      // Flatten all images for grid view
      const allImages = response.data.patients?.flatMap((p: PatientFolder) => p.images) || [];
      setImages(allImages);
      
      // Get current user ID and check if doctor
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setCurrentUserId(payload.userId);
          
          // Fetch user details to check if doctor
          const userResponse = await api.get('/auth/me');
          const isDoctorRole = userResponse.data?.role === 'doctor' || userResponse.data?.ambulanceRole === 'doctor';
          setIsDoctor(isDoctorRole);
        } catch (e) {
          console.error('Failed to parse token or fetch user:', e);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (folder: string) => {
    const newOpen = new Set(openFolders);
    if (newOpen.has(folder)) {
      newOpen.delete(folder);
    } else {
      newOpen.add(folder);
    }
    setOpenFolders(newOpen);
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      await api.delete(`/images/${imageId}`);
      
      // Update both images and patients state immediately
      const updatedImages = images.filter((img) => img.id !== imageId);
      setImages(updatedImages);
      
      // Update patients state to reflect the deletion
      const updatedPatients = patients.map(patient => ({
        ...patient,
        images: patient.images.filter(img => img.id !== imageId),
        imageCount: patient.images.filter(img => img.id !== imageId).length
      })).filter(patient => patient.imageCount > 0);
      
      setPatients(updatedPatients);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to delete image');
    }
  };

  const handleFolderDelete = async (folder: string) => {
    const patient = patients.find(p => p.folder === folder);
    if (!patient) return;
    
    if (!confirm(`Delete entire folder "${folder}" with ${patient.imageCount} images?`)) return;

    try {
      await api.delete(`/images/folder/${encodeURIComponent(folder)}`);
      
      // Remove all images from this folder
      const folderImageIds = new Set(patient.images.map(img => img.id));
      const updatedImages = images.filter(img => !folderImageIds.has(img.id));
      setImages(updatedImages);
      
      // Remove the folder from patients
      const updatedPatients = patients.filter(p => p.folder !== folder);
      setPatients(updatedPatients);
      
      // Close the folder if it was open
      const newOpen = new Set(openFolders);
      newOpen.delete(folder);
      setOpenFolders(newOpen);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to delete folder');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredImages = images
    .filter((image) => {
      // Uploader filter
      if (uploaderFilter === 'mine' && image.userId !== currentUserId) {
        return false;
      }
      if (uploaderFilter === 'shared' && image.userId === currentUserId) {
        return false;
      }

      // Search filter
      if (
        filters.searchTerm &&
        !image.originalFilename.toLowerCase().includes(filters.searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Format filter
      if (filters.fileFormat !== 'all' && image.fileFormat !== filters.fileFormat) {
        return false;
      }

      // Date range filter
      const uploadDate = new Date(image.uploadedAt);
      if (filters.dateFrom && uploadDate < new Date(filters.dateFrom)) {
        return false;
      }
      if (filters.dateTo && uploadDate > new Date(filters.dateTo + 'T23:59:59')) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'name':
          comparison = a.originalFilename.localeCompare(b.originalFilename);
          break;
        case 'size':
          comparison = a.fileSize - b.fileSize;
          break;
        case 'date':
        default:
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleViewImage = (image: Image) => {
    setSelectedImage(image);
  };

  const handleCloseViewer = () => {
    setSelectedImage(null);
  };

  const handleToggleSelect = (imageId: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedImages.size === filteredImages.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(filteredImages.map((img) => img.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedImages.size === 0) return;

    if (!confirm(`Delete ${selectedImages.size} selected images?`)) return;

    try {
      await Promise.all(
        Array.from(selectedImages).map((id) => api.delete(`/images/${id}`))
      );
      setImages(images.filter((img) => !selectedImages.has(img.id)));
      setSelectedImages(new Set());
    } catch (err: any) {
      alert('Failed to delete some images');
    }
  };

  const handleDownload = async (imageId: string, filename: string) => {
    try {
      const response = await api.get(`/images/${imageId}/download`, {
        responseType: 'blob',
      });

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to download image: ' + (err.response?.data?.error?.message || err.message));
    }
  };

  const handleBatchDownload = async (asZip: boolean = false) => {
    if (selectedImages.size === 0) return;

    if (asZip) {
      // Download as ZIP
      try {
        const imageIds = Array.from(selectedImages);
        const response = await api.post('/images/download-zip', 
          { imageIds },
          { responseType: 'blob' }
        );
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `images_${Date.now()}.zip`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Failed to download ZIP:', error);
        setError('Failed to download images as ZIP');
      }
    } else {
      // Download individually
      for (const imageId of Array.from(selectedImages)) {
        const image = images.find((img) => img.id === imageId);
        if (image) {
          await handleDownload(imageId, image.originalFilename);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }
  };

  const handleExportForAI = async () => {
    if (selectedImages.size === 0) {
      alert('Please select images to export');
      return;
    }

    try {
      const imageIds = Array.from(selectedImages);
      const blob = await exportService.exportToCOCO(imageIds);
      const filename = `coco_export_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
      exportService.downloadBlob(blob, filename);
      alert(`Successfully exported ${imageIds.length} images in COCO format for AI training!`);
    } catch (error: any) {
      console.error('Failed to export:', error);
      alert('Failed to export annotations: ' + (error.response?.data?.error?.message || error.message));
    }
  };

  const handleExportAllForAI = async () => {
    if (!confirm('Export all annotated images for AI training?')) return;

    try {
      const blob = await exportService.exportAllToCOCO();
      const filename = `coco_export_all_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
      exportService.downloadBlob(blob, filename);
      alert('Successfully exported all annotated images in COCO format for AI training!');
    } catch (error: any) {
      console.error('Failed to export:', error);
      alert('Failed to export annotations: ' + (error.response?.data?.error?.message || error.message));
    }
  };

  const handleFolderDownload = async (folder: string) => {
    try {
      const response = await api.get(`/images/folder/${encodeURIComponent(folder)}/download-zip`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${folder}_${Date.now()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download folder:', error);
      setError('Failed to download folder as ZIP');
    }
  };

  const handleToggleFolderSelect = (folder: string) => {
    const newSelection = new Set(selectedFolders);
    if (newSelection.has(folder)) {
      newSelection.delete(folder);
    } else {
      newSelection.add(folder);
    }
    setSelectedFolders(newSelection);
  };

  const handleSelectAllFolders = () => {
    if (selectedFolders.size === patients.length) {
      setSelectedFolders(new Set());
    } else {
      setSelectedFolders(new Set(patients.map(p => p.folder)));
    }
  };

  const handleBatchFolderDownload = async () => {
    if (selectedFolders.size === 0) return;

    try {
      for (const folder of Array.from(selectedFolders)) {
        await handleFolderDownload(folder);
        // Small delay between downloads to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      alert(`Successfully downloaded ${selectedFolders.size} folders`);
      setSelectedFolders(new Set());
    } catch (error) {
      console.error('Failed to download folders:', error);
      setError('Failed to download some folders');
    }
  };

  const handleBatchFolderDelete = async () => {
    if (selectedFolders.size === 0) return;

    if (!confirm(`Delete ${selectedFolders.size} selected folders and all their images?`)) return;

    try {
      for (const folder of Array.from(selectedFolders)) {
        await api.delete(`/images/folder/${encodeURIComponent(folder)}`);
      }
      alert(`Successfully deleted ${selectedFolders.size} folders`);
      setSelectedFolders(new Set());
      loadImages();
    } catch (error) {
      console.error('Failed to delete folders:', error);
      setError('Failed to delete some folders');
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedImage) {
        handleCloseViewer();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedImage]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col items-center gap-4 py-8">
          <CustomLoader size={50} />
          <p className="text-gray-600 text-center">Loading images...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-red-600 text-center">{error}</p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 text-center">
          No images uploaded yet. Upload your first X-ray image above!
        </p>
      </div>
    );
  }

  const isDicom = (format: string) => {
    const result = format.toLowerCase() === 'dicom' || format.toLowerCase() === 'dcm';
    console.log(`Checking if format "${format}" is DICOM:`, result);
    return result;
  };

  return (
    <>
      {selectedImage && (
        <>
          {isDicom(selectedImage.fileFormat) ? (
            <DicomViewer
              imageId={selectedImage.id}
              filename={selectedImage.originalFilename}
              onClose={handleCloseViewer}
            />
          ) : (
            <ImageViewer
              imageId={selectedImage.id}
              filename={selectedImage.originalFilename}
              format={selectedImage.fileFormat}
              onClose={handleCloseViewer}
            />
          )}
        </>
      )}

      <FilterPanel onFilterChange={setFilters} />

      <div className="medical-card p-6">
        {/* Uploader Filter */}
        <div className="flex gap-2 mb-4 p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
          <span className="text-sm font-medium text-[var(--text-primary)] mr-2 flex items-center">
            Show:
          </span>
          <GradientButton
            onClick={() => setUploaderFilter('all')}
            variant={uploaderFilter === 'all' ? 'primary' : 'secondary'}
            size="xs"
          >
            All Images ({images.length})
          </GradientButton>
          <GradientButton
            onClick={() => setUploaderFilter('mine')}
            variant={uploaderFilter === 'mine' ? 'primary' : 'secondary'}
            size="xs"
          >
            My Uploads ({images.filter(img => img.userId === currentUserId).length})
          </GradientButton>
          <GradientButton
            onClick={() => setUploaderFilter('shared')}
            variant={uploaderFilter === 'shared' ? 'primary' : 'secondary'}
            size="xs"
          >
            Shared with Me ({images.filter(img => img.userId !== currentUserId).length})
          </GradientButton>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              {uploaderFilter === 'all' && `All Images (${filteredImages.length})`}
              {uploaderFilter === 'mine' && `My Uploads (${filteredImages.length})`}
              {uploaderFilter === 'shared' && `Shared with Me (${filteredImages.length})`}
            </h2>
            {viewMode === 'grid' && filteredImages.length > 0 && (
              <label className="select-all-label">
                <input
                  type="checkbox"
                  checked={selectedImages.size === filteredImages.length && filteredImages.length > 0}
                  onChange={handleSelectAll}
                  className="image-gallery-checkbox"
                />
                <span className="font-medium text-sm">
                  {selectedImages.size === filteredImages.length && filteredImages.length > 0 ? 'Deselect All Images' : 'Select All Images'}
                </span>
              </label>
            )}
            {viewMode === 'folders' && patients.length > 0 && (
              <label className="select-all-label">
                <input
                  type="checkbox"
                  checked={selectedFolders.size === patients.length && patients.length > 0}
                  onChange={handleSelectAllFolders}
                  className="image-gallery-checkbox"
                />
                <span className="font-medium text-sm">
                  {selectedFolders.size === patients.length && patients.length > 0 ? 'Deselect All Folders' : 'Select All Folders'}
                </span>
              </label>
            )}
            {selectedImages.size > 0 && (
              <div className="batch-actions-container">
                <span className="batch-actions-count">
                  {selectedImages.size} image{selectedImages.size !== 1 ? 's' : ''} selected
                </span>
                <div className="relative">
                  <GradientButton
                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                    variant="primary"
                    size="xs"
                  >
                    Download Selected ▼
                  </GradientButton>
                  {showDownloadMenu && (
                    <div className="absolute top-full mt-1 right-0 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-lg z-10 min-w-[200px]">
                      <button
                        onClick={() => {
                          handleBatchDownload(false);
                          setShowDownloadMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                      >
                        📄 Individual Files
                      </button>
                      <button
                        onClick={() => {
                          handleBatchDownload(true);
                          setShowDownloadMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors border-t border-[var(--border-color)]"
                      >
                        📦 As ZIP Archive
                      </button>
                    </div>
                  )}
                </div>
                <GradientButton
                  onClick={handleBatchDelete}
                  variant="danger"
                  size="xs"
                >
                  Delete Selected
                </GradientButton>
              </div>
            )}
            {selectedFolders.size > 0 && viewMode === 'folders' && (
              <div className="batch-actions-container">
                <span className="batch-actions-count">
                  {selectedFolders.size} folder{selectedFolders.size !== 1 ? 's' : ''} selected
                </span>
                <GradientButton
                  onClick={handleBatchFolderDownload}
                  variant="primary"
                  size="xs"
                >
                  📦 Download Folders
                </GradientButton>
                <GradientButton
                  onClick={handleBatchFolderDelete}
                  variant="danger"
                  size="xs"
                >
                  🗑️ Delete Folders
                </GradientButton>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <GradientButton
              onClick={() => setViewMode('folders')}
              variant={viewMode === 'folders' ? 'primary' : 'secondary'}
              size="xs"
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Folders
            </GradientButton>
            <GradientButton
              onClick={() => setViewMode('grid')}
              variant={viewMode === 'grid' ? 'primary' : 'secondary'}
              size="xs"
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Grid
            </GradientButton>
          </div>
        </div>

        {/* Folder View */}
        {viewMode === 'folders' && (
          <div className="space-y-4">
            {patients.map((patient) => {
              // Filter images in this folder based on current filters
              const filteredFolderImages = patient.images.filter((image) => {
                // Uploader filter
                if (uploaderFilter === 'mine' && image.userId !== currentUserId) {
                  return false;
                }
                if (uploaderFilter === 'shared' && image.userId === currentUserId) {
                  return false;
                }

                // Search filter
                if (
                  filters.searchTerm &&
                  !image.originalFilename.toLowerCase().includes(filters.searchTerm.toLowerCase())
                ) {
                  return false;
                }

                // Format filter
                if (filters.fileFormat !== 'all' && image.fileFormat !== filters.fileFormat) {
                  return false;
                }

                // Date range filter
                const uploadDate = new Date(image.uploadedAt);
                if (filters.dateFrom && uploadDate < new Date(filters.dateFrom)) {
                  return false;
                }
                if (filters.dateTo && uploadDate > new Date(filters.dateTo + 'T23:59:59')) {
                  return false;
                }

                return true;
              });

              // Skip folders with no matching images
              if (filteredFolderImages.length === 0) {
                return null;
              }

              return (
              <div 
                key={patient.folder} 
                className={`border rounded-lg overflow-hidden transition-all ${
                  selectedFolders.has(patient.folder)
                    ? 'border-[var(--medical-primary)] bg-[var(--bg-tertiary)] shadow-md'
                    : 'border-[var(--border-color)] bg-[var(--bg-secondary)]'
                }`}
              >
                <div className="flex items-center justify-between p-4 hover:bg-[var(--bg-tertiary)] transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="image-card-checkbox-wrapper">
                      <input
                        type="checkbox"
                        checked={filteredFolderImages.every(img => selectedImages.has(img.id)) && filteredFolderImages.length > 0}
                        onChange={() => {
                          const allSelected = filteredFolderImages.every(img => selectedImages.has(img.id));
                          const newSelection = new Set(selectedImages);
                          filteredFolderImages.forEach(img => {
                            if (allSelected) {
                              newSelection.delete(img.id);
                            } else {
                              newSelection.add(img.id);
                            }
                          });
                          setSelectedImages(newSelection);
                        }}
                        className="image-gallery-checkbox"
                        title={filteredFolderImages.every(img => selectedImages.has(img.id)) ? "Deselect all images in folder" : "Select all images in folder"}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div 
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => toggleFolder(patient.folder)}
                    >
                      <svg className="w-6 h-6 text-[var(--medical-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-[var(--text-primary)]">
                          {patient.patientName || patient.patientId || patient.folder}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {filteredFolderImages.length} image{filteredFolderImages.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <GradientButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFolderDownload(patient.folder);
                      }}
                      variant="info"
                      size="xs"
                    >
                      📦 Download
                    </GradientButton>
                    <GradientButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFolderDelete(patient.folder);
                      }}
                      variant="danger"
                      size="xs"
                    >
                      🗑️ Delete Folder
                    </GradientButton>
                    <svg
                      className={`w-5 h-5 text-[var(--text-secondary)] transition-transform cursor-pointer ${
                        openFolders.has(patient.folder) ? 'rotate-90' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      onClick={() => toggleFolder(patient.folder)}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {openFolders.has(patient.folder) && (
                  <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-primary)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredFolderImages.map((image) => (
                        <div
                          key={image.id}
                          className={`border rounded-lg p-3 transition-all ${
                            selectedImages.has(image.id) 
                              ? 'border-[var(--medical-primary)] bg-[var(--bg-tertiary)] shadow-md' 
                              : 'border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--medical-primary)]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Checkbox for individual image selection */}
                            <div className="image-card-checkbox-wrapper">
                              <input
                                type="checkbox"
                                checked={selectedImages.has(image.id)}
                                onChange={() => handleToggleSelect(image.id)}
                                className="image-gallery-checkbox"
                                title="Select image"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            
                            {/* Image thumbnail */}
                            <div
                              className="flex-shrink-0 w-12 h-12 bg-[var(--bg-tertiary)] rounded-md flex items-center justify-center cursor-pointer hover:opacity-80"
                              onClick={() => handleViewImage(image)}
                            >
                              <svg className="h-8 w-8 text-[var(--medical-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            
                            {/* Image info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[var(--text-primary)] truncate font-medium mb-1">
                                {image.originalFilename}
                              </p>
                              <p className="text-xs text-[var(--text-muted)]">
                                {formatFileSize(image.fileSize)} • {image.fileFormat.toUpperCase()}
                              </p>
                              {image.userId && image.userId !== currentUserId && (
                                <p className="text-xs text-[var(--medical-primary)] mt-1">
                                  📤 Uploaded by: {image.uploaderName || image.uploaderEmail}
                                </p>
                              )}
                            </div>
                            
                            {/* Action buttons */}
                            <div className="flex gap-1 flex-shrink-0">
                              <GradientButton
                                onClick={() => handleViewImage(image)}
                                variant="primary"
                                size="xs"
                              >
                                View
                              </GradientButton>
                              {isDoctor && (
                                <GradientButton
                                  onClick={() => navigate(`/annotate/${image.id}`)}
                                  variant="info"
                                  size="xs"
                                >
                                  ✏️
                                </GradientButton>
                              )}
                              <GradientButton
                                onClick={() => handleDelete(image.id)}
                                variant="danger"
                                size="xs"
                              >
                                ×
                              </GradientButton>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                selectedImages.has(image.id) ? 'border-[var(--medical-primary)] bg-[var(--bg-tertiary)]' : 'border-[var(--border-color)] bg-[var(--bg-secondary)]'
              }`}
            >
            <div className="image-card-checkbox-container">
              <div className="image-card-checkbox-wrapper">
                <input
                  type="checkbox"
                  checked={selectedImages.has(image.id)}
                  onChange={() => handleToggleSelect(image.id)}
                  className="image-gallery-checkbox"
                  title="Select image"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3 mb-3">
              <div
                className="flex-shrink-0 w-16 h-16 bg-[var(--bg-tertiary)] rounded-md flex items-center justify-center cursor-pointer hover:opacity-80"
                onClick={() => handleViewImage(image)}
              >
                <svg className="h-10 w-10 text-[var(--medical-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-[var(--text-primary)] truncate mb-1">
                  {image.originalFilename}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {image.fileFormat.toUpperCase()}
                </p>
              </div>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-1">
              Size: {formatFileSize(image.fileSize)}
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-1">
              {formatDate(image.uploadedAt)}
            </p>
            {image.userId && image.userId !== currentUserId && (
              <p className="text-xs text-[var(--medical-primary)] mb-2 font-medium">
                📤 Uploaded by: {image.uploaderName || image.uploaderEmail}
              </p>
            )}

            <div className="flex gap-2 flex-wrap">
              <GradientButton
                onClick={() => handleViewImage(image)}
                variant="primary"
                size="xs"
              >
                View
              </GradientButton>
              {isDoctor && (
                <GradientButton
                  onClick={() => navigate(`/annotate/${image.id}`)}
                  variant="success"
                  size="xs"
                >
                  Annotate
                </GradientButton>
              )}
              <GradientButton
                onClick={() => handleDownload(image.id, image.originalFilename)}
                variant="info"
                size="xs"
              >
                Download
              </GradientButton>
              <GradientButton
                onClick={() => handleDelete(image.id)}
                variant="danger"
                size="xs"
              >
                Delete
              </GradientButton>
            </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </>
  );
}
