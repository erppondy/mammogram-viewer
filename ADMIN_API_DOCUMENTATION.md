# Admin Approval System API Documentation

## Overview

The Admin Approval System provides endpoints for managing user accounts, approvals, and system administration.

## Authentication

All admin endpoints require:
1. Valid JWT token in Authorization header: `Bearer <token>`
2. User role must be `super_admin`

## Base URL

```
http://localhost:3000/api
```

## Auth Endpoints

### Register User

Creates a new user account with pending status.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "fullName": "John Doe",
  "professionalCredentials": "MD" // optional
}
```

**Success Response (201):**
```json
{
  "message": "Registration successful! Your account is pending approval...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "professionalCredentials": "MD",
    "isVerified": false,
    "role": "user",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "requiresApproval": true
}
```

**Error Responses:**
- `409` - Email already registered
- `400` - Weak password or invalid email

### Login

Authenticates a user and returns JWT token.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Success Response (200):**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "user",
    "status": "approved"
  }
}
```

**Error Responses:**
- `401` - Invalid credentials
- `403` - Account pending/rejected/deactivated
  - `ACCOUNT_PENDING`: Account awaiting approval
  - `ACCOUNT_REJECTED`: Account has been rejected
  - `ACCOUNT_DEACTIVATED`: Account has been deactivated

## Admin Endpoints

### Get All Users

Retrieves all users with optional filtering.

**Endpoint:** `GET /admin/users`

**Query Parameters:**
- `status` (optional): Filter by status (pending, approved, rejected, deactivated)
- `role` (optional): Filter by role (user, super_admin)
- `search` (optional): Search by email or full name

**Example:**
```
GET /admin/users?status=pending&search=john
```

**Success Response (200):**
```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "professionalCredentials": "MD",
    "isVerified": false,
    "role": "user",
    "status": "pending",
    "approvedBy": null,
    "approvedAt": null,
    "rejectionReason": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLoginAt": null
  }
]
```

### Get Pending Users

Retrieves all users with pending status, ordered by creation date.

**Endpoint:** `GET /admin/users/pending`

**Success Response (200):**
```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Approve User

Approves a pending or rejected user.

**Endpoint:** `PUT /admin/users/:id/approve`

**Success Response (200):**
```json
{
  "message": "User approved successfully"
}
```

**Error Responses:**
- `404` - User not found
- `400` - Invalid status transition
- `403` - Cannot modify your own account

### Reject User

Rejects a pending or approved user.

**Endpoint:** `PUT /admin/users/:id/reject`

**Request Body:**
```json
{
  "reason": "Invalid credentials provided" // optional
}
```

**Success Response (200):**
```json
{
  "message": "User rejected successfully"
}
```

**Error Responses:**
- `404` - User not found
- `400` - Invalid status transition
- `403` - Cannot modify your own account

### Deactivate User

Deactivates an approved user.

**Endpoint:** `PUT /admin/users/:id/deactivate`

**Success Response (200):**
```json
{
  "message": "User deactivated successfully"
}
```

**Error Responses:**
- `404` - User not found
- `400` - Invalid status transition (can only deactivate approved users)
- `403` - Cannot modify your own account

### Activate User

Reactivates a deactivated user.

**Endpoint:** `PUT /admin/users/:id/activate`

**Success Response (200):**
```json
{
  "message": "User activated successfully"
}
```

**Error Responses:**
- `404` - User not found
- `400` - Invalid status transition (can only activate deactivated users)
- `403` - Cannot modify your own account

### Delete User

Permanently deletes a user and all associated data.

**Endpoint:** `DELETE /admin/users/:id`

**Success Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

**Error Responses:**
- `404` - User not found
- `403` - Cannot delete your own account

### Get System Statistics

Retrieves system-wide user statistics.

**Endpoint:** `GET /admin/stats`

**Success Response (200):**
```json
{
  "totalUsers": 100,
  "pendingUsers": 15,
  "approvedUsers": 75,
  "rejectedUsers": 5,
  "deactivatedUsers": 5
}
```

## User Status Flow

```
pending → approved → deactivated → approved
        ↓
      rejected → approved
```

## Error Codes

| Code | Description |
|------|-------------|
| `EMAIL_EXISTS` | Email already registered |
| `WEAK_PASSWORD` | Password doesn't meet requirements |
| `INVALID_CREDENTIALS` | Invalid email or password |
| `ACCOUNT_PENDING` | Account awaiting admin approval |
| `ACCOUNT_REJECTED` | Account has been rejected |
| `ACCOUNT_DEACTIVATED` | Account has been deactivated |
| `USER_NOT_FOUND` | User does not exist |
| `INVALID_STATUS_TRANSITION` | Cannot perform action on current status |
| `CANNOT_MODIFY_SELF` | Admin cannot modify their own account |

## Security Notes

1. All admin endpoints require `super_admin` role
2. Admins cannot modify their own accounts
3. JWT tokens include role and status information
4. Tokens expire after 24 hours (configurable)
5. Passwords must be at least 8 characters long
