# Ambulance User UI Components Implementation

## Overview

This document describes the implementation of ambulance user UI components that display license status, quota warnings, and expiry notices to ambulance users.

## Components Implemented

### 1. AmbulanceLicenseStatus Component

**Location:** `frontend/src/components/AmbulanceLicenseStatus.tsx`

**Purpose:** Displays comprehensive license information for ambulance users including:
- Ambulance name
- License key
- License status (active/expired/revoked)
- Expiration date with countdown timer
- Upload quota usage with visual progress bar
- Remaining uploads

**Features:**
- Real-time countdown timer that updates every minute
- Color-coded status indicators (green for active, yellow for expiring soon, red for expired/revoked)
- Visual quota progress bar with color coding based on usage (green < 80%, yellow 80-90%, red > 90%)
- Responsive design matching the medical UI theme

### 2. UploadQuotaWarning Component

**Location:** `frontend/src/components/UploadQuotaWarning.tsx`

**Purpose:** Displays a warning banner when upload quota is running low (≥ 80% used)

**Features:**
- Only appears when quota usage is 80% or higher
- Two severity levels:
  - Warning (yellow) when 80-89% used
  - Urgent (red) when 90%+ used
- Shows remaining uploads and total quota
- Provides guidance to contact administrator

### 3. LicenseExpiryNotice Component

**Location:** `frontend/src/components/LicenseExpiryNotice.tsx`

**Purpose:** Displays a notice when license is expiring soon (≤ 7 days) or has expired

**Features:**
- Only appears when license expires in 7 days or less
- Three severity levels:
  - Warning (yellow) when 4-7 days remaining
  - Urgent (orange) when 1-3 days remaining
  - Critical (red) when expired
- Shows expiration date and days remaining
- Provides guidance to contact administrator

## Integration Points

### 4. Updated UploadSection Component

**Location:** `frontend/src/components/UploadSection.tsx`

**Changes:**
- Added license status fetching on component mount
- Integrated `UploadQuotaWarning` and `LicenseExpiryNotice` components
- Added quota display in the header showing remaining/total uploads
- Added validation to prevent uploads when:
  - License is expired or revoked
  - Upload quota is exceeded
  - Upload would exceed remaining quota
- Disabled upload button when license is invalid or quota exceeded
- Refreshes license status after successful upload
- Shows appropriate error messages for license-related issues

### 5. Updated DashboardPage Component

**Location:** `frontend/src/pages/DashboardPage.tsx`

**Changes:**
- Added license status fetching on page load
- Integrated `AmbulanceLicenseStatus` component
- Displays license status card for ambulance users on all views
- Positioned at the top of the dashboard for easy visibility

### 6. Updated AuthService

**Location:** `frontend/src/services/authService.ts`

**Changes:**
- Added `LicenseStatus` interface
- Added `getLicenseStatus()` method to fetch current user's license information
- Interfaces include all necessary license data for UI components

## User Experience Flow

### For Ambulance Users:

1. **Dashboard Load:**
   - License status card appears at the top showing key information
   - If license is expiring soon (≤ 7 days), expiry notice is displayed
   - If quota is low (≥ 80%), quota warning is displayed

2. **Upload Section:**
   - Header shows remaining quota count with color coding
   - Warnings appear if quota is low or license is expiring
   - Upload button is disabled if quota exceeded or license invalid
   - Clear error messages explain why upload is blocked

3. **After Upload:**
   - License status automatically refreshes
   - Updated quota is displayed immediately
   - Warnings update based on new quota usage

### For Regular Users:

- No license components are displayed
- Upload functionality works as before
- No changes to existing user experience

## Visual Design

All components follow the medical UI theme with:
- Consistent color scheme (cyan/blue primary, green/yellow/red status colors)
- Medical-themed icons
- Scan-line animations on cards
- Responsive layouts
- Accessibility-friendly contrast ratios

## API Integration

Components integrate with the following backend endpoints:

- `GET /api/auth/license-status` - Fetches current user's license information
- Returns license data including:
  - License details (key, ambulance name, status)
  - Quota information (total, used, remaining, percentage)
  - Expiry information (date, days until expiry, flags for warnings)

## Requirements Satisfied

This implementation satisfies the following requirements from the specification:

- **Requirement 6.1:** Display license expiration date and remaining upload quota
- **Requirement 6.2:** Display number of days remaining until license expiration
- **Requirement 6.3:** Display warning when upload quota is below 20% (implemented as 20% remaining = 80% used)
- **Requirement 6.4:** Display total number of images uploaded and ambulance contact information

## Testing Recommendations

1. **License Status Display:**
   - Verify license information displays correctly for ambulance users
   - Verify regular users don't see license components
   - Test countdown timer updates correctly

2. **Quota Warnings:**
   - Test warning appears at 80% quota usage
   - Test urgent warning appears at 90% quota usage
   - Test warning disappears when quota is increased

3. **Expiry Notices:**
   - Test notice appears 7 days before expiry
   - Test severity levels change at 3 days and 0 days
   - Test notice disappears when license is extended

4. **Upload Restrictions:**
   - Test upload is blocked when quota exceeded
   - Test upload is blocked when license expired/revoked
   - Test upload is blocked when upload would exceed remaining quota
   - Test appropriate error messages are displayed

5. **License Status Refresh:**
   - Test license status updates after upload
   - Test quota count decrements after upload
   - Test warnings appear/disappear based on updated status

## Future Enhancements

Potential improvements for future iterations:

1. Add push notifications for license expiry warnings
2. Add email notifications when quota is low
3. Add ability to request quota increase from UI
4. Add historical quota usage charts
5. Add license renewal request workflow
6. Add multi-language support for notices
