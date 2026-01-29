# Upload Flow Analysis - DICOM Metadata Feature

## Complete Upload Flow

### Phase 1: File Selection & Metadata Extraction

#### Frontend (UploadSection.tsx)
```
User Action: Select/Drop Files
    ↓
handleFileSelect() or handleDrop()
    ↓
setSelectedFiles(filesArray)
    ↓
extractDicomMetadata(filesArray[0])  ← Extract from FIRST file only
    ↓
setIsExtractingMetadata(true)  ← Show loading spinner
    ↓
API Call: POST /api/upload/extract-metadata
    ↓
Backend Processing...
```

#### Backend (upload.routes.ts)
```
POST /api/upload/extract-metadata
    ↓
Receive file buffer
    ↓
dicomMetadataService.isDicomFile(buffer)
    ↓
If DICOM:
    ↓
    dicomMetadataService.extractMetadata(buffer)
        ↓
        Parse DICOM tags (17+ fields)
        Format dates/times
        Return metadata object
    ↓
    Response: { isDicom: true, metadata: {...} }
    
If NOT DICOM:
    ↓
    Response: { isDicom: false, metadata: null }
```

#### Frontend (continued)
```
Receive response
    ↓
If isDicom:
    ↓
    setDicomMetadata(metadata)
    setHasDicomFiles(true)
    ↓
    If useDicomMetadata === true:
        ↓
        Auto-fill all form fields:
        - setPatientName(metadata.patientName)
        - setPatientId(metadata.patientId)
        - setPatientBirthDate(metadata.patientBirthDate)
        - setPatientSex(metadata.patientSex)
        - setPatientAge(metadata.patientAge)
        - setStudyDate(metadata.studyDate)
        - setStudyDescription(metadata.studyDescription)
        - setModality(metadata.modality)
        - setInstitutionName(metadata.institutionName)
    ↓
    Show toggle switch
    Disable form fields
    
If NOT isDicom:
    ↓
    setHasDicomFiles(false)
    setDicomMetadata(null)
    ↓
    No toggle switch
    Fields remain editable
    
setIsExtractingMetadata(false)  ← Hide loading spinner
```

### Phase 2: User Interaction (Optional)

#### Toggle Switch Behavior
```
User clicks toggle switch
    ↓
setUseDicomMetadata(!useDicomMetadata)
    ↓
If switching TO DICOM mode (true):
    ↓
    Restore all fields from dicomMetadata
    Disable all fields
    
If switching TO MANUAL mode (false):
    ↓
    Keep current field values
    Enable all fields for editing
```

### Phase 3: Upload Initiation

#### Frontend Validation
```
User clicks "Upload" button
    ↓
handleStartUpload()
    ↓
Validation checks:
    ✓ patientName OR patientId must be filled
    ✓ expectedImageCount must be set
    ✓ selectedFiles.length > 0
    ✓ selectedFiles.length === expectedImageCount
    ↓
If validation fails:
    ↓
    setError(message)
    STOP
    
If validation passes:
    ↓
    Continue to upload...
```

#### Upload Loop
```
for each file in selectedFiles:
    ↓
    uploadFile(file)
        ↓
        Create upload progress entry
        setUploadQueue([...prev, newUpload])
        ↓
        Build FormData:
            - file (binary)
            - patientName
            - patientId
            - patientBirthDate
            - patientSex
            - patientAge
            - studyDate
            - studyDescription
            - modality
            - institutionName
            - metadataSource ('dicom' or 'manual')
        ↓
        API Call: POST /api/upload
        ↓
        Track progress with onUploadProgress
        ↓
        Update upload queue status
```

### Phase 4: Backend Processing

#### Upload Endpoint (upload.routes.ts)
```
POST /api/upload
    ↓
authMiddleware (verify user)
    ↓
multer.single('file') (parse multipart)
    ↓
Extract all form fields:
    - patientName, patientId
    - patientBirthDate, patientSex, patientAge
    - studyDate, studyDescription
    - modality, institutionName
    - metadataSource
    ↓
Validate file exists
    ↓
fileValidationService.validateFile()
    ↓
Generate imageId (UUID)
    ↓
Determine file format and extension
    ↓
Create patient folder name:
    patientFolder = patientName || patientId || 'unknown'
    ↓
storageService.saveFile()
    ↓
    Save to: uploads/{userId}/{patientFolder}/{imageId}.{ext}
    ↓
imageRepository.create()
    ↓
    INSERT INTO images (...)
    ↓
If patientName OR patientId exists:
    ↓
    INSERT INTO image_metadata (
        image_id,
        patient_name,
        patient_id,
        patient_birth_date,
        patient_sex,
        patient_age,
        study_date,
        study_description,
        modality,
        institution_name,
        metadata_source  ← 'dicom' or 'manual'
    )
    ↓
Async: Generate thumbnail
    ↓
    storageService.generateThumbnail()
    ↓
    imageRepository.updateThumbnailPath()
    ↓
Response: { success: true, data: { id, filename, ... } }
```

### Phase 5: Completion

