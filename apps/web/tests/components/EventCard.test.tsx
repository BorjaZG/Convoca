import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { EventCard } from '@/components/events/EventCard';
import type { EventWithOrganizer } from '@convoca/shared';

const baseEvent: EventWithOrganizer = {
  id: 'evt-1',
  title: 'Concierto de Primavera',
  description: 'Un concierto al aire libre para celebrar la primavera.',
  category: 'CONCIERTO',
  startDate: new Date('2025-06-15T19:00:00'),
  endDate: new Date('2025-06-15T22:00:00'),
  venue: 'Parque del Retiro',
  city: 'Madrid',
  capacity: 200,
  price: 15,
  status: 'PUBLISHED',
  featured: false,
  organizerId: 'org-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  organizer: { id: 'org-1', email: 'org@test.com', name: 'Org Test', role: 'ORGANIZER' },
  averageRating: 4.2,
  _count: { reservations: 10, reviews: 3 },
};

function setup(overrides: Partial<EventWithOrganizer> = {}) {
  return render(
    <MemoryRouter>
      <EventCard event={{ ...baseEvent, ...overrides }} />
    </MemoryRouter>
  );
}

describe('EventCard', () => {
  it('renderiza el título del evento', () => {
    setup();
    expect(screen.getByText('Concierto de Primavera')).toBeInTheDocument();
  });

  it('renderiza la fecha formateada', () => {
    setup();
    expect(screen.getByText(/jun/i)).toBeInTheDocument();
  });

  it('muestra el precio formateado para eventos de pago', () => {
    setup({ price: 15 });
    expect(screen.getByText('15.00 €')).toBeInTheDocument();
  });

  it('muestra "Gratuito" para eventos con precio 0', () => {
    setup({ price: 0 });
    expect(screen.getByText('Gratuito')).toBeInTheDocument();
  });

  it('incluye enlace "Ver detalles" que apunta al evento', () => {
    setup();
    const link = screen.getByRole('link', { name: /ver detalles/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/events/evt-1');
  });
});
