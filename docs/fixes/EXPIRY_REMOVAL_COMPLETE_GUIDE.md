# Complete Expiry Feature Removal Guide

## Status: ✅ Backend Complete | ⚠️ Frontend Needs Reapplication

The expiry feature has been successfully removed from the backend, but frontend changes keep getting reverted by autofix. Here's the complete list of changes needed:

## Backend Changes (✅ COMPLETE)

1. **AmbulanceLicense.ts** - Removed `durationDays` from CreateLicenseDTO
2. **LicenseService.ts** - Sets expiry to 100 years in future, removed duration validation
3. **licenses.routes.ts** - Removed `durationDays` validation requirement

## Frontend Changes Needed (Apply These)

### 1. LicenseExpiryNotice.tsx
```typescript
interface LicenseExpiryNoticeProps {
  ambulanceName: string;
}

export default function LicenseExpiryNotice({ ambulanceName }: LicenseExpiryNoticeProps) {
  return null; // Expiry feature removed
}
```

### 2. AmbulanceLicenseStatus.tsx
Remove from LicenseInfo interface:
- `expiresAt: string`
- `daysUntilExpiry: number`
- `isExpiringSoon: boolean`
- Change status type from `'active' | 'expired' | 'revoked'` to `'active' | 'revoked'`

### 3. RegisterPage.tsx
Remove from LicenseDetails interface:
- `expiresAt: string`

Remove from license details display:
- The line showing expiry date

### 4. EditLicenseModal.tsx
- Remove `onExtend` from props interface
- Remove `extendDays` state
- Change activeTab type from `'details' | 'quota' | 'expiry'` to `'details' | 'quota'`
- Remove the "Expiry Date" tab button
- Remove the entire expiry tab content section
- Remove expiry validation logic

### 5. AdminDashboardPage.tsx
- Remove `onExtend={handleExtendLicense}` prop from EditLicenseModal
- Remove `handleExtendLicense` function completely

### 6. LicenseDetailsPanel.tsx
- Remove `getDaysUntilExpiry` function
- Remove 'expired' from status badges
- Remove 'extended' from action badges  
- Remove the entire "Expiry Date" display section

### 7. LicenseManagementTable.tsx
- Remove `getDaysUntilExpiry` function
- Remove expiry column header
- Remove expiry cell from table body
- Remove 'expired' option from status filter dropdown

### 8. AmbulanceStatsTable.tsx
- Change SortField type to remove `'daysUntilExpiry'`
- Remove `getExpiryWarning` function
- Remove "Expires In" column header
- Remove expiry cell from table body
- Update colspan from 8 to 7

### 9. AmbulanceDetailsDashboard.tsx
- Remove the "Expires In" stat card (orange card showing days until expiry)

## Why Changes Keep Reverting

The Kiro IDE autofix/formatter is restoring the original code. To prevent this:

1. Apply all changes in one session
2. Test immediately after applying
3. Commit changes to version control
4. Consider disabling autofix temporarily

## Testing After Changes

1. Login as super admin
2. Create a new license (should work without duration field)
3. View license details (no expiry shown)
4. Register ambulance user (no expiry shown)
5. Check all admin dashboards (no expiry columns/stats)

## Current System Behavior

- Licenses are created with expiry set 100 years in future
- No expiry validation occurs
- Licenses remain active until manually revoked
- All expiry UI elements should be hidden/removed
