# DICOM Image Support in Annotation Tool

## Overview
The Enhanced Annotation Viewer fully supports DICOM (.dcm, .dicom) medical imaging format. DICOM files are automatically converted to PNG for web viewing while preserving image quality and medical accuracy.

## How DICOM Images Are Handled

### 1. Upload Process
When a DICOM file is uploaded:
- File is stored in its original DICOM format
- Metadata is extracted (patient info, study details, etc.)
- Thumbnail is generated for gallery view
- Background processing queues conversion tasks

### 2. Viewing Process
When opening a DICOM image in the annotation tool:

```
User clicks image → Frontend requests /api/images/:id/file
                  ↓
Backend receives request → Checks file format
                  ↓
If DICOM → DicomConverterService.convertToPNG()
                  ↓
DICOM parsed → Pixel data extracted → PNG created
                  ↓
PNG buffer sent to frontend → Displayed on canvas
                  ↓
Annotations drawn on top → Saved with coordinates
```

### 3. DICOM Conversion Details

#### Supported DICOM Features
- **Bit Depth**: 8-bit and 16-bit grayscale images
- **Photometric Interpretation**:
  - MONOCHROME1 (inverted/white-on-black)
  - MONOCHROME2 (normal/black-on-white)
- **Pixel Representation**: Signed and unsigned integers
- **Image Dimensions**: Any size (rows × columns)

#### Conversion Process
1. **Parse DICOM**: Uses `dicom-parser` library
2. **Extract Metadata**:
   - Rows (height)
   - Columns (width)
   - Bits Allocated (8 or 16)
   - Bits Stored
   - Samples Per Pixel
   - Photometric Interpretation
3. **Extract Pixel Data**: Raw pixel array from DICOM
4. **Normalize Values**:
   - 8-bit: Direct mapping (0-255)
   - 16-bit: Window/level normalization to 0-255 range
5. **Handle Inversion**: MONOCHROME1 images are inverted
6. **Create PNG**: Using `pngjs` library
7. **Return Buffer**: PNG sent to frontend

### 4. Annotation Coordinates

#### Coordinate System
- Annotations are stored in **image pixel coordinates**
- Independent of display size or zoom level
- Coordinates are relative to the original DICOM image dimensions

#### Example
```javascript
// DICOM image: 2048 × 1536 pixels
// Annotation polygon points:
{
  points: [
    { x: 512, y: 384 },   // Top-left
    { x: 1024, y: 384 },  // Top-right
    { x: 1024, y: 768 },  // Bottom-right
    { x: 512, y: 768 }    // Bottom-left
  ]
}
```

These coordinates remain valid regardless of:
- Browser window size
- Canvas display size
- Zoom level
- Pan position

### 5. Annotation Storage

Annotations on DICOM images are stored in the database with:
- **Image ID**: Links to the DICOM file
- **Coordinates**: Pixel-based coordinates
- **Finding Name**: Custom descriptive name
- **Category**: Mass, Calcification, etc.
- **Severity Level**: 1-5 scale
- **Notes**: Detailed description
- **Color**: Visual marker color
- **Annotation Type**: Polygon, circle, rectangle, etc.

### 6. Performance Considerations

#### Caching
- **Browser Cache**: PNG conversions cached for 1 hour
- **No Disk Cache**: Conversions done on-the-fly
- **Memory Efficient**: Buffers released after sending

#### Optimization
- Conversion happens only when viewing
- Original DICOM preserved for download
- Thumbnails pre-generated for gallery
- Lazy loading in annotation viewer

### 7. Quality Preservation

#### Medical Accuracy
- **No Data Loss**: Original DICOM always preserved
- **Proper Windowing**: 16-bit images normalized correctly
- **Inversion Handling**: MONOCHROME1 properly inverted
- **Aspect Ratio**: Original dimensions maintained

#### Visual Quality
- **8-bit PNG**: Sufficient for web viewing
- **Grayscale**: Medical images displayed correctly
- **Anti-aliasing**: Smooth annotation rendering
- **Zoom Support**: High-quality scaling

## Workflow Example

### Annotating a DICOM Mammogram

1. **Upload DICOM File**
   ```
   File: mammogram_2024.dcm (10 MB)
   Format: DICOM 16-bit grayscale
   Dimensions: 3328 × 4096 pixels
   ```

2. **View in Gallery**
   - Thumbnail displayed (JPEG, 200×200)
   - Metadata shown (patient, date, modality)

3. **Open in Annotation Tool**
   - DICOM converted to PNG on-the-fly
   - Displayed on canvas with optimal scaling
   - Ready for annotation

