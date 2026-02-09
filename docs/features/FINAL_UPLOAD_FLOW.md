# Final Upload Flow - Step by Step

## Overview
The upload process now follows a clear 3-step workflow that guides users through the process in a logical order.

## Upload Flow

### Step 1: Number of Images
**User Action**: Select how many images they want to upload

**UI**:
```
┌─────────────────────────────────────────┐
│ Step 1: Number of Images                │
│                                         │
│ How many images do you want to upload? │
│ [Dropdown: 1-50 images]                │
│                                         │
│ ✓ Matches selected files (if matched)  │
│ ⚠ Mismatch (if count doesn't match)    │
└─────────────────────────────────────────┘
```

**Purpose**: Sets expectation for how many files should be selected

---

### Step 2: Select Files
**User Action**: Choose files via click or drag-and-drop

**UI**:
```
┌─────────────────────────────────────────┐
│ Step 2: Select Files (X selected)      │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │     📁 Click to select files     │   │
│ │     or drag and drop             │   │
│ │                                  │   │
│ │ DICOM, AAN, JPEG, PNG, TIFF, ZIP│   │
│ └─────────────────────────────────┘   │
│                                         │
│ Selected Files:                         │
│ • file1.dcm (2.5 MB)                   │
│ • file2.dcm (2.3 MB)                   │
│ • file3.dcm (2.4 MB)                   │
│ • file4.dcm (2.6 MB)                   │
│                                         │
│ 🔄 Extracting DICOM metadata...        │
└─────────────────────────────────────────┘
```

**What Happens**:
1. User selects files
2. System immediately extracts DICOM metadata from ALL files
3. Loading indicator shows during extraction
4. System detects if files contain DICOM data

---

### DICOM Prompt (Conditional)
**Trigger**: DICOM files detected after file selection

#### Scenario A: Single Patient Detected
```
┌─────────────────────────────────────────┐
│ 🔵 DICOM Metadata Detected              │
│                                         │
│ We found patient information in your    │
│ DICOM file(s). Would you like to use   │
│ this data?                              │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ Patient Name: John Doe           │   │
│ │ Patient ID: 12345                │   │
│ │ Sex: M                           │   │
│ │ Age: 45Y                         │   │
│ │ Modality: MG                     │   │
│ │ Study Date: 2024-12-04           │   │
│ └─────────────────────────────────┘   │
│                                         │
│ [Use DICOM Data] [Enter Manually]      │
└─────────────────────────────────────────┘
```

**User Options**:
- **Use DICOM Data**: Auto-fills Step 3, fields become disabled
- **Enter Manually**: Proceeds to Step 3 with empty editable fields

#### Scenario B: Multiple Patients Detected
```
┌─────────────────────────────────────────┐
│ ⚠️  Multiple Patients Detected           │
│                                         │
│ Your selected files contain data for 2  │
│ different patients. Please select which │
│ patient's data to use:                  │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ John Doe  ID: 12345             │ → │
│ │ Sex: M  Age: 45Y  Modality: MG  │   │
│ │ From: file1.dcm                 │   │
│ └─────────────────────────────────┘   │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ Jane Smith  ID: 67890           │ → │
│ │ Sex: F  Age: 38Y  Modality: MG  │   │
│ │ From: file3.dcm                 │   │
│ └─────────────────────────────────┘   │
│                                         │
│ [Cancel - Enter Manually]               │
└─────────────────────────────────────────┘
```

**User Options**:
- **Click Patient Card**: Uses that patient's data for Step 3
- **Cancel**: Proceeds to Step 3 with empty editable fields

#### Scenario C: No DICOM Files
- No prompt appears
- Proceeds directly to Step 3 with empty editable fields

---

### Step 3: Patient Information
**User Action**: Review/edit patient information

**UI (DICOM Mode)**:
```
┌─────────────────────────────────────────┐
│ Step 3: Patient Information ✓           │
│                          [Using DICOM Data]│
│                                         │
│ Patient Name: John Doe [disabled]       │
│ Patient ID: 12345 [disabled]            │
│                                         │
│ Birth Date: 1979-05-15 [disabled]       │
│ Sex: M [disabled]                       │
│ Age: 45Y [disabled]                     │
│                                         │
│ Study Date: 2024-12-04 [disabled]       │
│ Modality: MG [disabled]                 │
│                                         │
│ Study Description: ... [disabled]       │
│ Institution Name: ... [disabled]        │
└─────────────────────────────────────────┘
```

**UI (Manual Mode)**:
```
┌─────────────────────────────────────────┐
│ Step 3: Patient Information             │
│                                         │
│ Patient Name: [editable]                │
│ Patient ID: [editable]                  │
│                                         │
│ Birth Date: [editable]                  │
│ Sex: [editable]                         │
│ Age: [editable]                         │
│                                         │
│ Study Date: [editable]                  │
│ Modality: [editable]                    │
│                                         │
│ Study Description: [editable]           │
│ Institution Name: [editable]            │
└─────────────────────────────────────────┘
```

---

### Final Step: Upload
**Validation Checks**:
- ✓ Patient Name OR Patient ID must be filled
- ✓ Expected image count must be set
- ✓ Files must be selected
- ✓ Selected file count must match expected count

