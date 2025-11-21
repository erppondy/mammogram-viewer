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

export interface User {
  id: string;
  email: string;
  fullName: string;
  professionalCredentials?: string;
  role?: 'user' | 'super_admin';
  status?: 'pending' | 'approved' | 'rejected' | 'deactivated';
}

export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await api.post('/auth/login', credentials);
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    return { token, user };
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

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
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
};
