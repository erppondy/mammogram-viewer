# Testing DICOM Metadata Auto-Fill Feature

## Quick Test Guide

### Prerequisites
1. Start the application: `./start-app.sh`
2. Have a DICOM file ready (you have `1.2.840.114257.1.1.3360.20251118.091531.8920812.1.222.dcm`)
3. Have a non-DICOM file ready (e.g., JPG, PNG)

### Test Case 1: DICOM File Auto-Fill
**Expected Behavior**: Metadata automatically extracted and fields auto-filled

1. Navigate to the upload page
2. Select or drag-drop the DICOM file: `1.2.840.114257.1.1.3360.20251118.091531.8920812.1.222.dcm`
3. **Verify**:
   - ✓ "Extracting DICOM metadata..." message appears briefly
   - ✓ Toggle switch appears showing "DICOM Auto-fill"
   - ✓ Patient information fields are auto-filled (if available in DICOM)
   - ✓ Fields are disabled (grayed out)
   - ✓ Checkmarks appear next to filled fields

### Test Case 2: Toggle to Manual Entry
**Expected Behavior**: Fields become editable when toggled

1. With DICOM file selected, click the toggle switch
2. **Verify**:
   - ✓ Toggle shows "Manual Entry"
   - ✓ All fields become enabled (no longer grayed out)
   - ✓ You can edit any field
   - ✓ DICOM-extracted values remain in fields

### Test Case 3: Toggle Back to DICOM
**Expected Behavior**: Fields restore DICOM values and become disabled

1. After editing some fields in manual mode, toggle back to DICOM
2. **Verify**:
   - ✓ Toggle shows "DICOM Auto-fill"
   - ✓ Fields restore original DICOM values (edits are discarded)
   - ✓ Fields become disabled again

### Test Case 4: Non-DICOM File
**Expected Behavior**: Manual entry mode, no auto-fill

1. Select a JPG or PNG file
2. **Verify**:
   - ✓ No "Extracting metadata..." message
   - ✓ No toggle switch appears
   - ✓ All fields remain empty and editable
   - ✓ You can manually enter patient information

### Test Case 5: Complete Upload with DICOM Metadata
**Expected Behavior**: Upload succeeds with metadata saved

1. Select DICOM file
2. Wait for auto-fill
3. Set expected image count to 1
4. Click "Upload 1 file"
5. **Verify**:
   - ✓ Upload completes successfully
   - ✓ Success message shows patient name/ID
   - ✓ Image appears in gallery

### Test Case 6: Complete Upload with Manual Entry
**Expected Behavior**: Upload succeeds with manual data saved

1. Select non-DICOM file (or toggle DICOM to manual)
2. Manually enter:
   - Patient Name: "Test Patient"
   - Patient ID: "TEST001"
   - Other fields (optional)
3. Set expected image count to 1
4. Click "Upload 1 file"
5. **Verify**:
   - ✓ Upload completes successfully
   - ✓ Success message shows entered patient name/ID

### Test Case 7: Multiple Files
**Expected Behavior**: Metadata extracted from first file

1. Select multiple DICOM files
2. **Verify**:
   - ✓ Metadata extracted from first file only
   - ✓ All files will use the same patient information
   - ✓ Expected image count must match selected files

## What to Look For

### Visual Elements
- **Toggle Switch**: Blue when DICOM mode, gray when manual mode
- **Disabled Fields**: Lower opacity, cursor shows "not-allowed"
- **Loading Spinner**: Animated during metadata extraction
- **Checkmarks**: Green ✓ next to filled fields

### Form Fields
- Patient Name
- Patient ID
- Birth Date (date picker)
- Sex (dropdown: Male/Female/Other)
- Age (e.g., "45Y")
- Study Date (date picker)
- Modality (e.g., "MG" for mammogram)
- Study Description
- Institution Name

### Console Logs
Check browser console for:
```
[DicomMetadata] Extracted metadata: { ... }
```

Check backend logs for:
```
[DicomConverter] Step X: ...
Patient Info - Name: ..., ID: ...
```

## Common Issues & Solutions

### Issue: No metadata extracted from DICOM
**Solution**: 
- Check if file is valid DICOM (has "DICM" magic number at offset 128)
- Some DICOM files may not have all tags populated
- Check browser console for errors

### Issue: Toggle doesn't appear
**Solution**:
- Verify file is detected as DICOM
- Check network tab for `/api/upload/extract-metadata` call
- Ensure backend is running

### Issue: Fields not auto-filling
**Solution**:
- Toggle might be in manual mode - switch to DICOM mode
- DICOM file might not have those specific tags
- Check console for extraction errors

### Issue: Upload fails
**Solution**:
- Ensure patient name OR patient ID is filled
- Ensure expected image count matches selected files
- Check backend logs for errors

## Database Verification

After successful upload, verify metadata in database:

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d mammogram_viewer -c "SELECT * FROM image_metadata ORDER BY created_at DESC LIMIT 1;"
```

Should show:
- All filled metadata fields
- `metadata_source` = 'dicom' or 'manual'
- Timestamps

## API Testing (Optional)

Test metadata extraction endpoint directly:

```bash
curl -X POST http://localhost:3000/api/upload/extract-metadata \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@1.2.840.114257.1.1.3360.20251118.091531.8920812.1.222.dcm"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "isDicom": true,
    "metadata": {
      "patientName": "...",
      "patientId": "...",
      ...
    }
  }
}
```

## Success Criteria

✅ DICOM files automatically extract metadata  
✅ Toggle switch allows switching between DICOM and manual modes  
✅ Fields are properly disabled/enabled based on mode  
✅ Manual entry works for non-DICOM files  
✅ Uploads complete successfully with metadata saved  
✅ Database stores metadata with correct source tracking  
✅ UI is responsive and provides clear feedback  

## Next Steps

After testing, you can:
1. Upload real patient DICOM files
2. Verify metadata accuracy
3. Use metadata for searching/filtering images
4. Export metadata along with annotations
