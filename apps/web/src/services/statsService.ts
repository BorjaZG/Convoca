import type { AdminStats, OrganizerStats, UserStats } from '@convoca/shared';
import { api } from './api';

export type StatsDateRange = { startDate?: string; endDate?: string };

export const statsService = {
  me: async (range?: StatsDateRange): Promise<UserStats | OrganizerStats | AdminStats> => {
    const params = range
      ? new URLSearchParams(
          Object.entries(range).filter((entry): entry is [string, string] => entry[1] !== undefined)
        ).toString()
      : '';
    const res = await api.get<{ data: UserStats | OrganizerStats | AdminStats }>(
      `/api/stats/me${params ? `?${params}` : ''}`
    );
    return res.data;
  },
};
