# Annotation Feature - User Guide

## ✅ Feature Status
**Backend:** ✅ Fully implemented
**Frontend:** ✅ Basic annotation viewer implemented

---

## 🎯 How to Use the Annotation Tool

### Step 1: Access the Annotation Tool
1. Login to the application
2. Navigate to the **Image Gallery** (Dashboard → View Gallery)
3. Find the image you want to annotate
4. Click the **"Annotate"** button (green button with ✏️ icon in folder view, or "Annotate" button in grid view)

### Step 2: Annotate the Image
Once in the annotation viewer, you'll see:
- **Left side:** The medical image on a canvas
- **Right side:** Annotation tools and properties

#### Available Tools:
1. **⭕ Circle** - Draw circular regions to mark suspicious areas
2. **▭ Rectangle** - Draw rectangular bounding boxes
3. **➜ Arrow** - Point to specific features
4. **T Text** - Add text labels

#### How to Draw:
1. Select a tool from the toolbar
2. Click and drag on the image to draw
3. Release to complete the annotation
4. For text annotations, you'll be prompted to enter text

#### Set Properties:
- **Color:** Choose from red, yellow, green, or cyan
  - Red: High priority/suspicious
  - Yellow: Moderate concern
  - Green: Normal/benign
  - Cyan: Information

- **Severity Level:** Slide from 1 (low) to 5 (high)

- **Category:** Select from dropdown
  - Mass
  - Calcification
  - Asymmetry
  - Distortion

- **Notes:** Add detailed observations

### Step 3: Manage Annotations
- View all annotations in the list on the right
- Click the **✕** button to delete an annotation
- Annotations are automatically saved to the database

### Step 4: Return to Gallery
- Click **"← Back to Gallery"** to return to the image gallery
- Your annotations are saved and will be loaded next time you open the image

---

## 🔧 Technical Details

### API Endpoints Used:
- `POST /api/annotations` - Create new annotation
- `GET /api/annotations/image/:imageId` - Load annotations for an image
- `DELETE /api/annotations/:id` - Delete annotation

### Data Stored:
- Annotation type (circle, rectangle, arrow, text)
- Coordinates (x, y, radius, width, height, etc.)
- Color, severity level, category
- Notes and timestamps
- User who created the annotation

---

## 🚀 Future Enhancements

### Coming Soon:
1. **Freehand Drawing** - Draw custom shapes
2. **Measurement Tools** - Measure distances and areas
3. **Annotation Editing** - Modify existing annotations
4. **Collaborative Annotations** - Multiple users can annotate
5. **Report Generation** - Generate PDF reports from annotations
6. **Annotation History** - Track changes over time
7. **Export Annotations** - Export as JSON or DICOM SR

---

## 📊 Report Generation (Planned)

Once annotations are complete, you'll be able to:
1. Click "Generate Report" button
2. Auto-populate findings from annotations
3. Add diagnosis and BI-RADS score
4. Preview and finalize report
5. Download as PDF

---

## 💡 Tips

- Use **red circles** for suspicious masses
- Use **yellow rectangles** for areas needing follow-up
- Use **arrows** to point out specific features
- Add **detailed notes** for each annotation
- Use **severity levels** to prioritize findings

---

## 🐛 Troubleshooting

**Annotations not saving?**
- Check your internet connection
- Ensure you're logged in
- Check browser console for errors

**Can't see annotations?**
- Refresh the page
- Check if annotations were created for this specific image

**Drawing not working?**
- Make sure you've selected a tool
- Try clicking and dragging (not just clicking)

---

## 📞 Support

For issues or feature requests, contact your system administrator.
