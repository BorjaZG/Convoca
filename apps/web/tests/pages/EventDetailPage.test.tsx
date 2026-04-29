import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventDetailPage } from '@/pages/events/EventDetailPage';
import type { EventWithOrganizer } from '@convoca/shared';

// Estado mutable que cada test configura antes de renderizar
let mockIsAuthenticated = false;

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: mockIsAuthenticated }),
}));

vi.mock('@/context/ToastContext', () => ({
  useToast: () => ({ toast: { success: vi.fn(), error: vi.fn() } }),
}));

vi.mock('@/services/reviewsService', () => ({
  reviewsService: {
    byEvent: vi.fn().mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    }),
  },
}));

const mockEvent: EventWithOrganizer = {
  id: 'evt-1',
  title: 'Festival de Jazz',
  description: 'Un evento de jazz al aire libre.',
  category: 'CONCIERTO',
  startDate: new Date('2025-09-10T20:00:00'),
  endDate: new Date('2025-09-10T23:00:00'),
  venue: 'Plaza Mayor',
  city: 'Madrid',
  capacity: 500,
  price: 25,
  status: 'PUBLISHED',
  featured: false,
  organizerId: 'org-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  organizer: { id: 'org-1', email: 'org@test.com', name: 'Jazz Org', role: 'ORGANIZER' },
  averageRating: null,
  _count: { reservations: 0, reviews: 0 },
};

vi.mock('@/hooks/useEvent', () => ({
  useEvent: () => ({ data: mockEvent, loading: false, error: null, refetch: vi.fn() }),
}));

function setup() {
  return render(
    <MemoryRouter initialEntries={['/events/evt-1']}>
      <Routes>
        <Route path="/events/:id" element={<EventDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('EventDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = false;
  });

  it('renderiza el título del evento', async () => {
    setup();
    await waitFor(() => expect(screen.getByText('Festival de Jazz')).toBeInTheDocument());
  });

  it('usuario no autenticado ve "Inicia sesión" en lugar del formulario de reserva', async () => {
    mockIsAuthenticated = false;
    setup();
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /inicia sesión/i })).toBeInTheDocument()
    );
    expect(screen.queryByRole('button', { name: /confirmar reserva/i })).not.toBeInTheDocument();
  });

  it('usuario autenticado ve el botón "Confirmar reserva"', async () => {
    mockIsAuthenticated = true;
    setup();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /confirmar reserva/i })).toBeInTheDocument()
    );
    expect(screen.queryByRole('link', { name: /inicia sesión/i })).not.toBeInTheDocument();
  });
});
