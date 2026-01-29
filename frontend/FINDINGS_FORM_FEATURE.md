# Findings Form Feature

## Overview
When closing a polygon annotation (via double-click), a modal form appears to capture detailed finding information before saving the annotation.

## Features

### Form Fields

1. **Finding Name (Required)**
   - Text input for custom finding name
   - Example: "Suspicious Mass in Upper Outer Quadrant"
   - This name is displayed in the annotations list
   - Helps identify specific findings quickly

2. **Finding Category (Required)**
   - Dropdown selection with predefined categories:
     - Mass
     - Calcification
     - Asymmetry
     - Distortion
     - Architectural Distortion
     - Lymph Node
     - Skin Lesion
     - Other

3. **Notes (Required)**
   - Multi-line text area for detailed description
   - Placeholder: "Describe the finding in detail..."
   - Minimum 4 rows for comfortable input

4. **Severity Level (Optional)**
   - Interactive slider from 1 (Low) to 5 (High)
   - Real-time value display
   - Defaults to current severity setting (3)
   - Visual indicators for Low/High extremes

### User Experience

- **Modal Appearance**: Triggered on polygon double-click
- **Backdrop**: Semi-transparent dark overlay with blur effect
- **Focus Management**: Click outside to cancel
- **Form Validation**: Required fields must be filled
- **Actions**:
  - **Cancel**: Discards the polygon and closes modal
  - **Save Finding**: Saves annotation with form data

### Workflow

1. User draws polygon by clicking points on canvas
2. User double-clicks to close the polygon
3. Findings form modal appears
4. User enters finding name (required)
5. User selects finding category (required)
6. User adds detailed notes (required)
7. User optionally adjusts severity level
8. User clicks "Save Finding" to create annotation
9. Annotation appears in the list with the finding name as the title

### Visual Design

- Medical-themed styling with cyan accents
- Clear visual hierarchy
- Responsive layout
- Accessible form controls
- Smooth transitions and animations

## Annotations List Display

- Annotations are displayed with the finding name as the primary title
- Falls back to annotation type if no finding name is provided
- Shows category and severity level as secondary information
- Displays notes preview (truncated to 2 lines)
- Click to select, delete button for removal

## Technical Implementation

- Form data captured via FormData API
- Validation handled by HTML5 required attributes
- State management for pending coordinates
- Clean separation between drawing and metadata capture
- Finding name stored in database `finding_name` column
- Backend models and repositories updated to support finding_name field
- Database migration adds `finding_name` column with index for performance
