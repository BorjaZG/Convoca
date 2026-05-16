import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventsPage } from '@/pages/events/EventsPage';
import { eventsService } from '@/services/eventsService';
import type { EventWithOrganizer, PaginatedResponse } from '@convoca/shared';

vi.mock('@/services/eventsService', () => ({
  eventsService: { list: vi.fn() },
}));

const mockEvent: EventWithOrganizer = {
  id: 'evt-1',
  title: 'Concierto de Primavera',
  description: 'Descripción del evento.',
  category: 'CONCIERTO',
  startDate: new Date('2025-06-15T19:00:00'),
  endDate: new Date('2025-06-15T22:00:00'),
  venue: 'Parque del Retiro',
  city: 'Madrid',
  capacity: 100,
  price: 15,
  status: 'PUBLISHED',
  featured: false,
  organizerId: 'org-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  organizer: { id: 'org-1', email: 'org@test.com', name: 'Org Test', role: 'ORGANIZER' },
};

describe('EventsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra los eventos cuando la petición tiene éxito', async () => {
    const mockPage: PaginatedResponse<EventWithOrganizer> = {
      data: [mockEvent],
      pagination: { page: 1, limit: 9, total: 1, totalPages: 1 },
    };
    vi.mocked(eventsService.list).mockResolvedValue(mockPage);

    render(
      <MemoryRouter>
        <EventsPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Concierto de Primavera')).toBeInTheDocument());
  });

  it('muestra mensaje cuando no hay eventos', async () => {
    const emptyPage: PaginatedResponse<EventWithOrganizer> = {
      data: [],
      pagination: { page: 1, limit: 9, total: 0, totalPages: 0 },
    };
    vi.mocked(eventsService.list).mockResolvedValue(emptyPage);

    render(
      <MemoryRouter>
        <EventsPage />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText('No se encontraron eventos')).toBeInTheDocument()
    );
  });
});
