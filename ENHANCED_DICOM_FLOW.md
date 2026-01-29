# Enhanced DICOM Metadata Flow

## Overview
Enhanced upload flow with user prompts for DICOM metadata usage and multi-patient detection.

## New User Experience

### Scenario 1: Single Patient DICOM Files
```
User selects 4 DICOM files (all same patient)
    ↓
System extracts metadata from all files
    ↓
System detects all files are for same patient
    ↓
PROMPT APPEARS:
┌─────────────────────────────────────────────┐
│ 🔵 DICOM Metadata Detected                 │
│                                             │
│ We found patient information in your        │
│ DICOM file(s). Would you like to use       │
│ this data?                                  │
│                                             │
│ Patient Name: John Doe                     │
│ Patient ID: 12345                          │
│ Sex: M                                     │
│ Age: 45Y                                   │
│ Modality: MG                               │
│ Study Date: 2024-12-04                     │
│                                             │
│ [Use DICOM Data] [Enter Manually]         │
└─────────────────────────────────────────────┘
    ↓
User clicks "Use DICOM Data"
    ↓
All fields auto-filled and disabled
Form shows: "Using DICOM Data" badge
    ↓
User sets expected image count and uploads
```

### Scenario 2: Multiple Different Patients
```
User selects 4 DICOM files (2 different patients)
    ↓
System extracts metadata from all files
    ↓
System detects 2 different patients
    ↓
ALERT APPEARS:
┌─────────────────────────────────────────────┐
│ ⚠️  Multiple Patients Detected              │
│                                             │
│ Your selected files contain data for 2      │
│ different patients. Please select which     │
│ patient's data to use:                      │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ John Doe  ID: 12345                 │ → │
│ │ Sex: M  Age: 45Y  Modality: MG      │   │
│ │ From: file1.dcm                     │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ Jane Smith  ID: 67890               │ → │
│ │ Sex: F  Age: 38Y  Modality: MG      │   │
│ │ From: file3.dcm                     │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ [Cancel - Enter Manually]                  │
└─────────────────────────────────────────────┘
    ↓
User clicks on one patient
    ↓
Selected patient's data auto-fills form
Fields disabled, "Using DICOM Data" badge shown
    ↓
User proceeds with upload
```

### Scenario 3: Non-DICOM Files
```
User selects 4 JPG files
    ↓
System checks all files
    ↓
No DICOM files detected
    ↓
No prompts shown
All fields remain empty and editable
    ↓
User manually enters patient information
    ↓
User proceeds with upload
```

### Scenario 4: Mixed Files (DICOM + Non-DICOM)
```
User selects 2 DICOM + 2 JPG files
    ↓
System extracts metadata from DICOM files only
    ↓
DICOM prompt appears (as in Scenario 1 or 2)
    ↓
User chooses to use DICOM data or manual entry
    ↓
All 4 files will use the same patient information
```

## Key Features

### 1. Automatic Metadata Extraction
- Extracts metadata from **ALL** selected files (not just first)
- Runs in parallel for better performance
- Shows loading indicator during extraction

### 2. Smart Patient Detection
```javascript
// Groups files by patient using name + ID combination
const patientKey = `${patientName}_${patientId}`;

// Detects unique patients
if (uniquePatients.length === 1) {
  // Show simple prompt
} else if (uniquePatients.length > 1) {
  // Show patient selector
}
```

### 3. User Prompts

#### DICOM Prompt (Single Patient)
- **Trigger**: DICOM files detected, all same patient
- **Shows**: Patient metadata preview
- **Options**: 
  - "Use DICOM Data" → Auto-fill and disable fields
  - "Enter Manually" → Keep fields editable

#### Patient Selector (Multiple Patients)
- **Trigger**: DICOM files detected, different patients
- **Shows**: List of unique patients with metadata
- **Options**:
  - Click patient card → Use that patient's data
  - "Cancel - Enter Manually" → Manual entry mode

### 4. Field Behavior
```javascript
// Fields disabled when using DICOM data
disabled={useDicomMetadata}

// Badge shown when using DICOM
{useDicomMetadata && hasDicomFiles && (
  <span>Using DICOM Data</span>
)}
```

## Implementation Details

### State Management
```typescript
const [useDicomMetadata, setUseDicomMetadata] = useState(false);
const [dicomMetadata, setDicomMetadata] = useState<DicomMetadata | null>(null);
const [hasDicomFiles, setHasDicomFiles] = useState(false);
const [showDicomPrompt, setShowDicomPrompt] = useState(false);
const [showPatientSelector, setShowPatientSelector] = useState(false);
const [uniquePatients, setUniquePatients] = useState<DicomMetadata[]>([]);
```

### Metadata Extraction Flow
```typescript
extractAllDicomMetadata(files: File[]) {
  // Extract from all files in parallel
  const metadataPromises = files.map(file => extractDicomMetadata(file));
  const allMetadata = await Promise.all(metadataPromises);
  
  // Filter DICOM files
  const dicomMetadataList = allMetadata.filter(m => m !== null);
  
  if (dicomMetadataList.length === 0) {
    // No DICOM files
    return;
  }
  
  // Detect unique patients
  const uniquePatientsMap = new Map();
  dicomMetadataList.forEach(metadata => {
    const key = `${metadata.patientName}_${metadata.patientId}`;
    if (!uniquePatientsMap.has(key)) {
      uniquePatientsMap.set(key, metadata);
    }
  });
  
  const uniquePatientsList = Array.from(uniquePatientsMap.values());
  
  if (uniquePatientsList.length > 1) {
    // Multiple patients - show selector
    setUniquePatients(uniquePatientsList);
    setShowPatientSelector(true);
  } else {
    // Single patient - show prompt
    setDicomMetadata(dicomMetadataList[0]);
    setShowDicomPrompt(true);
  }
}
```

