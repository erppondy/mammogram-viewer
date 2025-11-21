# Admin Approval System - Requirements Document

## Introduction

This feature adds a super admin role and user approval workflow to the mammogram viewer application. Users must be approved by a super admin before they can log in and access the system. This ensures controlled access and proper user management.

## Requirements

### Requirement 1: Super Admin Role

**User Story:** As a system administrator, I want a super admin role with elevated privileges, so that I can manage user access to the application.

#### Acceptance Criteria

1. WHEN the system is initialized THEN a default super admin account SHALL be created automatically
2. WHEN a super admin logs in THEN they SHALL have access to admin-specific features
3. WHEN a super admin views their profile THEN their role SHALL be displayed as "Super Admin"
4. IF a user is a super admin THEN they SHALL be able to access the admin dashboard
5. WHEN checking user permissions THEN the system SHALL distinguish between regular users and super admins

### Requirement 2: User Approval Workflow

**User Story:** As a super admin, I want to approve or reject user registration requests, so that I can control who has access to the system.

#### Acceptance Criteria

1. WHEN a new user registers THEN their account SHALL be created with "pending" status
2. WHEN a user with "pending" status attempts to login THEN they SHALL receive a message indicating their account is awaiting approval
3. WHEN a super admin views the user management page THEN they SHALL see all pending user requests
4. WHEN a super admin approves a user THEN the user's status SHALL change to "approved"
5. WHEN a super admin rejects a user THEN the user's status SHALL change to "rejected"
6. WHEN a user with "approved" status logs in THEN they SHALL be granted access to the system
7. WHEN a user with "rejected" status attempts to login THEN they SHALL receive a message indicating their account was rejected

### Requirement 3: Admin Dashboard

**User Story:** As a super admin, I want a dedicated admin dashboard, so that I can easily manage users and view system information.

#### Acceptance Criteria

1. WHEN a super admin logs in THEN they SHALL be redirected to the admin dashboard
2. WHEN viewing the admin dashboard THEN it SHALL display a list of all users with their status
3. WHEN viewing the admin dashboard THEN it SHALL show counts of pending, approved, and rejected users
4. WHEN viewing a user in the list THEN it SHALL display: username, email, registration date, and status
5. WHEN a super admin clicks on a pending user THEN they SHALL see options to approve or reject
6. WHEN a super admin approves/rejects a user THEN the list SHALL update immediately
7. WHEN a super admin searches for users THEN the list SHALL filter based on the search term

### Requirement 4: User Management Actions

**User Story:** As a super admin, I want to perform various user management actions, so that I can maintain proper system access control.

#### Acceptance Criteria

1. WHEN a super admin approves a user THEN an email notification SHALL be sent to the user (optional)
2. WHEN a super admin rejects a user THEN they SHALL be able to provide a reason
3. WHEN a super admin views user details THEN they SHALL see the user's uploaded images count
4. WHEN a super admin deactivates an approved user THEN the user SHALL no longer be able to log in
5. WHEN a super admin reactivates a deactivated user THEN the user SHALL be able to log in again
6. WHEN a super admin deletes a user THEN all associated data SHALL be removed from the system

### Requirement 5: Registration Flow Update

**User Story:** As a new user, I want to understand the approval process when I register, so that I know what to expect.

#### Acceptance Criteria

1. WHEN a user completes registration THEN they SHALL see a message explaining the approval process
2. WHEN a user attempts to login with a pending account THEN they SHALL see a clear message about waiting for approval
3. WHEN a user's account is approved THEN they SHALL be able to login immediately
4. WHEN a user's account is rejected THEN they SHALL see a message explaining the rejection

### Requirement 6: Security and Access Control

**User Story:** As a system, I want to ensure only super admins can access admin features, so that the system remains secure.

#### Acceptance Criteria

1. WHEN a regular user attempts to access admin routes THEN they SHALL receive a 403 Forbidden error
2. WHEN checking admin permissions THEN the system SHALL verify the user's role is "super_admin"
3. WHEN a super admin token is generated THEN it SHALL include the role information
4. WHEN validating admin access THEN the middleware SHALL check both authentication and authorization

### Requirement 7: Initial Super Admin Setup

**User Story:** As a system deployer, I want an easy way to create the initial super admin account, so that I can set up the system quickly.

#### Acceptance Criteria

1. WHEN the database is initialized THEN a default super admin account SHALL be created
2. WHEN creating the default super admin THEN the credentials SHALL be configurable via environment variables
3. WHEN the default super admin is created THEN their status SHALL be "approved" automatically
4. WHEN the system starts THEN it SHALL log the super admin creation status
5. IF the default super admin already exists THEN the system SHALL skip creation and continue normally

## Database Schema Changes

### Users Table Updates
- Add `role` column: VARCHAR (values: 'user', 'super_admin')
- Add `status` column: VARCHAR (values: 'pending', 'approved', 'rejected', 'deactivated')
- Add `approved_by` column: UUID (foreign key to users.id, nullable)
- Add `approved_at` column: TIMESTAMP (nullable)
- Add `rejection_reason` column: TEXT (nullable)

## API Endpoints

### Admin Routes
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/users/pending` - Get pending users (admin only)
- `PUT /api/admin/users/:id/approve` - Approve user (admin only)
- `PUT /api/admin/users/:id/reject` - Reject user (admin only)
- `PUT /api/admin/users/:id/deactivate` - Deactivate user (admin only)
- `PUT /api/admin/users/:id/activate` - Activate user (admin only)
- `DELETE /api/admin/users/:id` - Delete user (admin only)
- `GET /api/admin/stats` - Get system statistics (admin only)

### Updated Auth Routes
- `POST /api/auth/register` - Returns pending status message
- `POST /api/auth/login` - Checks user status before allowing login

## User Interface Components

### Admin Dashboard
- User list table with status indicators
- Filter/search functionality
- Approve/Reject action buttons
- User statistics cards
- User detail modal

### Registration Page
- Success message explaining approval process
- Link to contact admin if needed

### Login Page
- Status-specific error messages
- Clear feedback for pending/rejected accounts

## Non-Functional Requirements

### Performance
- User list should load within 2 seconds
- Approval/rejection actions should complete within 1 second

### Security
- All admin routes must be protected with role-based middleware
- Super admin credentials must be stored securely
- JWT tokens must include role information

### Usability
- Clear visual distinction between user statuses
- Intuitive admin interface
- Helpful error messages for users

## Out of Scope

- Email notifications (can be added later)
- Bulk user operations (can be added later)
- User activity logs (can be added later)
- Multiple admin roles (only super_admin for now)