#### Frontend Cleanup
```
All uploads complete
    ↓
setSuccess(message)
    ↓
Clear all form fields:
    - setSelectedFiles([])
    - setPatientName('')
    - setPatientId('')
    - setPatientBirthDate('')
    - setPatientSex('')
    - setPatientAge('')
    - setStudyDate('')
    - setStudyDescription('')
    - setModality('')
    - setInstitutionName('')
    - setExpectedImageCount('')
    - setDicomMetadata(null)
    - setHasDicomFiles(false)
    ↓
onUploadComplete()  ← Trigger parent refresh
```

## Key Flow Points

### 1. Metadata Extraction Timing
- **When**: Immediately after file selection
- **What**: First file only (assumes all files in batch are for same patient)
- **Why**: Provides instant feedback and auto-fill before upload

### 2. Toggle Switch Logic
- **Appears**: Only when DICOM files detected
- **Default**: DICOM mode (useDicomMetadata = true)
- **Effect**: Controls field editability and data source

### 3. Field Disable Logic
```javascript
disabled={useDicomMetadata && hasDicomFiles}
```
- Fields disabled ONLY when:
  - Toggle is in DICOM mode (useDicomMetadata = true)
  - AND DICOM files were detected (hasDicomFiles = true)

### 4. Metadata Source Tracking
```javascript
metadataSource: useDicomMetadata && hasDicomFiles ? 'dicom' : 'manual'
```
- 'dicom': Toggle in DICOM mode AND DICOM files detected
- 'manual': Toggle in manual mode OR non-DICOM files

### 5. Multiple File Handling
- Metadata extracted from **first file only**
- All files in batch use **same patient information**
- Validation ensures file count matches expected count

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER SELECTS FILES                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              EXTRACT METADATA (First File)                   │
│  POST /api/upload/extract-metadata                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                ┌────────┴────────┐
                │                 │
                ▼                 ▼
         ┌──────────┐      ┌──────────┐
         │  DICOM   │      │ NON-DICOM│
         │  FOUND   │      │   FILE   │
         └─────┬────┘      └─────┬────┘
               │                 │
               ▼                 ▼
    ┌──────────────────┐  ┌──────────────┐
    │ Auto-fill fields │  │ Manual entry │
    │ Show toggle      │  │ No toggle    │
    │ Disable fields   │  │ Enable fields│
    └─────┬────────────┘  └──────┬───────┘
          │                      │
          └──────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  USER FILLS REMAINING │
         │  FIELDS & CLICKS      │
         │  UPLOAD               │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  VALIDATION           │
         │  - Patient info       │
         │  - File count         │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  FOR EACH FILE:       │
         │  POST /api/upload     │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  BACKEND PROCESSING   │
         │  - Validate file      │
         │  - Save to storage    │
         │  - Create DB record   │
         │  - Save metadata      │
         │  - Generate thumbnail │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  SUCCESS RESPONSE     │
         │  - Clear form         │
         │  - Refresh gallery    │
         └───────────────────────┘
```

## Database Schema

### images table
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- original_filename
- file_format
- file_size
- storage_path
- thumbnail_path
- uploaded_at
```

### image_metadata table
```sql
- id (UUID, PK)
- image_id (UUID, FK → images.id)
- patient_name
- patient_id
- patient_birth_date
- patient_sex
- patient_age
- study_date
- study_time
- study_description
- study_instance_uid
- series_description
- series_number
- modality
- institution_name
- referring_physician
- image_type
- acquisition_date
- acquisition_time
- metadata_source ('dicom' or 'manual')  ← KEY FIELD
- created_at
- updated_at
```

## Error Handling

### Frontend Errors
1. **No patient info**: "Please enter either Patient Name or Patient ID"
2. **No image count**: "Please specify the number of images to upload"
3. **No files**: "Please select at least one file"
4. **Count mismatch**: "Please select exactly X images. Currently selected: Y"
5. **Upload failure**: Display error from backend response

### Backend Errors
1. **No file**: 400 - "No file provided"
2. **Invalid file**: 400 - "Invalid file"
3. **Upload error**: 500 - Error message
4. **Metadata extraction error**: 500 - "Failed to extract metadata"

## Performance Considerations

1. **Metadata extraction**: Happens client-side before upload (no delay)
2. **Thumbnail generation**: Async, doesn't block upload response
3. **Multiple files**: Sequential upload (could be parallelized)
4. **Progress tracking**: Real-time updates via onUploadProgress

## Security Considerations

1. **Authentication**: authMiddleware on all endpoints
2. **File validation**: fileValidationService checks file type
3. **SQL injection**: Parameterized queries
4. **File size limit**: 100MB per file (multer config)
5. **User isolation**: Files saved in user-specific folders

## Testing Checklist

- [ ] DICOM file auto-fills metadata
- [ ] Non-DICOM file shows manual entry
- [ ] Toggle switch appears for DICOM files
- [ ] Toggle switch works correctly
- [ ] Fields disable/enable properly
- [ ] Validation works for all cases
- [ ] Multiple files upload correctly
- [ ] Metadata saves to database
- [ ] metadata_source tracks correctly
- [ ] Thumbnails generate
- [ ] Error handling works
- [ ] Form clears after upload
- [ ] Gallery refreshes after upload
