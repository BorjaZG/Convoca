import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserDashboardPage } from '@/pages/user/UserDashboardPage';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Test User', email: 'test@example.com', role: 'USER' },
    status: 'authenticated',
    isAuthenticated: true,
    hasRole: () => true,
  }),
}));

vi.mock('@/context/ToastContext', () => ({
  useToast: () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
    dismiss: vi.fn(),
    toasts: [],
  }),
}));

vi.mock('@/services/statsService', () => ({
  statsService: {
    me: vi.fn().mockResolvedValue({ totalReservations: 7, eventsAttended: 3, upcomingEvents: 4 }),
  },
}));

vi.mock('@/services/reservationsService', () => ({
  reservationsService: {
    mine: vi.fn().mockResolvedValue([]),
    cancel: vi.fn(),
  },
}));

describe('UserDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title', () => {
    render(
      <MemoryRouter>
        <UserDashboardPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Mi dashboard')).toBeInTheDocument();
  });

  it('renders StatCards with mocked values once loaded', async () => {
    render(
      <MemoryRouter>
        <UserDashboardPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  it('shows EmptyState in reservations table when no data', async () => {
    render(
      <MemoryRouter>
        <UserDashboardPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('No tienes reservas todavía')).toBeInTheDocument();
    });
  });

  it('renders section headers', () => {
    render(
      <MemoryRouter>
        <UserDashboardPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Mis reservas')).toBeInTheDocument();
    expect(screen.getByText('Próximos eventos')).toBeInTheDocument();
  });

  it('renders StatCard titles once loading completes', async () => {
    render(
      <MemoryRouter>
        <UserDashboardPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Reservas activas')).toBeInTheDocument();
      expect(screen.getByText('Eventos asistidos')).toBeInTheDocument();
    });
  });
});
