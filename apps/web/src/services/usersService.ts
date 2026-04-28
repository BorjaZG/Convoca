import type { PaginatedResponse, Role, User } from '@convoca/shared';
import { api } from './api';

export const usersService = {
  list: (page = 1, limit = 20, role?: Role): Promise<PaginatedResponse<User>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (role) params.set('role', role);
    return api.get<PaginatedResponse<User>>(`/api/users?${params}`);
  },

  updateRole: async (id: string, role: Role): Promise<User> => {
    const res = await api.patch<{ data: User }>(`/api/users/${id}/role`, { role });
    return res.data;
  },

  remove: (id: string): Promise<void> => api.delete(`/api/users/${id}`),
};
