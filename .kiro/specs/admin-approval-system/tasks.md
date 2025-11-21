# Implementation Plan - Admin Approval System

- [x] 1. Database schema updates and super admin setup
  - [x] 1.1 Create database migration for user roles and status
    - Create migration file `002_add_user_roles_and_status.sql`
    - Add `role` column with default 'user'
    - Add `status` column with default 'pending'
    - Add `approved_by`, `approved_at`, `rejection_reason` columns
    - Create indexes on `role` and `status`
    - Add check constraints for valid values
    - Update existing users to 'approved' status
    - _Requirements: 1.1, 1.2, 2.1, 7.3_

  - [x] 1.2 Create super admin seed script
    - Create seed file `001_create_super_admin.ts`
    - Read super admin credentials from environment variables
    - Check if super admin already exists
    - Create super admin with 'super_admin' role and 'approved' status
    - Log creation status and credentials
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 1.3 Run migration and seed
    - Execute migration script
    - Run super admin seed script
    - Verify database schema changes
    - Test super admin account creation
    - _Requirements: 7.1, 7.2_

- [x] 2. Update backend models and types
  - [x] 2.1 Update User model with new fields
    - Add `UserRole` type ('user' | 'super_admin')
    - Add `UserStatus` type ('pending' | 'approved' | 'rejected' | 'deactivated')
    - Update `User` interface with new fields
    - Update `UserResponse` interface
    - Update `CreateUserDTO` interface
    - _Requirements: 1.1, 2.1_

- [x] 3. Implement admin authorization middleware
  - [x] 3.1 Create admin auth middleware
    - Create `backend/src/middleware/adminAuth.ts`
    - Implement `requireAdmin` middleware function
    - Check if user is authenticated
    - Verify user role is 'super_admin'
    - Return 403 if not admin
    - Write unit tests for middleware
    - _Requirements: 1.4, 6.1, 6.2, 6.4_

- [x] 4. Implement AdminService for user management
  - [x] 4.1 Create AdminService class
    - Create `backend/src/services/AdminService.ts`
    - Implement `getAllUsers` method with filtering
    - Implement `getPendingUsers` method
    - Implement `getSystemStats` method
    - Write unit tests for read operations
    - _Requirements: 3.2, 3.3, 3.4_

  - [x] 4.2 Implement user approval/rejection methods
    - Implement `approveUser` method
    - Implement `rejectUser` method with reason
    - Update user status and approval tracking fields
    - Validate status transitions
    - Write unit tests for approval/rejection
    - _Requirements: 2.3, 2.4, 2.5, 4.1, 4.2_

  - [x] 4.3 Implement user activation/deactivation methods
    - Implement `deactivateUser` method
    - Implement `activateUser` method
    - Implement `deleteUser` method
    - Validate operations (cannot modify self)
    - Write unit tests for activation/deactivation
    - _Requirements: 4.4, 4.5, 4.6_

- [x] 5. Update AuthService for status checking
  - [x] 5.1 Update registration to set pending status
    - Modify `register` method to set status as 'pending'
    - Return message about approval process
    - Update registration response format
    - Write unit tests for registration
    - _Requirements: 2.1, 5.1_

  - [x] 5.2 Update login to check user status
    - Add `validateUserStatus` private method
    - Check user status before generating token
    - Return appropriate error for pending users
    - Return appropriate error for rejected users
    - Return appropriate error for deactivated users
    - Update JWT token to include role and status
    - Write unit tests for login with different statuses
    - _Requirements: 2.2, 2.6, 2.7, 6.3_

- [x] 6. Create admin API routes
  - [x] 6.1 Create admin routes file
    - Create `backend/src/routes/admin.routes.ts`
    - Apply `authMiddleware` to all routes
    - Apply `requireAdmin` middleware to all routes
    - _Requirements: 6.1, 6.2_

  - [x] 6.2 Implement user management endpoints
    - Implement `GET /api/admin/users` endpoint
    - Implement `GET /api/admin/users/pending` endpoint
    - Implement `PUT /api/admin/users/:id/approve` endpoint
    - Implement `PUT /api/admin/users/:id/reject` endpoint
    - Implement `PUT /api/admin/users/:id/deactivate` endpoint
    - Implement `PUT /api/admin/users/:id/activate` endpoint
    - Implement `DELETE /api/admin/users/:id` endpoint
    - Write integration tests for all endpoints
    - _Requirements: 3.2, 3.3, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 6.3 Implement statistics endpoint
    - Implement `GET /api/admin/stats` endpoint
    - Return counts for each user status
    - Write integration tests
    - _Requirements: 3.2_

  - [x] 6.4 Register admin routes in main app
    - Import admin routes in `backend/src/index.ts`
    - Mount admin routes at `/api/admin`
    - Test route accessibility
    - _Requirements: 6.1_

- [x] 7. Update auth routes for new workflow
  - [x] 7.1 Update registration endpoint
    - Modify `POST /api/auth/register` to return pending message
    - Update response format
    - Write integration tests
    - _Requirements: 2.1, 5.1_

  - [x] 7.2 Update login endpoint
    - Modify `POST /api/auth/login` to check status
    - Return status-specific error messages
    - Update JWT token payload
    - Write integration tests for each status
    - _Requirements: 2.2, 2.6, 2.7, 5.4_