4. **Draw Annotations**
   - Select polygon tool
   - Click points around suspicious mass
   - Double-click to close polygon
   - Fill in findings form:
     - Finding Name: "Suspicious Mass - Upper Outer Quadrant"
     - Category: Mass
     - Severity: 4
     - Notes: "Irregular margins, spiculated appearance..."

5. **Save Annotation**
   - Coordinates stored in database
   - Linked to original DICOM file
   - Available for reporting

6. **View Later**
   - DICOM re-converted to PNG
   - Annotations loaded from database
   - Rendered on top of image
   - All findings visible

## Technical Implementation

### Frontend (EnhancedAnnotationViewer.tsx)
```typescript
// Load image (DICOM or regular)
const response = await fetch(`${API_BASE_URL}/images/${imageId}/file`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

const blob = await response.blob();
const imageUrl = URL.createObjectURL(blob);

const img = new Image();
img.onload = () => {
  setImage(img);
  // Draw on canvas with annotations
};
img.src = imageUrl;
```

### Backend (images.routes.ts)
```typescript
// Check if DICOM
const isDicom = image.fileFormat.toLowerCase() === 'dicom' || 
                image.fileFormat.toLowerCase() === 'dcm';

if (isDicom) {
  // Convert to PNG
  const pngBuffer = await dicomConverterService.convertToPNG(fileBuffer);
  res.setHeader('Content-Type', 'image/png');
  res.send(pngBuffer);
}
```

### DICOM Converter (DicomConverterService.ts)
```typescript
// Parse DICOM
const dataSet = dicomParser.parseDicom(new Uint8Array(dicomBuffer));

// Extract dimensions
const rows = dataSet.uint16('x00280010');
const columns = dataSet.uint16('x00280011');

// Get pixel data
const pixelData = new Uint8Array(...);

// Create PNG
const png = new PNG({ width: columns, height: rows });

// Convert pixels (8-bit or 16-bit)
// Handle MONOCHROME1/MONOCHROME2
// Return PNG buffer
```

## Supported DICOM Tags

### Image Tags
- `(0028,0010)` - Rows
- `(0028,0011)` - Columns
- `(0028,0100)` - Bits Allocated
- `(0028,0101)` - Bits Stored
- `(0028,0002)` - Samples Per Pixel
- `(0028,0103)` - Pixel Representation
- `(0028,0004)` - Photometric Interpretation
- `(7FE0,0010)` - Pixel Data

### Metadata Tags (extracted during upload)
- Patient Name
- Patient ID
- Study Date
- Modality
- Institution Name
- Manufacturer
- And more...

## Error Handling

### Conversion Failures
If DICOM conversion fails:
1. Try to serve thumbnail instead
2. If thumbnail fails, show placeholder SVG
3. User can still download original DICOM

### Fallback Strategy
```
DICOM → PNG conversion
  ↓ (if fails)
Thumbnail JPEG
  ↓ (if fails)
Placeholder SVG with message
```

## Limitations

### Current Limitations
- **Color Images**: Only grayscale supported (most medical images are grayscale)
- **Compressed DICOM**: Some compression formats may not be supported
- **Multi-frame**: Only single-frame images supported
- **Overlays**: DICOM overlays not rendered

### Future Enhancements
- Support for color DICOM images
- Multi-frame/cine support
- DICOM overlay rendering
- Window/level adjustment controls
- DICOM SR (Structured Report) export

## Best Practices

### For Radiologists
1. **Upload Original DICOM**: Always upload original DICOM files
2. **Verify Display**: Check image appears correctly before annotating
3. **Use Zoom**: Zoom in for precise annotation placement
4. **Descriptive Names**: Use clear finding names
5. **Complete Notes**: Add detailed observations

### For Administrators
1. **Storage Space**: DICOM files are large, monitor storage
2. **Backup Original**: Always keep original DICOM files
3. **Performance**: Monitor conversion times
4. **Error Logs**: Check logs for conversion failures

## Troubleshooting

### Image Not Displaying
- Check if DICOM file is valid
- Verify file format in database
- Check backend logs for conversion errors
- Try downloading original file

### Annotations Not Aligned
- Ensure image fully loaded before annotating
- Check zoom level is stable
- Verify coordinate system matches image dimensions

### Slow Loading
- Large DICOM files take time to convert
- Check network connection
- Monitor server CPU usage
- Consider thumbnail for preview

## Conclusion

The Enhanced Annotation Viewer provides seamless DICOM support with:
- ✅ Automatic format detection
- ✅ On-the-fly PNG conversion
- ✅ Medical-grade image quality
- ✅ Accurate coordinate mapping
- ✅ Professional annotation tools
- ✅ Comprehensive metadata handling
- ✅ Error recovery mechanisms

DICOM images work exactly like regular images in the annotation tool, with all the same features and capabilities.
