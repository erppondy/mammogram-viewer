# DICOM Annotation Flow Diagram

## Complete Flow: From Upload to Annotation

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DICOM FILE UPLOAD                            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  mammogram.dcm (10 MB)  │
                    │  3328 × 4096 pixels     │
                    │  16-bit grayscale       │
                    └─────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND PROCESSING                           │
├─────────────────────────────────────────────────────────────────────┤
│  1. Store original DICOM file                                       │
│  2. Extract metadata (patient, date, modality)                      │
│  3. Generate thumbnail (JPEG, 200×200)                              │
│  4. Save to database                                                │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         IMAGE GALLERY VIEW                           │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐                                                   │
│  │  Thumbnail   │  Patient: John Doe                                │
│  │  [Preview]   │  Date: 2024-12-02                                 │
│  │              │  Format: DICOM                                    │
│  └──────────────┘  Size: 10 MB                                      │
│                    [View] [Annotate] [Download]                     │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    User clicks "Annotate"
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ANNOTATION VIEWER REQUEST                         │
├─────────────────────────────────────────────────────────────────────┤
│  Frontend: GET /api/images/:id/file                                 │
│  Headers: Authorization: Bearer <token>                             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND IMAGE SERVING                             │
├─────────────────────────────────────────────────────────────────────┤
│  1. Check file format: "DICOM"                                      │
│  2. Load original DICOM file                                        │
│  3. Call DicomConverterService.convertToPNG()                       │
│     ┌─────────────────────────────────────────┐                    │
│     │  DICOM CONVERSION PROCESS               │                    │
│     ├─────────────────────────────────────────┤                    │
│     │  • Parse DICOM with dicom-parser        │                    │
│     │  • Extract: rows, columns, bits         │                    │
│     │  • Get pixel data array                 │                    │
│     │  • Normalize 16-bit → 8-bit (0-255)     │                    │
│     │  • Handle MONOCHROME1 inversion         │                    │
│     │  • Create PNG with pngjs                │                    │
│     │  • Return PNG buffer                    │                    │
│     └─────────────────────────────────────────┘                    │
│  4. Send PNG to frontend                                            │
│  5. Set headers: Content-Type: image/png                            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ENHANCED ANNOTATION VIEWER                        │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │                    CANVAS DISPLAY                           │   │
│  │                                                             │   │
│  │    ┌─────────────────────────────────────────┐             │   │
│  │    │                                         │             │   │
│  │    │     PNG Image (converted from DICOM)   │             │   │
│  │    │     3328 × 4096 pixels                 │             │   │
│  │    │                                         │             │   │
│  │    │     [Mammogram displayed here]         │             │   │
│  │    │                                         │             │   │
│  │    └─────────────────────────────────────────┘             │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  TOOLBAR                                                    │   │
│  │  🛠️ Tools: [Polygon] Circle Rectangle Arrow Freehand Text  │   │
│  │  🎨 Color: [Red] Yellow Green Cyan Magenta Orange          │   │
│  │  ⚠️ Severity: ●●●●○ (4/5)                                   │   │
│  │  📋 Category: [Mass] Calcification Asymmetry Distortion    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    User draws polygon annotation
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DRAWING POLYGON ON CANVAS                         │
├─────────────────────────────────────────────────────────────────────┤
│  1. User clicks points: (512, 384), (1024, 384), ...               │
│  2. Real-time preview with numbered vertices                        │
│  3. Gradient fill and glow effects                                  │
│  4. User double-clicks to close polygon                             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FINDINGS FORM MODAL                               │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Add Finding Details                                        │   │
│  │                                                             │   │
│  │  Finding Name: *                                            │   │
│  │  [Suspicious Mass - Upper Outer Quadrant]                  │   │
│  │                                                             │   │
│  │  Finding Category: *                                        │   │
│  │  [Mass ▼]                                                   │   │
│  │                                                             │   │
│  │  Notes: *                                                   │   │
│  │  [Irregular margins, spiculated appearance,                │   │
│  │   heterogeneous density. Recommend biopsy.]                │   │
│  │                                                             │   │
│  │  Severity Level: (optional)                                │   │
│  │  Low ●●●●○ High  [4]                                        │   │
│  │                                                             │   │
│  │  [Cancel]  [Save Finding]                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    User clicks "Save Finding"
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SAVE ANNOTATION TO DATABASE                       │
├─────────────────────────────────────────────────────────────────────┤
│  POST /api/annotations                                              │
│  {                                                                  │
│    image_id: "uuid-of-dicom-image",                                │
│    annotation_type: "polygon",                                     │
│    coordinates: {                                                  │
│      points: [                                                     │
│        { x: 512, y: 384 },                                         │
│        { x: 1024, y: 384 },                                        │
│        { x: 1024, y: 768 },                                        │
│        { x: 512, y: 768 }                                          │
│      ]                                                             │
│    },                                                              │
│    color: "#ff0000",                                               │
│    finding_name: "Suspicious Mass - Upper Outer Quadrant",        │
│    category: "mass",                                               │
│    severity_level: 4,                                              │
│    notes: "Irregular margins, spiculated appearance..."           │
│  }                                                                 │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ANNOTATION SAVED IN DATABASE                      │
├─────────────────────────────────────────────────────────────────────┤
│  PostgreSQL Table: annotations                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ id: uuid-123                                                 │  │
│  │ image_id: uuid-of-dicom-image                                │  │
│  │ user_id: uuid-of-radiologist                                 │  │
│  │ annotation_type: "polygon"                                   │  │
│  │ coordinates: { points: [...] }                               │  │
│  │ color: "#ff0000"                                             │  │
│  │ finding_name: "Suspicious Mass - Upper Outer Quadrant"      │  │
│  │ category: "mass"                                             │  │
│  │ severity_level: 4                                            │  │
│  │ notes: "Irregular margins..."                                │  │
│  │ created_at: 2024-12-02 10:30:00                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ANNOTATION DISPLAYED IN LIST                      │
├─────────────────────────────────────────────────────────────────────┤
│  📍 Findings (1)                                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ● Suspicious Mass - Upper Outer Quadrant                    │   │
│  │   [mass] ⚠️ 4                                                │   │
│  │   "Irregular margins, spiculated appearance..."             │   │
│  │                                                         [🗑️] │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    User continues annotating
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    MULTIPLE ANNOTATIONS ON IMAGE                     │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │    ┌─────────────────────────────────────────┐             │   │
│  │    │                                         │             │   │
│  │    │     [Mammogram with annotations]       │             │   │
│  │    │                                         │             │   │
│  │    │     🔴 Polygon 1: Mass (Severity 4)    │             │   │
│  │    │     🟡 Circle 2: Calcification (Sev 2) │             │   │
│  │    │     🟢 Rectangle 3: Asymmetry (Sev 3)  │             │   │
│  │    │                                         │             │   │
│  │    └─────────────────────────────────────────┘             │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  📍 Findings (3)                                                    │
│  • Suspicious Mass - Upper Outer Quadrant                          │
│  • Clustered Microcalcifications - Central                         │
│  • Focal Asymmetry - Lower Inner Quadrant                          │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    User closes viewer
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    VIEWING ANNOTATIONS LATER                         │
├─────────────────────────────────────────────────────────────────────┤
│  1. User opens same DICOM image                                    │
│  2. DICOM converted to PNG again (cached in browser)               │
│  3. Annotations loaded from database                               │
│  4. Coordinates mapped to canvas                                   │
│  5. All findings rendered on top of image                          │
│  6. User can edit, delete, or add more annotations                 │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Points

### ✅ Seamless Integration
- DICOM files work exactly like regular images
- No special handling required by user
- Automatic format detection and conversion

### ✅ Coordinate Accuracy
- Annotations stored in pixel coordinates
- Independent of display size or zoom
- Always aligned with image content

### ✅ Data Preservation
- Original DICOM file never modified
- Annotations stored separately in database
- Can be exported or used for reporting

### ✅ Professional Quality
- Medical-grade image rendering
- Proper windowing for 16-bit images
- MONOCHROME1/2 handling
- High-quality annotation tools

## Summary

**The annotation tool handles DICOM images transparently:**
1. Upload DICOM → Stored as-is
2. View in tool → Auto-converted to PNG
3. Draw annotations → Saved with coordinates
4. View later → Annotations perfectly aligned

**No special steps needed - it just works!** 🎉
