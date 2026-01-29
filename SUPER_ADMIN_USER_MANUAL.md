# 🏥 Super Admin User Manual
## Mammogram Viewer & Annotation System

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Ambulance License Management](#ambulance-license-management)
4. [Ambulance User Registration](#ambulance-user-registration)
5. [User Management](#user-management)
6. [Image Upload & Management](#image-upload--management)
7. [Image Download](#image-download)
8. [Image Annotation](#image-annotation)
9. [Password Management](#password-management)
10. [Statistics & Analytics](#statistics--analytics)
11. [License Templates](#license-templates)
12. [System Monitoring](#system-monitoring)
13. [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### Logging In

1. Navigate to the application URL
2. Enter your **Super Admin** credentials
3. Click **"Login"**
4. You'll be redirected to the Admin Dashboard

### First Time Setup

After logging in for the first time:
1. Review system statistics
2. Create license templates (optional but recommended)
3. Create your first ambulance license
4. Set up ambulance users

---

## 📊 Dashboard Overview

The Admin Dashboard has **4 main tabs**:

### 1. **User Management** 
   - View and manage all users
   - Approve/reject pending registrations
   - Assign users to ambulance licenses
   - Reset user passwords

### 2. **License Management**
   - Create and manage ambulance licenses
   - Monitor license status and expiration
   - Track upload quotas
   - Revoke licenses when needed

### 3. **Statistics**
   - View system-wide statistics
   - Monitor ambulance usage
   - Track storage consumption
   - Export reports

### 4. **Templates**
   - Create license templates for quick setup
   - Define default quotas and durations
   - Manage template library

---

## 🚑 Ambulance License Management

### Creating a New Ambulance License

**Step-by-Step Flow:**

1. **Navigate to License Management**
   - Click on **"License Management"** tab
   - Click **"+ Create License"** button

2. **Fill in Ambulance Details**
   ```
   Required Fields:
   ✓ Ambulance Name (e.g., "City Hospital Ambulance")
   ✓ Contact Email (e.g., "ambulance@cityhospital.com")
   ✓ Contact Phone (e.g., "+1-555-0123")
   ✓ Address (e.g., "123 Medical Center Dr, City, State")
   ```

3. **Set License Parameters**
   ```
   ✓ Upload Quota: Number of images allowed (e.g., 1000)
   ✓ Duration: License validity in days (e.g., 365)
   
   OR
   
   ✓ Select Template: Choose from pre-configured templates
   ```

4. **Review and Create**
   - Review all details
   - Click **"Create License"**
   - A unique **License Key** will be generated (e.g., `AMB-A1B2-C3D4-E5F6-G7H8`)

5. **Save the License Key**
   - **IMPORTANT**: Copy and securely store the license key
   - Share this key with the ambulance for user registration
   - The key cannot be recovered if lost

### Viewing License Details

1. In the **License Management** tab
2. Click **"View Details"** on any license
3. You'll see:
   - License status (Active/Expired/Revoked)
   - Ambulance information
   - Upload quota (used/total)
   - Expiration date
   - Associated users
   - Upload history
   - Audit trail

### Editing a License

1. Click **"Edit"** button on the license
2. You can modify:
   - Ambulance contact information
   - Upload quota (increase or decrease)
   - Expiration date (extend license)
3. Click **"Save Changes"**
4. All changes are logged in the audit trail

### Extending License Duration

**Quick Extension:**
1. Click **"Edit"** on the license
2. Go to **"Extend License"** section
3. Enter number of days to extend (e.g., 90)
4. Click **"Extend"**
5. New expiration date is calculated automatically

### Updating Upload Quota

**Increase/Decrease Quota:**
1. Click **"Edit"** on the license
2. Go to **"Update Quota"** section
3. Enter new quota value (e.g., 2000)
4. Click **"Update Quota"**
5. Change takes effect immediately

### Revoking a License

**When to Revoke:**
- Contract termination
- Policy violations
- Security concerns
- Service discontinuation

**How to Revoke:**
1. Click **"Revoke"** button on the license
2. Enter **revocation reason** (required)
3. Confirm revocation
4. License status changes to "Revoked"
5. All associated users lose access immediately
6. No further uploads are allowed

### Filtering and Searching Licenses

**Search Options:**
- Search by ambulance name
- Search by license key
- Filter by status (Active/Expired/Revoked)
- Sort by expiration date, creation date, or quota usage

---

## 👥 Ambulance User Registration

### How Ambulance Users Register

**User Registration Flow:**

1. **User Visits Registration Page**
   - Navigate to `/register`
   - Select **"Register as Ambulance User"**

2. **User Provides Information**
   ```
   Required Fields:
   ✓ Full Name
   ✓ Email Address
   ✓ Password (minimum 8 characters)
   ✓ License Key (provided by Super Admin)
   ```

3. **License Validation**
   - System validates the license key
   - Checks if license is active and not expired
   - Verifies license has available quota

4. **Account Creation**
   - User account is created with "Pending" status
   - User is associated with the ambulance license
   - Super Admin receives notification

5. **Admin Approval Required**
   - Super Admin reviews the registration
   - Approves or rejects the user
   - User receives email notification

### Approving Ambulance User Registrations

**Step-by-Step:**

1. **View Pending Users**
   - Go to **"User Management"** tab
   - Click on **"Pending"** status card
   - Or filter by status: "Pending"

2. **Review User Details**
   - Check user information
   - Verify associated license
   - Review registration date

3. **Approve User**
   - Click **"Approve"** button
   - User status changes to "Approved"
   - User can now log in and upload images

4. **Reject User (if needed)**
   - Click **"Reject"** button
   - Optionally provide rejection reason
   - User receives notification

### Assigning Users to Licenses

**Manual Assignment:**

1. In **User Management** tab
2. Find the user you want to assign
3. Click **"Assign License"** button
4. Select:
   - **License** from dropdown
   - **Ambulance Role** (Operator/Supervisor/Admin)
5. Click **"Assign"**
6. User is now associated with the license

**Ambulance Roles:**
- **Operator**: Can upload and view images
- **Supervisor**: Can upload, view, and manage team uploads
- **Admin**: Full access to ambulance data

### Unassigning Users from Licenses

1. Find the user in **User Management**
2. Click **"Unassign License"** button
3. Confirm the action
4. User loses access to upload features

---

## 👤 User Management

### Viewing All Users

**User List Features:**
- View all registered users
- See user status (Pending/Approved/Rejected/Deactivated)
- Check associated licenses
- View registration dates
- Search and filter users

### User Status Management

#### Approving Users
1. Select user with "Pending" status
2. Click **"Approve"**
3. User can now access the system

#### Rejecting Users
1. Select user with "Pending" status
2. Click **"Reject"**
3. Optionally provide reason
4. User cannot access the system

#### Deactivating Users
**When to Deactivate:**
- Temporary suspension
- Investigation period
- User request

**How to Deactivate:**
1. Select active user
2. Click **"Deactivate"**
3. User cannot log in
4. Data is preserved

#### Reactivating Users
1. Select deactivated user
2. Click **"Activate"**
3. User can log in again

#### Deleting Users
**⚠️ Warning: This action is permanent!**

1. Select user to delete
2. Click **"Delete"**
3. Confirm deletion
4. User account and data are removed

### Searching and Filtering Users

**Search Options:**
- Search by name or email
- Filter by status
- Filter by license
- Filter by role
- Sort by registration date

**Quick Filters:**
- Click on status cards to filter
- Click "Clear filter" to reset

---

## 📤 Image Upload & Management

### How Users Upload Images

**Upload Flow (User Perspective):**

1. **Navigate to Upload Page**
   - Click **"Upload Images"** from dashboard
   - Or go to `/upload`

2. **Select Files**
   - Click **"Choose Files"** or drag & drop
   - Supported formats:
     - DICOM (.dcm, .dicom)
     - Standard images (.jpg, .jpeg, .png, .tiff)
     - AAN files (.aan)
     - ZIP archives (containing supported files)

3. **Fill in Metadata**
   ```
   Required Fields:
   ✓ Patient ID
   ✓ Patient Name
   ✓ Study Date
   ✓ Modality (e.g., Mammography)
   
   Optional Fields:
   ○ Patient Age
   ○ Patient Sex
   ○ Study Description
   ○ Institution Name
   ```

4. **Upload Process**
   - Files are validated
   - Quota is checked
   - Upload progress is shown
   - Thumbnails are generated
   - Metadata is extracted

5. **Upload Complete**
   - Success notification
   - Images appear in gallery
   - Quota is updated

### Admin Viewing Uploaded Images

**View Images by License:**

1. Go to **License Management** tab
2. Click **"View Details"** on a license
3. Scroll to **"Uploaded Images"** section
4. View all images from that ambulance

**View All Images:**
1. Navigate to **"My Images"** or dashboard
2. Use filters to find specific images
3. Search by patient ID, date, or modality

### Monitoring Upload Quotas

**Check Quota Usage:**
- View in License Details panel
- See used/total uploads
- Monitor percentage used
- Get alerts when quota is low (< 20%)

**Quota Warnings:**
- Users see warnings at 80% usage
- Users see critical alerts at 90% usage
- Uploads blocked at 100% usage

---

## 📥 Image Download

### Downloading Individual Images

**Single Image Download:**

1. **Navigate to Image Gallery**
   - Go to dashboard or images page
   - Find the image you want

2. **View Image Details**
   - Click on the image thumbnail
   - Image viewer opens

3. **Download Options**
   - Click **"Download"** button
   - Image downloads in original format
   - Filename includes patient ID and date

### Downloading Multiple Images

**Bulk Download:**

1. **Select Images**
   - Use checkboxes to select multiple images
   - Or use "Select All" option

2. **Download as ZIP**
   - Click **"Download Selected"** button
   - Images are packaged into a ZIP file
   - ZIP includes metadata files

3. **Download Complete**
   - ZIP file downloads automatically
   - Extract to view images

### Downloading Annotations

**Export Annotated Data:**

1. **Navigate to Annotated Image**
   - Find image with annotations
   - Open in annotation viewer

2. **Export Options**
   - **JSON Format**: Machine-readable annotations
   - **LabelMe Format**: Compatible with AI training tools
   - **COCO Format**: For object detection models
   - **Report PDF**: Human-readable report

3. **Download**
   - Select format
   - Click **"Export"**
   - File downloads automatically

### Downloading Statistics Reports

**Export System Statistics:**

1. Go to **Statistics** tab
2. Click **"Export"** button
3. Choose format:
   - **CSV**: For spreadsheet analysis
   - **PDF**: For reports and presentations
4. File downloads with timestamp

---

## 🎨 Image Annotation

### Opening Annotation Viewer

**Start Annotating:**

1. **From Image Gallery**
   - Click on any image thumbnail
   - Click **"Annotate"** button
   - Annotation viewer opens

2. **From Upload**
   - After uploading, click **"Annotate Now"**
   - Directly opens in annotation viewer

### Annotation Tools

**Available Tools:**

#### 1. **Rectangle Tool**
   - Click **"Rectangle"** button
   - Click and drag on image
   - Use for bounding boxes

#### 2. **Polygon Tool**
   - Click **"Polygon"** button
   - Click to add points
   - Double-click to complete
   - Use for irregular shapes

#### 3. **Point Tool**
   - Click **"Point"** button
   - Click on image to mark location
   - Use for specific landmarks

#### 4. **Freehand Tool**
   - Click **"Freehand"** button
   - Click and drag to draw
   - Use for complex outlines

### Creating Annotations

**Step-by-Step:**

1. **Select Tool**
   - Choose annotation tool from toolbar
   - Tool button highlights when active

2. **Draw on Image**
   - Follow tool-specific instructions
   - Annotation appears in real-time

3. **Add Finding Information**
   ```
   Required:
   ✓ Finding Name (e.g., "Mass", "Calcification")
   ✓ Category (e.g., "Benign", "Malignant", "Suspicious")
   
   Optional:
   ○ Description
   ○ Severity
   ○ Notes
   ```

4. **Save Annotation**
   - Click **"Save"** button
   - Annotation is stored
   - Appears in annotations list

### Editing Annotations

**Modify Existing Annotations:**

1. **Select Annotation**
   - Click on annotation in image
   - Or select from annotations list

2. **Edit Options**
   - **Move**: Drag to reposition
   - **Resize**: Drag corner handles
   - **Edit Points**: Modify polygon vertices
   - **Update Info**: Change finding details

3. **Save Changes**
   - Click **"Update"**
   - Changes are saved

### Deleting Annotations

1. Select annotation
2. Click **"Delete"** button
3. Confirm deletion
4. Annotation is removed

### Annotation Features

**Advanced Features:**

#### Zoom and Pan
- **Zoom In**: Mouse wheel up or + button
- **Zoom Out**: Mouse wheel down or - button
- **Pan**: Click and drag image
- **Fit to Screen**: Click fit button
- **Reset**: Click reset button

#### Keyboard Shortcuts
- **R**: Rectangle tool
- **P**: Polygon tool
- **F**: Freehand tool
- **Delete**: Remove selected annotation
- **Esc**: Cancel current drawing
- **Ctrl+Z**: Undo
- **Ctrl+S**: Save

#### Annotation Visibility
- Toggle annotation visibility
- Show/hide labels
- Adjust opacity
- Change colors

### Exporting Annotations

**Export for AI Training:**

1. Click **"Export"** button
2. Select format:
   - **LabelMe JSON**: Standard format
   - **COCO JSON**: Object detection
   - **YOLO TXT**: YOLO format
   - **Pascal VOC XML**: VOC format

3. Download file
4. Use in machine learning pipelines

---

## 🔐 Password Management

### Changing Your Own Password

**Self-Service Password Change:**

1. **Navigate to Profile**
   - Click on your profile icon (top right)
   - Select **"Profile"** or **"Settings"**

2. **Go to Password Section**
   - Find **"Change Password"** section
   - Click **"Change Password"**

3. **Enter Password Details**
   ```
   Required:
   ✓ Current Password
   ✓ New Password (minimum 8 characters)
   ✓ Confirm New Password
   ```

4. **Password Requirements**
   - Minimum 8 characters
   - At least one uppercase letter (recommended)
   - At least one number (recommended)
   - At least one special character (recommended)

5. **Save New Password**
   - Click **"Update Password"**
   - Success notification appears
   - Use new password for next login

### Resetting User Passwords (Admin)

**Admin Password Reset:**

1. **Navigate to User Management**
   - Go to **"User Management"** tab
   - Find the user who needs password reset

2. **Initiate Reset**
   - Click **"Reset Password"** button
   - Password reset modal opens

3. **Set New Password**
   ```
   Required:
   ✓ New Password (minimum 8 characters)
   ✓ Confirm Password
   ```

4. **Confirm Reset**
   - Click **"Reset Password"**
   - Password is changed immediately
   - User is notified (if email configured)

5. **Share New Password**
   - Securely communicate new password to user
   - Advise user to change password on first login

**⚠️ Important Notes:**
- You cannot reset your own password this way
- Use the profile password change for your account
- Always use strong, unique passwords
- Never share passwords via insecure channels

### Password Security Best Practices

**For Admins:**
- Use strong, unique passwords
- Change passwords regularly (every 90 days)
- Never share admin credentials
- Use password manager
- Enable two-factor authentication (if available)

**For Users:**
- Enforce minimum password length
- Require password complexity
- Implement password expiration policies
- Monitor failed login attempts
- Lock accounts after multiple failures

---

## 📈 Statistics & Analytics

### System-Wide Statistics

**Overview Dashboard:**

1. **Navigate to Statistics Tab**
   - Click **"Statistics"** tab
   - System overview loads

2. **Key Metrics Displayed**
   ```
   ✓ Total Licenses (Active/Expired/Revoked)
   ✓ Total Ambulance Users
   ✓ Total Images Uploaded
   ✓ Total Storage Used (GB)
   ✓ Average Images per Ambulance
   ✓ Average Storage per Ambulance
   ```

3. **Visual Charts**
   - License status distribution
   - Upload trends over time
   - Storage usage by ambulance
   - User activity metrics

### Ambulance-Specific Statistics

**View Individual Ambulance Stats:**

1. **From Statistics Tab**
   - Scroll to **"Ambulance Statistics"** table
   - Click **"View Details"** on any ambulance

2. **Detailed Metrics**
   ```
   License Information:
   ✓ License status and expiration
   ✓ Days until expiry
   ✓ License key
   
   Usage Metrics:
   ✓ Total images uploaded
   ✓ Upload quota (used/remaining)
   ✓ Quota usage percentage
   ✓ Storage used (MB/GB)
   
   User Metrics:
   ✓ Total users
   ✓ Active users
   ✓ User roles distribution
   
   Activity Metrics:
   ✓ Last upload date
   ✓ Uploads today
   ✓ Uploads this week
   ✓ Uploads this month
   ```

3. **Activity Charts**
   - Daily upload trends
   - Weekly patterns
   - Monthly summaries
   - Storage growth over time

### Exporting Statistics

**Export Options:**

#### Export All Statistics (CSV)
1. Go to **Statistics** tab
2. Click **"Export All"** button
3. CSV file downloads
4. Open in Excel or Google Sheets

#### Export Specific Ambulance (CSV)
1. View ambulance details
2. Click **"Export CSV"** button
3. CSV with ambulance data downloads

#### Export Report (PDF)
1. View ambulance details
2. Click **"Export PDF"** button
3. Formatted PDF report downloads
4. Includes charts and tables

### Monitoring Alerts

**Automatic Alerts:**

- **Quota Warnings**: When ambulance reaches 80% quota
- **Quota Critical**: When ambulance reaches 90% quota
- **License Expiring**: 30 days before expiration
- **License Expired**: When license expires
- **Storage Warnings**: When storage reaches threshold

---

## 📋 License Templates

### Why Use Templates?

**Benefits:**
- Quick license creation
- Standardized configurations
- Consistent quotas and durations
- Easy management of license tiers

**Common Use Cases:**
- Basic tier (small ambulances)
- Standard tier (medium ambulances)
- Premium tier (large hospitals)
- Trial licenses (evaluation period)

### Creating License Templates

**Step-by-Step:**

1. **Navigate to Templates Tab**
   - Click **"Templates"** tab
   - Click **"+ Create Template"** button

2. **Fill Template Details**
   ```
   Required:
   ✓ Template Name (e.g., "Standard Annual License")
   ✓ Default Duration (days) (e.g., 365)
   ✓ Default Upload Quota (e.g., 1000)
   
   Optional:
   ○ Description (e.g., "Standard license for medium-sized ambulances")
   ```

3. **Save Template**
   - Click **"Create Template"**
   - Template appears in list
   - Ready to use for license creation

### Using Templates

**Apply Template to New License:**

1. When creating a new license
2. Click **"Use Template"** dropdown
3. Select template
4. Fields auto-fill with template values
5. Customize if needed
6. Create license

### Managing Templates

**Edit Template:**
1. Find template in list
2. Click **"Edit"** button
3. Modify values
4. Save changes
5. **Note**: Doesn't affect existing licenses

**Deactivate Template:**
1. Click **"Deactivate"** button
2. Template hidden from selection
3. Can be reactivated later

**Delete Template:**
1. Click **"Delete"** button
2. Confirm deletion
3. Template removed permanently

### Template Examples

**Suggested Templates:**

#### Basic Tier
```
Name: Basic Monthly License
Duration: 30 days
Quota: 100 images
Use: Small clinics, trial periods
```

#### Standard Tier
```
Name: Standard Annual License
Duration: 365 days
Quota: 1000 images
Use: Medium ambulances, regular use
```

#### Premium Tier
```
Name: Premium Annual License
Duration: 365 days
Quota: 5000 images
Use: Large hospitals, high volume
```

#### Enterprise Tier
```
Name: Enterprise License
Duration: 730 days (2 years)
Quota: 10000 images
Use: Hospital networks, enterprise clients
```

---

## 🔍 System Monitoring

### Real-Time Monitoring

**Dashboard Indicators:**

1. **System Health**
   - Active users count
   - Current upload activity
   - Storage availability
   - System performance

2. **License Status**
   - Active licenses count
   - Expiring soon (next 30 days)
   - Expired licenses
   - Revoked licenses

3. **User Activity**
   - Pending approvals
   - Recent registrations
   - Active sessions
   - Failed login attempts

### Audit Trail

**Viewing Audit Logs:**

1. **License Audit Trail**
   - View in License Details panel
   - Shows all license modifications
   - Includes:
     - Who made changes
     - What was changed
     - When it happened
     - Old and new values

2. **User Activity Logs**
   - Track user actions
   - Monitor uploads
   - Review annotations
   - Check downloads

### Performance Monitoring

**Key Performance Indicators:**

- **Upload Success Rate**: % of successful uploads
- **Average Upload Time**: Time per image
- **Storage Growth Rate**: GB per day/week/month
- **User Engagement**: Active users vs total users
- **Quota Utilization**: Average quota usage across ambulances

### Capacity Planning

**Monitor These Metrics:**

1. **Storage Capacity**
   - Current usage
   - Growth trends
   - Projected capacity needs
   - Plan for expansion

2. **License Capacity**
   - Total licenses issued
   - Average users per license
   - Average uploads per license
   - Plan for scaling

3. **System Load**
   - Concurrent users
   - Upload volume
   - Processing queue
   - Response times

---

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### Issue: User Cannot Register

**Symptoms:**
- Registration fails
- "Invalid license key" error

**Solutions:**
1. Verify license key is correct
2. Check license status (must be "Active")
3. Verify license not expired
4. Check quota not exceeded
5. Ensure license not revoked

#### Issue: User Cannot Upload Images

**Symptoms:**
- Upload fails
- "Quota exceeded" error
- "License expired" error

**Solutions:**
1. Check user's license status
2. Verify quota availability
3. Check license expiration date
4. Increase quota if needed
5. Extend license if expired

#### Issue: Annotations Not Saving

**Symptoms:**
- Annotations disappear
- Save button not working

**Solutions:**
1. Check internet connection
2. Verify user is logged in
3. Check browser console for errors
4. Try refreshing page
5. Clear browser cache

#### Issue: Images Not Displaying

**Symptoms:**
- Thumbnails not loading
- Image viewer shows error

**Solutions:**
1. Check storage service status
2. Verify file permissions
3. Check image file integrity
4. Regenerate thumbnails
5. Contact system administrator

#### Issue: Statistics Not Updating

**Symptoms:**
- Old data displayed
- Counts incorrect

**Solutions:**
1. Refresh page
2. Clear browser cache
3. Check background jobs running
4. Verify database connectivity
5. Run manual statistics update

### Getting Help

**Support Channels:**

1. **System Administrator**
   - Technical issues
   - Server problems
   - Database issues

2. **User Documentation**
   - Feature guides
   - How-to articles
   - Video tutorials

3. **Support Email**
   - General questions
   - Feature requests
   - Bug reports

### Best Practices

**For Smooth Operations:**

1. **Regular Maintenance**
   - Review pending users daily
   - Monitor expiring licenses weekly
   - Check storage capacity monthly
   - Review audit logs regularly

2. **Proactive Management**
   - Extend licenses before expiration
   - Increase quotas before limits reached
   - Approve users promptly
   - Respond to alerts quickly

3. **Security**
   - Use strong passwords
   - Review user access regularly
   - Monitor for suspicious activity
   - Keep audit trails
   - Backup data regularly

4. **Communication**
   - Notify users of license changes
   - Inform about system maintenance
   - Provide clear instructions
   - Respond to user questions

---

## 📞 Quick Reference

### Common Tasks Quick Guide

| Task | Steps |
|------|-------|
| Create License | License Management → + Create License → Fill form → Create |
| Approve User | User Management → Find user → Approve |
| Reset Password | User Management → Find user → Reset Password |
| Extend License | License Management → Edit → Extend License |
| Increase Quota | License Management → Edit → Update Quota |
| View Statistics | Statistics Tab → View metrics |
| Export Data | Statistics → Export → Choose format |
| Revoke License | License Management → Revoke → Enter reason |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+F | Search/Filter |
| Esc | Close modal |
| Enter | Confirm action |
| Tab | Navigate fields |

### Status Indicators

| Status | Meaning | Action Required |
|--------|---------|-----------------|
| 🟢 Active | License is valid | None |
| 🟡 Expiring Soon | < 30 days left | Consider extending |
| 🔴 Expired | License expired | Extend or revoke |
| ⚫ Revoked | License terminated | No action possible |
| 🔵 Pending | Awaiting approval | Approve or reject |

---

## 📝 Appendix

### Supported File Formats

**Images:**
- DICOM (.dcm, .dicom)
- JPEG (.jpg, .jpeg)
- PNG (.png)
- TIFF (.tiff, .tif)
- AAN (.aan)
- ZIP archives (.zip)

**Export Formats:**
- JSON (annotations)
- CSV (statistics)
- PDF (reports)
- LabelMe JSON (AI training)
- COCO JSON (object detection)
- YOLO TXT (YOLO format)

### System Limits

- **Max File Size**: 100 MB per file
- **Max Upload Batch**: 50 files
- **Max License Duration**: 1095 days (3 years)
- **Max Upload Quota**: 100,000 images
- **Max Users per License**: Unlimited

### Glossary

- **Ambulance License**: Authorization for an ambulance to use the system
- **License Key**: Unique identifier for a license (format: AMB-XXXX-XXXX-XXXX-XXXX)
- **Upload Quota**: Maximum number of images allowed
- **Super Admin**: Administrator with full system access
- **Annotation**: Marked region on an image with associated findings
- **Finding**: Medical observation or diagnosis marked on an image
- **Audit Trail**: Log of all system changes and actions

---

## 🎯 Summary

This manual covers all major features of the Mammogram Viewer & Annotation System for Super Admins:

✅ **License Management**: Create, edit, extend, and revoke ambulance licenses
✅ **User Management**: Approve, assign, and manage ambulance users  
✅ **Image Operations**: Upload, download, and manage medical images
✅ **Annotation Tools**: Create and export image annotations
✅ **Password Management**: Change and reset user passwords
✅ **Statistics**: Monitor system usage and generate reports
✅ **Templates**: Streamline license creation with templates
✅ **Monitoring**: Track system health and performance

For additional support or questions, contact your system administrator.

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**System**: Mammogram Viewer & Annotation Platform
