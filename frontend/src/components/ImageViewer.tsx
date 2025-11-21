import { useState, useEffect } from 'react';
import api from '../services/api';

interface ImageViewerProps {
  imageId: string;
  filename: string;
  format: string;
  onClose: () => void;
}

export default function ImageViewer({ imageId, filename, format, onClose }: ImageViewerProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    loadImage();
    loadMetadata();
  }, [imageId]);

  const loadImage = async () => {
    try {
      const response = await api.get(`/images/${imageId}/file`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      setImageUrl(url);
    } catch (error) {
      console.error('Failed to load image:', error);
    } finally {
      setLoading(false);
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
  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">{filename}</h2>
          <p className="text-sm text-gray-400">Format: {format.toUpperCase()}</p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 text-2xl font-bold px-4"
        >
          ×
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-gray-800 text-white p-2 flex gap-2 items-center justify-center">
        <button
          onClick={handleZoomOut}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded"
        >
          −
        </button>
        <span className="px-3 py-1 bg-gray-700 rounded min-w-[80px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded"
        >
          +
        </button>
        <button
          onClick={handleResetZoom}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded ml-2"
        >
          Reset
        </button>
      </div>

      {/* Image Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Image Area */}
        <div
          className="flex-1 flex items-center justify-center overflow-hidden cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {loading ? (
            <div className="text-white">Loading image...</div>
          ) : (
            <img
              src={imageUrl}
              alt={filename}
              style={{
                transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                userSelect: 'none',
              }}
              draggable={false}
            />
          )}
        </div>

        {/* Metadata Panel */}
        {metadata && (
          <div className="w-80 bg-gray-900 text-white p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Metadata</h3>
            <div className="space-y-2 text-sm">
              {metadata.patientName && (
                <div>
                  <span className="text-gray-400">Patient:</span>
                  <div className="text-white">{metadata.patientName}</div>
                </div>
              )}
              {metadata.patientId && (
                <div>
                  <span className="text-gray-400">Patient ID:</span>
                  <div className="text-white">{metadata.patientId}</div>
                </div>
              )}
              {metadata.studyDate && (
                <div>
                  <span className="text-gray-400">Study Date:</span>
                  <div className="text-white">
                    {new Date(metadata.studyDate).toLocaleDateString()}
                  </div>
                </div>
              )}
              {metadata.modality && (
                <div>
                  <span className="text-gray-400">Modality:</span>
                  <div className="text-white">{metadata.modality}</div>
                </div>
              )}
              {metadata.imageWidth && metadata.imageHeight && (
                <div>
                  <span className="text-gray-400">Dimensions:</span>
                  <div className="text-white">
                    {metadata.imageWidth} × {metadata.imageHeight}
                  </div>
                </div>
              )}
              {metadata.bitDepth && (
                <div>
                  <span className="text-gray-400">Bit Depth:</span>
                  <div className="text-white">{metadata.bitDepth} bits</div>
                </div>
              )}
              {metadata.colorSpace && (
                <div>
                  <span className="text-gray-400">Color Space:</span>
                  <div className="text-white">{metadata.colorSpace}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-gray-800 text-gray-400 text-xs p-2 text-center">
        Use mouse wheel or +/− buttons to zoom • Click and drag to pan • ESC to close
      </div>
    </div>
  );
}
