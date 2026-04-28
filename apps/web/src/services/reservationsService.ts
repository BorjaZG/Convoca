import type { Reservation, ReservationStatus } from '@convoca/shared';
import type { ReservationWithEvent } from '@/types';
import { api } from './api';

export type CreateReservationData = {
  eventId: string;
  quantity: number;
};

export type ReservationFilters = {
  status?: ReservationStatus;
  startDate?: string;
  endDate?: string;
};

export const reservationsService = {
  create: async (data: CreateReservationData): Promise<ReservationWithEvent> => {
    const res = await api.post<{ data: ReservationWithEvent }>('/api/reservations', data);
    return res.data;
  },

  mine: async (filters: ReservationFilters = {}): Promise<ReservationWithEvent[]> => {
    const params = new URLSearchParams(
      Object.entries(filters).filter((entry): entry is [string, string] => entry[1] !== undefined)
    ).toString();
    const res = await api.get<{ data: ReservationWithEvent[] }>(
      `/api/reservations/me${params ? `?${params}` : ''}`
    );
    return res.data;
  },

  byEvent: async (eventId: string): Promise<Reservation[]> => {
    const res = await api.get<{ data: Reservation[] }>(`/api/reservations/event/${eventId}`);
    return res.data;
  },

  cancel: async (id: string): Promise<Reservation> => {
    const res = await api.patch<{ data: Reservation }>(`/api/reservations/${id}/cancel`);
    return res.data;
  },
};
