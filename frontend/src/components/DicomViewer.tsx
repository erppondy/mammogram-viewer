import { useEffect, useState } from 'react';
import api from '../services/api';

interface DicomViewerProps {
  imageId: string;
  filename: string;
  onClose: () => void;
}

export default function DicomViewer({ imageId, filename, onClose }: DicomViewerProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState<any>(null);
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [invert, setInvert] = useState(false);

  useEffect(() => {
    loadDicomPreview();
    loadMetadata();
  }, [imageId]);

  const loadDicomPreview = async () => {
    try {
      console.log('[DicomViewer] ========== START LOADING ==========');
      console.log('[DicomViewer] Image ID:', imageId);
      console.log('[DicomViewer] API endpoint:', `/images/${imageId}/file`);
      
      // Load the converted PNG
      const response = await api.get(`/images/${imageId}/file`, {
        responseType: 'blob',
      });

      console.log('[DicomViewer] Response received successfully');
      console.log('[DicomViewer] Response status:', response.status);
      console.log('[DicomViewer] Response headers:', response.headers);
      console.log('[DicomViewer] Blob type:', response.data.type);
      console.log('[DicomViewer] Blob size:', response.data.size, 'bytes');
      
      if (response.data.size === 0) {
        throw new Error('Received empty blob from server');
      }

      const url = URL.createObjectURL(response.data);
      console.log('[DicomViewer] Object URL created:', url);
      
      setImageUrl(url);
      setLoading(false);
      console.log('[DicomViewer] ========== LOADING COMPLETE ==========');
    } catch (err: any) {
      console.error('[DicomViewer] ========== ERROR OCCURRED ==========');
      console.error('[DicomViewer] Error object:', err);
      console.error('[DicomViewer] Error message:', err.message);
      console.error('[DicomViewer] Error stack:', err.stack);
      
      if (err.response) {
        console.error('[DicomViewer] Response status:', err.response.status);
        console.error('[DicomViewer] Response data:', err.response.data);
        console.error('[DicomViewer] Response headers:', err.response.headers);
        
        // Try to read error message from blob
        if (err.response.data instanceof Blob) {
          try {
            const text = await err.response.data.text();
            console.error('[DicomViewer] Error response text:', text);
            setError(`Failed to load DICOM: ${text}`);
          } catch (blobError) {
            console.error('[DicomViewer] Could not read error blob:', blobError);
            setError(`Failed to load DICOM preview (Status: ${err.response.status})`);
          }
        } else {
          setError(`Failed to load DICOM preview: ${JSON.stringify(err.response.data)}`);
        }
      } else if (err.request) {
        console.error('[DicomViewer] No response received');
        console.error('[DicomViewer] Request:', err.request);
        setError('No response from server - check network connection');
      } else {
        console.error('[DicomViewer] Request setup error');
        setError(`Failed to load DICOM preview: ${err.message}`);
      }
      
      setLoading(false);
      console.error('[DicomViewer] ========== ERROR HANDLING COMPLETE ==========');
    }
  };

  const loadMetadata = async () => {
    try {
      const response = await api.get(`/images/${imageId}/metadata`);
      setMetadata(response.data);
    } catch (error) {
      console.error('Failed to load metadata:', error);
    }
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.25));
  const handleReset = () => {
    setZoom(1);
    setBrightness(100);
    setContrast(100);
    setInvert(false);
  };
  const handleDownload = async () => {
    try {
      const response = await api.get(`/images/${imageId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download DICOM file');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">{filename}</h2>
          <p className="text-sm text-gray-400">DICOM Viewer</p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 text-2xl font-bold px-4"
        >
          ×
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-gray-800 text-white p-2 flex gap-2 items-center justify-center flex-wrap">
        <div className="flex gap-1 items-center">
          <button onClick={handleZoomOut} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded">−</button>
          <span className="px-3 py-1 bg-gray-700 rounded min-w-[80px] text-center text-sm">{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded">+</button>
        </div>
        <div className="flex gap-1 items-center">
          <span className="text-xs text-gray-400 mr-1">Brightness:</span>
          <button onClick={() => setBrightness(b => Math.max(0, b - 10))} className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">−</button>
          <span className="px-2 py-1 bg-gray-700 rounded text-xs min-w-[50px] text-center">{brightness}%</span>
          <button onClick={() => setBrightness(b => Math.min(200, b + 10))} className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">+</button>
        </div>
        <div className="flex gap-1 items-center">
          <span className="text-xs text-gray-400 mr-1">Contrast:</span>
          <button onClick={() => setContrast(c => Math.max(0, c - 10))} className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">−</button>
          <span className="px-2 py-1 bg-gray-700 rounded text-xs min-w-[50px] text-center">{contrast}%</span>
          <button onClick={() => setContrast(c => Math.min(200, c + 10))} className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">+</button>
        </div>
        <button onClick={() => setInvert(!invert)} className={`px-3 py-1 rounded text-sm ${invert ? 'bg-blue-600' : 'bg-gray-700'}`}>Invert</button>
        <button onClick={handleReset} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">Reset</button>
        <button onClick={handleDownload} className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm">Download DICOM</button>
      </div>

      {/* Viewer Container */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex items-center justify-center bg-black overflow-hidden relative">
          {loading && (
            <div className="text-white text-center">
              <div className="text-2xl mb-2">Loading DICOM...</div>
              <div className="text-sm text-gray-400">Converting to viewable format</div>
            </div>
          )}
          
          {error && (
            <div className="text-red-500 text-center max-w-md">
              <div className="text-xl mb-2">⚠ Error</div>
              <div className="text-sm">{error}</div>
            </div>
          )}
          
          {!loading && !error && !imageUrl && (
            <div className="text-yellow-500 text-center">
              <div className="text-xl mb-2">⚠ No Image</div>
              <div className="text-sm">Image URL is empty</div>
            </div>
          )}
          
          {!loading && !error && imageUrl && (
            <>
              <img
                src={imageUrl}
                alt={filename}
                onLoad={() => console.log('Image loaded successfully!')}
                onError={(e) => console.error('Image failed to load:', e)}
                className="max-w-full max-h-full"
                style={{
                  transform: `scale(${zoom})`,
                  objectFit: 'contain',
                  filter: `brightness(${brightness}%) contrast(${contrast}%) ${invert ? 'invert(1)' : ''}`,
                  imageRendering: 'auto',
                  display: 'block',
                }}
              />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-10">
                <p className="text-sm">📋 DICOM Image (732x896) • Use controls to adjust view</p>
              </div>
            </>
          )}
        </div>

        {/* Metadata Panel */}
        {metadata && !loading && !error && (
          <div className="w-80 bg-gray-900 text-white p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">DICOM Metadata</h3>
            <div className="space-y-3 text-sm">
              {metadata.patientName && (
                <div>
                  <span className="text-gray-400 block">Patient Name:</span>
                  <div className="text-white font-medium">{metadata.patientName}</div>
                </div>
              )}
              {metadata.patientId && (
                <div>
                  <span className="text-gray-400 block">Patient ID:</span>
                  <div className="text-white font-medium">{metadata.patientId}</div>
                </div>
              )}
              {metadata.studyDate && (
                <div>
                  <span className="text-gray-400 block">Study Date:</span>
                  <div className="text-white font-medium">
                    {new Date(metadata.studyDate).toLocaleDateString()}
                  </div>
                </div>
              )}
              {metadata.modality && (
                <div>
                  <span className="text-gray-400 block">Modality:</span>
                  <div className="text-white font-medium">{metadata.modality}</div>
                </div>
              )}
              {metadata.studyDescription && (
                <div>
                  <span className="text-gray-400 block">Study Description:</span>
                  <div className="text-white font-medium">{metadata.studyDescription}</div>
                </div>
              )}
              {metadata.imageWidth && metadata.imageHeight && (
                <div>
                  <span className="text-gray-400 block">Dimensions:</span>
                  <div className="text-white font-medium">
                    {metadata.imageWidth} × {metadata.imageHeight}
                  </div>
                </div>
              )}
              {metadata.bitDepth && (
                <div>
                  <span className="text-gray-400 block">Bit Depth:</span>
                  <div className="text-white font-medium">{metadata.bitDepth} bits</div>
                </div>
              )}
              <div className="pt-3 border-t border-gray-700">
                <span className="text-gray-400 block mb-2">Current View:</span>
                <div className="text-xs space-y-1">
                  <div>Zoom: {Math.round(zoom * 100)}%</div>
                  <div>Brightness: {brightness}%</div>
                  <div>Contrast: {contrast}%</div>
                  <div>Inverted: {invert ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-gray-800 text-gray-400 text-xs p-2 text-center">
        DICOM Preview • Use controls to adjust view • Download original file for professional DICOM software • ESC to close
      </div>
    </div>
  );
}
