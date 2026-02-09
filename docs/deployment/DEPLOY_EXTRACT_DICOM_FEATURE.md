# Deploy Extract DICOM Data Feature

## Summary
Added "Extract DICOM Data" button that extracts patient metadata from DICOM files and auto-fills the upload form.

## Changes Made

### Backend
1. **upload.routes.ts** - Added `/upload/extract-metadata` endpoint with logging
2. **DicomMetadataService.ts** - Metadata extraction service (already working)
3. **MetadataRepository.ts** - Added new patient fields support
4. **Image.ts** - Updated ImageMetadata interface
5. **DicomViewer.tsx** - Enhanced metadata display panel
6. **Migration 007** - Added patient fields to database

### Frontend
1. **UploadSection.tsx** - Added "Extract DICOM Data" button
2. Auto-fills form with: Patient Name, ID, Birth Date, Sex, Age, Study Date, Modality, Description

## Deployment Steps

### 1. Database Migration
```bash
PGPASSWORD=postgres psql -U postgres -d mammogram_viewer -f backend/src/migrations/007_alter_image_metadata_add_patient_fields.sql
```

### 2. Build Backend
```bash
cd backend
npm run build
```

### 3. Deploy to Production
Copy the built files to your production server and restart the backend service.

### 4. Test
1. Go to https://xraycad.bosschn.in/mammogram
2. Login
3. Go to Dashboard
4. Select a DICOM file (e.g., the test file with patient DURGA DEVI)
5. Click "📋 Extract DICOM Data" button
6. Form should auto-fill with patient data
7. Upload the file
8. View the image - metadata panel shows all patient info

## Test Results (Local)
✅ DICOM metadata extraction working
✅ Extracted data:
- Patient Name: DURGA DEVI
- Patient ID: 005
- Birth Date: 1993-11-18
- Sex: F
- Age: 032Y
- Study Date: 2025-11-18
- Modality: MG
- Study Description: Screening Mammography

## Files Changed
- backend/src/routes/upload.routes.ts
- backend/src/repositories/MetadataRepository.ts
- backend/src/models/Image.ts
- backend/src/migrations/007_alter_image_metadata_add_patient_fields.sql
- frontend/src/components/UploadSection.tsx
- frontend/src/components/DicomViewer.tsx

## Notes
- The `/upload/extract-metadata` endpoint requires authentication
- Backend must be restarted after deployment
- Database migration must be run before deploying backend
