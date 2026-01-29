# 📥 Image Download Guide
## How to Download and Export Images

---

## Overview

This guide explains how to download medical images, export annotations, and save data from the system. Learn different download methods and export formats.

---

## 🎯 What You Can Download

### Available Downloads

✅ **Original Images** - Full resolution medical images  
✅ **Annotated Images** - Images with markings  
✅ **Annotations Data** - Finding information in various formats  
✅ **Reports** - PDF reports with findings  
✅ **Batch Downloads** - Multiple images as ZIP  
✅ **Statistics** - Usage and analytics data  

---

## 📥 Downloading Single Images

### Method 1: From Image Viewer

**Step-by-Step:**

1. **Open Image**
   - Go to **"My Images"**
   - Click on image thumbnail
   - Image viewer opens

2. **Locate Download Button**
   - Look for **"Download"** button in toolbar
   - Usually at top-right of viewer

3. **Click Download**
   - Click **"Download"** button
   - File downloads automatically
   - Check your Downloads folder

4. **File Details**
   ```
   Filename: mammogram_P12345_20241205.dcm
   Format: Original format (DICOM, JPG, PNG, etc.)
   Size: Original file size
   ```

### Method 2: From Image Gallery

**Quick Download:**

1. **Find Image**
   - Go to **"My Images"**
   - Locate image in gallery

2. **Right-Click Menu**
   - Right-click on image thumbnail
   - Select **"Download"** from menu
   - Or click download icon if visible

3. **Download Starts**
   - File downloads immediately
   - Original format preserved

### Method 3: From Image Details

**Detailed View:**

1. **Open Image Details**
   - Click on image
   - Click **"Details"** or info icon

2. **Download Options**
   - See file information
   - Click **"Download Original"**
   - File downloads

---

## 📦 Downloading Multiple Images

### Batch Download as ZIP

**When to Use:**
- Download multiple images at once
- Backup your images
- Transfer to another system
- Archive patient studies

**How to Download Multiple:**

1. **Select Images**
   - Go to **"My Images"** gallery
   - Check boxes next to images you want
   - Or click **"Select All"** for all images

2. **Selection Counter**
   ```
   ✓ 5 images selected
   ```

3. **Click Download Button**
   - Click **"Download Selected"** button
   - Or **"Download as ZIP"**

4. **Processing**
   ```
   Preparing download...
   Packaging 5 images
   Creating ZIP archive
   ████████████ 100%
   ```

5. **Download ZIP**
   - ZIP file downloads automatically
   - Filename includes date and count
   ```
   Example: images_5files_20241205.zip
   ```

6. **Extract Files**
   - Locate ZIP in Downloads folder
   - Right-click → Extract All
   - Access individual files

### ZIP Contents

**What's Inside:**
```
images_5files_20241205.zip
├── mammogram_P12345_20241205.dcm
├── mammogram_P12346_20241205.dcm
├── xray_P12347_20241204.jpg
├── metadata.json (image information)
└── README.txt (file descriptions)
```

---

## 🎨 Downloading Annotated Images

### Download Image with Annotations

**Visual Export:**

1. **Open Annotated Image**
   - Go to image with annotations
   - Open in annotation viewer

2. **Export Options**
   - Click **"Export"** button
   - Select **"Image with Annotations"**

3. **Choose Format**
   ```
   Options:
   - PNG (recommended for viewing)
   - JPEG (smaller file size)
   - TIFF (highest quality)
   ```

4. **Download**
   - Click **"Download"**
   - Image with visible annotations downloads
   - Annotations are "burned in" (permanent)

**Use Cases:**
- Share findings with colleagues
- Include in presentations
- Print for records
- Documentation purposes

---

## 📊 Exporting Annotation Data

### Export Formats Overview

| Format | Best For | File Type |
|--------|----------|-----------|
| JSON | General use, backup | .json |
| LabelMe | AI training | .json |
| COCO | Object detection | .json |
| YOLO | YOLO models | .txt |
| Pascal VOC | Computer vision | .xml |
| PDF Report | Documentation | .pdf |
| CSV | Spreadsheet analysis | .csv |

### Export JSON (Standard)

**General Purpose Format:**

1. **Open Annotation Viewer**
   - Open image with annotations

2. **Export Menu**
   - Click **"Export"** button
   - Select **"JSON"**

3. **Download**
   - File downloads as `.json`
   - Contains all annotation data

