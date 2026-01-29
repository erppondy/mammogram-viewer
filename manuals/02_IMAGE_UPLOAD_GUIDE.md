# 📤 Image Upload Guide
## How to Upload Medical Images

---

## Overview

This guide explains how to upload mammogram and medical images to the system. Follow these step-by-step instructions for successful uploads.

---

## 🎯 Before You Upload

### Check Your License Status

Before uploading, verify:

✅ **License is Active** - Green status indicator  
✅ **Quota Available** - Check remaining uploads  
✅ **Not Expired** - Check expiration date  

**Where to Check:**
- Dashboard → License Status section
- Top of any page (status bar)

### Prepare Your Files

**Supported File Formats:**

| Format | Extension | Notes |
|--------|-----------|-------|
| DICOM | .dcm, .dicom | Medical imaging standard |
| JPEG | .jpg, .jpeg | Standard image format |
| PNG | .png | High quality images |
| TIFF | .tiff, .tif | High resolution |
| AAN | .aan | Specialized format |
| ZIP | .zip | Multiple files in archive |

**File Size Limits:**
- Maximum file size: **100 MB** per file
- Maximum batch: **50 files** at once
- ZIP archives: Up to 100 MB total

---

## 📋 Step-by-Step Upload Process

### Step 1: Navigate to Upload Page

**Option A: From Dashboard**
1. Click **"Upload Images"** card on dashboard
2. Upload page opens

**Option B: From Menu**
1. Click **"Upload"** in main navigation
2. Upload page opens

### Step 2: Select Files

**Method 1: Click to Browse**
1. Click **"Choose Files"** button
2. File browser opens
3. Navigate to your files
4. Select one or multiple files
5. Click **"Open"**

**Method 2: Drag and Drop**
1. Open your file folder
2. Select files
3. Drag files to upload area
4. Drop files when area highlights
5. Files are added automatically

**Tips:**
- Hold **Ctrl** (Windows) or **Cmd** (Mac) to select multiple files
- You can upload up to 50 files at once
- Mix different file formats in one upload

### Step 3: Review Selected Files

After selecting files, you'll see:

```
Selected Files:
✓ mammogram_001.dcm (2.5 MB)
✓ mammogram_002.dcm (2.3 MB)
✓ xray_scan.jpg (1.8 MB)

Total: 3 files (6.6 MB)
```

**Actions Available:**
- **Remove**: Click ❌ to remove a file
- **Add More**: Click "Add More Files" to select additional files
- **Clear All**: Remove all selected files

### Step 4: Fill in Patient Information

**Required Fields** (marked with *):

```
* Patient ID
  Example: P12345
  Note: Unique identifier for the patient

* Patient Name
  Example: John Doe
  Note: Full name of the patient

* Study Date
  Example: 2024-12-05
  Note: Date when images were taken

* Modality
  Example: Mammography
  Options: Mammography, X-Ray, CT, MRI, Ultrasound
```

**Optional Fields:**

```
Patient Age
  Example: 45
  Note: Age in years

Patient Sex
  Options: Male, Female, Other

Study Description
  Example: Routine mammogram screening
  Note: Brief description of the study

Institution Name
  Example: City Hospital
  Note: Your facility name
```

**Auto-Fill from DICOM:**
- If uploading DICOM files, some fields auto-fill
- Review and correct if needed
- You can override auto-filled values

### Step 5: Verify Information

**Double-Check:**
- [ ] Patient ID is correct
- [ ] Patient name is spelled correctly
- [ ] Study date is accurate
- [ ] Modality is selected
- [ ] All files are listed
- [ ] No duplicate files

### Step 6: Start Upload

