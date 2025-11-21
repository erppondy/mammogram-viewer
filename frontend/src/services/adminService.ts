import api from './api';

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  professionalCredentials: string | null;
  isVerified: boolean;
  role: 'user' | 'super_admin';
  status: 'pending' | 'approved' | 'rejected' | 'deactivated';
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface SystemStats {
  totalUsers: number;
  pendingUsers: number;
  approvedUsers: number;
  rejectedUsers: number;
  deactivatedUsers: number;
}

export interface UserFilters {
  status?: 'pending' | 'approved' | 'rejected' | 'deactivated';
  role?: 'user' | 'super_admin';
  search?: string;
}

class AdminService {
  async getAllUsers(filters?: UserFilters): Promise<UserResponse[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.role) params.append('role', filters.role);
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    const url = `/admin/users${queryString ? `?${queryString}` : ''}`;

    const response = await api.get(url);
    return response.data;
  }

  async getPendingUsers(): Promise<UserResponse[]> {
    const response = await api.get('/admin/users/pending');
    return response.data;
  }

  async approveUser(userId: string): Promise<void> {
    await api.put(`/admin/users/${userId}/approve`);
  }

  async rejectUser(userId: string, reason?: string): Promise<void> {
    await api.put(`/admin/users/${userId}/reject`, { reason });
  }

  async deactivateUser(userId: string): Promise<void> {
    await api.put(`/admin/users/${userId}/deactivate`);
  }

  async activateUser(userId: string): Promise<void> {
    await api.put(`/admin/users/${userId}/activate`);
  }

  async deleteUser(userId: string): Promise<void> {
    await api.delete(`/admin/users/${userId}`);
  }

  async getStats(): Promise<SystemStats> {
    const response = await api.get('/admin/stats');
    return response.data;
  }
}

export const adminService = new AdminService();
