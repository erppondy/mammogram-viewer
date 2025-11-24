import { useState, useEffect } from 'react';
import api from '../services/api';
import ImageViewer from './ImageViewer';
import DicomViewer from './DicomViewer';
import FilterPanel, { FilterOptions } from './FilterPanel';
import LazyImage from './LazyImage';
import CustomLoader from './CustomLoader';

interface Image {
  id: string;
  originalFilename: string;
  fileFormat: string;
  fileSize: number;
  uploadedAt: string;
  thumbnailPath?: string;
}

export default function ImageGallery() {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
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
      const response = await api.get('/images');
      setImages(response.data.images || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      await api.delete(`/images/${imageId}`);
      setImages(images.filter((img) => img.id !== imageId));
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to delete image');
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

  const handleBatchDownload = async () => {
    if (selectedImages.size === 0) return;

    for (const imageId of Array.from(selectedImages)) {
      const image = images.find((img) => img.id === imageId);
      if (image) {
        await handleDownload(imageId, image.originalFilename);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
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
          No images uploaded yet. Upload your first mammogram above!
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

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Images ({filteredImages.length})
            </h2>
            {selectedImages.size > 0 && (
              <div className="flex gap-2">
                <span className="text-sm text-gray-600">
                  {selectedImages.size} selected
                </span>
                <button
                  onClick={handleBatchDownload}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Download Selected
                </button>
                <button
                  onClick={handleBatchDelete}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete Selected
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleSelectAll}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {selectedImages.size === filteredImages.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredImages.map((image) => (
          <div
            key={image.id}
            className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
              selectedImages.has(image.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <input
                type="checkbox"
                checked={selectedImages.has(image.id)}
                onChange={() => handleToggleSelect(image.id)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {image.thumbnailPath ? (
              <LazyImage
                src={`http://localhost:3000${image.thumbnailPath}`}
                alt={image.originalFilename}
                className="aspect-square bg-gray-100 rounded-md mb-3 flex items-center justify-center cursor-pointer hover:bg-gray-200"
                onClick={() => handleViewImage(image)}
              />
            ) : (
              <div
                className="aspect-square bg-gray-100 rounded-md mb-3 flex items-center justify-center cursor-pointer hover:bg-gray-200"
                onClick={() => handleViewImage(image)}
              >
                <svg
                  className="h-16 w-16 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}

            <h3 className="font-medium text-gray-900 truncate mb-1">
              {image.originalFilename}
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              Format: {image.fileFormat.toUpperCase()}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              Size: {formatFileSize(image.fileSize)}
            </p>
            <p className="text-xs text-gray-500 mb-3">
              {formatDate(image.uploadedAt)}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => handleViewImage(image)}
                className="flex-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                View
              </button>
              <button
                onClick={() => handleDownload(image.id, image.originalFilename)}
                className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Download
              </button>
              <button
                onClick={() => handleDelete(image.id)}
                className="flex-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        </div>
      </div>
    </>
  );
}
