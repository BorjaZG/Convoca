import type { EventWithOrganizer, PaginatedResponse } from '@convoca/shared';
import { eventsService, type EventFilters } from '@/services/eventsService';
import { useFetch } from './useFetch';

export function useEvents(filters: EventFilters = {}) {
  const { page, limit, category, city, q, startDate, endDate, maxPrice, sortBy, order } = filters;

  return useFetch<PaginatedResponse<EventWithOrganizer>>(
    () =>
      eventsService.list({
        page,
        limit,
        category,
        city,
        q,
        startDate,
        endDate,
        maxPrice,
        sortBy,
        order,
      }),
    [page, limit, category, city, q, startDate, endDate, maxPrice, sortBy, order]
  );
}
