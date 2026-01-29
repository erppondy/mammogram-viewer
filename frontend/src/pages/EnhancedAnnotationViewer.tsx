import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { annotationService, Annotation, CreateAnnotationDTO } from '../services/annotationService';
import { MedicalHeader, MedicalButton } from '../components/MedicalUI';
import { authService } from '../services/authService';

type AnnotationType = 'circle' | 'rectangle' | 'arrow' | 'text' | 'polygon' | 'freehand' | 'pan';

interface HistoryState {
  annotations: Annotation[];
  timestamp: number;
}

export default function EnhancedAnnotationViewer() {
  const { imageId } = useParams<{ imageId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Image and annotations
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  
  // Drawing state
  const [selectedTool, setSelectedTool] = useState<AnnotationType>('polygon');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
  // Properties
  const [color, setColor] = useState('#ff0000');
  const [category, setCategory] = useState('mass');
  const [severityLevel, setSeverityLevel] = useState(3);
  const [notes, setNotes] = useState('');
  
  // View state
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // History for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Image adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  
  // Zoom lock (starts locked, unlocked after image loads for annotation)
  const [isZoomLocked, setIsZoomLocked] = useState(true);
  
  // Findings form modal
  const [showFindingsForm, setShowFindingsForm] = useState(false);
  const [pendingCoordinates, setPendingCoordinates] = useState<any>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  // Load image and annotations
  useEffect(() => {
    loadImageAndAnnotations();
  }, [imageId]);

  // Redraw when zoom, pan, annotations, or drawing state changes
  useEffect(() => {
    if (image) {
      drawCanvas();
    }
  }, [zoom, pan, annotations, selectedAnnotation, brightness, contrast, currentPoints]);

  // Keyboard shortcuts - REMOVED letter shortcuts to avoid conflicts with form input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts if not typing in an input/textarea
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      // Undo/Redo (works even when typing)
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
      
      // Only handle these if NOT typing in a form field
      if (!isTyping) {
        // Delete
        if (e.key === 'Delete' && selectedAnnotation) {
          handleDeleteAnnotation(selectedAnnotation);
        }
        
        // Escape to cancel
        if (e.key === 'Escape') {
          setCurrentPoints([]);
          setIsDrawing(false);
          setSelectedAnnotation(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnnotation, historyIndex]);

  const loadImageAndAnnotations = async () => {
    if (!imageId) return;

    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/images/${imageId}/file`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load image');

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      
      const img = new Image();
      img.onload = async () => {
        setImage(img);
        const annots = await annotationService.getAnnotationsByImage(imageId);
        setAnnotations(annots);
        addToHistory(annots);
        
        // Auto-zoom for easier annotation (1.5x zoom by default)
        setTimeout(() => {
          if (containerRef.current) {
            const container = containerRef.current;
            const scaleX = (container.clientWidth - 40) / img.width;
            const scaleY = (container.clientHeight - 40) / img.height;
            const fitZoom = Math.min(scaleX, scaleY, 1);
            
            // Set initial zoom to 1.5x for easier annotation
            const annotationZoom = Math.min(fitZoom * 1.5, 2); // Max 2x zoom
            setZoom(annotationZoom);
            setPan({ x: 0, y: 0 });
            
            // Unlock zoom for annotation work
            setIsZoomLocked(false);
          }
        }, 100);
      };
      img.src = imageUrl;

    } catch (error) {
      console.error('Error loading:', error);
      alert('Failed to load image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    


    // Set canvas internal size to image dimensions
    canvas.width = image.width;
    canvas.height = image.height;

    // Calculate display size to fit container while maintaining aspect ratio
    const container = containerRef.current;
    if (container) {
      const containerWidth = container.clientWidth - 40;
      const containerHeight = container.clientHeight - 40;
      
      // Calculate scale to fit container
      const scaleX = containerWidth / image.width;
      const scaleY = containerHeight / image.height;
      const displayScale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 100%
      
      // Apply display size
      canvas.style.width = `${image.width * displayScale}px`;
      canvas.style.height = `${image.height * displayScale}px`;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Calculate center offset to keep image centered
    const scaledWidth = image.width * zoom;
    const scaledHeight = image.height * zoom;
    const centerX = (canvas.width - scaledWidth) / 2;
    const centerY = (canvas.height - scaledHeight) / 2;

    // Apply transformations with centering
    ctx.translate(centerX + pan.x, centerY + pan.y);
    ctx.scale(zoom, zoom);

    // Apply brightness and contrast
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    ctx.drawImage(image, 0, 0);
    ctx.filter = 'none';

    // Draw annotations
    annotations.forEach(annotation => {
      const isSelected = annotation.id === selectedAnnotation;
      ctx.strokeStyle = isSelected ? '#00ff00' : annotation.color;
      ctx.lineWidth = (isSelected ? 4 : 3) / zoom;
      ctx.fillStyle = annotation.color + '40';

      const coords = annotation.coordinates;

      switch (annotation.annotation_type) {
        case 'polygon':
          if (coords.points && coords.points.length > 0) {
            // Draw filled polygon
            ctx.beginPath();
            ctx.moveTo(coords.points[0].x, coords.points[0].y);
            for (let i = 1; i < coords.points.length; i++) {
              ctx.lineTo(coords.points[i].x, coords.points[i].y);
            }
            ctx.closePath();
            ctx.fill();
            
            // Draw polygon outline
            ctx.beginPath();
            ctx.moveTo(coords.points[0].x, coords.points[0].y);
            for (let i = 1; i < coords.points.length; i++) {
              ctx.lineTo(coords.points[i].x, coords.points[i].y);
            }
            ctx.closePath();
            ctx.stroke();
            
            // Draw vertex points for better visibility
            coords.points.forEach(p => {
              ctx.fillStyle = isSelected ? '#00ff00' : annotation.color;
              ctx.beginPath();
              ctx.arc(p.x, p.y, 3 / zoom, 0, 2 * Math.PI);
              ctx.fill();
            });
          }
          break;
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
        case 'freehand':
          if (coords.points && coords.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(coords.points[0].x, coords.points[0].y);
            coords.points.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.stroke();
          }
          break;
        case 'text':
          if (coords.x && coords.y && coords.text) {
            ctx.font = `${20 / zoom}px Arial`;
            ctx.fillStyle = annotation.color;
            ctx.fillText(coords.text, coords.x, coords.y);
          }
          break;
      }
    });

    // Draw current polygon points with real-time preview
    if (selectedTool === 'polygon' && currentPoints.length > 0) {
      // Draw filled polygon preview if we have 3+ points
      if (currentPoints.length >= 3) {
        ctx.fillStyle = color + '60'; // More opaque for visibility
        ctx.beginPath();
        ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
        for (let i = 1; i < currentPoints.length; i++) {
          ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
        }
        ctx.closePath();
        ctx.fill();
      }
      
      // Draw lines between points - THICKER for visibility
      ctx.strokeStyle = color;
      ctx.lineWidth = 4 / zoom;
      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
      for (let i = 1; i < currentPoints.length; i++) {
        ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
      }
      ctx.stroke();
      
      // Draw point markers - MUCH LARGER for visibility
      currentPoints.forEach((p, index) => {
        // Draw a large white circle background
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8 / zoom, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw colored circle on top
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6 / zoom, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw point number
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${12 / zoom}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((index + 1).toString(), p.x, p.y);
      });
    }
    
    // Draw current freehand path
    if (selectedTool === 'freehand' && currentPoints.length > 1) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3 / zoom;
      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
      currentPoints.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    }

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

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    // Calculate the scale between display size and actual canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Calculate center offset (same as in drawCanvas)
    const scaledWidth = image.width * zoom;
    const scaledHeight = image.height * zoom;
    const centerX = (canvas.width - scaledWidth) / 2;
    const centerY = (canvas.height - scaledHeight) / 2;
    
    // Convert mouse position to canvas coordinates accounting for centering
    const x = ((e.clientX - rect.left) * scaleX - centerX - pan.x) / zoom;
    const y = ((e.clientY - rect.top) * scaleY - centerY - pan.y) / zoom;
    
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);

    // Pan tool or Right click or Shift for panning
    if (selectedTool === 'pan' || e.button === 2 || e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    // Polygon tool - add points on click
    if (selectedTool === 'polygon') {
      const newPoints = [...currentPoints, coords];
      setCurrentPoints(newPoints);
      return;
    }

    // Freehand tool - start drawing
    if (selectedTool === 'freehand') {
      setIsDrawing(true);
      setCurrentPoints([coords]);
      return;
    }

    // Other tools
    setIsDrawing(true);
    setStartPos(coords);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    // Freehand drawing
    if (isDrawing && selectedTool === 'freehand') {
      const coords = getCanvasCoordinates(e);
      setCurrentPoints(prev => [...prev, coords]);
      drawCanvas();
      return;
    }

    // Live preview for circle and rectangle while drawing
    if (isDrawing && (selectedTool === 'circle' || selectedTool === 'rectangle')) {
      const canvas = canvasRef.current;
      if (!canvas || !image) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Redraw everything
      drawCanvas();

      // Draw preview shape
      const coords = getCanvasCoordinates(e);
      
      ctx.save();
      
      // Calculate center offset (same as in drawCanvas)
      const scaledWidth = image.width * zoom;
      const scaledHeight = image.height * zoom;
      const centerX = (canvas.width - scaledWidth) / 2;
      const centerY = (canvas.height - scaledHeight) / 2;
      
      ctx.translate(centerX + pan.x, centerY + pan.y);
      ctx.scale(zoom, zoom);
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 3 / zoom;
      ctx.fillStyle = color + '40';
      ctx.setLineDash([5 / zoom, 5 / zoom]); // Dashed line for preview
      
      if (selectedTool === 'circle') {
        const radius = Math.sqrt(Math.pow(coords.x - startPos.x, 2) + Math.pow(coords.y - startPos.y, 2));
        ctx.beginPath();
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      } else if (selectedTool === 'rectangle') {
        const x = Math.min(startPos.x, coords.x);
        const y = Math.min(startPos.y, coords.y);
        const width = Math.abs(coords.x - startPos.x);
        const height = Math.abs(coords.y - startPos.y);
        ctx.fillRect(x, y, width, height);
        ctx.strokeRect(x, y, width, height);
      }
      
      ctx.setLineDash([]); // Reset dash
      ctx.restore();
      return;
    }

    // Show preview line for polygon tool
    if (selectedTool === 'polygon' && currentPoints.length > 0) {
      const canvas = canvasRef.current;
      if (!canvas || !image) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Redraw everything
      drawCanvas();

      // Draw preview line from last point to cursor
      const coords = getCanvasCoordinates(e);
      const lastPoint = currentPoints[currentPoints.length - 1];
      
      ctx.save();
      
      // Calculate center offset (same as in drawCanvas)
      const scaledWidth = image.width * zoom;
      const scaledHeight = image.height * zoom;
      const centerX = (canvas.width - scaledWidth) / 2;
      const centerY = (canvas.height - scaledHeight) / 2;
      
      ctx.translate(centerX + pan.x, centerY + pan.y);
      ctx.scale(zoom, zoom);
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]); // Dashed line for preview
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash
      
      ctx.restore();
    }
  };

  const handleMouseUp = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (selectedTool === 'freehand' && isDrawing) {
      await saveAnnotation({ points: currentPoints });
      setCurrentPoints([]);
      setIsDrawing(false);
      return;
    }

    if (!isDrawing || !imageId) return;

    const endCoords = getCanvasCoordinates(e);
    let coordinates: any = {};

    switch (selectedTool) {
      case 'circle':
        const radius = Math.sqrt(Math.pow(endCoords.x - startPos.x, 2) + Math.pow(endCoords.y - startPos.y, 2));
        coordinates = { x: startPos.x, y: startPos.y, radius };
        // Show findings form for circle
        setPendingCoordinates(coordinates);
        setShowFindingsForm(true);
        setIsDrawing(false);
        return;
      case 'rectangle':
        coordinates = {
          x: Math.min(startPos.x, endCoords.x),
          y: Math.min(startPos.y, endCoords.y),
          width: Math.abs(endCoords.x - startPos.x),
          height: Math.abs(endCoords.y - startPos.y),
        };
        // Show findings form for rectangle
        setPendingCoordinates(coordinates);
        setShowFindingsForm(true);
        setIsDrawing(false);
        return;
      case 'arrow':
        coordinates = { startX: startPos.x, startY: startPos.y, endX: endCoords.x, endY: endCoords.y };
        // Arrows save directly without findings form
        await saveAnnotation(coordinates);
        setIsDrawing(false);
        return;
      case 'text':
        const text = prompt('Enter text:');
        if (!text) {
          setIsDrawing(false);
          return;
        }
        coordinates = { x: startPos.x, y: startPos.y, text };
        await saveAnnotation(coordinates);
        setIsDrawing(false);
        return;
    }

    setIsDrawing(false);
  };

  const handleDoubleClick = async () => {
    // Close polygon on double click - show findings form
    if (selectedTool === 'polygon' && currentPoints.length >= 3) {
      setPendingCoordinates({ points: currentPoints });
      setShowFindingsForm(true);
      setCurrentPoints([]); // Clear the drawing
    }
  };

  const saveAnnotation = async (
    coordinates: any, 
    customCategory?: string, 
    customSeverity?: number, 
    customNotes?: string,
    customFindingName?: string
  ) => {
    if (!imageId) return;

    try {
      const newAnnotation: CreateAnnotationDTO = {
        image_id: imageId,
        annotation_type: selectedTool,
        coordinates,
        color,
        severity_level: customSeverity !== undefined ? customSeverity : severityLevel,
        category: customCategory || category,
        finding_name: customFindingName,
        notes: customNotes !== undefined ? customNotes : notes,
      };

      const created = await annotationService.createAnnotation(newAnnotation);
      const newAnnotations = [...annotations, created];
      setAnnotations(newAnnotations);
      addToHistory(newAnnotations);
      setNotes('');
      setCurrentPoints([]);
      setShowFindingsForm(false);
      setPendingCoordinates(null);
    } catch (error) {
      console.error('Error creating annotation:', error);
      alert('Failed to create annotation');
    }
  };

  const handleSaveFinding = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const findingName = formData.get('finding_name') as string;
    const findingCategory = formData.get('finding') as string;
    const findingNotes = formData.get('notes') as string;
    const findingSeverity = formData.get('severity') as string;
    
    if (pendingCoordinates) {
      await saveAnnotation(
        pendingCoordinates, 
        findingCategory, 
        findingSeverity ? parseInt(findingSeverity) : undefined, 
        findingNotes,
        findingName
      );
    }
  };

  const handleCancelFinding = () => {
    setShowFindingsForm(false);
    setPendingCoordinates(null);
  };

  const handleDeleteAnnotation = async (id: string) => {
    if (!confirm('Delete this annotation?')) return;

    try {
      await annotationService.deleteAnnotation(id);
      const newAnnotations = annotations.filter(a => a.id !== id);
      setAnnotations(newAnnotations);
      addToHistory(newAnnotations);
      setSelectedAnnotation(null);
    } catch (error) {
      console.error('Error deleting annotation:', error);
      alert('Failed to delete annotation');
    }
  };

  // History management
  const addToHistory = (annots: Annotation[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ annotations: annots, timestamp: Date.now() });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAnnotations(history[historyIndex - 1].annotations);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAnnotations(history[historyIndex + 1].annotations);
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (isZoomLocked) return;
    setZoom(prev => Math.min(prev + 0.25, 5));
    // Keep centered by resetting pan
    setPan({ x: 0, y: 0 });
  };
  
  const handleZoomOut = () => {
    if (isZoomLocked) return;
    setZoom(prev => Math.max(prev - 0.25, 0.25));
    // Keep centered by resetting pan
    setPan({ x: 0, y: 0 });
  };
  
  const handleResetZoom = () => {
    if (isZoomLocked) return;
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  
  const handleFitScreen = () => {
    if (!image || !containerRef.current) return;
    const container = containerRef.current;
    const scaleX = container.clientWidth / image.width;
    const scaleY = container.clientHeight / image.height;
    setZoom(Math.min(scaleX, scaleY, 1));
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (isZoomLocked) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.25, Math.min(5, prev + delta)));
    // Keep centered by resetting pan
    setPan({ x: 0, y: 0 });
  };
  
  const toggleZoomLock = () => {
    setIsZoomLocked(!isZoomLocked);
  };

  const handleLogout = () => authService.logout();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] medical-grid-bg flex items-center justify-center">
        <div className="medical-spinner"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[var(--bg-primary)] medical-grid-bg flex flex-col overflow-hidden">
      <MedicalHeader title="Enhanced Annotation Tool">
        <MedicalButton onClick={handleLogout} variant="secondary" size="sm">
          Logout
        </MedicalButton>
      </MedicalHeader>

      <div className="flex-1 flex flex-col overflow-hidden px-4 py-2">
        <div className="mb-2 flex items-center justify-between flex-shrink-0">
          <MedicalButton onClick={() => navigate(-1)} variant="secondary" size="sm">
            ← Back
          </MedicalButton>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="px-2 py-1 text-sm bg-[var(--medical-primary)]/20 hover:bg-[var(--medical-primary)]/30 text-[var(--medical-primary)] rounded transition-colors disabled:opacity-30"
              title="Undo (Ctrl+Z)"
            >
              ↶
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="px-2 py-1 text-sm bg-[var(--medical-primary)]/20 hover:bg-[var(--medical-primary)]/30 text-[var(--medical-primary)] rounded transition-colors disabled:opacity-30"
              title="Redo (Ctrl+Y)"
            >
              ↷
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-3 flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          {/* Canvas */}
          <div className="lg:col-span-4 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
            <div className="bg-black/40 backdrop-blur-sm border border-[var(--medical-primary)]/30 rounded-lg p-2 flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
              {/* Controls */}
              <div className="flex items-center gap-2 mb-3 flex-wrap flex-shrink-0">
                {/* Zoom Lock Toggle */}
                <button 
                  onClick={toggleZoomLock} 
                  className={`px-3 py-2 text-sm font-semibold rounded transition-all ${
                    isZoomLocked 
                      ? 'bg-[var(--medical-primary)] text-black' 
                      : 'bg-[var(--medical-primary)]/20 text-[var(--medical-primary)]'
                  }`}
                  title={isZoomLocked ? "Zoom Locked" : "Zoom Unlocked"}
                >
                  {isZoomLocked ? '🔒 Locked' : '🔓 Unlocked'}
                </button>
                
                <div className="h-8 w-px bg-[var(--medical-primary)]/30"></div>
                
                <button 
                  onClick={handleZoomOut} 
                  disabled={isZoomLocked}
                  className={`px-3 py-2 text-base font-bold rounded ${
                    isZoomLocked 
                      ? 'bg-gray-600/20 text-gray-500 cursor-not-allowed' 
                      : 'bg-[var(--medical-primary)]/20 text-[var(--medical-primary)] hover:bg-[var(--medical-primary)]/30'
                  }`}
                  title="Zoom Out"
                >
                  −
                </button>
                <span className="text-[var(--medical-primary)] text-base font-bold min-w-[60px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button 
                  onClick={handleZoomIn} 
                  disabled={isZoomLocked}
                  className={`px-3 py-2 text-base font-bold rounded ${
                    isZoomLocked 
                      ? 'bg-gray-600/20 text-gray-500 cursor-not-allowed' 
                      : 'bg-[var(--medical-primary)]/20 text-[var(--medical-primary)] hover:bg-[var(--medical-primary)]/30'
                  }`}
                  title="Zoom In"
                >
                  +
                </button>
                <button 
                  onClick={handleFitScreen} 
                  className="px-3 py-2 text-sm bg-[var(--medical-primary)]/20 text-[var(--medical-primary)] hover:bg-[var(--medical-primary)]/30 rounded transition-colors" 
                  title="Fit to Screen"
                >
                  Fit Screen
                </button>
                
                <div className="h-8 w-px bg-[var(--medical-primary)]/30 ml-2"></div>
                
                {/* Brightness/Contrast */}
                <div className="flex items-center gap-2 ml-2">
                  <label className="text-sm text-gray-300 font-medium">Brightness:</label>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-sm text-[var(--medical-primary)] font-bold min-w-[40px]">{brightness}%</span>
                  
                  <label className="text-sm text-gray-300 font-medium ml-3">Contrast:</label>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={contrast}
                    onChange={(e) => setContrast(parseInt(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-sm text-[var(--medical-primary)] font-bold min-w-[40px]">{contrast}%</span>
                </div>
              </div>
              
              {selectedTool === 'polygon' && currentPoints.length > 0 && (
                <div className="text-sm bg-[var(--medical-primary)] text-black px-4 py-2 rounded mb-2 text-center flex-shrink-0 font-semibold">
                  Polygon: {currentPoints.length} points - Double-click to finish
                </div>
              )}
              
              <div 
                ref={containerRef}
                className="overflow-hidden border border-[var(--medical-primary)]/50 rounded flex-1 flex items-center justify-center bg-black/20"
                style={{ minHeight: 0, height: '100%' }}
              >
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onDoubleClick={handleDoubleClick}
                  onWheel={handleWheel}
                  onContextMenu={(e) => e.preventDefault()}
                  className={isPanning ? 'cursor-grabbing' : (selectedTool === 'pan' ? 'cursor-grab' : 'cursor-crosshair')}
                  style={{ 
                    display: 'block', 
                    imageRendering: 'auto',
                    maxWidth: '100%', 
                    maxHeight: '100%'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="lg:col-span-2 flex flex-col gap-3 overflow-hidden" style={{ minHeight: 0 }}>
            {/* Annotations List - MOVED TO TOP */}
            <div className="bg-black/40 backdrop-blur-sm border border-[var(--medical-primary)]/30 rounded-lg p-3 flex-1 flex flex-col overflow-hidden">
              <h3 className="text-[var(--medical-primary)] font-semibold text-base mb-2">
                Findings ({annotations.length})
              </h3>
              <div className="space-y-2 flex-1 overflow-y-auto">
                {annotations.length === 0 ? (
                  <div className="text-center text-gray-500 py-6">
                    <div className="text-2xl mb-2">📝</div>
                    <div className="text-sm">No findings yet</div>
                  </div>
                ) : (
                  annotations.map(ann => (
                    <div 
                      key={ann.id} 
                      className={`p-2.5 rounded text-sm cursor-pointer transition-all ${
                        selectedAnnotation === ann.id 
                          ? 'bg-[var(--medical-primary)]/30 border-2 border-[var(--medical-primary)]' 
                          : 'bg-black/20 hover:bg-black/40'
                      }`}
                      onClick={() => setSelectedAnnotation(ann.id)}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-200 font-semibold flex items-center gap-1.5">
                            <span style={{ color: ann.color, fontSize: '16px' }}>●</span>
                            <span className="truncate text-sm">{ann.finding_name || ann.annotation_type}</span>
                          </div>
                          <div className="text-sm text-gray-400 mt-0.5">
                            {ann.category} • Severity: {ann.severity_level}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAnnotation(ann.id);
                          }}
                          className="text-red-400 hover:text-red-300 flex-shrink-0 text-base"
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tools */}
            <div className="bg-black/40 backdrop-blur-sm border border-[var(--medical-primary)]/30 rounded-lg p-3 flex-1 flex flex-col">
              <h3 className="text-[var(--medical-primary)] font-semibold text-base mb-2">Tools</h3>
              <div className="space-y-2 flex-1">
                {[
                  { type: 'pan' as AnnotationType, label: '✋ Pan/Drag' },
                  { type: 'polygon' as AnnotationType, label: '▽ Polygon' },
                  { type: 'circle' as AnnotationType, label: '⭕ Circle' },
                  { type: 'rectangle' as AnnotationType, label: '▭ Rectangle' },
                  { type: 'arrow' as AnnotationType, label: '➜ Arrow' },
                  { type: 'freehand' as AnnotationType, label: '✏️ Freehand' },
                  { type: 'text' as AnnotationType, label: 'T Text' },
                ].map(tool => (
                  <button
                    key={tool.type}
                    onClick={() => setSelectedTool(tool.type)}
                    className={`w-full px-3 py-2 text-sm rounded text-left transition-all ${
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
            <div className="bg-black/40 backdrop-blur-sm border border-[var(--medical-primary)]/30 rounded-lg p-3 flex-shrink-0">
              <h3 className="text-[var(--medical-primary)] font-semibold text-base mb-2">Properties</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-300 block mb-1.5 font-medium">Severity</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={severityLevel}
                      onChange={(e) => setSeverityLevel(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-[var(--medical-primary)] font-bold text-base min-w-[20px] text-center">{severityLevel}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-300 block mb-1.5 font-medium">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-black/40 border border-[var(--medical-primary)]/30 rounded text-gray-300"
                  >
                    <option value="mass">Mass</option>
                    <option value="calcification">Calcification</option>
                    <option value="asymmetry">Asymmetry</option>
                    <option value="distortion">Distortion</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Findings Form Modal */}
      {showFindingsForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={handleCancelFinding}>
          <div className="bg-[var(--bg-secondary)] border-2 border-[var(--medical-primary)] rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-[var(--medical-primary)] mb-4">Add Finding Details</h2>
            
            <form onSubmit={handleSaveFinding} className="space-y-4">
              {/* Finding Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Finding Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="finding_name"
                  required
                  placeholder="e.g., Suspicious Mass in Upper Outer Quadrant"
                  className="w-full px-4 py-2 bg-black/40 border border-[var(--medical-primary)]/30 rounded text-gray-300 focus:outline-none focus:border-[var(--medical-primary)] transition-colors"
                />
              </div>

              {/* Finding Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Finding Category <span className="text-red-400">*</span>
                </label>
                <select
                  name="finding"
                  required
                  defaultValue={category}
                  className="w-full px-4 py-2 bg-black/40 border border-[var(--medical-primary)]/30 rounded text-gray-300 focus:outline-none focus:border-[var(--medical-primary)] transition-colors"
                >
                  <option value="mass">Mass</option>
                  <option value="calcification">Calcification</option>
                  <option value="asymmetry">Asymmetry</option>
                  <option value="distortion">Distortion</option>
                  <option value="architectural_distortion">Architectural Distortion</option>
                  <option value="lymph_node">Lymph Node</option>
                  <option value="skin_lesion">Skin Lesion</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Notes <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="notes"
                  required
                  rows={4}
                  placeholder="Describe the finding in detail..."
                  className="w-full px-4 py-2 bg-black/40 border border-[var(--medical-primary)]/30 rounded text-gray-300 focus:outline-none focus:border-[var(--medical-primary)] transition-colors resize-none"
                />
              </div>

              {/* Severity Level (Optional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Severity Level <span className="text-gray-500 text-xs">(optional)</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    name="severity"
                    min="1"
                    max="5"
                    defaultValue={severityLevel}
                    className="flex-1"
                    id="severity-slider"
                    onChange={(e) => {
                      const output = e.currentTarget.nextElementSibling as HTMLOutputElement;
                      if (output) output.textContent = e.currentTarget.value;
                    }}
                  />
                  <output 
                    htmlFor="severity-slider" 
                    className="text-[var(--medical-primary)] font-bold text-lg min-w-[30px] text-center"
                  >
                    {severityLevel}
                  </output>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelFinding}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[var(--medical-primary)] hover:bg-[var(--medical-primary)]/80 text-black font-semibold rounded transition-colors"
                >
                  Save Finding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
