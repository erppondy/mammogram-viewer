# 🔍 Multiple File Selection Debug Guide

## 🐛 **Issue Reported**
User cannot select multiple files at the same time in the file dialog.

## ✅ **Verification Steps**

### **1. Check File Input Configuration**
The file input element should have these attributes:
```html
<input
  type="file"
  multiple          ← This enables multiple selection
  accept=".dcm,.dicom,.aan,.jpg,.jpeg,.png,.tiff,.zip"
  onChange={handleFileSelect}
/>
```

### **2. Browser File Dialog Behavior**
When clicking "Select Files", the file dialog should:
- ✅ Allow Ctrl+Click (Windows/Linux) or Cmd+Click (Mac) for multiple selection
- ✅ Allow Shift+Click for range selection
- ✅ Show "X files selected" in the dialog
- ✅ Have "Open" or "Choose" button enabled for multiple files

### **3. Debug Information Added**
I've added debug info to help identify the issue:
```
Debug: Multiple attribute = true | Selected files: X
```

## 🔧 **Troubleshooting Steps**

### **Step 1: Verify Multiple Attribute**
1. Open browser developer tools (F12)
2. Go to Console tab
3. Select files and check console logs:
   ```
   File selection event triggered
   Number of files selected: X
   Files selected: [file1.jpg, file2.jpg, ...]
   ```

### **Step 2: Test File Dialog**
1. Click "Click to select files"
2. In the file dialog:
   - **Windows/Linux**: Hold Ctrl and click multiple files
   - **Mac**: Hold Cmd and click multiple files
   - **Range selection**: Click first file, hold Shift, click last file
3. Check if multiple files appear selected in dialog
4. Click "Open" or "Choose"

### **Step 3: Browser Compatibility**
Different browsers may have different behaviors:

**Chrome/Edge:**
- ✅ Full multiple selection support
- ✅ Ctrl+Click and Shift+Click work
- ✅ Shows file count in dialog

**Firefox:**
- ✅ Multiple selection supported
- ✅ May have slightly different UI
- ✅ Same keyboard shortcuts

**Safari:**
- ✅ Multiple selection supported
- ⚠️ May have different file dialog appearance
- ✅ Cmd+Click for multiple selection

## 🎯 **Common Issues & Solutions**

### **Issue 1: Browser Security Restrictions**
**Symptoms:** File dialog only allows single selection
**Solution:** 
- Check if running in secure context (HTTPS)
- Verify no browser extensions blocking file access
- Try in incognito/private mode

### **Issue 2: File Type Restrictions**
**Symptoms:** Some files can't be selected
**Solution:**
- Check file extensions match accept attribute
- Try with different file types
- Remove accept attribute temporarily for testing

### **Issue 3: JavaScript Errors**
**Symptoms:** File selection doesn't work at all
**Solution:**
- Check browser console for errors
- Verify handleFileSelect function is working
- Check if event handlers are properly attached

### **Issue 4: Operating System Limitations**
**Symptoms:** Multiple selection works differently than expected
**Solution:**
- **Windows**: Use Ctrl+Click for individual files, Shift+Click for range
- **Mac**: Use Cmd+Click for individual files, Shift+Click for range
- **Linux**: Use Ctrl+Click for individual files, Shift+Click for range

## 🧪 **Testing Scenarios**

### **Test 1: Basic Multiple Selection**
1. Click "Select Files"
2. Hold Ctrl (or Cmd on Mac)
3. Click 3-5 different files
4. Click "Open"
5. **Expected**: All selected files should appear in the list

### **Test 2: Range Selection**
1. Click "Select Files"
2. Click first file
3. Hold Shift
4. Click a file further down the list
5. Click "Open"
6. **Expected**: All files in the range should be selected

### **Test 3: Mixed Selection**
1. Click "Select Files"
2. Click first file
3. Hold Ctrl (or Cmd)
4. Click several individual files
5. Hold Shift and click another file (range)
6. Click "Open"
7. **Expected**: All individually selected files + range should be selected

### **Test 4: Large File Count**
1. Navigate to folder with 20+ files
2. Select all files (Ctrl+A or Cmd+A)
3. Click "Open"
4. **Expected**: All files should be processed (may show "Processing..." indicator)

## 🔍 **Debug Console Commands**

Open browser console and run these commands to debug:

```javascript
// Check if file input has multiple attribute
document.getElementById('file-upload').multiple

// Check file input element
document.getElementById('file-upload')

// Manually trigger file selection
document.getElementById('file-upload').click()

// Check current selected files
document.getElementById('file-upload').files.length
```

## 📊 **Expected Console Output**

When selecting multiple files, you should see:
```
File selection event triggered
Number of files selected: 5
Files selected: ["image1.jpg", "image2.jpg", "image3.jpg", "image4.jpg", "image5.jpg"]
Processed files array: 5
Total files after adding: 5
```

## 🚨 **If Multiple Selection Still Doesn't Work**

### **Immediate Workarounds:**
1. **Use Drag & Drop**: Drag multiple files from file explorer directly to the upload area
2. **Use "Add More" Button**: Select files one by one using the "+ Add More" button
3. **Browser Reset**: Clear browser cache and cookies
4. **Different Browser**: Try Chrome, Firefox, or Edge

### **System-Level Checks:**
1. **File Permissions**: Ensure files are not locked or in use
2. **Antivirus**: Check if antivirus is blocking file access
3. **File System**: Verify file system supports multiple file operations
4. **Browser Updates**: Ensure browser is up to date

## 🔧 **Developer Solutions**

If the issue persists, try these code-level fixes:

### **Alternative File Input**
```html
<!-- More explicit multiple attribute -->
<input 
  type="file" 
  multiple="multiple"
  accept="image/*,.dcm,.dicom"
  onChange={handleFileSelect}
/>
```

### **Event Handler Debug**
```javascript
const handleFileSelect = (e) => {
  console.log('Event:', e);
  console.log('Target:', e.target);
  console.log('Files:', e.target.files);
  console.log('Multiple attribute:', e.target.multiple);
  
  // Rest of handler...
};
```

### **Force Multiple Attribute**
```javascript
useEffect(() => {
  if (fileInputRef.current) {
    fileInputRef.current.setAttribute('multiple', 'multiple');
  }
}, []);
```

## 📱 **Mobile Considerations**

On mobile devices:
- **iOS Safari**: Multiple selection may be limited
- **Android Chrome**: Should work normally
- **Mobile File Managers**: May have different selection UI

## 🎯 **Next Steps**

1. **Test with debug info**: Check console logs during file selection
2. **Try different browsers**: Test in Chrome, Firefox, Edge
3. **Test drag & drop**: Verify if drag & drop works for multiple files
4. **Check file types**: Try with different file extensions
5. **Report findings**: Share console output and browser details

The multiple file selection should work in all modern browsers. If it's not working, the debug information will help identify the specific issue.

**Most likely causes:**
1. User not using Ctrl/Cmd+Click for multiple selection
2. Browser security restrictions
3. File type limitations
4. JavaScript errors preventing proper handling

**Quick test**: Try dragging multiple files from your file explorer directly to the upload area - this should work regardless of file dialog issues.