**UI**:
```
┌─────────────────────────────────────────┐
│ Validation Messages (if any):           │
│ ⚠ Please enter Patient Name or ID       │
│ ⚠ Please specify the number of images   │
│ ⚠ Selected files (3) must match         │
│   expected count (4)                    │
│                                         │
│ [Upload 4 files] (disabled if invalid)  │
└─────────────────────────────────────────┘
```

**Upload Process**:
1. User clicks "Upload X files" button
2. Each file uploads sequentially with progress bar
3. Success message shows after all files complete
4. Form clears and gallery refreshes

---

## Complete Flow Diagram

```
START
  │
  ▼
┌─────────────────────┐
│ Step 1:             │
│ Select Number       │
│ of Images (1-50)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Step 2:             │
│ Select Files        │
│ (click/drag-drop)   │
└──────────┬──────────┘
           │
           ▼
    Extract DICOM
    Metadata from
    ALL files
           │
           ▼
    ┌──────┴──────┐
    │             │
    ▼             ▼
DICOM Found   No DICOM
    │             │
    ▼             │
Check Patients    │
    │             │
┌───┴───┐         │
│       │         │
▼       ▼         │
Single  Multiple  │
Patient Patients  │
│       │         │
▼       ▼         │
Prompt  Selector  │
│       │         │
└───┬───┘         │
    │             │
    ▼             ▼
User Chooses:
- Use DICOM → Auto-fill
- Manual → Empty fields
    │
    ▼
┌─────────────────────┐
│ Step 3:             │
│ Patient Information │
│ (filled or empty)   │
│ (disabled or edit)  │
└──────────┬──────────┘
           │
           ▼
    Validation
           │
           ▼
    ┌──────┴──────┐
    │             │
    ▼             ▼
  Valid       Invalid
    │             │
    ▼             ▼
  Upload      Show Errors
    │         (stay on form)
    ▼
  Success
    │
    ▼
Clear Form &
Refresh Gallery
    │
    ▼
   END
```

## Key Features

### 1. Clear Step-by-Step Process
- Numbered steps (1, 2, 3) guide the user
- Each step is clearly labeled
- Visual feedback shows progress

### 2. Smart DICOM Detection
- Automatic extraction from all files
- Detects single vs multiple patients
- Appropriate prompt for each scenario

### 3. User Control
- User explicitly chooses DICOM or manual
- Can select which patient if multiple found
- Can always choose manual entry

### 4. Visual Feedback
- Loading spinner during extraction
- "Using DICOM Data" badge when active
- Disabled fields show they're auto-filled
- Checkmarks show completed fields
- Validation warnings before upload

### 5. Safety Features
- Prevents mixing patient data
- Forces choice when multiple patients detected
- Validates all required fields
- Confirms file count matches expectation

## User Experience Benefits

1. **Logical Flow**: Number → Files → Patient Info → Upload
2. **No Surprises**: User is asked before auto-filling
3. **Flexibility**: Can always choose manual entry
4. **Safety**: Prevents patient data mix-ups
5. **Efficiency**: Auto-fill saves time when desired
6. **Clarity**: Clear steps and validation messages

## Technical Implementation

### State Management
```typescript
// Step tracking
const [expectedImageCount, setExpectedImageCount] = useState<string>('');
const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

// DICOM detection
const [hasDicomFiles, setHasDicomFiles] = useState(false);
const [dicomMetadata, setDicomMetadata] = useState<DicomMetadata | null>(null);
const [uniquePatients, setUniquePatients] = useState<DicomMetadata[]>([]);

// User choices
const [useDicomMetadata, setUseDicomMetadata] = useState(false);
const [showDicomPrompt, setShowDicomPrompt] = useState(false);
const [showPatientSelector, setShowPatientSelector] = useState(false);

// Patient data
const [patientName, setPatientName] = useState('');
const [patientId, setPatientId] = useState('');
// ... other patient fields
```

### Flow Control
```typescript
// On file selection
handleFileSelect() {
  setSelectedFiles(files);
  extractAllDicomMetadata(files); // Extracts from ALL files
}

// After extraction
extractAllDicomMetadata() {
  if (no DICOM) {
    // Proceed to Step 3 (manual)
  } else if (single patient) {
    setShowDicomPrompt(true); // Show prompt
  } else if (multiple patients) {
    setShowPatientSelector(true); // Show selector
  }
}

// User chooses DICOM
handleUseDicomData() {
  setUseDicomMetadata(true);
  applyDicomMetadata(metadata); // Fill fields
  // Fields become disabled
}

// User chooses manual
handleUseManualEntry() {
  setUseDicomMetadata(false);
  // Fields remain editable
}
```

## Testing Checklist

- [ ] Step 1: Select number of images
- [ ] Step 2: Select files (click)
- [ ] Step 2: Select files (drag-drop)
- [ ] DICOM extraction shows loading
- [ ] Single patient: Prompt appears
- [ ] Single patient: Use DICOM fills fields
- [ ] Single patient: Enter manually keeps fields empty
- [ ] Multiple patients: Selector appears
- [ ] Multiple patients: Can select patient
- [ ] Multiple patients: Can cancel to manual
- [ ] No DICOM: No prompts, manual entry
- [ ] Step 3: Fields disabled in DICOM mode
- [ ] Step 3: Fields editable in manual mode
- [ ] Validation: Shows appropriate warnings
- [ ] Upload: Works with DICOM data
- [ ] Upload: Works with manual data
- [ ] Form clears after successful upload
