import type { ReservationWithEvent } from '@/types';
import { reservationsService, type ReservationFilters } from '@/services/reservationsService';
import { useFetch } from './useFetch';

export function useMyReservations(filters: ReservationFilters = {}) {
  const { status, startDate, endDate } = filters;
  return useFetch<ReservationWithEvent[]>(
    () => reservationsService.mine({ status, startDate, endDate }),
    [status, startDate, endDate]
  );
}
