# Design Document

## Overview

This design document outlines the technical architecture for a completely redesigned medical image annotation interface. The new system will replace the existing annotation viewer with a modern, intuitive, and highly responsive interface that addresses all identified usability issues. The design focuses on three core pillars: **ease of use**, **visual clarity**, and **performance**.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  ImprovedAnnotationViewer                    │
│                     (Main Component)                         │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Toolbar    │    │    Canvas    │    │   Sidebar    │
│  Component   │    │   Manager    │    │  Component   │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Tool Manager │    │ Zoom/Pan     │    │ Annotation   │
│              │    │ Controller   │    │ List Manager │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┴─────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  State Manager   │
                    │  (with History)  │
                    └──────────────────┘
```

### Component Breakdown

1. **ImprovedAnnotationViewer** - Main container component
2. **Toolbar** - Tool selection and zoom controls
3. **Canvas Manager** - Handles image and annotation rendering
4. **Sidebar** - Annotations list and management
5. **Tool Manager** - Manages active tools and interactions
6. **Zoom/Pan Controller** - Handles viewport transformations
7. **State Manager** - Centralized state with undo/redo history

## Components and Interfaces

### 1. ImprovedAnnotationViewer Component

**Purpose:** Main container that orchestrates all sub-components

**Props:**
```typescript
interface ImprovedAnnotationViewerProps {
  imageId: string;
  imageUrl: string;
  initialAnnotations?: Annotation[];
  onSave?: (annotations: Annotation[]) => Promise<void>;
  onClose?: () => void;
  readOnly?: boolean;
}
```

**State:**
```typescript
interface ViewerState {
  // Image state
  image: HTMLImageElement | null;
  imageLoaded: boolean;
  
  // Viewport state
  zoom: number;
  panX: number;
  panY: number;
  
  // Tool state
  activeTool: ToolType;
  isDrawing: boolean;
  isPanning: boolean;
  
  // Annotations
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  hoveredAnnotationId: string | null;
  
  // History
  history: HistoryState[];
  historyIndex: number;
  
  // UI state
  sidebarCollapsed: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
}
```

### 2. Toolbar Component

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│ [Select] [Pan] [Rect] [Polygon] [Arrow] [Text] │ Zoom: 150% │
│                                                  │ [−] [Slider] [+] [Fit] [100%] │
│                                                  │ [Undo] [Redo] [Save] │
└────────────────────────────────────────────────────────────┘
```

**Features:**
- Large, touch-friendly buttons (48x48px)
- Active tool highlighted with border and background
- Keyboard shortcuts displayed on hover
- Zoom percentage display
- Zoom slider (10% - 500%)
- Quick zoom buttons
- Undo/Redo with disabled states
- Save status indicator

### 3. Canvas Manager

**Responsibilities:**
- Render image with current zoom and pan
- Render all visible annotations
- Handle mouse/touch events
- Manage drawing interactions
- Optimize rendering performance

**Rendering Strategy:**
```typescript
class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement; // For performance
  
  render(state: ViewerState): void {
    // 1. Clear canvas
    // 2. Apply zoom and pan transformations
    // 3. Draw image
    // 4. Draw annotations
    // 5. Draw active drawing preview
    // 6. Draw selection handles
  }
  
  renderAnnotation(annotation: Annotation, isSelected: boolean, isHovered: boolean): void {
    // Render with appropriate styling based on state
  }
}
```

**Performance Optimizations:**
- Use offscreen canvas for complex rendering
- Only redraw when state changes
- Use requestAnimationFrame for smooth animations
- Implement dirty rectangle optimization
- Cache rendered annotations

### 4. Zoom/Pan Controller

**Zoom Implementation:**
```typescript
class ZoomPanController {
  // Zoom centered on mouse position
  zoomAtPoint(currentZoom: number, delta: number, mouseX: number, mouseY: number): {
    zoom: number;
    panX: number;
    panY: number;
  } {
    const newZoom = clamp(currentZoom + delta, 0.1, 5.0);
    const zoomRatio = newZoom / currentZoom;
    
    // Adjust pan to keep mouse position fixed
    const newPanX = mouseX - (mouseX - panX) * zoomRatio;
    const newPanY = mouseY - (mouseY - panY) * zoomRatio;
    
    return { zoom: newZoom, panX: newPanX, panY: newPanY };
  }
  
  // Fit image to viewport
  fitToScreen(imageWidth: number, imageHeight: number, viewportWidth: number, viewportHeight: number): {
    zoom: number;
    panX: number;
    panY: number;
  } {
    const scaleX = viewportWidth / imageWidth;
    const scaleY = viewportHeight / imageHeight;
    const zoom = Math.min(scaleX, scaleY, 1.0);
    
    const panX = (viewportWidth - imageWidth * zoom) / 2;
    const panY = (viewportHeight - imageHeight * zoom) / 2;
    
    return { zoom, panX, panY };
  }
}
```

