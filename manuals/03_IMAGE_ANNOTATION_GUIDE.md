# 🎨 Image Annotation Guide
## How to Annotate Medical Images

---

## Overview

This guide teaches you how to annotate medical images by marking regions of interest and adding medical findings. Annotations help document observations and can be exported for AI training.

---

## 🎯 What is Annotation?

**Annotation** means marking specific areas on medical images and adding information about what you observe.

**Common Uses:**
- Mark tumors or masses
- Identify calcifications
- Highlight abnormalities
- Document findings
- Train AI models
- Create medical reports

---

## 🚀 Getting Started with Annotation

### Opening the Annotation Viewer

**Method 1: From Image Gallery**
1. Go to **"My Images"**
2. Click on any image thumbnail
3. Image viewer opens
4. Click **"Annotate"** button
5. Annotation mode activates

**Method 2: After Upload**
1. Complete image upload
2. Click **"Annotate Now"** button
3. Annotation viewer opens directly

**Method 3: From Dashboard**
1. Find image in recent uploads
2. Click **"Annotate"** icon
3. Annotation viewer opens

### Annotation Viewer Layout

```
┌─────────────────────────────────────────────────┐
│  [Tools] [Zoom] [Save] [Export] [Close]         │ ← Toolbar
├──────────────────────────────┬──────────────────┤
│                              │                  │
│                              │  Annotations     │
│      Image Display           │  List            │
│      Area                    │                  │
│                              │  - Annotation 1  │
│                              │  - Annotation 2  │
│                              │                  │
│                              │  Finding Form    │
│                              │                  │
└──────────────────────────────┴──────────────────┘
```

**Main Areas:**
- **Toolbar**: Annotation tools and controls
- **Image Area**: Where you draw annotations
- **Sidebar**: List of annotations and finding details
- **Finding Form**: Add medical information

---

## 🛠️ Annotation Tools

### Tool 1: Rectangle Tool

**Best For:**
- Bounding boxes
- Rectangular regions
- Quick marking
- General areas

**How to Use:**

1. **Select Tool**
   - Click **"Rectangle"** button in toolbar
   - Or press **R** key
   - Tool button highlights

2. **Draw Rectangle**
   - Click on image (starting corner)
   - Hold and drag to opposite corner
   - Release mouse button
   - Rectangle appears

3. **Adjust Size**
   - Drag corner handles to resize
   - Drag edges to adjust one side
   - Drag center to move entire rectangle

4. **Complete**
   - Rectangle turns solid color
   - Finding form appears
   - Fill in details

**Tips:**
- Hold **Shift** while dragging for perfect square
- Start from top-left, drag to bottom-right
- Make rectangle slightly larger than target area

### Tool 2: Polygon Tool

**Best For:**
- Irregular shapes
- Precise boundaries
- Complex regions
- Detailed marking

**How to Use:**

1. **Select Tool**
   - Click **"Polygon"** button
   - Or press **P** key
   - Tool activates

2. **Draw Polygon**
   - Click to place first point
   - Click to add more points
   - Follow the outline of your target
   - Double-click to complete
   - Or click on first point to close

3. **Edit Points**
   - Click on any point to select
   - Drag point to move it
   - Add points by clicking on edge
   - Delete point by selecting and pressing Delete

4. **Complete**
   - Polygon closes automatically
   - Finding form appears
   - Fill in details

**Tips:**
- Use more points for complex shapes
- Fewer points for simple shapes
- Zoom in for precise placement
- Can edit points after creation

### Tool 3: Point Tool

**Best For:**
- Specific locations
- Landmarks
- Small features
- Reference points

**How to Use:**

1. **Select Tool**
   - Click **"Point"** button
   - Tool activates

2. **Place Point**
   - Click on exact location
   - Point marker appears
   - Finding form opens

3. **Move Point**
   - Click and drag to reposition
   - Release at new location

4. **Complete**
   - Fill in finding details
   - Save annotation

**Tips:**
- Zoom in for precise placement
- Use for marking centers of masses
- Good for multiple small features

### Tool 4: Freehand Tool

**Best For:**
- Complex outlines
- Natural drawing
- Quick sketching
- Organic shapes

**How to Use:**

1. **Select Tool**
   - Click **"Freehand"** button
   - Or press **F** key

2. **Draw Freehand**
   - Click and hold mouse button
   - Draw outline by moving mouse
   - Release to complete
   - Shape closes automatically

3. **Smooth Drawing**
   - Draw slowly for smooth lines
   - System smooths the path
   - Can redraw if not satisfied

4. **Complete**
   - Finding form appears
   - Fill in details

**Tips:**
- Draw slowly for better accuracy
- Use with mouse or stylus
- Zoom in for detailed areas
- Can delete and redraw if needed

---

## 📝 Adding Finding Information

### Required Fields

After drawing an annotation, fill in:

**1. Finding Name** (Required)
```
Examples:
- Mass
- Calcification
- Lesion
- Nodule
- Cyst
- Tumor
- Abnormality
```