### User Actions
```typescript
// User chooses to use DICOM data
handleUseDicomData() {
  setUseDicomMetadata(true);
  applyDicomMetadata(dicomMetadata);
  setShowDicomPrompt(false);
}

// User chooses manual entry
handleUseManualEntry() {
  setUseDicomMetadata(false);
  setShowDicomPrompt(false);
}

// User selects a patient from multiple
handleSelectPatient(metadata: DicomMetadata) {
  setDicomMetadata(metadata);
  setUseDicomMetadata(true);
  applyDicomMetadata(metadata);
  setShowPatientSelector(false);
}

// User cancels patient selection
handleCancelPatientSelection() {
  setUseDicomMetadata(false);
  setShowPatientSelector(false);
}
```

## UI Components

### DICOM Prompt Dialog
```tsx
<div className="bg-blue-900/20 border border-blue-500/50">
  <h3>DICOM Metadata Detected</h3>
  <p>We found patient information...</p>
  
  {/* Metadata Preview */}
  <div className="metadata-preview">
    <div>Patient Name: {patientName}</div>
    <div>Patient ID: {patientId}</div>
    ...
  </div>
  
  {/* Action Buttons */}
  <button onClick={handleUseDicomData}>Use DICOM Data</button>
  <button onClick={handleUseManualEntry}>Enter Manually</button>
</div>
```

### Patient Selector Dialog
```tsx
<div className="bg-yellow-900/20 border border-yellow-500/50">
  <h3>Multiple Patients Detected</h3>
  <p>Your selected files contain data for {count} different patients...</p>
  
  {/* Patient Cards */}
  {uniquePatients.map(patient => (
    <button onClick={() => handleSelectPatient(patient)}>
      <div>{patient.patientName} ID: {patient.patientId}</div>
      <div>Sex: {sex} Age: {age} Modality: {modality}</div>
      <div>From: {fileName}</div>
    </button>
  ))}
  
  {/* Cancel Button */}
  <button onClick={handleCancelPatientSelection}>
    Cancel - Enter Manually
  </button>
</div>
```

## Benefits

### 1. User Control
- User explicitly chooses whether to use DICOM data
- No automatic assumptions
- Clear feedback on what data will be used

### 2. Multi-Patient Safety
- Prevents accidental mixing of patient data
- Forces user to choose when ambiguity exists
- Shows which file each patient came from

### 3. Flexibility
- Works with DICOM, non-DICOM, or mixed files
- User can always choose manual entry
- Clear visual indication of data source

### 4. Better UX
- Prompts appear at the right time (after file selection)
- Clear, actionable choices
- Preview of data before accepting
- No hidden auto-fill behavior

## Testing Scenarios

### Test 1: Single Patient DICOM
- [ ] Select 4 DICOM files (same patient)
- [ ] Verify prompt appears with correct data
- [ ] Click "Use DICOM Data"
- [ ] Verify fields auto-fill and disable
- [ ] Verify "Using DICOM Data" badge appears
- [ ] Complete upload successfully

### Test 2: Multiple Patients
- [ ] Select DICOM files from 2 different patients
- [ ] Verify alert appears with patient list
- [ ] Verify each patient shows correct metadata
- [ ] Click on first patient
- [ ] Verify that patient's data fills form
- [ ] Complete upload successfully

### Test 3: Manual Entry Choice
- [ ] Select DICOM files
- [ ] Click "Enter Manually" on prompt
- [ ] Verify fields remain editable
- [ ] Manually edit patient information
- [ ] Complete upload successfully

### Test 4: Non-DICOM Files
- [ ] Select JPG/PNG files
- [ ] Verify no prompts appear
- [ ] Verify fields are editable
- [ ] Enter patient information manually
- [ ] Complete upload successfully

### Test 5: Mixed Files
- [ ] Select 2 DICOM + 2 JPG files
- [ ] Verify DICOM prompt appears
- [ ] Choose to use DICOM data
- [ ] Verify all 4 files upload with same patient info

### Test 6: Cancel Patient Selection
- [ ] Select files with multiple patients
- [ ] Click "Cancel - Enter Manually"
- [ ] Verify fields remain editable
- [ ] Enter data manually
- [ ] Complete upload successfully

## Edge Cases Handled

1. **No patient name or ID in DICOM**: Shows "Unknown" in selector
2. **Partial metadata**: Shows only available fields
3. **Extraction failure**: Treats as non-DICOM file
4. **Network error during extraction**: Shows error, allows manual entry
5. **User changes files after prompt**: Re-extracts and shows new prompt

## Performance Considerations

- Parallel extraction of metadata (Promise.all)
- Only extracts from selected files (not all in directory)
- Extraction happens client-side (no server load)
- Minimal re-renders with proper state management

## Security Considerations

- Metadata extraction happens in user's browser
- No sensitive data sent until user confirms upload
- User explicitly chooses which patient's data to use
- Clear audit trail of data source (DICOM vs manual)
