import type { User } from '@convoca/shared';
import { api } from './api';

type AuthResponse = { user: User };

export const authService = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post<AuthResponse>('/api/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/api/auth/login', data),

  logout: () => api.post<{ message: string }>('/api/auth/logout'),

  getMe: () => api.get<AuthResponse>('/api/auth/me'),
};
