# 🔧 Troubleshooting Guide
## Common Issues and Solutions

---

## Overview

This guide helps you solve common problems you might encounter while using the Mammogram Viewer & Annotation System. Find quick solutions to get back to work.

---

## 🚨 Quick Problem Solver

### Can't Login?
→ See [Login Issues](#login-issues)

### Can't Upload Images?
→ See [Upload Issues](#upload-issues)

### Images Not Showing?
→ See [Image Display Issues](#image-display-issues)

### Annotations Not Working?
→ See [Annotation Issues](#annotation-issues)

### Download Problems?
→ See [Download Issues](#download-issues)

### License Problems?
→ See [License Issues](#license-issues)

---

## 🔐 Login Issues

### Issue: Forgot Password

**Problem:** Cannot remember password

**Solutions:**

1. **Use Forgot Password Feature**
   - Click **"Forgot Password?"** on login page
   - Enter your email address
   - Check email for reset link
   - Follow instructions to reset

2. **Contact Administrator**
   - If no reset email received
   - Email or call your admin
   - Verify your identity
   - Admin will reset password

**Prevention:**
- Use password manager
- Write down password securely
- Change password regularly

### Issue: Account Locked

**Problem:**
```
⚠ Account Locked
Too many failed login attempts
```

**Cause:** Multiple incorrect password attempts

**Solutions:**

1. **Wait 30 Minutes**
   - Account auto-unlocks after 30 minutes
   - Try again after waiting

2. **Contact Administrator**
   - For immediate unlock
   - Verify your identity
   - Admin unlocks account

**Prevention:**
- Type password carefully
- Check Caps Lock is off
- Use password manager

### Issue: "Invalid Credentials" Error

**Problem:**
```
✗ Login Failed
Invalid email or password
```

**Solutions:**

1. **Check Email Address**
   - Verify spelling
   - Check for extra spaces
   - Use registered email

2. **Check Password**
   - Verify Caps Lock is OFF
   - Check for extra spaces
   - Type slowly and carefully

3. **Try Password Reset**
   - Use "Forgot Password" feature
   - Create new password

4. **Verify Account Status**
   - Contact admin
   - Ensure account is approved
   - Check not deactivated

### Issue: "Account Pending Approval"

**Problem:**
```
⚠ Account Pending
Your account is awaiting approval
```

**Cause:** Admin hasn't approved your registration yet

**Solutions:**

1. **Wait for Approval**
   - Usually within 24-48 hours
   - Check email for updates

2. **Contact Administrator**
   - If waiting more than 48 hours
   - Verify registration received
   - Ask for approval status

**What to Provide:**
- Your registered email
- Registration date
- License key used

---

## 📤 Upload Issues

### Issue: "File Format Not Supported"

**Problem:**
```
✗ Upload Failed
File format not supported
```

**Cause:** File type not allowed

**Solutions:**

1. **Check File Extension**
   ```
   Supported Formats:
   ✓ .dcm, .dicom (DICOM)
   ✓ .jpg, .jpeg (JPEG)
   ✓ .png (PNG)
   ✓ .tiff, .tif (TIFF)
   ✓ .aan (AAN)
   ✓ .zip (ZIP archive)
   ```

2. **Convert File**
   - Use image converter
   - Save in supported format
   - Try upload again

3. **Check File Corruption**
   - Try opening file locally
   - Re-export from source
   - Get new copy if corrupted

### Issue: "File Too Large"

**Problem:**
```
✗ Upload Failed
File size exceeds 100 MB limit
```

**Cause:** File larger than 100 MB

**Solutions:**

1. **Compress Image**
   - Reduce image quality slightly
   - Use image compression tool
   - Keep quality acceptable for medical use

2. **Split Large Files**
   - If multi-page, split into separate files
   - Upload individually

3. **Use ZIP Compression**
   - Compress file into ZIP
   - May reduce size
   - Upload ZIP file

4. **Contact Administrator**
   - For large file support
   - May increase limit for you

### Issue: "Quota Exceeded"

**Problem:**
```
✗ Upload Failed
Upload quota exceeded
```

**Cause:** Reached maximum upload limit

**Solutions:**

1. **Check Quota Status**
   - Go to Dashboard
   - View remaining quota
   - Confirm limit reached

2. **Contact Administrator**
   - Request quota increase
   - Explain usage needs
   - Wait for increase

3. **Delete Old Images** (if allowed)
   - Remove unnecessary images
   - Frees up quota
   - Upload new images

**Prevention:**
- Monitor quota regularly
- Request increase at 80%
- Plan uploads accordingly

### Issue: "License Expired"

**Problem:**
```
✗ Upload Failed
Your license has expired
```

**Cause:** License validity period ended

**Solutions:**

1. **Verify Expiration**
   - Check Dashboard
   - Confirm expiration date

2. **Contact Administrator**
   - Request license renewal
   - Provide license details
   - Wait for renewal

3. **Cannot Upload Until Renewed**
   - Must wait for admin
   - Can still view existing images

### Issue: Upload Stuck at 0%

**Problem:** Upload progress bar doesn't move

**Causes:**
- Internet connection issue
- Browser problem
- Server issue
- File corruption

**Solutions:**

1. **Check Internet Connection**
   - Verify connected to internet
   - Test with other websites
   - Restart router if needed

2. **Refresh Page**
   - Reload the page
   - Try upload again

3. **Try Different Browser**
   - Use Chrome, Firefox, or Edge
   - Clear browser cache first

4. **Try Smaller File**
   - Test with smaller image
   - If works, original file may be corrupted

5. **Check File**
   - Try opening file locally
   - Verify not corrupted
   - Get new copy if needed

### Issue: Upload Fails at 99%

**Problem:** Upload almost complete but fails

**Causes:**
- Server processing error
- File validation failed
- Timeout

**Solutions:**

1. **Try Again**
   - Often works on second attempt
   - Wait a few minutes first

2. **Check File Integrity**
   - Verify file not corrupted
   - Try opening locally

3. **Try Different File**
   - Test if issue is file-specific
   - Or system-wide

4. **Contact Support**
   - If persists
   - Provide error details

---

## 🖼️ Image Display Issues

### Issue: Images Not Loading

**Problem:** Thumbnails or images don't appear

**Solutions:**

1. **Refresh Page**
   - Press F5 or Ctrl+R
   - Or click refresh button

2. **Clear Browser Cache**
   - Chrome: Ctrl+Shift+Delete
   - Select "Cached images and files"
   - Clear and reload

3. **Check Internet Connection**
   - Verify stable connection
   - Test speed if slow

4. **Try Different Browser**
   - Test in Chrome, Firefox, Edge
   - May be browser-specific issue

5. **Wait for Processing**
   - Recently uploaded images may still be processing
   - Thumbnails generate in background
   - Wait 5-10 minutes and refresh

### Issue: Image Viewer Won't Open

**Problem:** Clicking image doesn't open viewer

**Solutions:**

1. **Check Popup Blocker**
   - Disable popup blocker
   - Allow popups for this site
   - Try again

2. **Try Right-Click**
   - Right-click image
   - Select "Open in new tab"

3. **Clear Browser Cache**
   - Clear cache and cookies
   - Reload page

4. **Update Browser**
   - Ensure browser is up to date
   - Update if needed

### Issue: Image Quality Poor

**Problem:** Image appears blurry or pixelated

**Solutions:**

1. **Zoom In**
   - Use zoom controls
   - View at 100% or higher

2. **Check Original File**
   - Verify original image quality
   - Re-upload if original is better

3. **Use DICOM Viewer**
   - For DICOM files
   - Specialized viewer has better quality

4. **Download Original**
   - Download and view locally
   - Use professional viewer

### Issue: DICOM Images Not Displaying Correctly

**Problem:** DICOM files show incorrectly

**Solutions:**

1. **Use DICOM Viewer**
   - Click "Open in DICOM Viewer"
   - Specialized viewer for DICOM

2. **Adjust Window/Level**
   - Use windowing controls
   - Adjust brightness/contrast

3. **Check File Integrity**
   - Verify DICOM file not corrupted
   - Re-export from source

4. **Try Different Viewer**
   - Download and use desktop DICOM viewer
   - RadiAnt, MicroDicom, etc.

---

## 🎨 Annotation Issues

### Issue: Cannot Draw Annotations

**Problem:** Annotation tools not working

**Solutions:**

1. **Select Tool First**
   - Click tool button (Rectangle, Polygon, etc.)
   - Tool should highlight
   - Then draw on image

2. **Check Zoom Level**
   - Zoom to 100-200%
   - Too zoomed in/out may cause issues

3. **Refresh Page**
   - Reload annotation viewer
   - Try again

4. **Try Different Tool**
   - Test if all tools affected
   - Or just one tool

5. **Clear Browser Cache**
   - Clear cache
   - Reload page

### Issue: Annotations Not Saving

**Problem:** Annotations disappear after saving

**Solutions:**

1. **Check Internet Connection**
   - Verify stable connection
   - Annotations need connection to save

2. **Wait for Save Confirmation**
   ```
   Look for:
   ✓ All changes saved
   
   Not:
   ⟳ Saving...
   ```

3. **Manual Save**
   - Click "Save" button
   - Or press Ctrl+S
   - Wait for confirmation

4. **Check Browser Console**
   - Press F12
   - Look for errors
   - Report to admin

5. **Try Different Browser**
   - Test in another browser
   - May be browser-specific

### Issue: Cannot Delete Annotation

**Problem:** Delete button not working

**Solutions:**

1. **Select Annotation First**
   - Click on annotation
   - Should highlight
   - Then press Delete key

2. **Use Delete Button**
   - Click annotation
   - Click "Delete" button in toolbar
   - Confirm deletion

3. **Try Keyboard Shortcut**
   - Select annotation
   - Press Delete key

4. **Refresh Page**
   - Reload viewer
   - Try again

### Issue: Polygon Won't Close

**Problem:** Cannot complete polygon drawing

**Solutions:**

1. **Double-Click to Complete**
   - Double-click on last point
   - Polygon closes automatically

2. **Click First Point**
   - Click on the first point you created
   - Closes the polygon

3. **Add More Points**
   - Need at least 3 points
   - Add more if needed

4. **Press Escape and Restart**
   - Press Esc key
   - Start drawing again

### Issue: Annotations Not Visible

**Problem:** Cannot see annotations on image

**Solutions:**

1. **Check Visibility Toggle**
   - Click "Show Annotations" button
   - May be hidden

2. **Adjust Opacity**
   - Use opacity slider
   - Increase to 50-100%

3. **Check Color**
   - Annotation color may match image
   - Change annotation color

4. **Zoom Level**
   - Zoom in to see better
   - Annotations may be small

---

## 📥 Download Issues

### Issue: Download Button Not Working

**Problem:** Clicking download does nothing

**Solutions:**

1. **Check Popup Blocker**
   - Disable popup blocker
   - Allow downloads for this site

2. **Try Right-Click**
   - Right-click download button
   - Select "Save link as"

3. **Check Browser Settings**
   - Verify downloads enabled
   - Check download location set

4. **Try Different Browser**
   - Test in another browser

### Issue: Downloaded File Won't Open

**Problem:** File downloads but won't open

**Solutions:**

1. **Check File Extension**
   - Verify correct extension
   - .dcm needs DICOM viewer
   - .jpg/.png need image viewer

2. **Use Appropriate Software**
   - DICOM files: RadiAnt, MicroDicom
   - Images: Windows Photos, Preview
   - ZIP: WinZip, 7-Zip

3. **Verify Download Complete**
   - Check file size
   - Re-download if incomplete

4. **Check File Corruption**
   - Try downloading again
   - Use different browser

### Issue: ZIP File Won't Extract

**Problem:** Cannot extract ZIP archive

**Solutions:**

1. **Use Extraction Software**
   - Windows: Built-in or 7-Zip
   - Mac: Built-in or The Unarchiver
   - Linux: unzip command

2. **Check Disk Space**
   - Ensure enough space
   - Free up space if needed

3. **Verify ZIP Complete**
   - Check file size
   - Re-download if incomplete

4. **Try Different Tool**
   - Use 7-Zip or WinRAR
   - May handle better

---

## 📜 License Issues

### Issue: License Shows Expired

**Problem:**
```
✗ License Expired
Contact administrator
```

**Solutions:**

1. **Verify Expiration Date**
   - Check Dashboard
   - Confirm actually expired

2. **Contact Administrator**
   - Request renewal
   - Provide license details

3. **Wait for Renewal**
   - Cannot upload until renewed
   - Can still view images

### Issue: Quota Shows Exceeded

**Problem:**
```
✗ Quota Exceeded
Cannot upload more images
```

**Solutions:**

1. **Verify Quota**
   - Check Dashboard
   - Confirm limit reached

2. **Contact Administrator**
   - Request quota increase
   - Explain needs

3. **Wait for Increase**
   - Cannot upload until increased
   - Monitor for update

---

## 🌐 Browser Issues

### Recommended Browsers

**Best Performance:**
- Google Chrome (latest version)
- Mozilla Firefox (latest version)
- Microsoft Edge (latest version)
- Safari (latest version)

**Not Recommended:**
- Internet Explorer (outdated)
- Very old browser versions

### Clear Browser Cache

**Chrome:**
1. Press Ctrl+Shift+Delete
2. Select "All time"
3. Check "Cached images and files"
4. Click "Clear data"

**Firefox:**
1. Press Ctrl+Shift+Delete
2. Select "Everything"
3. Check "Cache"
4. Click "Clear Now"

**Edge:**
1. Press Ctrl+Shift+Delete
2. Select "All time"
3. Check "Cached images and files"
4. Click "Clear now"

**Safari:**
1. Safari menu → Preferences
2. Advanced tab
3. Check "Show Develop menu"
4. Develop → Empty Caches

### Update Browser

**Chrome:**
1. Click three dots (top-right)
2. Help → About Google Chrome
3. Updates automatically

**Firefox:**
1. Click three lines (top-right)
2. Help → About Firefox
3. Updates automatically

**Edge:**
1. Click three dots (top-right)
2. Help and feedback → About Microsoft Edge
3. Updates automatically

---

## 🔌 Connection Issues

### Check Internet Connection

**Test Connection:**
1. Open other websites
2. Check WiFi/Ethernet connected
3. Test speed at speedtest.net
4. Restart router if needed

**Minimum Requirements:**
- Download speed: 5 Mbps
- Upload speed: 2 Mbps
- Stable connection (no drops)

### Slow Performance

**Solutions:**

1. **Check Internet Speed**
   - Test at speedtest.net
   - Contact ISP if slow

2. **Close Other Applications**
   - Close unnecessary programs
   - Free up bandwidth

3. **Use Wired Connection**
   - Ethernet more stable than WiFi
   - Better for large uploads

4. **Try Different Time**
   - Network may be congested
   - Try off-peak hours

---

## 🆘 When to Contact Support

### Contact Administrator If:

- Account locked for over 30 minutes
- License expired or revoked
- Quota exceeded
- Cannot login after password reset
- Need account approval
- Need password reset
- Technical issues persist

### What to Provide:

```
Support Request Template:

Subject: [Brief description of issue]

Details:
- Your Name: [name]
- Email: [email]
- License Key: AMB-XXXX-****-****
- Issue: [detailed description]
- When it started: [date/time]
- What you tried: [solutions attempted]
- Browser: [Chrome/Firefox/etc.]
- Operating System: [Windows/Mac/Linux]
- Error messages: [exact text]
- Screenshots: [attach if possible]
```

### Administrator Contact

**Contact Information:**
- Email: [admin email]
- Phone: [admin phone]
- Hours: [support hours]
- Response time: [expected time]

---

## 📋 Troubleshooting Checklist

Before contacting support, try:

- [ ] Refresh the page (F5)
- [ ] Clear browser cache
- [ ] Try different browser
- [ ] Check internet connection
- [ ] Restart computer
- [ ] Check license status
- [ ] Check quota remaining
- [ ] Verify file format/size
- [ ] Read error message carefully
- [ ] Check this guide for solution

---

## 📞 Quick Reference

| Problem | Quick Fix |
|---------|-----------|
| Can't login | Check password, Caps Lock |
| Can't upload | Check quota, license status |
| Images not showing | Refresh page, clear cache |
| Annotations not working | Select tool first, refresh |
| Download fails | Check popup blocker |
| Slow performance | Check internet speed |

---

**Need More Help?**

If this guide doesn't solve your problem, contact your system administrator with detailed information about the issue.

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**For**: Ambulance Users (Clients)