**Pan Implementation:**
- Track mouse down position
- Calculate delta on mouse move
- Update pan offset
- Constrain to reasonable bounds
- Support multiple pan triggers (spacebar, pan tool, right-click)

### 5. Tool Manager

**Tool Types:**
```typescript
enum ToolType {
  SELECT = 'select',
  PAN = 'pan',
  RECTANGLE = 'rectangle',
  POLYGON = 'polygon',
  ARROW = 'arrow',
  TEXT = 'text',
}

interface Tool {
  type: ToolType;
  name: string;
  icon: React.ReactNode;
  cursor: string;
  shortcut: string;
  onMouseDown: (e: MouseEvent, state: ViewerState) => void;
  onMouseMove: (e: MouseEvent, state: ViewerState) => void;
  onMouseUp: (e: MouseEvent, state: ViewerState) => void;
}
```

**Tool Behaviors:**

**Select Tool:**
- Click annotation to select
- Drag to move annotation
- Show resize handles on selected annotation
- Double-click to edit properties

**Rectangle Tool:**
- Click and drag to draw rectangle
- Show preview while drawing
- Release to complete
- Auto-switch to select tool after completion

**Polygon Tool:**
- Click to add points
- Show preview line to cursor
- Double-click or click first point to close
- ESC to cancel

**Arrow Tool:**
- Click and drag to draw arrow
- Show preview while drawing
- Release to complete

**Text Tool:**
- Click to place text annotation
- Show input dialog
- Create text annotation with entered text

### 6. Annotations Sidebar

**Layout:**
```
┌─────────────────────────────┐
│ Annotations (5)        [▼]  │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 🟥 Rectangle            │ │
│ │ Finding: Mass           │ │
│ │ [👁] [✏️] [🗑]          │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 🟨 Polygon              │ │
│ │ Finding: Calcification  │ │
│ │ [👁] [✏️] [🗑]          │ │
│ └─────────────────────────┘ │
│ ...                         │
└─────────────────────────────┘
```

**Features:**
- Scrollable list of annotations
- Click to select and center on image
- Hover to highlight on image
- Toggle visibility (eye icon)
- Edit properties (pencil icon)
- Delete (trash icon)
- Color-coded by type
- Show finding name and notes
- Collapsible to maximize image space

**Annotation Card Component:**
```typescript
interface AnnotationCardProps {
  annotation: Annotation;
  isSelected: boolean;
  onSelect: () => void;
  onHover: () => void;
  onToggleVisibility: () => void;
  onEdit: () => void;
  onDelete: () => void;
}
```

### 7. State Manager with History

**History Implementation:**
```typescript
interface HistoryState {
  annotations: Annotation[];
  timestamp: number;
}

class StateManager {
  private history: HistoryState[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;
  
  pushState(annotations: Annotation[]): void {
    // Remove any redo history
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // Add new state
    this.history.push({
      annotations: JSON.parse(JSON.stringify(annotations)),
      timestamp: Date.now(),
    });
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }
  
  undo(): Annotation[] | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.history[this.currentIndex].annotations;
    }
    return null;
  }
  
  redo(): Annotation[] | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.history[this.currentIndex].annotations;
    }
    return null;
  }
  
  canUndo(): boolean {
    return this.currentIndex > 0;
  }
  
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }
}
```

## Data Models

### Annotation Model

```typescript
interface Annotation {
  id: string;
  type: 'rectangle' | 'polygon' | 'arrow' | 'text';
  color: string;
  coordinates: AnnotationCoordinates;
  findingName: string;
  notes: string;
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type AnnotationCoordinates = 
  | RectangleCoordinates
  | PolygonCoordinates
  | ArrowCoordinates
  | TextCoordinates;

interface RectangleCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PolygonCoordinates {
  points: Array<{ x: number; y: number }>;
}

interface ArrowCoordinates {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface TextCoordinates {
  x: number;
  y: number;
  text: string;
}
```

## Event Handling

### Mouse Event Flow