- [x] 8. Create admin frontend service
  - [x] 8.1 Create admin API service
    - Create `frontend/src/services/adminService.ts`
    - Implement `getAllUsers` function
    - Implement `getPendingUsers` function
    - Implement `approveUser` function
    - Implement `rejectUser` function
    - Implement `deactivateUser` function
    - Implement `activateUser` function
    - Implement `deleteUser` function
    - Implement `getStats` function
    - _Requirements: 3.2, 3.3, 3.5, 3.6_

- [x] 9. Create admin dashboard components
  - [x] 9.1 Create AdminStats component
    - Create `frontend/src/components/admin/AdminStats.tsx`
    - Display statistics cards for each status
    - Color-code cards by status
    - Make cards clickable to filter users
    - Style with Tailwind CSS
    - _Requirements: 3.2_

  - [x] 9.2 Create UserManagementTable component
    - Create `frontend/src/components/admin/UserManagementTable.tsx`
    - Display user list in table format
    - Show username, email, status, registration date
    - Add status badge with color coding
    - Add action buttons based on status
    - Implement search/filter functionality
    - Add confirmation modals for actions
    - Style with Tailwind CSS
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 9.3 Create RejectUserModal component
    - Create `frontend/src/components/admin/RejectUserModal.tsx`
    - Add textarea for rejection reason
    - Add confirm/cancel buttons
    - Handle form submission
    - Style with Tailwind CSS
    - _Requirements: 4.2_

- [x] 10. Create admin dashboard page
  - [x] 10.1 Create AdminDashboardPage component
    - Create `frontend/src/pages/AdminDashboardPage.tsx`
    - Fetch users and stats on mount
    - Render AdminStats component
    - Render UserManagementTable component
    - Handle approve/reject/deactivate/activate actions
    - Show success/error toast notifications
    - Add loading states
    - Style with Tailwind CSS
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_

- [x] 11. Update registration and login pages
  - [x] 11.1 Update RegisterPage for pending status
    - Update success message to explain approval process
    - Add information about waiting for admin approval
    - Style message prominently
    - _Requirements: 5.1_

  - [x] 11.2 Update LoginPage for status errors
    - Handle 'ACCOUNT_PENDING' error
    - Handle 'ACCOUNT_REJECTED' error
    - Handle 'ACCOUNT_DEACTIVATED' error
    - Display clear, user-friendly error messages
    - Style error messages appropriately
    - _Requirements: 2.2, 5.2, 5.3, 5.4_

- [x] 12. Implement protected admin routes
  - [x] 12.1 Create admin route protection
    - Update `frontend/src/App.tsx`
    - Add admin route for `/admin`
    - Use ProtectedRoute with `requireAdmin` prop
    - Redirect non-admins to dashboard
    - _Requirements: 1.4, 6.1_

  - [x] 12.2 Update navigation for admin users
    - Add "Admin Dashboard" link in navigation
    - Show link only for super admin users
    - Update user context to include role
    - _Requirements: 1.2, 1.3_

- [x] 13. Update authentication context
  - [x] 13.1 Update auth context to include role
    - Modify `frontend/src/contexts/AuthContext.tsx`
    - Add `role` to user state
    - Extract role from JWT token
    - Provide `isAdmin` helper function
    - _Requirements: 1.2, 1.3, 6.3_

- [x] 14. Add environment configuration
  - [x] 14.1 Update backend .env file
    - Add `SUPER_ADMIN_EMAIL` variable
    - Add `SUPER_ADMIN_PASSWORD` variable
    - Add `SUPER_ADMIN_USERNAME` variable
    - Document variables in .env.example
    - _Requirements: 7.2_

- [x] 15. Testing and validation
  - [x] 15.1 Test complete registration flow
    - Register new user
    - Verify pending status in database
    - Attempt login (should fail with pending message)
    - Login as super admin
    - Approve user
    - Login as approved user (should succeed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

  - [x] 15.2 Test admin dashboard functionality
    - Login as super admin
    - View all users
    - Filter by status
    - Search for users
    - Approve pending user
    - Reject pending user with reason
    - Deactivate approved user
    - Activate deactivated user
    - Verify statistics update
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.4, 4.5_

  - [x] 15.3 Test security and authorization
    - Attempt to access admin routes as regular user (should fail)
    - Verify JWT token includes role
    - Test admin middleware protection
    - Verify cannot modify own account
    - _Requirements: 6.1, 6.2, 6.4_

- [x] 16. Documentation
  - [x] 16.1 Update API documentation
    - Document new admin endpoints
    - Document updated auth endpoints
    - Add example requests/responses
    - Document error codes
    - _Requirements: All_

  - [x] 16.2 Update README
    - Add super admin setup instructions
    - Document environment variables
    - Add admin dashboard usage guide
    - Update deployment instructions
    - _Requirements: 7.1, 7.2_

  - [x] 16.3 Create admin user guide
    - Document how to approve/reject users
    - Explain user statuses
    - Document user management actions
    - Add screenshots of admin dashboard
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_
