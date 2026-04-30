import { Link } from 'react-router-dom';
import { Calendar, Eye, Star, Ticket } from 'lucide-react';
import type { Category, EventStatus, EventWithOrganizer } from '@convoca/shared';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Loading } from '@/components/common/Loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFetch } from '@/hooks/useFetch';
import { eventsService } from '@/services/eventsService';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<EventStatus, string> = {
  DRAFT: 'bg-gray-100   text-gray-600   dark:bg-gray-800   dark:text-gray-400',
  PUBLISHED: 'bg-green-100  text-green-700  dark:bg-green-900/40  dark:text-green-300',
  CANCELLED: 'bg-red-100    text-red-700    dark:bg-red-900/40    dark:text-red-300',
  COMPLETED: 'bg-blue-100   text-blue-700   dark:bg-blue-900/40   dark:text-blue-300',
};

const STATUS_LABELS: Record<EventStatus, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Completado',
};

const CATEGORY_LABELS: Record<Category, string> = {
  CONCIERTO: 'Concierto',
  EXPOSICION: 'Exposición',
  TALLER: 'Taller',
  MERCADILLO: 'Mercadillo',
  TEATRO: 'Teatro',
  CONFERENCIA: 'Conferencia',
  GASTRONOMIA: 'Gastronomía',
  DEPORTE: 'Deporte',
};

function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function EventRow({ event }: { event: EventWithOrganizer }) {
  const counts = event._count;

  return (
    <div className="flex flex-col gap-3 border-b py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              STATUS_STYLES[event.status]
            )}
          >
            {STATUS_LABELS[event.status]}
          </span>
          <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[event.category]}</span>
        </div>

        <p className="truncate font-medium">{event.title}</p>

        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(event.startDate)}
          </span>
          {counts && (
            <>
              <span className="flex items-center gap-1">
                <Ticket className="h-3.5 w-3.5" />
                {counts.reservations} reserva{counts.reservations !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5" />
                {counts.reviews} reseña{counts.reviews !== 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
      </div>

      <Button asChild variant="outline" size="sm" className="shrink-0">
        <Link to={`/events/${event.id}`}>
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          Ver
        </Link>
      </Button>
    </div>
  );
}

export function OrganizerPage() {
  const {
    data: events,
    loading,
    error,
    refetch,
  } = useFetch<EventWithOrganizer[]>(() => eventsService.mine());

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mis eventos</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Todos los eventos que has creado, en cualquier estado.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {events ? `${events.length} evento${events.length !== 1 ? 's' : ''}` : 'Eventos'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <Loading />}

          {!loading && error && <ErrorState error={error} onRetry={refetch} />}

          {!loading && !error && events?.length === 0 && (
            <EmptyState
              message="Todavía no has creado ningún evento"
              description="Crea tu primer evento y empieza a recibir reservas."
            />
          )}

          {!loading && !error && events && events.length > 0 && (
            <div>
              {events.map(event => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