```typescript
class EventHandler {
  handleMouseDown(e: MouseEvent, state: ViewerState): Partial<ViewerState> {
    // Check for spacebar pan
    if (e.spaceKey) {
      return { isPanning: true, panStartX: e.clientX, panStartY: e.clientY };
    }
    
    // Check for right-click pan
    if (e.button === 2) {
      return { isPanning: true, panStartX: e.clientX, panStartY: e.clientY };
    }
    
    // Delegate to active tool
    return state.activeTool.onMouseDown(e, state);
  }
  
  handleMouseMove(e: MouseEvent, state: ViewerState): Partial<ViewerState> {
    // Handle panning
    if (state.isPanning) {
      const deltaX = e.clientX - state.panStartX;
      const deltaY = e.clientY - state.panStartY;
      return {
        panX: state.panX + deltaX,
        panY: state.panY + deltaY,
        panStartX: e.clientX,
        panStartY: e.clientY,
      };
    }
    
    // Check for annotation hover
    const hoveredAnnotation = this.findAnnotationAtPoint(e.clientX, e.clientY, state);
    
    // Delegate to active tool
    return {
      ...state.activeTool.onMouseMove(e, state),
      hoveredAnnotationId: hoveredAnnotation?.id || null,
    };
  }
  
  handleMouseUp(e: MouseEvent, state: ViewerState): Partial<ViewerState> {
    if (state.isPanning) {
      return { isPanning: false };
    }
    
    return state.activeTool.onMouseUp(e, state);
  }
  
  handleWheel(e: WheelEvent, state: ViewerState): Partial<ViewerState> {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    return zoomPanController.zoomAtPoint(
      state.zoom,
      delta,
      e.clientX,
      e.clientY
    );
  }
}
```

### Keyboard Shortcuts

```typescript
const keyboardShortcuts = {
  // Tools
  's': () => setActiveTool(ToolType.SELECT),
  'h': () => setActiveTool(ToolType.PAN),
  'r': () => setActiveTool(ToolType.RECTANGLE),
  'p': () => setActiveTool(ToolType.POLYGON),
  'a': () => setActiveTool(ToolType.ARROW),
  't': () => setActiveTool(ToolType.TEXT),
  
  // Zoom
  '+': () => zoomIn(),
  '=': () => zoomIn(),
  '-': () => zoomOut(),
  '0': () => resetZoom(),
  
  // Actions
  'Delete': () => deleteSelectedAnnotation(),
  'Backspace': () => deleteSelectedAnnotation(),
  'Escape': () => cancelDrawing(),
  
  // History
  'Ctrl+z': () => undo(),
  'Ctrl+y': () => redo(),
  'Ctrl+s': () => save(),
  
  // Help
  '?': () => showKeyboardShortcuts(),
};
```

## Error Handling

### Save Error Handling

```typescript
async function saveAnnotations(annotations: Annotation[]): Promise<void> {
  try {
    setSaveStatus('saving');
    await annotationService.saveAnnotations(imageId, annotations);
    setSaveStatus('saved');
    
    // Clear saved status after 2 seconds
    setTimeout(() => setSaveStatus('idle'), 2000);
  } catch (error) {
    setSaveStatus('error');
    console.error('Failed to save annotations:', error);
    
    // Show error notification
    showNotification({
      type: 'error',
      message: 'Failed to save annotations. Retrying...',
    });
    
    // Retry after 3 seconds
    setTimeout(() => saveAnnotations(annotations), 3000);
  }
}
```

### Auto-save Implementation

```typescript
// Debounced auto-save
const debouncedSave = useMemo(
  () => debounce((annotations: Annotation[]) => {
    saveAnnotations(annotations);
  }, 2000),
  []
);

// Trigger on annotation changes
useEffect(() => {
  if (annotations.length > 0) {
    debouncedSave(annotations);
  }
}, [annotations]);
```

## Testing Strategy

### Unit Tests
- Tool behavior logic
- Zoom/pan calculations
- Annotation hit detection
- History management (undo/redo)
- Coordinate transformations

### Integration Tests
- Tool switching
- Drawing complete workflows
- Annotation CRUD operations
- Save/load functionality
- Keyboard shortcuts

### E2E Tests
- Complete annotation workflow
- Zoom and pan interactions
- Sidebar interactions
- Multi-annotation management
- Performance under load

### Performance Tests
- Rendering performance with 100+ annotations
- Zoom/pan smoothness
- Memory usage over time
- Canvas redraw optimization

## Accessibility

- All interactive elements keyboard accessible
- ARIA labels for screen readers
- Focus indicators on all controls
- Keyboard shortcut help dialog
- High contrast mode support
- Minimum touch target size: 44x44px

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Targets

- Initial load: < 500ms
- Tool switch: < 50ms
- Zoom/pan response: < 16ms (60fps)
- Annotation render: < 100ms for 100 annotations
- Save operation: < 1s

