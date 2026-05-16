import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { EventCard } from '@/components/events/EventCard';
import type { EventWithOrganizer } from '@convoca/shared';

const mockEvent: EventWithOrganizer = {
  id: 'evt-1',
  title: 'Concierto de Primavera',
  description: 'Un concierto al aire libre.',
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

describe('EventCard', () => {
  it('renderiza el título del evento', () => {
    render(
      <MemoryRouter>
        <EventCard event={mockEvent} />
      </MemoryRouter>
    );
    expect(screen.getByText('Concierto de Primavera')).toBeInTheDocument();
  });

  it('muestra "Gratuito" para eventos con precio 0', () => {
    render(
      <MemoryRouter>
        <EventCard event={{ ...mockEvent, price: 0 }} />
      </MemoryRouter>
    );
    expect(screen.getByText('Gratuito')).toBeInTheDocument();
  });

  it('incluye enlace al detalle del evento', () => {
    render(
      <MemoryRouter>
        <EventCard event={mockEvent} />
      </MemoryRouter>
    );
    const link = screen.getByRole('link', { name: /ver detalles/i });
    expect(link).toHaveAttribute('href', '/events/evt-1');
  });
});