**2. Category** (Required)
```
Options:
- Benign (non-cancerous)
- Malignant (cancerous)
- Suspicious (needs investigation)
- Normal Variant
- Artifact
- Other
```

### Optional Fields

**3. Description**
```
Example:
"Irregular mass with spiculated margins in upper outer quadrant"

Tips:
- Be specific and detailed
- Include size if known
- Mention location
- Note characteristics
```

**4. Severity**
```
Options:
- Low
- Medium
- High
- Critical

Use for prioritization
```

**5. Notes**
```
Example:
"Follow-up recommended in 6 months"

Additional observations or recommendations
```

### Saving Finding Information

1. Fill in all required fields
2. Add optional information
3. Click **"Save"** button
4. Annotation is saved
5. Appears in annotations list

---

## ✏️ Editing Annotations

### Selecting Annotations

**Method 1: Click on Image**
- Click directly on annotation
- Annotation highlights
- Details appear in sidebar

**Method 2: From List**
- Click annotation in sidebar list
- Annotation highlights on image
- Details appear in form

### Modifying Shape

**For Rectangles:**
1. Select annotation
2. Drag corner handles to resize
3. Drag center to move
4. Changes save automatically

**For Polygons:**
1. Select annotation
2. Click on any vertex point
3. Drag to new position
4. Add points by clicking edge
5. Delete points with Delete key

**For Points:**
1. Select point
2. Drag to new location
3. Release to place

**For Freehand:**
1. Cannot edit shape directly
2. Delete and redraw if needed

### Updating Finding Information

1. Select annotation
2. Finding form shows current data
3. Modify any field
4. Click **"Update"** button
5. Changes are saved

### Deleting Annotations

**Method 1: From Image**
1. Select annotation on image
2. Press **Delete** key
3. Confirm deletion
4. Annotation removed

**Method 2: From List**
1. Find annotation in sidebar
2. Click **"Delete"** icon (🗑️)
3. Confirm deletion
4. Annotation removed

**Method 3: Delete Button**
1. Select annotation
2. Click **"Delete"** button in toolbar
3. Confirm deletion
4. Annotation removed

---

## 🔍 Zoom and Navigation

### Zoom Controls

**Zoom In:**
- Mouse wheel up
- Click **+** button
- Press **+** key
- Pinch out (touchscreen)

**Zoom Out:**
- Mouse wheel down
- Click **-** button
- Press **-** key
- Pinch in (touchscreen)

**Zoom Levels:**
```
25% - Very zoomed out
50% - Zoomed out
100% - Original size (default)
200% - Zoomed in
400% - Very zoomed in
800% - Maximum zoom
```

**Fit to Screen:**
- Click **"Fit"** button
- Image resizes to fit viewer
- Maintains aspect ratio

**Reset View:**
- Click **"Reset"** button
- Returns to 100% zoom
- Centers image

### Pan (Move Image)

**When Zoomed In:**
1. Click and hold on image
2. Drag to move view
3. Release to stop
4. Useful for viewing different areas

**Keyboard Navigation:**
- Arrow keys move view
- Works when zoomed in

---

## ⌨️ Keyboard Shortcuts

### Tool Selection
- **R** - Rectangle tool
- **P** - Polygon tool
- **F** - Freehand tool

### Actions
- **Delete** - Remove selected annotation
- **Esc** - Cancel current drawing
- **Ctrl+Z** - Undo last action
- **Ctrl+S** - Save all annotations
- **Ctrl+E** - Export annotations

### Navigation
- **+** - Zoom in
- **-** - Zoom out
- **0** - Reset zoom
- **Arrow Keys** - Pan image

### View
- **H** - Hide/show annotations
- **L** - Hide/show labels
- **T** - Toggle toolbar

---

## 👁️ Annotation Display Options

### Visibility Controls

**Show/Hide Annotations:**
1. Click **"Toggle Visibility"** button
2. All annotations hide/show
3. Useful for viewing original image

**Show/Hide Labels:**
1. Click **"Toggle Labels"** button
2. Finding names hide/show
3. Keeps annotations visible

### Color Options

**Change Annotation Color:**
1. Select annotation
2. Click **"Color"** picker
3. Choose new color
4. Annotation updates

**Default Colors:**
- Benign: Green
- Malignant: Red
- Suspicious: Yellow
- Other: Blue

### Opacity Control

**Adjust Transparency:**
1. Use opacity slider
2. Range: 0% (invisible) to 100% (solid)
3. Default: 50%
4. Helps see underlying image

---

## 💾 Saving Your Work

### Auto-Save

**Automatic Saving:**
- Annotations save automatically
- Saves every 30 seconds
- Saves when you create/edit
- No manual save needed

**Save Indicator:**
```
✓ All changes saved
⟳ Saving...
⚠ Not saved - check connection
```

### Manual Save

**Force Save:**
1. Click **"Save"** button
2. Or press **Ctrl+S**
3. All annotations save immediately
4. Confirmation message appears

### Before Closing

**When Closing Viewer:**
1. System checks for unsaved changes
2. Prompts to save if needed
3. Click **"Save and Close"**
4. Or **"Close Without Saving"**

