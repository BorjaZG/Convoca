import type { EventWithOrganizer, PaginatedResponse } from '@convoca/shared';
import { api } from './api';

export type EventFilters = {
  page?: number;
  limit?: number;
  category?: string;
  city?: string;
  q?: string;
  startDate?: string;
  endDate?: string;
  maxPrice?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
};

export type CreateEventData = {
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  venue: string;
  city: string;
  capacity: number;
  price: number;
  imageUrl?: string;
  status?: string;
  featured?: boolean;
};

export const eventsService = {
  list: (filters: EventFilters = {}): Promise<PaginatedResponse<EventWithOrganizer>> => {
    const params = new URLSearchParams();
    (Object.entries(filters) as [string, string | number | undefined][]).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.set(k, String(v));
    });
    const qs = params.toString();
    return api.get<PaginatedResponse<EventWithOrganizer>>(`/api/events${qs ? `?${qs}` : ''}`);
  },

  getById: async (id: string): Promise<EventWithOrganizer> => {
    const res = await api.get<{ data: EventWithOrganizer }>(`/api/events/${id}`);
    return res.data;
  },

  create: async (data: CreateEventData): Promise<EventWithOrganizer> => {
    const res = await api.post<{ data: EventWithOrganizer }>('/api/events', data);
    return res.data;
  },

  update: async (id: string, data: Partial<CreateEventData>): Promise<EventWithOrganizer> => {
    const res = await api.put<{ data: EventWithOrganizer }>(`/api/events/${id}`, data);
    return res.data;
  },

  remove: (id: string): Promise<void> => api.delete(`/api/events/${id}`),

  mine: async (): Promise<EventWithOrganizer[]> => {
    const res = await api.get<{ data: EventWithOrganizer[] }>('/api/events/mine');
    return res.data;
  },
};
