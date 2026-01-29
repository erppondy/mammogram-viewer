import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  professionalCredentials?: string;
}

export interface RegisterAmbulanceUserData {
  email: string;
  password: string;
  fullName: string;
  professionalCredentials?: string;
  licenseKey: string;
  ambulanceRole?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  professionalCredentials?: string;
  role?: 'user' | 'super_admin';
  status?: 'pending' | 'approved' | 'rejected' | 'deactivated';
  licenseId?: string;
  ambulanceRole?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  license?: {
    licenseId: string;
    ambulanceName: string;
    status: string;
    expiresAt: string;
    uploadQuota: number;
    uploadsUsed: number;
    uploadsRemaining: number;
    quotaUsagePercent: number;
    daysUntilExpiry: number;
  };
}

export interface LicenseStatus {
  hasLicense: boolean;
  license: {
    id: string;
    licenseKey: string;
    ambulanceName: string;
    status: 'active' | 'expired' | 'revoked';
    uploadQuota: number;
    uploadsUsed: number;
    uploadsRemaining: number;
    quotaUsagePercent: number;
    expiresAt: string;
    daysUntilExpiry: number;
    isExpiringSoon: boolean;
    isQuotaLow: boolean;
  } | null;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post('/auth/login', credentials);
    const { token, user, license } = response.data;
    localStorage.setItem('token', token);
    
    // Store license info if available
    if (license) {
      localStorage.setItem('licenseInfo', JSON.stringify(license));
    }
    
    return { token, user, license };
  },

  async register(data: RegisterData) {
    const response = await api.post('/auth/register', data);
    // Registration now returns a different format with requiresApproval
    if (response.data.requiresApproval) {
      return response.data; // { message, user, requiresApproval }
    }
    const { token, user } = response.data;
    if (token) {
      localStorage.setItem('token', token);
    }
    return { token, user };
  },

  async registerAmbulanceUser(data: RegisterAmbulanceUserData) {
    const response = await api.post('/auth/register/ambulance', data);
    // Ambulance registration may also require approval
    if (response.data.requiresApproval) {
      return response.data; // { message, user, requiresApproval }
    }
    const { token, user } = response.data;
    if (token) {
      localStorage.setItem('token', token);
    }
    return { token, user, message: response.data.message };
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('licenseInfo');
    // Use the base path from environment or default
    const basePath = import.meta.env.VITE_BASE_PATH || '/mammogram';
    window.location.href = `${basePath}/login`;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },

  isAdmin(user: User | null): boolean {
    return user?.role === 'super_admin';
  },

  getUserRole(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || null;
    } catch {
      return null;
    }
  },

  async getLicenseStatus(): Promise<LicenseStatus> {
    const response = await api.get('/auth/license-status');
    return response.data.data;
  },
};
