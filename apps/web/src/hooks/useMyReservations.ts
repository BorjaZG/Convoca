import type { ReservationWithEvent } from '@/types';
import { reservationsService } from '@/services/reservationsService';
import { useFetch } from './useFetch';

export function useMyReservations() {
  return useFetch<ReservationWithEvent[]>(() => reservationsService.mine());
}