1. Click **"Upload"** button
2. Upload progress bar appears
3. Wait for completion (don't close browser)

**During Upload:**
```
Uploading... 2 of 3 files

mammogram_001.dcm ████████████ 100%
mammogram_002.dcm ████████░░░░ 75%
xray_scan.jpg ░░░░░░░░░░░░ 0%

Overall Progress: 58%
```

### Step 7: Upload Complete

**Success Message:**
```
✓ Upload Successful!

3 files uploaded successfully
Quota used: 3 / 1000
Remaining: 997 uploads
```

**What Happens Next:**
- Images are processed
- Thumbnails are generated
- Metadata is extracted
- Images appear in your gallery

**Next Actions:**
- **View Images**: Click "View Gallery"
- **Annotate Now**: Click "Annotate" on any image
- **Upload More**: Click "Upload More Images"

---

## 🔄 Special Upload Scenarios

### Uploading ZIP Archives

**When to Use:**
- Multiple DICOM files from one study
- Batch upload from imaging equipment
- Organized folder structure

**How to Upload ZIP:**

1. **Prepare ZIP File**
   - Compress files into .zip format
   - Ensure all files are supported formats
   - Keep under 100 MB total

2. **Upload ZIP**
   - Select .zip file like any other file
   - System automatically extracts files
   - All valid files are imported

3. **Processing**
   ```
   Extracting ZIP archive...
   Found 15 DICOM files
   Importing files...
   ████████████ 100%
   
   ✓ 15 files imported successfully
   ```

4. **Review Extracted Files**
   - All files appear in gallery
   - Each file counted separately in quota
   - Metadata extracted from each file

### Uploading DICOM Files

**DICOM Advantages:**
- Automatic metadata extraction
- Patient info auto-filled
- Study details included
- High quality medical images

**DICOM Upload Process:**

1. Select DICOM file(s)
2. System reads DICOM headers
3. Form auto-fills with:
   - Patient ID
   - Patient Name
   - Patient Age
   - Patient Sex
   - Study Date
   - Modality
   - Institution Name

4. Review and correct if needed
5. Upload as normal

**DICOM Viewer:**
- DICOM files open in specialized viewer
- Windowing controls available
- Measurement tools included

### Uploading Standard Images (JPG, PNG)

**For Non-DICOM Images:**

1. Select image files
2. **All fields must be filled manually**
3. No auto-fill available
4. Enter all patient information
5. Upload as normal

**Best Practices:**
- Use consistent naming convention
- Include date in filename
- Keep original high-quality images
- Document patient ID in filename

---

## ⚠️ Common Upload Issues

### Issue: "File Format Not Supported"

**Cause:** File type not allowed

**Solution:**
1. Check file extension
2. Convert to supported format
3. Use DICOM, JPG, PNG, or TIFF
4. Contact admin if format needed

### Issue: "File Too Large"

**Cause:** File exceeds 100 MB limit

**Solution:**
1. Compress image (reduce quality slightly)
2. Split into multiple files
3. Use ZIP compression
4. Contact admin for large file support

### Issue: "Quota Exceeded"

**Cause:** Upload limit reached

**Solution:**
1. Check remaining quota on dashboard
2. Contact administrator to increase quota
3. Delete old images if allowed
4. Wait for quota reset (if applicable)

### Issue: "Upload Failed"

**Possible Causes:**
- Internet connection lost
- Browser timeout
- Server error
- File corrupted

**Solutions:**
1. Check internet connection
2. Refresh page and try again
3. Try smaller batch of files
4. Try different browser
5. Contact support if persists

### Issue: "Invalid Patient ID"

**Cause:** Patient ID format incorrect

**Solution:**
1. Check ID format requirements
2. Remove special characters
3. Use alphanumeric only
4. Follow your facility's ID format

### Issue: "Duplicate File"

**Cause:** File already uploaded

**Solution:**
1. Check if file exists in gallery
2. Use different filename
3. Verify it's not a duplicate study
4. Contact admin if you need to replace

---

## 💡 Upload Best Practices

### File Organization

**Before Upload:**
1. Organize files by patient
2. Name files consistently
3. Group related studies
4. Remove test/duplicate files

**Naming Convention Example:**
```
PatientID_Date_Modality_View.dcm

Examples:
P12345_20241205_MAMMO_CC.dcm
P12345_20241205_MAMMO_MLO.dcm
P67890_20241204_XRAY_CHEST.jpg
```

### Batch Uploads

**For Multiple Patients:**
1. Upload one patient at a time
2. Fill in patient info for each
3. Verify before uploading next
4. Keep track of uploaded patients

**For Single Patient:**
1. Select all files for patient
2. Fill in info once
3. Upload all together
4. Saves time and ensures consistency

### Quality Control

**Before Uploading:**
- [ ] Verify image quality
- [ ] Check correct patient
- [ ] Confirm study date
- [ ] Remove personal identifiers (if required)
- [ ] Ensure proper orientation

**After Uploading:**
- [ ] Verify all files uploaded
- [ ] Check thumbnails display correctly
- [ ] Confirm metadata is accurate
- [ ] Test image viewer
- [ ] Add annotations if needed

### Quota Management

**Monitor Your Usage:**
1. Check quota regularly
2. Plan uploads accordingly
3. Request increase before limit
4. Archive old images if possible

**Quota Alerts:**
- **80%**: Start planning
- **90%**: Contact admin soon
- **95%**: Urgent - contact admin
- **100%**: Cannot upload

---

## 📊 Upload Statistics

### Track Your Uploads

**View Upload History:**
1. Go to Dashboard
2. See "Recent Uploads" section
3. View upload dates and counts

**Statistics Available:**
- Total images uploaded
- Uploads this week
- Uploads this month
- Storage used
- Quota remaining

---

## 🔐 Security and Privacy

### Patient Data Protection

**Important:**
- All uploads are encrypted
- Data stored securely
- Access controlled by license
- Audit trail maintained

**Your Responsibilities:**
1. Verify patient consent
2. Follow HIPAA guidelines (if applicable)
3. Use secure internet connection
4. Don't share login credentials
5. Log out when finished

### Data Retention

**How Long Data is Kept:**
- Images stored per license agreement
- Retention policy set by administrator
- Backup copies maintained
- Deletion requires admin approval

---

## ✅ Upload Checklist

Before each upload session:

- [ ] License is active
- [ ] Quota available
- [ ] Files prepared and organized
- [ ] Patient information ready
- [ ] Stable internet connection
- [ ] Sufficient time to complete
- [ ] Browser up to date

---

## 📞 Quick Reference

| Task | Action |
|------|--------|
| Start Upload | Dashboard → Upload Images |
| Select Files | Click "Choose Files" or drag & drop |
| Remove File | Click ❌ next to filename |
| Check Quota | View dashboard license section |
| View Uploaded | Dashboard → My Images |
| Upload More | Click "Upload More Images" |

---

## 🎯 Next Steps

After uploading images:

1. **View Images** - Check your gallery
2. **Annotate Images** - Mark findings
3. **Download Images** - Export if needed
4. **Generate Reports** - Create documentation

See other guides for detailed instructions on these features.

---

**Need Help?**

Contact your system administrator or support team if you encounter any issues during upload.

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**For**: Ambulance Users (Clients)