**JSON Contents:**
```json
{
  "image": "mammogram_P12345.dcm",
  "annotations": [
    {
      "id": "1",
      "type": "rectangle",
      "coordinates": {...},
      "finding": "Mass",
      "category": "Suspicious",
      "description": "Irregular mass..."
    }
  ]
}
```

### Export LabelMe Format

**For AI Training:**

1. **Select LabelMe Export**
   - Click **"Export"** → **"LabelMe JSON"**

2. **Download**
   - LabelMe-compatible JSON downloads
   - Ready for machine learning tools

**Use With:**
- LabelMe annotation tool
- PyTorch datasets
- TensorFlow training
- Custom ML pipelines

### Export COCO Format

**For Object Detection:**

1. **Select COCO Export**
   - Click **"Export"** → **"COCO JSON"**

2. **Download**
   - COCO-format JSON downloads
   - Industry-standard format

**Use With:**
- Object detection models
- Instance segmentation
- Detectron2
- MMDetection

### Export YOLO Format

**For YOLO Models:**

1. **Select YOLO Export**
   - Click **"Export"** → **"YOLO TXT"**

2. **Download**
   - Text file with YOLO format
   - One file per image

**Format:**
```
class_id center_x center_y width height
0 0.5 0.5 0.2 0.3
1 0.3 0.7 0.15 0.25
```

### Export Pascal VOC Format

**For Computer Vision:**

1. **Select VOC Export**
   - Click **"Export"** → **"Pascal VOC XML"**

2. **Download**
   - XML file downloads
   - Detailed metadata included

**Use With:**
- Traditional CV algorithms
- Legacy systems
- Research projects

### Export PDF Report

**Human-Readable Documentation:**

1. **Generate Report**
   - Click **"Export"** → **"PDF Report"**

2. **Report Contents**
   ```
   - Patient information
   - Image preview
   - All annotations with findings
   - Categories and descriptions
   - Date and time
   - Your name/credentials
   ```

3. **Download PDF**
   - Professional report downloads
   - Ready to print or share

**Use Cases:**
- Medical records
- Patient files
- Consultation reports
- Documentation

---

## 📈 Downloading Statistics and Reports

### Export Usage Statistics

**Your Activity Data:**

1. **Access Statistics**
   - Go to Dashboard
   - Find **"Statistics"** section

2. **Export Options**
   - Click **"Export Statistics"**
   - Choose format:
     - CSV (spreadsheet)
     - PDF (report)
     - JSON (data)

3. **Download**
   - File downloads with your data
   - Includes upload counts, dates, quotas

**CSV Contents:**
```
Date,Images Uploaded,Storage Used,Quota Remaining
2024-12-01,5,12.5 MB,995
2024-12-02,3,8.2 MB,992
2024-12-03,7,18.9 MB,985
```

### Export Patient Study Data

**Complete Study Export:**

1. **Filter by Patient**
   - Search for patient ID
   - View all patient images

2. **Select All Patient Images**
   - Check all images for patient
   - Click **"Export Study"**

3. **Export Package**
   - ZIP with all images
   - Annotations included
   - Metadata file included
   - Report PDF included

---

## 🔄 Batch Export Operations

### Export All Annotations

**Bulk Annotation Export:**

1. **Go to Export Page**
   - Navigate to **"Export"** section
   - Or from image gallery

2. **Select Export Type**
   - Choose **"All Annotations"**
   - Select format (JSON, LabelMe, COCO, etc.)

3. **Configure Options**
   ```
   Options:
   ☑ Include images
   ☑ Include metadata
   ☑ Separate files per image
   ☐ Single combined file
   ```

4. **Start Export**
   - Click **"Export All"**
   - Processing begins

5. **Download ZIP**
   ```
   Processing: 15 of 20 images
   ████████████░░░░ 75%
   ```
   - ZIP file downloads when complete

**ZIP Structure:**
```
annotations_export_20241205.zip
├── images/
│   ├── image1.dcm
│   ├── image2.jpg
│   └── ...
├── annotations/
│   ├── image1_annotations.json
│   ├── image2_annotations.json
│   └── ...
└── metadata.json
```

### Export for AI Training

**Complete Training Dataset:**

1. **Prepare Export**
   - Select images with annotations
   - Choose AI-compatible format

2. **Export Configuration**
   ```
   Format: LabelMe JSON
   ☑ Include images
   ☑ Include annotations
   ☑ Split train/validation (80/20)
   ☑ Include class labels
   ```

3. **Download Dataset**
   - Organized folder structure
   - Ready for training

