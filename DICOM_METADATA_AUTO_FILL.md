# DICOM Metadata Auto-Fill Feature

## Overview
Implemented automatic extraction and filling of patient information from DICOM files during upload, with a toggle option to switch between DICOM metadata and manual entry.

## Features Implemented

### 1. Database Schema
**File**: `backend/src/migrations/006_create_image_metadata_table.sql`

Created `image_metadata` table to store comprehensive patient and study information:
- **Patient Information**: name, ID, birth date, sex, age
- **Study Information**: date, time, description, instance UID
- **Series Information**: description, number, modality
- **Institution Information**: name, referring physician
- **Image Information**: type, acquisition date/time
- **Metadata Source**: tracks whether data came from DICOM or manual entry

### 2. DICOM Metadata Extraction Service
**File**: `backend/src/services/DicomMetadataService.ts`

New service that extracts metadata from DICOM files:
- Parses DICOM tags using `dicom-parser`
- Extracts patient demographics (name, ID, birth date, sex, age)
- Extracts study details (date, time, description, modality)
- Extracts institution information
- Formats DICOM dates (YYYYMMDD) to ISO format (YYYY-MM-DD)
- Formats DICOM times (HHMMSS) to standard format (HH:MM:SS)
- Validates DICOM files by checking magic number

### 3. Backend Upload API Enhancement
**File**: `backend/src/routes/upload.routes.ts`

#### New Endpoint: `/api/upload/extract-metadata`
- Accepts a file upload
- Checks if file is DICOM format
- Extracts and returns metadata without saving the file
- Used by frontend to preview metadata before upload

#### Enhanced Upload Endpoint: `/api/upload`
- Now accepts additional metadata fields:
  - `patientBirthDate`, `patientSex`, `patientAge`
  - `studyDate`, `studyDescription`, `modality`
  - `institutionName`, `metadataSource`
- Stores all metadata in `image_metadata` table
- Tracks whether metadata came from DICOM or manual entry

### 4. Frontend Upload Component Enhancement
**File**: `frontend/src/components/UploadSection.tsx`

#### New Features:
1. **Automatic DICOM Detection**
   - When files are selected, automatically extracts DICOM metadata from first file
   - Shows loading indicator during extraction

2. **Toggle Switch**
   - Appears when DICOM files are detected
   - Allows switching between "DICOM Auto-fill" and "Manual Entry"
   - When toggled to DICOM mode, auto-fills all fields from extracted metadata
   - When toggled to manual mode, enables all fields for editing

3. **Expanded Form Fields**
   - Patient Name and ID (existing)
   - Patient Birth Date (date picker)
   - Patient Sex (dropdown: Male/Female/Other)
   - Patient Age (text input)
   - Study Date (date picker)
   - Modality (text input, e.g., MG, CR, DX)
   - Study Description (text input)
   - Institution Name (text input)

4. **Field States**
   - Fields are disabled when DICOM auto-fill is active
   - Visual indication (opacity) shows disabled state
   - Fields become editable when switched to manual mode

5. **Visual Feedback**
   - Loading spinner during metadata extraction
   - Toggle switch shows current mode (DICOM/Manual)
   - Checkmarks indicate filled fields
   - Responsive grid layout for better organization

## Usage Flow

### For DICOM Files:
1. User selects/drops DICOM file(s)
2. System automatically extracts metadata from first file
3. Toggle switch appears showing "DICOM Auto-fill" mode
4. All available metadata fields are auto-filled
5. Fields are disabled to prevent accidental changes
6. User can toggle to "Manual Entry" to edit fields if needed
7. User completes upload with auto-filled data

### For Non-DICOM Files:
1. User selects/drops non-DICOM file(s)
2. No metadata extraction occurs
3. All fields remain in manual entry mode
4. User manually enters patient information
5. User completes upload with manual data

## Technical Details

### DICOM Tags Extracted:
- `(0010,0010)` - Patient Name
- `(0010,0020)` - Patient ID
- `(0010,0030)` - Patient Birth Date
- `(0010,0040)` - Patient Sex
- `(0010,1010)` - Patient Age
- `(0008,0020)` - Study Date
- `(0008,0030)` - Study Time
- `(0008,1030)` - Study Description
- `(0020,000D)` - Study Instance UID
- `(0008,103E)` - Series Description
- `(0020,0011)` - Series Number
- `(0008,0060)` - Modality
- `(0008,0080)` - Institution Name
- `(0008,0090)` - Referring Physician
- `(0008,0008)` - Image Type
- `(0008,0022)` - Acquisition Date
- `(0008,0032)` - Acquisition Time

### Database Indexes:
- `image_id` - for fast lookups
- `patient_name` - for patient searches
- `patient_id` - for patient ID searches
- `study_date` - for date-based queries

### Metadata Source Tracking:
- `dicom` - Data extracted from DICOM file
- `manual` - Data entered manually by user

## Benefits

1. **Time Savings**: Eliminates manual data entry for DICOM files
2. **Accuracy**: Reduces human error in transcription
3. **Flexibility**: Users can still manually edit or enter data when needed
4. **Traceability**: System tracks whether data came from DICOM or manual entry
5. **User Control**: Toggle switch gives users full control over data source
6. **Comprehensive**: Captures extensive patient and study metadata

## Testing

To test the feature:
1. Upload a DICOM file (.dcm)
2. Observe automatic metadata extraction
3. Verify fields are auto-filled and disabled
4. Toggle to manual mode and verify fields become editable
5. Toggle back to DICOM mode and verify fields restore DICOM values
6. Complete upload and verify metadata is saved to database
7. Upload a non-DICOM file and verify manual entry mode works

## Future Enhancements

Potential improvements:
- Support for multi-file DICOM series with consistent metadata
- Metadata validation and conflict resolution
- Bulk metadata editing for multiple images
- Export metadata to CSV/JSON
- Search and filter by metadata fields
- DICOM tag customization for different modalities
