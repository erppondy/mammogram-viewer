# Hide Upload for Ambulance Doctors

## Summary
Upload functionality is now hidden for ambulance users with the doctor role, as doctors should only annotate images, not upload them.

## Changes Made

### DashboardPage.tsx

1. **Upload Card Hidden**
   - Wrapped the "Upload Images" ActionCard in a conditional check
   - Only shows if `user?.ambulanceRole !== 'doctor'`
   - Doctors will not see the upload option in the main menu

2. **Upload View Protected**
   - Added condition to upload view rendering
   - Prevents doctors from accessing upload view even if they try to navigate directly
   - Condition: `viewMode === 'upload' && user?.ambulanceRole !== 'doctor'`

## User Experience

### For Ambulance Doctors (ambulanceRole='doctor'):
- ❌ No "Upload Images" card on dashboard
- ❌ Cannot access upload view
- ✅ Can view gallery
- ✅ Can annotate images
- ✅ Can download images

### For Other Ambulance Users (operator, supervisor, admin):
- ✅ See "Upload Images" card on dashboard
- ✅ Can upload images
- ✅ Can view gallery
- ✅ Can download images
- ❌ Cannot annotate (unless they're doctors)

### For Regular Users:
- ✅ See "Upload Images" card on dashboard
- ✅ Can upload images
- ✅ Can view gallery
- ✅ Can download images

## Workflow

The intended workflow is:
1. **Operators/Supervisors/Admins** upload X-ray images
2. **Doctors** review and annotate the uploaded images
3. Everyone can view and download images

This separation of duties ensures:
- Doctors focus on medical analysis and annotation
- Technical staff handle image uploads and management
- Clear role-based access control

## Testing

To test this feature:
1. Register/login as ambulance user with `ambulanceRole: 'doctor'`
2. Navigate to dashboard
3. Verify "Upload Images" card is NOT visible
4. Only "View Gallery" card should be shown
5. Register/login as ambulance user with `ambulanceRole: 'operator'`
6. Navigate to dashboard
7. Verify both "Upload Images" and "View Gallery" cards are visible

## Related Changes
- Annotate button is only visible to doctors (see ANNOTATE_BUTTON_DOCTOR_ONLY.md)
- This creates a complementary role separation:
  - Non-doctors: Upload but cannot annotate
  - Doctors: Annotate but cannot upload
