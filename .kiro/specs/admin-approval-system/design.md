# Admin Approval System - Design Document

## Overview

This design implements a role-based access control system with super admin capabilities and user approval workflow. The system ensures that only approved users can access the application, with super admins having full control over user management.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   Frontend      │
│  - Admin UI     │
│  - User Status  │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼────────┐
│   Backend API   │
│  - Auth Routes  │
│  - Admin Routes │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼───┐
│ Auth │  │Admin │
│ Svc  │  │ Svc  │
└───┬──┘  └──┬───┘
    │        │
    └────┬───┘
         │
    ┌────▼────┐
    │Database │
    │ - Users │
    └─────────┘
```

## Components and Interfaces

### 1. Database Layer

#### Migration: Add User Roles and Status

**File**: `backend/src/database/migrations/002_add_user_roles_and_status.sql`

```sql
-- Add role column
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user' NOT NULL;

-- Add status column
ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'pending' NOT NULL;

-- Add approval tracking
ALTER TABLE users ADD COLUMN approved_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN approved_at TIMESTAMP;
ALTER TABLE users ADD COLUMN rejection_reason TEXT;

-- Create indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Update existing users to approved status
UPDATE users SET status = 'approved' WHERE status = 'pending';

-- Add check constraints
ALTER TABLE users ADD CONSTRAINT chk_role CHECK (role IN ('user', 'super_admin'));
ALTER TABLE users ADD CONSTRAINT chk_status CHECK (status IN ('pending', 'approved', 'rejected', 'deactivated'));
```

#### Seed: Create Default Super Admin

**File**: `backend/src/database/seeds/001_create_super_admin.ts`

```typescript
import { pool } from '../config/database';
import bcrypt from 'bcrypt';

export async function createDefaultSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL || 'admin@mammogram-viewer.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456';
  const username = process.env.SUPER_ADMIN_USERNAME || 'superadmin';

  // Check if super admin already exists
  const existing = await pool.query(
    'SELECT id FROM users WHERE email = $1 OR role = $2',
    [email, 'super_admin']
  );

  if (existing.rows.length > 0) {
    console.log('Super admin already exists');
    return;
  }

  // Create super admin
  const hashedPassword = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO users (id, username, email, password, role, status, created_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())`,
    [username, email, hashedPassword, 'super_admin', 'approved']
  );

  console.log('Super admin created successfully');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}
```

### 2. Backend Models

#### Updated User Model

**File**: `backend/src/models/User.ts`

```typescript
export type UserRole = 'user' | 'super_admin';
export type UserStatus = 'pending' | 'approved' | 'rejected' | 'deactivated';

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
}

export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
}
```

### 3. Backend Services

#### Admin Service

**File**: `backend/src/services/AdminService.ts`

```typescript
export class AdminService {
  async getAllUsers(filters?: {
    status?: UserStatus;
    role?: UserRole;
    search?: string;
  }): Promise<UserResponse[]>;

  async getPendingUsers(): Promise<UserResponse[]>;

  async approveUser(userId: string, adminId: string): Promise<void>;

  async rejectUser(
    userId: string,
    adminId: string,
    reason?: string
  ): Promise<void>;

  async deactivateUser(userId: string, adminId: string): Promise<void>;

  async activateUser(userId: string, adminId: string): Promise<void>;

  async deleteUser(userId: string): Promise<void>;

  async getSystemStats(): Promise<{
    totalUsers: number;
    pendingUsers: number;
    approvedUsers: number;
    rejectedUsers: number;
    deactivatedUsers: number;
  }>;
}
```

#### Updated Auth Service

**File**: `backend/src/services/AuthService.ts`

```typescript
export class AuthService {
  async register(data: CreateUserDTO): Promise<{
    message: string;
    status: 'pending';
  }>;

  async login(email: string, password: string): Promise<{
    token: string;
    user: UserResponse;
  }>;

  // Check user status before allowing login
  private async validateUserStatus(user: User): Promise<void>;
}
```

### 4. Backend Middleware

