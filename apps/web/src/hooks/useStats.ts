import type { AdminStats, OrganizerStats, UserStats } from '@convoca/shared';
import { statsService } from '@/services/statsService';
import { useFetch } from './useFetch';

export function useStats() {
  return useFetch<UserStats | OrganizerStats | AdminStats>(() => statsService.me());
}
