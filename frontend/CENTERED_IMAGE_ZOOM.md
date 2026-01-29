# Centered Image with Zoom Lock

## Overview
The Enhanced Annotation Viewer now keeps the image perfectly centered at all times, regardless of zoom level. Additionally, zoom is locked by default to prevent accidental zoom changes during annotation work.

## Features

### 1. Always-Centered Image Display

#### How It Works
The image remains centered in the canvas container at all zoom levels:
- **Zoom In**: Image stays centered while getting larger
- **Zoom Out**: Image stays centered while getting smaller
- **Reset**: Returns to 100% zoom, still centered
- **Fit Screen**: Scales to fit container, centered

#### Technical Implementation
```typescript
// Calculate center offset based on zoom
const scaledWidth = image.width * zoom;
const scaledHeight = image.height * zoom;
const centerX = (canvas.width - scaledWidth) / 2;
const centerY = (canvas.height - scaledHeight) / 2;

// Apply centering transformation
ctx.translate(centerX + pan.x, centerY + pan.y);
ctx.scale(zoom, zoom);
```

#### Benefits
- **Consistent View**: Image always in the same position
- **Professional**: Medical-grade viewer behavior
- **Predictable**: Users know where to look
- **No Drift**: Image doesn't move unexpectedly

### 2. Zoom Lock Feature (Default: Enabled)

#### Purpose
Prevents accidental zoom changes while annotating, which is critical for:
- **Precision**: Maintaining exact view while marking findings
- **Consistency**: All annotations at same zoom level
- **Workflow**: No interruptions from accidental scrolling
- **Professional Use**: Standard in medical imaging tools

#### Visual Indicators

**When Locked (Default)**:
```
🔒 Locked  |  [🔍−] 100% [🔍+] [Reset] [Fit]
           ↑
    Bright cyan button
    
Zoom buttons are grayed out and disabled
Help text: "🔒 Zoom Locked - Click lock button to enable zoom"
```

**When Unlocked**:
```
🔓 Unlocked  |  🔍− 100% 🔍+ Reset Fit
             ↑
    Transparent button
    
Zoom buttons are active and colorful
Help text: "Shift+Drag to pan | Mouse wheel to zoom | ..."
```

#### Controls

**Lock/Unlock Button**:
- **Location**: First button in controls bar
- **Locked State**: 
  - Icon: 🔒
  - Text: "Locked"
  - Style: Bright cyan background
  - Tooltip: "Zoom Locked - Click to Unlock"
- **Unlocked State**:
  - Icon: 🔓
  - Text: "Unlocked"
  - Style: Transparent with cyan text
  - Tooltip: "Zoom Unlocked - Click to Lock"

**Zoom Buttons (when locked)**:
- Grayed out appearance
- Cursor: not-allowed
- Tooltip: "Unlock zoom to use"
- No action on click

**Zoom Buttons (when unlocked)**:
- Normal cyan appearance
- Cursor: pointer
- Tooltips: "Zoom In", "Zoom Out", "Reset Zoom"
- Functional on click

#### Keyboard Shortcuts
All zoom shortcuts respect the lock:
- **Mouse Wheel**: Disabled when locked
- **Ctrl + Plus**: Would be disabled (if implemented)
- **Ctrl + Minus**: Would be disabled (if implemented)

#### Fit Screen Exception
The "Fit Screen" button works regardless of lock state:
- Useful for initial setup
- Resets to optimal view
- Still keeps image centered

### 3. Pan Behavior

#### With Zoom Lock
- Pan is still available (Shift + Drag)
- Allows repositioning without zoom changes
- Useful for viewing different areas

#### Auto-Reset on Zoom
When zoom changes (if unlocked):
- Pan automatically resets to (0, 0)
- Ensures image returns to center
- Prevents off-center views after zooming

### 4. Coordinate Accuracy

#### Centering Offset
Mouse coordinates are calculated accounting for centering:
```typescript
// Calculate center offset
const centerX = (canvas.width - scaledWidth) / 2;
const centerY = (canvas.height - scaledHeight) / 2;

// Adjust mouse coordinates
const x = ((mouseX - rect.left) * scaleX - centerX - pan.x) / zoom;
const y = ((mouseY - rect.top) * scaleY - centerY - pan.y) / zoom;
```

#### Annotation Accuracy
- Annotations placed at correct pixel coordinates
- Independent of zoom level
- Always aligned with image content
- No drift or misalignment

## User Experience

### Workflow
1. **Open Image**: Loads centered at optimal zoom
2. **Zoom Locked**: Default state, prevents accidents
3. **Annotate**: Draw annotations with stable view
4. **Need Zoom?**: Click lock button to unlock
5. **Zoom In/Out**: Image stays centered
6. **Lock Again**: Click lock button to re-lock
7. **Continue**: Annotate with locked zoom

### Professional Benefits
- **Medical Standard**: Matches professional DICOM viewers
- **Reduced Errors**: No accidental zoom during annotation
- **Faster Workflow**: Less time adjusting view
- **Consistent Results**: All annotations at same scale
- **User Confidence**: Predictable, stable interface

## Technical Details

### State Management
```typescript
// Zoom lock state (default: true)
const [isZoomLocked, setIsZoomLocked] = useState(true);

// Toggle function
const toggleZoomLock = () => {
  setIsZoomLocked(!isZoomLocked);
};
```

### Zoom Control Guards
```typescript
const handleZoomIn = () => {
  if (isZoomLocked) return; // Guard
  setZoom(prev => Math.min(prev + 0.25, 5));
  setPan({ x: 0, y: 0 }); // Keep centered
};
```

### Canvas Rendering
```typescript
// Always calculate center offset
const centerX = (canvas.width - scaledWidth) / 2;
const centerY = (canvas.height - scaledHeight) / 2;

// Apply to all transformations
ctx.translate(centerX + pan.x, centerY + pan.y);
```

## Configuration

### Default State
- **Zoom Lock**: Enabled (true)
- **Initial Zoom**: Fit to screen
- **Initial Pan**: (0, 0) - centered

### Customization
To change default lock state, modify:
```typescript
const [isZoomLocked, setIsZoomLocked] = useState(false); // Unlocked by default
```

## Comparison

### Before
- Image could drift off-center when zooming
- Accidental zoom changes common
- Inconsistent view during annotation
- Manual re-centering needed

### After
- ✅ Image always centered
- ✅ Zoom locked by default
- ✅ Stable view during annotation
- ✅ Professional medical viewer behavior
- ✅ Clear visual feedback
- ✅ Easy to unlock when needed

## Best Practices

### For Radiologists
1. **Keep Locked**: Leave zoom locked while annotating
2. **Unlock Temporarily**: Only unlock when you need to zoom
3. **Re-lock**: Lock again after adjusting zoom
4. **Use Fit**: Use "Fit Screen" for initial setup

### For Administrators
1. **Train Users**: Explain zoom lock feature
2. **Default Locked**: Keep default as locked
3. **Monitor Feedback**: Check if users need different default

## Summary

The Enhanced Annotation Viewer now provides:
- ✅ **Always-centered image** at all zoom levels
- ✅ **Zoom lock by default** to prevent accidents
- ✅ **Clear visual indicators** for lock state
- ✅ **Professional behavior** matching medical standards
- ✅ **Accurate coordinates** with centering offset
- ✅ **Smooth workflow** for annotation work

This creates a stable, predictable, professional annotation environment perfect for medical imaging work.