#### Admin Authorization Middleware

**File**: `backend/src/middleware/adminAuth.ts`

```typescript
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    if (user.role !== 'super_admin') {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
        },
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Authorization check failed',
      },
    });
  }
};
```

### 5. Backend Routes

#### Admin Routes

**File**: `backend/src/routes/admin.routes.ts`

```typescript
const router = Router();

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(requireAdmin);

// User management
router.get('/users', getAllUsers);
router.get('/users/pending', getPendingUsers);
router.put('/users/:id/approve', approveUser);
router.put('/users/:id/reject', rejectUser);
router.put('/users/:id/deactivate', deactivateUser);
router.put('/users/:id/activate', activateUser);
router.delete('/users/:id', deleteUser);

// Statistics
router.get('/stats', getSystemStats);

export default router;
```

#### Updated Auth Routes

**File**: `backend/src/routes/auth.routes.ts`

```typescript
// Registration returns pending status
router.post('/register', async (req, res) => {
  // Create user with 'pending' status
  // Return message about approval process
});

// Login checks user status
router.post('/login', async (req, res) => {
  // Verify credentials
  // Check user status
  // Block if pending/rejected/deactivated
  // Allow if approved
});
```

### 6. Frontend Components

#### Admin Dashboard Page

**File**: `frontend/src/pages/AdminDashboardPage.tsx`

```typescript
export default function AdminDashboardPage() {
  // State for users list, filters, stats
  // Fetch users on mount
  // Handle approve/reject actions
  // Display user table with actions
  // Show statistics cards
}
```

#### User Management Table Component

**File**: `frontend/src/components/admin/UserManagementTable.tsx`

```typescript
interface UserManagementTableProps {
  users: User[];
  onApprove: (userId: string) => void;
  onReject: (userId: string, reason?: string) => void;
  onDeactivate: (userId: string) => void;
  onActivate: (userId: string) => void;
  onDelete: (userId: string) => void;
}

export default function UserManagementTable(props: UserManagementTableProps) {
  // Render table with user data
  // Show status badges
  // Action buttons based on status
  // Confirmation modals
}
```

#### Admin Stats Component

**File**: `frontend/src/components/admin/AdminStats.tsx`

```typescript
interface AdminStatsProps {
  stats: {
    totalUsers: number;
    pendingUsers: number;
    approvedUsers: number;
    rejectedUsers: number;
    deactivatedUsers: number;
  };
}

export default function AdminStats(props: AdminStatsProps) {
  // Display statistics cards
  // Color-coded by status
  // Click to filter users
}
```

### 7. Frontend Services

#### Admin API Service

**File**: `frontend/src/services/adminService.ts`

```typescript
export const adminService = {
  getAllUsers: (filters?: UserFilters) => api.get('/admin/users', { params: filters }),
  getPendingUsers: () => api.get('/admin/users/pending'),
  approveUser: (userId: string) => api.put(`/admin/users/${userId}/approve`),
  rejectUser: (userId: string, reason?: string) => 
    api.put(`/admin/users/${userId}/reject`, { reason }),
  deactivateUser: (userId: string) => api.put(`/admin/users/${userId}/deactivate`),
  activateUser: (userId: string) => api.put(`/admin/users/${userId}/activate`),
  deleteUser: (userId: string) => api.delete(`/admin/users/${userId}`),
  getStats: () => api.get('/admin/stats'),
};
```

### 8. Frontend Routing

#### Protected Admin Routes

**File**: `frontend/src/App.tsx`

```typescript
// Add admin route protection
<Route
  path="/admin"
  element={
    <ProtectedRoute requireAdmin>
      <AdminDashboardPage />
    </ProtectedRoute>
  }
/>
```

## Data Models

### User Status Flow

```
Registration
     │
     ▼
  PENDING ──────────┐
     │              │
     │ Approve      │ Reject
     │              │
     ▼              ▼
 APPROVED      REJECTED
     │
     │ Deactivate
     ▼
DEACTIVATED
     │
     │ Activate
     ▼
 APPROVED
```

