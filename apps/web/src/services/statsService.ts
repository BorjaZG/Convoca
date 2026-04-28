import type { AdminStats, OrganizerStats, UserStats } from '@convoca/shared';
import { api } from './api';

export const statsService = {
  me: async (): Promise<UserStats | OrganizerStats | AdminStats> => {
    const res = await api.get<{ data: UserStats | OrganizerStats | AdminStats }>('/api/stats/me');
    return res.data;
  },
};
