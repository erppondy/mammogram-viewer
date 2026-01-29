export type UserRole = 'user' | 'doctor' | 'super_admin';
export type UserStatus = 'pending' | 'approved' | 'rejected' | 'deactivated';
export type AmbulanceRole = 'operator' | 'supervisor' | 'admin' | 'doctor';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  professionalCredentials: string | null;
  isVerified: boolean;
  role: UserRole;
  status: UserStatus;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
  licenseId: string | null;
  ambulanceRole: AmbulanceRole | null;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  fullName: string;
  professionalCredentials?: string;
  role?: UserRole;
  status?: UserStatus;
  licenseId?: string;
  ambulanceRole?: AmbulanceRole;
}

export interface UpdateUserDTO {
  email?: string;
  fullName?: string;
  professionalCredentials?: string;
  isVerified?: boolean;
  lastLoginAt?: Date;
  licenseId?: string;
  ambulanceRole?: AmbulanceRole;
}

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  professionalCredentials: string | null;
  isVerified: boolean;
  role: UserRole;
  status: UserStatus;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
  licenseId: string | null;
  ambulanceRole: AmbulanceRole | null;
  createdAt: Date;
  lastLoginAt: Date | null;
}

/**
 * Convert User to UserResponse (exclude password hash)
 */
export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    professionalCredentials: user.professionalCredentials,
    isVerified: user.isVerified,
    role: user.role,
    status: user.status,
    approvedBy: user.approvedBy,
    approvedAt: user.approvedAt,
    rejectionReason: user.rejectionReason,
    licenseId: user.licenseId,
    ambulanceRole: user.ambulanceRole,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}
