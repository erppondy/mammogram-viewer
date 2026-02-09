# Ambulance Role Case Verification

## Summary
Verified that `ambulanceRole` values are stored and checked as **lowercase** throughout the system.

## Verification Results

### Database Level
- **Migration 011**: Constraint allows `'operator', 'doctor', 'supervisor', 'admin'` (all lowercase)
- **Migration 013**: Updated constraint confirms `'doctor'` (lowercase)
- **Database Column**: `ambulance_role VARCHAR(50)` stores lowercase values

### Backend Level
- **TypeScript Type**: `export type AmbulanceRole = 'operator' | 'supervisor' | 'admin' | 'doctor';`
- All values are lowercase in the type definition

### Frontend Level
- **RegisterPage**: `<option value="doctor">Doctor</option>` - sends lowercase 'doctor'
- **Display**: Shows "Doctor" (capitalized) to users, but stores 'doctor' (lowercase)

### Code Checks
All our conditional checks use lowercase:
```typescript
// ImageGallery.tsx
const isDoctorRole = userResponse.data?.role === 'doctor' || userResponse.data?.ambulanceRole === 'doctor';

// ImageViewer.tsx
const isDoctorRole = userResponse.data?.role === 'doctor' || userResponse.data?.ambulanceRole === 'doctor';

// DicomViewer.tsx
const isDoctorRole = userResponse.data?.role === 'doctor' || userResponse.data?.ambulanceRole === 'doctor';

// DashboardPage.tsx
{user?.ambulanceRole !== 'doctor' && (
```

## Conclusion
✅ **All checks are correct** - using lowercase `'doctor'` consistently throughout the system.

## Valid Ambulance Roles
The system accepts these ambulanceRole values (all lowercase):
- `'operator'` - Can upload images, cannot annotate
- `'doctor'` - Can annotate images, cannot upload
- `'supervisor'` - Can upload images, cannot annotate
- `'admin'` - Can upload images, cannot annotate

## Case Sensitivity Note
PostgreSQL string comparisons are case-sensitive by default, so:
- ✅ `'doctor'` will match
- ❌ `'Doctor'` will NOT match
- ❌ `'DOCTOR'` will NOT match

Our code correctly uses lowercase `'doctor'` in all comparisons.
