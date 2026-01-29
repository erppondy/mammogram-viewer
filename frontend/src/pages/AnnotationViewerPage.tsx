import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { annotationService, Annotation, CreateAnnotationDTO } from '../services/annotationService';
import { MedicalHeader, MedicalButton } from '../components/MedicalUI';
import { authService } from '../services/authService';

type AnnotationType = 'circle' | 'rectangle' | 'arrow' | 'text';

export default function AnnotationViewerPage() {
  const { imageId } = useParams<{ imageId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedTool, setSelectedTool] = useState<AnnotationType>('circle');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [color, setColor] = useState('#ff0000');
  const [category, setCategory] = useState('mass');
  const [severityLevel, setSeverityLevel] = useState(3);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    loadImageAndAnnotations();
  }, [imageId]);

  useEffect(() => {
    if (image) {
      drawCanvas(image, annotations);
    }
  }, [zoom, pan]);

  const loadImageAndAnnotations = async () => {
    if (!imageId) return;

    try {
      setLoading(true);
      
      // Load image using fetch with Authorization header
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/images/${imageId}/file`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load image');
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      
      const img = new Image();
      img.onload = () => {
        setImage(img);
        // Load annotations after image is loaded
        annotationService.getAnnotationsByImage(imageId).then(annots => {
          setAnnotations(annots);
          drawCanvas(img, annots);
        });
      };
      img.src = imageUrl;

    } catch (error) {
      console.error('Error loading:', error);
      alert('Failed to load image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const drawCanvas = (img: HTMLImageElement, annots: Annotation[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to original image size
    canvas.width = img.width;
    canvas.height = img.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();

    // Apply zoom and pan transformations
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw image
    ctx.drawImage(img, 0, 0);

    // Draw annotations
    annots.forEach(annotation => {
      ctx.strokeStyle = annotation.color;
      ctx.lineWidth = 3 / zoom; // Adjust line width for zoom
      ctx.fillStyle = annotation.color + '40';

      const coords = annotation.coordinates;

      switch (annotation.annotation_type) {
        case 'circle':
          if (coords.x && coords.y && coords.radius) {
            ctx.beginPath();
            ctx.arc(coords.x, coords.y, coords.radius, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.fill();
          }
          break;
        case 'rectangle':
          if (coords.x && coords.y && coords.width && coords.height) {
            ctx.strokeRect(coords.x, coords.y, coords.width, coords.height);
            ctx.fillRect(coords.x, coords.y, coords.width, coords.height);
          }
          break;
        case 'arrow':
          if (coords.startX && coords.startY && coords.endX && coords.endY) {
            drawArrow(ctx, coords.startX, coords.startY, coords.endX, coords.endY);
          }
          break;
        case 'text':
          if (coords.x && coords.y && coords.text) {
            ctx.font = `${20 / zoom}px Arial`; // Adjust font size for zoom
            ctx.fillStyle = annotation.color;
            ctx.fillText(coords.text, coords.x, coords.y);
          }
          break;
      }
    });

    // Restore context state
    ctx.restore();
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const headLength = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.25, Math.min(5, prev + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    // Right click or space key for panning
    if (e.button === 2 || e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    setIsDrawing(true);
    setStartPos({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleMouseUp = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!isDrawing || !imageId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const endX = (e.clientX - rect.left - pan.x) / zoom;
    const endY = (e.clientY - rect.top - pan.y) / zoom;

    let coordinates: any = {};

    switch (selectedTool) {
      case 'circle':
        const radius = Math.sqrt(Math.pow(endX - startPos.x, 2) + Math.pow(endY - startPos.y, 2));
        coordinates = { x: startPos.x, y: startPos.y, radius };
        break;
      case 'rectangle':
        coordinates = {
          x: Math.min(startPos.x, endX),
          y: Math.min(startPos.y, endY),
          width: Math.abs(endX - startPos.x),
          height: Math.abs(endY - startPos.y),
        };
        break;
      case 'arrow':
        coordinates = { startX: startPos.x, startY: startPos.y, endX, endY };
        break;
      case 'text':
        const text = prompt('Enter text:');
        if (!text) {
          setIsDrawing(false);
          return;
        }
        coordinates = { x: startPos.x, y: startPos.y, text };
        break;
    }

    try {
      const newAnnotation: CreateAnnotationDTO = {
        image_id: imageId,
        annotation_type: selectedTool,
        coordinates,
        color,
        severity_level: severityLevel,
        category,
        notes,
      };

      await annotationService.createAnnotation(newAnnotation);
      await loadImageAndAnnotations();
      setNotes('');
    } catch (error) {
      console.error('Error creating annotation:', error);
      alert('Failed to create annotation');
    }

    setIsDrawing(false);
  };

  const handleDeleteAnnotation = async (id: string) => {
    if (!confirm('Delete this annotation?')) return;

    try {
      await annotationService.deleteAnnotation(id);
      await loadImageAndAnnotations();
    } catch (error) {
      console.error('Error deleting annotation:', error);
      alert('Failed to delete annotation');
    }
  };

  const handleLogout = () => {
    authService.logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] medical-grid-bg flex items-center justify-center">
        <div className="medical-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] medical-grid-bg">
      <MedicalHeader title="Annotation Tool">
        <MedicalButton onClick={handleLogout} variant="secondary" size="sm">
          Logout
        </MedicalButton>
      </MedicalHeader>

      <div className="container mx-auto px-4 py-6">
        <div className="mb-4">
          <MedicalButton onClick={() => navigate(-1)} variant="secondary" size="sm">
            ← Back to Gallery
          </MedicalButton>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Canvas */}
          <div className="lg:col-span-3">
            <div className="bg-black/40 backdrop-blur-sm border border-[var(--medical-primary)]/30 rounded-lg p-4">
              {/* Zoom Controls */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={handleZoomOut}
                  className="px-3 py-1 bg-[var(--medical-primary)]/20 hover:bg-[var(--medical-primary)]/30 text-[var(--medical-primary)] rounded transition-colors"
                  title="Zoom Out"
                >
                  🔍−
                </button>
                <span className="text-[var(--medical-primary)] font-mono text-sm min-w-[60px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="px-3 py-1 bg-[var(--medical-primary)]/20 hover:bg-[var(--medical-primary)]/30 text-[var(--medical-primary)] rounded transition-colors"
                  title="Zoom In"
                >
                  🔍+
                </button>
                <button
                  onClick={handleResetZoom}
                  className="px-3 py-1 bg-[var(--medical-primary)]/20 hover:bg-[var(--medical-primary)]/30 text-[var(--medical-primary)] rounded transition-colors text-sm"
                  title="Reset Zoom"
                >
                  Reset
                </button>
                <span className="text-xs text-gray-400 ml-auto">
                  Shift+Drag to pan | Mouse wheel to zoom
                </span>
              </div>
              <div 
                ref={containerRef}
                className="overflow-auto border border-[var(--medical-primary)]/50 rounded"
                style={{ maxHeight: '65vh' }}
              >
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onWheel={handleWheel}
                  onContextMenu={(e) => e.preventDefault()}
                  className="cursor-crosshair"
                  style={{ 
                    display: 'block',
                    imageRendering: 'pixelated'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="space-y-4">
            {/* Tools */}
            <div className="bg-black/40 backdrop-blur-sm border border-[var(--medical-primary)]/30 rounded-lg p-4">
              <h3 className="text-[var(--medical-primary)] font-semibold mb-3">Tools</h3>
              <div className="space-y-2">
                {[
                  { type: 'circle' as AnnotationType, label: '⭕ Circle', icon: '⭕' },
                  { type: 'rectangle' as AnnotationType, label: '▭ Rectangle', icon: '▭' },
                  { type: 'arrow' as AnnotationType, label: '➜ Arrow', icon: '➜' },
                  { type: 'text' as AnnotationType, label: 'T Text', icon: 'T' },
                ].map(tool => (
                  <button
                    key={tool.type}
                    onClick={() => setSelectedTool(tool.type)}
                    className={`w-full px-3 py-2 rounded text-left transition-all ${
                      selectedTool === tool.type
                        ? 'bg-[var(--medical-primary)] text-black font-semibold'
                        : 'bg-black/20 text-gray-300 hover:bg-black/40'
                    }`}
                  >
                    {tool.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Properties */}
            <div className="bg-black/40 backdrop-blur-sm border border-[var(--medical-primary)]/30 rounded-lg p-4">
              <h3 className="text-[var(--medical-primary)] font-semibold mb-3">Properties</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-300 block mb-1">Color</label>
                  <div className="flex gap-2">
                    {['#ff0000', '#ffff00', '#00ff00', '#00ffff'].map(c => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded border-2 ${color === c ? 'border-white' : 'border-gray-600'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-300 block mb-1">Severity (1-5)</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={severityLevel}
                    onChange={(e) => setSeverityLevel(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-center text-[var(--medical-primary)]">{severityLevel}</div>
                </div>

                <div>
                  <label className="text-sm text-gray-300 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-[var(--medical-primary)]/30 rounded text-gray-300"
                  >
                    <option value="mass">Mass</option>
                    <option value="calcification">Calcification</option>
                    <option value="asymmetry">Asymmetry</option>
                    <option value="distortion">Distortion</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-300 block mb-1">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-[var(--medical-primary)]/30 rounded text-gray-300"
                    rows={3}
                    placeholder="Add notes..."
                  />
                </div>
              </div>
            </div>

            {/* Annotations List */}
            <div className="bg-black/40 backdrop-blur-sm border border-[var(--medical-primary)]/30 rounded-lg p-4">
              <h3 className="text-[var(--medical-primary)] font-semibold mb-3">
                Annotations ({annotations.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {annotations.map(ann => (
                  <div key={ann.id} className="bg-black/20 p-2 rounded text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-gray-300">{ann.annotation_type}</div>
                        <div className="text-xs text-gray-500">{ann.category}</div>
                      </div>
                      <button
                        onClick={() => handleDeleteAnnotation(ann.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