---

## 📤 Exporting Annotations

### Export Formats

**Available Formats:**

**1. JSON (Standard)**
- Machine-readable format
- Includes all annotation data
- Compatible with most tools

**2. LabelMe JSON**
- Popular annotation format
- Used for AI training
- Compatible with LabelMe tool

**3. COCO JSON**
- Common Objects in Context format
- For object detection models
- Industry standard

**4. YOLO TXT**
- YOLO format for training
- Bounding box coordinates
- Class labels included

**5. Pascal VOC XML**
- XML-based format
- Used in computer vision
- Detailed metadata

**6. PDF Report**
- Human-readable report
- Includes image and findings
- For documentation

### How to Export

**Step-by-Step:**

1. **Open Export Menu**
   - Click **"Export"** button
   - Export options appear

2. **Select Format**
   - Choose desired format
   - Click on format name

3. **Configure Options** (if available)
   - Include/exclude certain data
   - Select annotation types
   - Choose image quality

4. **Download**
   - Click **"Download"** button
   - File downloads to your computer
   - Filename includes date and format

**Export Filename Example:**
```
mammogram_P12345_20241205_annotations.json
mammogram_P12345_20241205_labelme.json
mammogram_P12345_20241205_report.pdf
```

### Batch Export

**Export Multiple Images:**
1. Go to image gallery
2. Select multiple images
3. Click **"Export Annotations"**
4. Choose format
5. ZIP file downloads with all annotations

---

## 💡 Annotation Best Practices

### Accuracy Tips

**For Precise Annotations:**
1. Zoom in to target area (200-400%)
2. Use appropriate tool for shape
3. Follow exact boundaries
4. Double-check placement
5. Review before saving

**Quality Checklist:**
- [ ] Annotation covers entire finding
- [ ] Boundaries are accurate
- [ ] No overlap with other annotations
- [ ] Finding name is correct
- [ ] Category is appropriate
- [ ] Description is detailed

### Consistency

**Maintain Consistency:**
1. Use same naming convention
2. Apply same categories
3. Similar detail level
4. Consistent tool choice
5. Standard color scheme

**Naming Examples:**
```
Good:
- "Mass - Upper Outer Quadrant"
- "Calcification - Clustered"
- "Lesion - Irregular Border"

Avoid:
- "Thing"
- "Spot"
- "Area 1"
```

### Documentation

**Complete Documentation:**
1. Fill all required fields
2. Add detailed descriptions
3. Include measurements if known
4. Note location precisely
5. Add follow-up recommendations

**Description Template:**
```
[Finding Type] with [Characteristics]
Located in [Anatomical Location]
Size: [Dimensions if known]
Additional notes: [Other observations]

Example:
"Irregular mass with spiculated margins
Located in upper outer quadrant of right breast
Size: approximately 15mm
Additional notes: Requires biopsy"
```

---

## ⚠️ Common Issues

### Issue: Cannot Draw Annotation

**Possible Causes:**
- Tool not selected
- Image not loaded
- Zoom level too high/low

**Solutions:**
1. Click on tool button
2. Wait for image to load fully
3. Adjust zoom to 100-200%
4. Refresh page if needed

### Issue: Annotation Not Saving

**Possible Causes:**
- Internet connection lost
- Browser issue
- Server error

**Solutions:**
1. Check internet connection
2. Click manual save button
3. Refresh page (annotations may be saved)
4. Try different browser
5. Contact support

### Issue: Cannot See Annotations

**Possible Causes:**
- Annotations hidden
- Opacity set to 0%
- Wrong image selected

**Solutions:**
1. Click "Show Annotations" button
2. Adjust opacity slider
3. Verify correct image is open
4. Refresh page

### Issue: Polygon Won't Close

**Possible Causes:**
- Not enough points
- Points too far apart
- Tool not completing

**Solutions:**
1. Add at least 3 points
2. Double-click to complete
3. Click on first point to close
4. Press Esc and start over

---

## 📊 Annotation Statistics

### View Your Annotations

**Statistics Available:**
- Total annotations created
- Annotations by category
- Annotations by finding type
- Images annotated
- Export history

**Access Statistics:**
1. Go to Dashboard
2. View "Annotation Summary"
3. See counts and breakdowns

---

## 🎯 Next Steps

After mastering annotations:

1. **Export for AI Training** - Use annotations in machine learning
2. **Generate Reports** - Create medical documentation
3. **Share Findings** - Collaborate with team
4. **Review Analytics** - Track annotation patterns

---

## 📞 Quick Reference

| Task | Action |
|------|--------|
| Open Annotator | Click image → Annotate |
| Rectangle | Click R or Rectangle button |
| Polygon | Click P or Polygon button |
| Save | Ctrl+S or Save button |
| Delete | Select → Delete key |
| Zoom In | Mouse wheel up or + |
| Zoom Out | Mouse wheel down or - |
| Export | Export button → Choose format |

---

**Need Help?**

Contact your system administrator if you have questions about annotation features.

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**For**: Ambulance Users (Clients)