**Dataset Structure:**
```
training_dataset_20241205.zip
├── train/
│   ├── images/
│   └── annotations/
├── val/
│   ├── images/
│   └── annotations/
├── classes.txt
└── README.md
```

---

## 💾 Download Management

### Download Location

**Where Files Go:**
- Default: Your browser's Downloads folder
- Windows: `C:\Users\[YourName]\Downloads`
- Mac: `/Users/[YourName]/Downloads`
- Linux: `/home/[YourName]/Downloads`

**Change Download Location:**
1. Open browser settings
2. Go to Downloads section
3. Choose new location
4. Or enable "Ask where to save"

### Download History

**Track Your Downloads:**
1. Browser download history (Ctrl+J)
2. System download folder
3. Application download log (if available)

### Failed Downloads

**If Download Fails:**

1. **Check Internet Connection**
   - Ensure stable connection
   - Try again

2. **Check Storage Space**
   - Ensure enough disk space
   - Free up space if needed

3. **Try Different Browser**
   - Chrome, Firefox, Edge, Safari
   - Some browsers handle large files better

4. **Download Smaller Batches**
   - Select fewer images
   - Download in multiple batches

5. **Contact Support**
   - If problem persists
   - Provide error message

---

## 🔐 Security and Privacy

### Download Security

**Important Notes:**
- Downloads are encrypted during transfer
- Files saved locally are your responsibility
- Secure your computer
- Delete sensitive files when done
- Don't share on unsecured networks

### Data Handling

**Best Practices:**
1. Download only what you need
2. Store in secure location
3. Encrypt sensitive files
4. Delete after use if not needed
5. Follow HIPAA guidelines (if applicable)

### Audit Trail

**Download Tracking:**
- All downloads are logged
- Audit trail maintained
- Administrator can view download history
- Ensures accountability

---

## 💡 Download Best Practices

### Organization

**File Organization Tips:**

1. **Create Folder Structure**
   ```
   Medical_Images/
   ├── 2024/
   │   ├── December/
   │   │   ├── Patient_P12345/
   │   │   └── Patient_P12346/
   │   └── November/
   └── Annotations/
   ```

2. **Rename Files Consistently**
   ```
   Original: image_123.dcm
   Renamed: P12345_20241205_MAMMO_CC.dcm
   ```

3. **Keep Metadata**
   - Save metadata files
   - Keep README files
   - Document export dates

### Backup Strategy

**Regular Backups:**
1. Download important images regularly
2. Store in multiple locations
3. Use cloud backup services
4. Verify backup integrity
5. Test restore process

### Quality Control

**After Download:**
- [ ] Verify file integrity
- [ ] Check file opens correctly
- [ ] Confirm annotations present (if applicable)
- [ ] Verify metadata accuracy
- [ ] Test with intended software

---

## ⚠️ Common Issues

### Issue: Download Button Not Working

**Solutions:**
1. Refresh the page
2. Try different browser
3. Check popup blocker settings
4. Clear browser cache
5. Contact support

### Issue: ZIP File Won't Extract

**Solutions:**
1. Ensure download completed fully
2. Check file size matches expected
3. Try different extraction tool
4. Re-download the file
5. Check disk space

### Issue: Downloaded Image Won't Open

**Solutions:**
1. Verify file format
2. Use appropriate viewer (DICOM viewer for .dcm files)
3. Check file not corrupted
4. Re-download the file
5. Try different software

### Issue: Annotations Missing in Export

**Solutions:**
1. Verify annotations were saved
2. Check export format supports annotations
3. Select "Include Annotations" option
4. Try different export format
5. Contact support

---

## 📞 Quick Reference

| Task | Action |
|------|--------|
| Download Single Image | Open image → Download button |
| Download Multiple | Select images → Download Selected |
| Export Annotations | Annotation viewer → Export → Choose format |
| Export PDF Report | Export → PDF Report |
| Download Statistics | Dashboard → Export Statistics |
| Batch Export | Select all → Export as ZIP |

---

## 🎯 Export Format Quick Guide

| Need | Use This Format |
|------|----------------|
| Backup | JSON or Original Images |
| AI Training | LabelMe or COCO |
| Documentation | PDF Report |
| Spreadsheet Analysis | CSV |
| Object Detection | COCO or YOLO |
| Sharing with Doctors | PDF Report + Images |
| Archive | ZIP with all formats |

---

**Need Help?**

Contact your system administrator if you have questions about downloading or exporting data.

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**For**: Ambulance Users (Clients)
