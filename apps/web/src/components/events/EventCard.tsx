import { Link } from 'react-router-dom';
import { Calendar, MapPin, Star, Users } from 'lucide-react';
import type { Category, EventWithOrganizer } from '@convoca/shared';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDate, formatPrice } from '@/lib/formatters';

const CATEGORY_STYLES: Record<Category, string> = {
  CONCIERTO: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  EXPOSICION: 'bg-blue-100   text-blue-700   dark:bg-blue-900/40   dark:text-blue-300',
  TALLER: 'bg-green-100  text-green-700  dark:bg-green-900/40  dark:text-green-300',
  MERCADILLO: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  TEATRO: 'bg-red-100    text-red-700    dark:bg-red-900/40    dark:text-red-300',
  CONFERENCIA: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  GASTRONOMIA: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  DEPORTE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
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

interface EventCardProps {
  event: EventWithOrganizer;
}

export function EventCard({ event }: EventCardProps) {
  const priceLabel = formatPrice(event.price);
  const hasRating = event.averageRating != null;

  return (
    <Card className="group flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      {/* Imagen */}
      <div className="relative h-44 overflow-hidden bg-muted">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-muted-foreground/30">
            🎭
          </div>
        )}
        {/* Badge categoría */}
        <span
          className={cn(
            'absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-medium',
            CATEGORY_STYLES[event.category]
          )}
        >
          {CATEGORY_LABELS[event.category]}
        </span>
        {event.featured && (
          <span className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
            Destacado
          </span>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-semibold leading-snug">{event.title}</h3>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>{formatDate(event.startDate)}</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {event.city} · {event.venue}
          </span>
        </div>

        {/* Precio + rating */}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-sm font-semibold text-primary">{priceLabel}</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {hasRating && (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                {(event.averageRating as number).toFixed(1)}
              </span>
            )}
            {event._count && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {event._count.reservations}
              </span>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button asChild size="sm" className="w-full">
          <Link to={`/events/${event.id}`}>Ver detalles</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
