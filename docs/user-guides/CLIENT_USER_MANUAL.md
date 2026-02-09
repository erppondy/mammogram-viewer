# 🏥 Mammogram System - Simple User Guide

## Quick Start Guide for Ambulance Users

---

## 📋 What You Need

- **License Key** from your administrator (Format: AMB-XXXX-XXXX-XXXX-XXXX)
- **Email Address**
- **Password** (minimum 8 characters)
- **Internet Connection**

---

## 🔑 Important: Shared Access Feature

**All users registered with the same ambulance license can:**

✅ **View** all images uploaded by anyone in your ambulance team
✅ **Download** any image from your ambulance
✅ **Annotate** any image from your ambulance
✅ **Delete** any image from your ambulance
✅ **Create reports** for any image from your ambulance

**This means:**
- Your team can collaborate on patient cases
- Night shift uploads are visible to day shift
- Multiple radiologists can review the same images
- Seamless handover between operators

**Privacy Note:** Users from different ambulances cannot see each other's images.

---

## 1️⃣ AMBULANCE USER REGISTRATION

### Step 1: Go to Registration Page

1. Open your web browser
2. Go to the https://xraycad.bosschn.in/mammogram)
3. Click **"Register"** button

### Step 2: Fill Registration Form

```
Enter the following:

✓ Full Name: Your complete name
✓ Email: Your work email address
✓ Password: Create a strong password (min 8 characters)
✓ Confirm Password: Type password again
✓ License Key: AMB-XXXX-XXXX-XXXX-XXXX (from admin)
```

### Step 3: Submit

1. Click **"Register"** button , 
2  Check Register as ambulance user
2. You'll see: "Registration successful

---

## 2️⃣ AMBULANCE USER LOGIN

### Step 1: Go to Login Page

1. Open the website
2. Click **"Login"** button

### Step 2: Enter Credentials

```
✓ Email: Your registered email
✓ Password: Your password
```

### Step 3: Login

1. Click **"Login"** button
2. You'll see your Dashboard
---

## 3️⃣ UPLOAD DICOM IMAGE

### Step 1: Go to Upload Page

1. From Dashboard, click **"Upload Images"**
2. Or click **"Upload"** in the menu

### Step 2: Select DICOM File

**Option A: Click to Browse**
1. Click **"Choose Files"** button
2. Find your DICOM file (.dcm or .dicom)
3. Select file
4. Click **"Open"**

**Option B: Drag and Drop**
1. Open your file folder
2. Drag DICOM file to upload area
3. Drop it

### Step 3: Fill Patient Information (optional)

**DICOM files auto-fill most fields!** Just verify:

```
Auto-filled (verify these)(click on extract dicom data):
✓ Patient ID
✓ Patient Name
✓ Patient Age
✓ Patient Sex
✓ Study Date
✓ Modality (e.g., Mammography)

Optional (add if needed):
○ Study Description
○ Institution Name
```

### Step 4: Upload

1. Review all information
2. Click **"Upload"** button
3. Wait for progress bar to complete
4. You'll see: "✓ Upload Successful!"

**Upload Progress:**
```
Uploading... ████████████ 100%
✓ Upload Complete!
```

---

## 4️⃣ VIEWING IMAGES (SHARED ACCESS)

### All Team Members Can View All Images

**When you view images, you'll see:**
- ✅ Images YOU uploaded
- ✅ Images uploaded by OTHER USERS in your ambulance
- ✅ All patient folders from your entire team

### How to View Images

1. From Dashboard, click **"View Images"** or **"Gallery"**
2. You'll see ALL images from your ambulance license
3. Images are organized by patient folders

### Identifying Who Uploaded

- All images from your ambulance are accessible
- You can view, download, and work with any image
- Perfect for team collaboration and shift handovers

---

## 5️⃣ DOCTOR REGISTRATION & LOGIN

### Doctor Registration (Same as Ambulance User)

**Doctors from your ambulance register the same way:**

