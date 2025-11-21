# Authentication System Documentation

## Overview

The authentication system provides secure user registration, login, and JWT-based authentication for the mammogram viewer application.

## Features

- User registration with email validation
- Password strength requirements
- Secure password hashing with bcrypt (12 salt rounds)
- JWT token generation and verification
- Session timeout (30 minutes of inactivity)
- Protected routes with authentication middleware

## API Endpoints

### POST /api/auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "doctor@example.com",
  "password": "SecurePass123",
  "fullName": "Dr. John Doe",
  "professionalCredentials": "MD, Radiologist"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "doctor@example.com",
      "fullName": "Dr. John Doe",
      "professionalCredentials": "MD, Radiologist",
      "isVerified": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastLoginAt": null
    }
  }
}
```

**Validation Rules:**
- Email: Required, valid email format
- Password: Required, minimum 8 characters, must contain uppercase, lowercase, and numbers
- Full Name: Required, minimum 2 characters
- Professional Credentials: Optional

**Error Responses:**
- 400: Validation error or weak password
- 409: Email already registered

### POST /api/auth/login

Login with existing credentials.

**Request Body:**
```json
{
  "email": "doctor@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "doctor@example.com",
      "fullName": "Dr. John Doe",
      "professionalCredentials": "MD, Radiologist",
      "isVerified": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastLoginAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**
- 400: Validation error
- 401: Invalid credentials

### GET /api/auth/verify

Verify JWT token and get user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "doctor@example.com",
    "fullName": "Dr. John Doe",
    "professionalCredentials": "MD, Radiologist",
    "isVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLoginAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- 401: No token, invalid token, expired token, or session expired

### GET /api/auth/me

Get current user profile (same as verify).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** Same as /api/auth/verify

## Authentication Middleware

### authMiddleware

Protects routes by requiring valid JWT token.

**Usage:**
```typescript
import { authMiddleware } from './middleware/auth';

router.get('/protected', authMiddleware, (req, res) => {
  const user = req.user; // User object attached by middleware
  res.json({ user });
});
```

**Features:**
- Validates JWT token from Authorization header
- Checks session timeout (30 minutes)
- Attaches user object to request
- Returns appropriate error codes

**Error Codes:**
- `NO_TOKEN`: No authorization header provided
- `INVALID_TOKEN_FORMAT`: Authorization header format is incorrect
- `TOKEN_EXPIRED`: JWT token has expired
- `INVALID_TOKEN`: Token is invalid or user not found
- `SESSION_EXPIRED`: User inactive for more than 30 minutes

### optionalAuthMiddleware

Attaches user if token is provided, but doesn't require it.

**Usage:**
```typescript
import { optionalAuthMiddleware } from './middleware/auth';

router.get('/public', optionalAuthMiddleware, (req, res) => {
  const user = req.user; // May be undefined
  if (user) {
    // User is authenticated
  } else {
    // Anonymous access
  }
});
```

## Password Requirements

Passwords must meet the following criteria:
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

Examples:
- ✅ `Password123`
- ✅ `SecurePass1`
- ✅ `MyP@ssw0rd`
- ❌ `password` (no uppercase, no numbers)
- ❌ `PASSWORD123` (no lowercase)
- ❌ `Pass1` (too short)

## Security Features

### Password Hashing
- Uses bcrypt with 12 salt rounds
- Passwords are never stored in plain text
- Hash comparison is done securely

### JWT Tokens
- Signed with secret key (configurable via JWT_SECRET env var)
- Default expiration: 24 hours
- Contains user ID and email
- Verified on every protected request

### Session Management
- 30-minute inactivity timeout
- Last login time tracked
- Automatic session expiration

### Input Validation
- Email format validation
- Password strength validation
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization)

## Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

## Client Integration

### Registration Example

```typescript
const response = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'doctor@example.com',
    password: 'SecurePass123',
    fullName: 'Dr. John Doe',
    professionalCredentials: 'MD, Radiologist',
  }),
});

const data = await response.json();
if (data.success) {
  const { token, user } = data.data;
  // Store token for future requests
  localStorage.setItem('token', token);
}
```

### Login Example

```typescript
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'doctor@example.com',
    password: 'SecurePass123',
  }),
});

const data = await response.json();
if (data.success) {
  const { token, user } = data.data;
  localStorage.setItem('token', token);
}
```

### Authenticated Request Example

```typescript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/api/protected-endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

const data = await response.json();
```

### Token Verification Example

```typescript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/api/auth/verify', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

if (response.status === 401) {
  // Token expired or invalid, redirect to login
  localStorage.removeItem('token');
  window.location.href = '/login';
}
```

## Testing

Run authentication tests:

```bash
npm test -- AuthService
npm test -- auth.routes
npm test -- auth.middleware
```

## Troubleshooting

### "Email already registered"
- The email is already in use
- Try logging in instead or use a different email

### "Invalid credentials"
- Email or password is incorrect
- Check for typos
- Passwords are case-sensitive

### "Token expired"
- JWT token has exceeded 24-hour expiration
- User needs to log in again

### "Session expired"
- User has been inactive for more than 30 minutes
- User needs to log in again

### "Weak password"
- Password doesn't meet strength requirements
- Ensure password has uppercase, lowercase, and numbers
- Minimum 8 characters required

## Best Practices

1. **Always use HTTPS in production** to protect tokens in transit
2. **Store tokens securely** (httpOnly cookies preferred over localStorage)
3. **Implement token refresh** for better user experience
4. **Log authentication events** for security auditing
5. **Rate limit authentication endpoints** to prevent brute force attacks
6. **Implement account lockout** after multiple failed attempts
7. **Use strong JWT secrets** in production (minimum 32 characters)
8. **Rotate JWT secrets** periodically
9. **Implement email verification** before allowing full access
10. **Add two-factor authentication** for enhanced security

## Future Enhancements

- Email verification system
- Password reset functionality
- Two-factor authentication (2FA)
- OAuth integration (Google, Microsoft)
- Refresh token mechanism
- Account lockout after failed attempts
- Password history to prevent reuse
- Role-based access control (RBAC)
- Audit logging for all auth events
