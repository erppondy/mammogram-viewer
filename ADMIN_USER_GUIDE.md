# Admin User Guide

## Overview

This guide explains how to use the Admin Dashboard to manage user accounts in the Mammogram Viewer application.

## Accessing the Admin Dashboard

1. Log in with your super admin credentials
2. Click the "Admin Dashboard" button in the top navigation bar
3. You will be redirected to `/admin`

## User Statuses

The system supports four user statuses:

### Pending
- **Description**: New user registrations awaiting approval
- **User Can**: Nothing (cannot log in)
- **Admin Can**: Approve or Reject

### Approved
- **Description**: Active users with full access
- **User Can**: Log in and use the application
- **Admin Can**: Deactivate or Delete

### Rejected
- **Description**: Users who have been denied access
- **User Can**: Nothing (cannot log in)
- **Admin Can**: Approve (give them another chance) or Delete

### Deactivated
- **Description**: Previously approved users who have been temporarily disabled
- **User Can**: Nothing (cannot log in)
- **Admin Can**: Activate (restore access) or Delete

## Dashboard Overview

### Statistics Cards

At the top of the dashboard, you'll see five colored cards:

- **Blue (Total Users)**: All users in the system
- **Yellow (Pending)**: Users awaiting approval
- **Green (Approved)**: Active users
- **Red (Rejected)**: Rejected users
- **Gray (Deactivated)**: Deactivated users

Click any card to filter the user list by that status.

### User Management Table

The table displays:
- User's full name and credentials
- Email address
- Current status (with color-coded badge)
- Registration date
- Available actions

### Search and Filter

- Use the search box to find users by email or name
- Click status cards to filter by status
- Click "Clear filter" to show all users

## Managing Users

### Approving a Pending User

1. Find the user in the Pending list (yellow badge)
2. Click the "Approve" button
3. Confirm the action in the modal
4. User can now log in

### Rejecting a User

1. Find the user (usually Pending status)
2. Click the "Reject" button
3. Optionally enter a rejection reason
4. Click "Reject" to confirm
5. User will see the rejection reason when attempting to log in

### Deactivating an Approved User

1. Find the approved user (green badge)
2. Click the "Deactivate" button
3. Confirm the action
4. User will be immediately logged out and cannot log back in

### Reactivating a Deactivated User

1. Find the deactivated user (gray badge)
2. Click the "Activate" button
3. Confirm the action
4. User can now log in again

### Deleting a User

1. Find any user
2. Click the "Delete" button
3. Confirm the action
4. User and all associated data will be permanently removed

**Warning**: Deletion is permanent and cannot be undone!

## Best Practices

### Approving Users

- Verify the user's email domain matches your organization
- Check professional credentials if provided
- Consider requiring additional verification for sensitive access

### Rejecting Users

- Always provide a clear rejection reason
- Common reasons:
  - "Invalid or unverified credentials"
  - "Not affiliated with authorized organization"
  - "Incomplete registration information"

### Deactivating Users

Use deactivation instead of deletion when:
- User is temporarily inactive
- Investigating potential policy violations
- User requested temporary suspension

### Deleting Users

Only delete users when:
- Account is confirmed fraudulent
- User explicitly requested account deletion
- Cleaning up old test accounts

## Security Considerations

### Admin Account Protection

- You cannot modify your own admin account
- This prevents accidental self-lockout
- Contact another admin if you need changes to your account

### Audit Trail

The system tracks:
- Who approved/rejected each user
- When approval/rejection occurred
- Rejection reasons (if provided)

### Password Requirements

All users must have passwords that are:
- At least 8 characters long
- This is enforced at registration

## Common Workflows

### New User Registration Flow

1. User registers → Status: Pending
2. Admin reviews registration
3. Admin approves → Status: Approved
4. User receives notification (if configured)
5. User can now log in

### Handling Suspicious Activity

1. Admin notices suspicious activity
2. Admin deactivates user → Status: Deactivated
3. Admin investigates
4. Either:
   - Reactivate if cleared
   - Delete if confirmed malicious

### Bulk Approval

1. Click "Pending" statistics card
2. Review each pending user
3. Approve legitimate users
4. Reject suspicious registrations

## Troubleshooting

### Cannot See Admin Dashboard Button

- Verify you're logged in as super_admin
- Check your user role in the database
- Try logging out and back in

### Cannot Approve User

- Check if user is already approved
- Verify you're not trying to modify your own account
- Ensure user exists in the system

### User Still Cannot Log In After Approval

- Verify status changed to "approved" in the table
- Ask user to clear browser cache
- Check for any error messages in the login page

## Support

For technical issues or questions:
1. Check the API documentation (ADMIN_API_DOCUMENTATION.md)
2. Review application logs
3. Contact system administrator