1. Go to **"Register"** page
2. Fill in their information:
   - Name
   - Email
   - Password
   - **Same License Key** (your ambulance's key)
3. Click **"Register"**
4. **Important:** They will see ALL images uploaded by the entire team


### Doctor Login (Same Process)

1. Go to **"Login"** page
2. Enter email and password
3. Click **"Login"**
4. Access dashboard

**Note:** All users from the same ambulance share the same license and quota.

---

## 5️⃣ VIEW IMAGE

### Step 1: Go to Image Gallery

1. From Dashboard, click **"VIEW GALLERY**
2. All your uploaded images appear as FOLDER 

### Step 2: Open Image

1. Click on any folder and click the image
2. Image viewer opens in full screen

### Image Viewer Features:

**Zoom:**
- Mouse wheel up = Zoom in
- Mouse wheel down = Zoom out
- **+** button = Zoom in
- **-** button = Zoom out

**Pan (Move Image):**
- Click and drag image to move around

**Reset View:**
- Click **"Fit to Screen"** button

**Close Viewer:**
- Click **X** button
- Or press **Esc** key

### DICOM Viewer (Special for DICOM files)

For DICOM files, you get extra features:
- Window/Level adjustment (brightness/contrast)
- Measurement tools
- DICOM metadata display

---

## 6️⃣ DOWNLOAD IMAGE

### Download Single Image

**Method 1: From Image Viewer**
1. Open the image
2. Click **"Download"** button (top-right)
3. File downloads to your computer

**Method 2: From Gallery**
1. Right-click on image thumbnail
2. Select **"Download"**
3. File downloads

### Download Multiple Images

1. Go to **"My Images"** gallery
2. Check boxes next to images you want
3. Click **"Download Selected"** button
4. ZIP file downloads with all images

**ZIP File:**
```
images_5files_20241205.zip
├── mammogram_001.dcm
├── mammogram_002.dcm
├── mammogram_003.dcm
└── metadata.json
```

5. Extract ZIP file on your computer
6. Access individual files

---

## 7️⃣ ANNOTATE IMAGE

### Step 1: Open Annotation Viewer

1. Click on image thumbnail
2. Click **"Annotate"** button
3. Annotation viewer opens

### Step 2: Choose Annotation Tool

**Available Tools:**

**Rectangle Tool** (Press R)
- For bounding boxes
- Click and drag to draw

**Polygon Tool** (Press P)
- For irregular shapes
- Click to add points
- Double-click to finish

**Point Tool**
- For marking specific spots
- Click to place point

**Freehand Tool** (Press F)
- For drawing freely
- Click and drag to draw

### Step 3: Draw Annotation

**Example: Using Rectangle Tool**

1. Click **"Rectangle"** button
2. Click on image where you want to start
3. Drag to opposite corner
4. Release mouse button
5. Rectangle appears

### Step 4: Add Finding Information

After drawing, a form appears:

```
Required Fields:
✓ Finding Name: (e.g., "Mass", "Calcification")
✓ Category: (e.g., "Benign", "Malignant", "Suspicious")

Optional Fields:
○ Description: (e.g., "Irregular mass in upper quadrant")
○ Severity: (Low, Medium, High)
○ Notes: (Additional observations)
```

### Step 5: Save Annotation

1. Fill in the information
2. Click **"Save"** button
3. Annotation is saved
4. Appears in annotations list

### Edit or Delete Annotation

**To Edit:**
1. Click on annotation
2. Modify shape by dragging
3. Update information in form
4. Click **"Update"**

**To Delete:**
1. Click on annotation
2. Press **Delete** key
3. Or click **"Delete"** button
4. Confirm deletion

### Export Annotations

**For AI Training or Reports:**

1. Click **"Export"** button
2. Choose format:
   - **JSON** - Standard format
   - **LabelMe** - For AI training
   - **COCO** - For object detection
   - **PDF Report** - For documentation
3. Click **"Download"**
4. File downloads

---

## 🎯 Quick Reference

### Common Tasks

| Task | Steps |
|------|-------|
| Register | Register page → Fill form → Enter license key → Submit |
| Login | Login page → Enter email & password → Login |
| Upload DICOM | Upload page → Choose file → Verify info → Upload |
| View Image | My Images → Click thumbnail |
| Download Image | Open image → Download button |
| Annotate | Open image → Annotate → Choose tool → Draw → Save |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| R | Rectangle tool |
| P | Polygon tool |
| F | Freehand tool |
| Delete | Remove annotation |
| Esc | Cancel/Close |
| + | Zoom in |
| - | Zoom out |

---

## ⚠️ Important Notes

### License & Quota

**Check Your Status:**
- Dashboard shows license status
- Shows upload quota (used/remaining)
- Monitor regularly

**Status Indicators:**
- 🟢 **Active** = Can upload
- 🟡 **Expiring Soon** = Contact admin
- 🔴 **Expired** = Cannot upload, contact admin
- ⚫ **Revoked** = Contact admin immediately

**Quota Warnings:**
- At 80% = Warning
- At 90% = Critical
- At 100% = Cannot upload

**Action:** Contact administrator to renew license or increase quota

### Supported File Formats

**For Upload:**
- DICOM (.dcm, .dicom) ✓ Recommended
- JPEG (.jpg, .jpeg)
- PNG (.png)
- TIFF (.tiff, .tif)
- ZIP archives (.zip)

**File Size Limit:** 100 MB per file

---

## 🆘 Common Problems

### Problem: Cannot Login

**Solution:**
1. Check email and password are correct
2. Check Caps Lock is OFF
3. Click "Forgot Password" if needed
4. Contact admin if account not approved

### Problem: Cannot Upload

**Solution:**
1. Check license status (must be Active)
2. Check quota not exceeded
3. Check file format is supported
4. Check file size under 100 MB
5. Check internet connection

### Problem: Image Not Showing

**Solution:**
1. Refresh the page (F5)
2. Wait a few minutes (processing)
3. Clear browser cache
4. Try different browser

### Problem: Annotation Not Saving

**Solution:**
1. Check internet connection
2. Click "Save" button manually
3. Wait for "✓ Saved" confirmation
4. Refresh page and try again

---

## 📞 Need Help?

### Contact Your Administrator

**For:**
- Account approval
- License renewal
- Quota increase
- Password reset
- Technical problems

**Contact Information:**
- Email: [Your admin email]
- Phone: [Your admin phone]

---

## ✅ Quick Checklist

### First Time Setup:
- [ ] Received license key from admin
- [ ] Registered account
- [ ] Account approved by admin
- [ ] Logged in successfully
- [ ] Checked license status
- [ ] Uploaded first test image

### Before Each Upload:
- [ ] License is Active
- [ ] Quota available
- [ ] DICOM file ready
- [ ] Patient information ready

### After Upload:
- [ ] Upload successful
- [ ] Image appears in gallery
- [ ] Can view image
- [ ] Can annotate if needed

---

## 🎓 Training Flow

### Day 1: Setup
1. Register account
2. Wait for approval
3. Login for first time
4. Explore dashboard

### Day 2: Upload
1. Prepare DICOM file
2. Upload first image
3. Verify upload successful
4. View uploaded image

### Day 3: Annotation
1. Open image
2. Try each annotation tool
3. Add findings
4. Save annotations

### Day 4: Download & Export
1. Download single image
2. Download multiple images
3. Export annotations
4. Try different formats

### Day 5: Practice
1. Upload multiple images
2. Annotate images
3. Download and export
4. Review all features

---

## 📊 System Overview

```
┌─────────────────────────────────────────┐
│           YOUR WORKFLOW                  │
├─────────────────────────────────────────┤
│                                          │
│  1. Register with License Key            │
│           ↓                              │
│  2. Login to System                      │
│           ↓                              │
│  3. Upload DICOM Images                  │
│           ↓                              │
│  4. View Images                          │
│           ↓                              │
│  5. Annotate Findings                    │
│           ↓                              │
│  6. Download/Export                      │
│                                          │
└─────────────────────────────────────────┘
```

---

## 🎯 Success Tips

**For Best Results:**

1. **Use DICOM Files**
   - Auto-fills patient information
   - Better quality
   - More features

2. **Monitor Your Quota**
   - Check dashboard regularly
   - Request increase at 80%
   - Don't wait until 100%

3. **Annotate Carefully**
   - Zoom in for precision
   - Use appropriate tool
   - Add detailed descriptions
   - Save frequently

4. **Keep License Active**
   - Note expiration date
   - Request renewal 30 days before
   - Contact admin early

5. **Secure Your Account**
   - Use strong password
   - Logout when finished
   - Don't share credentials

---

**That's it! You're ready to use the system.**

**Remember:**
- Register with license key
- Login with email and password
- Upload DICOM images
- View, download, and annotate
- Contact admin for help

**Happy imaging! 🏥📸**

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**For:** Ambulance Users & Doctors
