import type { AdminStats, OrganizerStats, UserStats } from '@convoca/shared';
import { statsService, type StatsDateRange } from '@/services/statsService';
import { useFetch } from './useFetch';

export function useStats() {
  return useFetch<UserStats | OrganizerStats | AdminStats>(() => statsService.me());
}

export function useUserStats() {
  return useFetch<UserStats>(() => statsService.me() as Promise<UserStats>);
}

export function useOrganizerStats() {
  return useFetch<OrganizerStats>(() => statsService.me() as Promise<OrganizerStats>);
}

export function useAdminStats(range?: StatsDateRange) {
  return useFetch<AdminStats>(
    () => statsService.me(range) as Promise<AdminStats>,
    [range?.startDate, range?.endDate]
  );
}
