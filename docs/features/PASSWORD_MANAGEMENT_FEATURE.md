# Password Management Feature

## Overview
Added comprehensive password management functionality allowing users to change their own passwords and super admins to reset passwords for any user.

## Features Implemented

### 1. User Password Change (Profile Page)
- Users can change their own password from the profile page
- Requires current password verification
- New password must be at least 8 characters
- New password must be different from current password
- Password confirmation validation

**Location:** `/profile` page

**UI Components:**
- Collapsible password change form
- Current password field
- New password field
- Confirm password field
- Visual feedback with toast notifications

### 2. Admin Password Reset
- Super admins can reset any user's password
- Does not require the user's current password
- Admin cannot reset their own password (must use change password)
- Password must be at least 8 characters
- Password confirmation validation

**Location:** Admin Dashboard → Users Tab

**UI Components:**
- "Reset Password" button for each user
- Modal dialog with password fields
- Warning message about password reset
- Visual feedback with toast notifications

## Backend Implementation

### New API Endpoints

#### 1. Change Password (User)
```
PUT /api/auth/change-password
```

**Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

**Response:**
```json
{
  "message": "Password changed successfully",
  "timestamp": "ISO 8601 timestamp"
}
```

**Error Codes:**
- `MISSING_FIELDS` - Required fields missing
- `PASSWORD_MISMATCH` - New password and confirm password don't match
- `WEAK_PASSWORD` - Password doesn't meet requirements
- `INVALID_PASSWORD` - Current password is incorrect
- `SAME_PASSWORD` - New password same as current
- `PASSWORD_CHANGE_ERROR` - General error

#### 2. Reset User Password (Admin)
```
PUT /api/admin/users/:id/reset-password
```

**Request Body:**
```json
{
  "newPassword": "string"
}
```

**Response:**
```json
{
  "message": "User password reset successfully",
  "timestamp": "ISO 8601 timestamp"
}
```

**Error Codes:**
- `CANNOT_RESET_OWN_PASSWORD` - Admin trying to reset their own password
- `MISSING_PASSWORD` - New password not provided
- `WEAK_PASSWORD` - Password doesn't meet requirements
- `USER_NOT_FOUND` - User doesn't exist
- `PASSWORD_RESET_ERROR` - General error

### Service Layer Changes

**AuthService.ts:**
- `changePassword(userId, currentPassword, newPassword)` - User password change
- `resetUserPassword(userId, newPassword)` - Admin password reset

**UserRepository.ts:**
- `updatePassword(id, passwordHash)` - Update password hash in database

### Security Features

1. **Password Validation:**
   - Minimum 8 characters
   - Validated on both frontend and backend

2. **Current Password Verification:**
   - User must provide correct current password to change it
   - Uses bcrypt comparison

3. **Admin Restrictions:**
   - Admin cannot reset their own password via admin panel
   - Must use regular password change flow

4. **Password Hashing:**
   - Uses bcrypt with 12 salt rounds
   - Passwords never stored in plain text

## Frontend Implementation

### Profile Page Updates

**File:** `frontend/src/pages/ProfilePage.tsx`

**New State:**
```typescript
const [changingPassword, setChangingPassword] = useState(false);
const [showPasswordForm, setShowPasswordForm] = useState(false);
const [passwordData, setPasswordData] = useState({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});
```

**New Functions:**
- `handlePasswordChange()` - Handle password input changes
- `handlePasswordSubmit()` - Submit password change request

### Admin Dashboard Updates

**File:** `frontend/src/pages/AdminDashboardPage.tsx`

**New Function:**
- `handleResetPassword(userId, newPassword)` - Reset user password

**File:** `frontend/src/components/admin/UserManagementTable.tsx`

**New Props:**
- `onResetPassword: (userId: string, newPassword: string) => void`

**New State:**
```typescript
const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
const [newPassword, setNewPassword] = useState('');
const [confirmNewPassword, setConfirmNewPassword] = useState('');
```

**New Functions:**
- `handleResetPasswordClick(userId)` - Open reset password modal
- `handleResetPasswordSubmit()` - Submit password reset

### Admin Service Updates

**File:** `frontend/src/services/adminService.ts`

**New Method:**
```typescript
async resetUserPassword(userId: string, newPassword: string): Promise<void> {
  await api.put(`/admin/users/${userId}/reset-password`, { newPassword });
}
```

## Usage

### For Users

1. Navigate to Profile page (`/profile`)
2. Scroll to "Change Password" section
3. Click "Change Password" button
4. Enter current password
5. Enter new password (min 8 characters)
6. Confirm new password
7. Click "Change Password" to submit
8. Success message will appear

### For Admins

1. Navigate to Admin Dashboard
2. Go to "Users" tab
3. Find the user whose password needs to be reset
4. Click "Reset Password" button
5. Enter new password (min 8 characters)
6. Confirm new password
7. Click "Reset Password" to submit
8. Success message will appear
9. User can now log in with the new password

## Testing

### Manual Testing Steps

1. **User Password Change:**
   - Log in as a regular user
   - Go to profile page
   - Try changing password with wrong current password (should fail)
   - Try changing password with matching new password (should fail)
   - Try changing password with weak password (should fail)
   - Change password successfully
   - Log out and log in with new password

2. **Admin Password Reset:**
   - Log in as super admin
   - Go to admin dashboard
   - Try resetting your own password (should fail)
   - Reset another user's password
   - Log out
   - Log in as that user with new password

## Security Considerations

1. **Password Requirements:**
   - Minimum 8 characters enforced
   - Consider adding complexity requirements (uppercase, lowercase, numbers, special chars)

2. **Rate Limiting:**
   - Consider adding rate limiting to prevent brute force attacks
   - Implement account lockout after failed attempts

3. **Password History:**
   - Consider preventing reuse of recent passwords
   - Store password history hashes

4. **Audit Logging:**
   - Log all password changes and resets
   - Include timestamp, user ID, and IP address

5. **Email Notifications:**
   - Send email when password is changed
   - Send email when admin resets password
   - Include security alert information

## Future Enhancements

1. **Password Strength Meter:**
   - Visual indicator of password strength
   - Real-time feedback as user types

2. **Two-Factor Authentication:**
   - Require 2FA for password changes
   - SMS or authenticator app verification

3. **Password Reset via Email:**
   - Forgot password functionality
   - Email-based password reset flow

4. **Password Expiration:**
   - Force password change after X days
   - Configurable expiration policy

5. **Password Complexity Rules:**
   - Configurable complexity requirements
   - Uppercase, lowercase, numbers, special characters

6. **Session Invalidation:**
   - Invalidate all sessions when password changes
   - Force re-login on all devices

## Files Modified

### Backend
- `backend/src/services/AuthService.ts` - Added password change/reset methods
- `backend/src/repositories/UserRepository.ts` - Added updatePassword method
- `backend/src/routes/auth.routes.ts` - Added change-password endpoint
- `backend/src/routes/admin.routes.ts` - Added reset-password endpoint

### Frontend
- `frontend/src/pages/ProfilePage.tsx` - Added password change UI
- `frontend/src/pages/AdminDashboardPage.tsx` - Added reset password handler
- `frontend/src/components/admin/UserManagementTable.tsx` - Added reset password UI
- `frontend/src/services/adminService.ts` - Added resetUserPassword method

## Deployment Notes

1. No database migrations required
2. No environment variable changes needed
3. Backward compatible with existing code
4. Can be deployed without downtime

## Support

For issues or questions:
1. Check error messages in browser console
2. Check backend logs for detailed error information
3. Verify user has correct permissions (super_admin for reset)
4. Ensure password meets minimum requirements