### JWT Token Structure

```typescript
{
  userId: string;
  email: string;
  role: 'user' | 'super_admin';
  status: 'approved'; // Only approved users get tokens
  iat: number;
  exp: number;
}
```

## Error Handling

### Status-Based Login Errors

```typescript
{
  pending: {
    code: 'ACCOUNT_PENDING',
    message: 'Your account is awaiting admin approval',
  },
  rejected: {
    code: 'ACCOUNT_REJECTED',
    message: 'Your account registration was rejected',
    reason: string, // If provided by admin
  },
  deactivated: {
    code: 'ACCOUNT_DEACTIVATED',
    message: 'Your account has been deactivated',
  },
}
```

### Admin Action Errors

```typescript
{
  userNotFound: {
    code: 'USER_NOT_FOUND',
    message: 'User not found',
  },
  invalidStatus: {
    code: 'INVALID_STATUS',
    message: 'Cannot perform this action on user with current status',
  },
  cannotModifySelf: {
    code: 'CANNOT_MODIFY_SELF',
    message: 'Cannot modify your own account',
  },
}
```

## Testing Strategy

### Unit Tests

1. **AdminService Tests**
   - Test user approval/rejection
   - Test status transitions
   - Test statistics calculation

2. **Auth Service Tests**
   - Test registration with pending status
   - Test login with different statuses
   - Test token generation with role

3. **Middleware Tests**
   - Test admin authorization
   - Test role verification
   - Test error handling

### Integration Tests

1. **Admin Routes Tests**
   - Test user management endpoints
   - Test authorization requirements
   - Test error responses

2. **Auth Flow Tests**
   - Test complete registration flow
   - Test login with various statuses
   - Test admin approval workflow

### E2E Tests

1. **User Registration Flow**
   - Register new user
   - Verify pending status
   - Attempt login (should fail)
   - Admin approves
   - Login succeeds

2. **Admin Dashboard Flow**
   - Login as admin
   - View pending users
   - Approve/reject users
   - View statistics

## Security Considerations

1. **Role-Based Access Control**
   - All admin routes protected with `requireAdmin` middleware
   - JWT tokens include role information
   - Frontend checks role before showing admin UI

2. **Status Validation**
   - Login blocked for non-approved users
   - Status transitions validated server-side
   - Cannot approve/reject already processed users

3. **Super Admin Protection**
   - Cannot delete or deactivate own account
   - Cannot change own role
   - Audit trail for admin actions

4. **Password Security**
   - Super admin password configurable via env
   - Strong password requirements enforced
   - Passwords hashed with bcrypt

## Performance Considerations

1. **Database Indexes**
   - Index on `role` column for admin queries
   - Index on `status` column for filtering
   - Composite index on `(status, created_at)` for pending users

2. **Caching**
   - Cache system statistics (5-minute TTL)
   - Cache user counts by status
   - Invalidate cache on user status changes

3. **Pagination**
   - User list paginated (50 users per page)
   - Pending users list paginated
   - Search results paginated

## Deployment Considerations

1. **Environment Variables**
   ```env
   SUPER_ADMIN_EMAIL=admin@example.com
   SUPER_ADMIN_PASSWORD=SecurePassword123!
   SUPER_ADMIN_USERNAME=superadmin
   ```

2. **Database Migration**
   - Run migration to add new columns
   - Update existing users to 'approved' status
   - Create default super admin

3. **Backward Compatibility**
   - Existing users automatically approved
   - Existing JWT tokens remain valid
   - Gradual rollout possible

## Future Enhancements

1. **Email Notifications**
   - Notify users when approved/rejected
   - Notify admins of new registrations

2. **Audit Logging**
   - Log all admin actions
   - Track who approved/rejected users
   - View admin activity history

3. **Multiple Admin Roles**
   - Add 'admin' role (limited permissions)
   - Role hierarchy (super_admin > admin > user)
   - Granular permissions

4. **Bulk Operations**
   - Approve multiple users at once
   - Export user list to CSV
   - Bulk status updates
