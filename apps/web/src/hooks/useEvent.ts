import type { EventWithOrganizer } from '@convoca/shared';
import { eventsService } from '@/services/eventsService';
import { useFetch } from './useFetch';

export function useEvent(id: string | undefined) {
  return useFetch<EventWithOrganizer>(
    () => {
      if (!id) return Promise.reject({ error: 'ID requerido', status: 400 });
      return eventsService.getById(id);
    },
    [id]
  );
}
