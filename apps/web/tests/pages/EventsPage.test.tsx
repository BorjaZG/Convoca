import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

const mockPage: PaginatedResponse<EventWithOrganizer> = {
  data: [mockEvent],
  pagination: { page: 1, limit: 9, total: 1, totalPages: 1 },
};

const emptyPage: PaginatedResponse<EventWithOrganizer> = {
  data: [],
  pagination: { page: 1, limit: 9, total: 0, totalPages: 0 },
};

function setup() {
  return render(
    <MemoryRouter>
      <EventsPage />
    </MemoryRouter>
  );
}

describe('EventsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra la lista de eventos tras resolver la petición inicial', async () => {
    vi.mocked(eventsService.list).mockResolvedValue(mockPage);
    setup();
    await waitFor(() => expect(screen.getByText('Concierto de Primavera')).toBeInTheDocument());
  });

  it('muestra EmptyState cuando no hay resultados', async () => {
    vi.mocked(eventsService.list).mockResolvedValue(emptyPage);
    setup();
    await waitFor(() =>
      expect(screen.getByText('No se encontraron eventos')).toBeInTheDocument()
    );
  });

  it('cambiar filtro de categoría vuelve a llamar al servicio con el nuevo valor', async () => {
    vi.mocked(eventsService.list).mockResolvedValue(mockPage);
    setup();
    await waitFor(() => expect(screen.getByText('Concierto de Primavera')).toBeInTheDocument());

    const callsBefore = vi.mocked(eventsService.list).mock.calls.length;

    fireEvent.change(screen.getByRole('combobox', { name: /categoría/i }), {
      target: { value: 'TALLER' },
    });

    await waitFor(() =>
      expect(vi.mocked(eventsService.list).mock.calls.length).toBeGreaterThan(callsBefore)
    );
    const lastArgs = vi.mocked(eventsService.list).mock.calls.at(-1)![0];
    expect(lastArgs.category).toBe('TALLER');
  });
});
