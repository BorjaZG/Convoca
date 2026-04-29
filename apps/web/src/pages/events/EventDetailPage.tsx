import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Star,
  Ticket,
  Users,
} from 'lucide-react';
import type { Category } from '@convoca/shared';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useEvent } from '@/hooks/useEvent';
import { useFetch } from '@/hooks/useFetch';
import { reviewsService } from '@/services/reviewsService';
import { reservationsService } from '@/services/reservationsService';
import { isApiError } from '@/services/api';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Loading } from '@/components/common/Loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ReviewWithAuthor } from '@/types';

const CATEGORY_LABELS: Record<Category, string> = {
  CONCIERTO:   'Concierto',
  EXPOSICION:  'Exposición',
  TALLER:      'Taller',
  MERCADILLO:  'Mercadillo',
  TEATRO:      'Teatro',
  CONFERENCIA: 'Conferencia',
  GASTRONOMIA: 'Gastronomía',
  DEPORTE:     'Deporte',
};

function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-4 w-4',
            i < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted'
          )}
        />
      ))}
    </span>
  );
}

// ── Componente de reserva ─────────────────────────────────────────────────────
function ReserveSection({
  eventId,
  price,
  availableCapacity,
}: {
  eventId: string;
  price: number;
  availableCapacity: number;
}) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const maxPerOrder = Math.min(10, availableCapacity);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-medium text-primary hover:underline">
          Inicia sesión
        </Link>{' '}
        para reservar tu plaza.
      </div>
    );
  }

  if (availableCapacity <= 0) {
    return (
      <div className="rounded-lg border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
        <span className="block font-medium text-foreground">Aforo completo</span>
        No quedan entradas disponibles para este evento.
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center text-sm text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400">
        ¡Reserva confirmada! Puedes verla en tu perfil.
      </div>
    );
  }

  const total = (price * quantity).toFixed(2);

  const handleReserve = async () => {
    setLoading(true);
    try {
      await reservationsService.create({ eventId, quantity });
      setDone(true);
      toast.success('¡Reserva confirmada!');
    } catch (err) {
      const msg = isApiError(err) ? err.error : 'Error al crear la reserva';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Reservar entradas</p>
        <span className="text-xs text-muted-foreground">
          {availableCapacity} {availableCapacity === 1 ? 'plaza disponible' : 'plazas disponibles'}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <label htmlFor="qty" className="text-sm text-muted-foreground">
          Cantidad
        </label>
        <Input
          id="qty"
          type="number"
          min={1}
          max={maxPerOrder}
          value={quantity}
          onChange={e => setQuantity(Math.max(1, Math.min(maxPerOrder, Number(e.target.value))))}
          className="w-20"
        />
        {price > 0 && (
          <span className="ml-auto text-sm font-semibold">{total} €</span>
        )}
      </div>
      <Button onClick={handleReserve} disabled={loading} className="w-full">
        <Ticket className="mr-2 h-4 w-4" />
        {loading ? 'Procesando…' : 'Confirmar reserva'}
      </Button>
    </div>
  );
}

// ── Componente de reseña individual ──────────────────────────────────────────
function ReviewItem({ review }: { review: ReviewWithAuthor }) {
  return (
    <div className="space-y-1 border-b pb-4 last:border-0">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase">
          {review.user.name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-medium leading-none">{review.user.name}</p>
          <StarRating rating={review.rating} />
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          {new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(
            new Date(review.createdAt)
          )}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{review.comment}</p>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────
export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: event, loading, error, refetch } = useEvent(id);

  const {
    data: reviewsData,
    loading: reviewsLoading,
    error: reviewsError,
    refetch: reviewsRefetch,
  } = useFetch(
    () => reviewsService.byEvent(id ?? '', 1, 10),
    [id]
  );

  if (loading) return <Loading className="py-24" />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!event) return null;

  const priceLabel = event.price === 0 ? 'Gratuito' : `${event.price.toFixed(2)} €`;
  const hasReviews = reviewsData && reviewsData.data.length > 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* Volver */}
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/events">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Todos los eventos
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* ── Columna principal ── */}
        <div className="space-y-6">
          {/* Imagen hero */}
          <div className="h-64 overflow-hidden rounded-xl bg-muted sm:h-80">
            {event.imageUrl ? (
              <img
                src={event.imageUrl}
                alt={event.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl text-muted-foreground/20">
                🎭
              </div>
            )}
          </div>

          {/* Cabecera del evento */}
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border px-2.5 py-0.5 text-xs font-medium">
                {CATEGORY_LABELS[event.category]}
              </span>
              {event.featured && (
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                  Destacado
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Organizado por{' '}
              <span className="font-medium text-foreground">{event.organizer.name}</span>
            </p>
          </div>

          {/* Meta-info */}
          <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="text-sm">
                <p className="font-medium capitalize">{formatDate(event.startDate)}</p>
                {event.endDate !== event.startDate && (
                  <p className="text-muted-foreground capitalize">
                    Hasta: {formatDate(event.endDate)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="text-sm">
                <p className="font-medium">{event.venue}</p>
                <p className="text-muted-foreground">{event.city}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Users className="h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm">
                {event.availableCapacity != null ? (
                  <>
                    <span className="font-medium">{event.availableCapacity}</span>
                    {' '}de{' '}
                    <span className="font-medium">{event.capacity}</span>
                    {' '}plazas disponibles
                  </>
                ) : (
                  <>Aforo: <span className="font-medium">{event.capacity} personas</span></>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Ticket className="h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm font-medium">{priceLabel}</p>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <h2 className="mb-2 font-semibold">Descripción</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {event.description}
            </p>
          </div>

          {/* Reseñas */}
          <div>
            <h2 className="mb-4 font-semibold">
              Reseñas
              {event.averageRating != null && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  · {(event.averageRating as number).toFixed(1)} / 5
                </span>
              )}
            </h2>

            {reviewsLoading && <Loading />}

            {!reviewsLoading && reviewsError && (
              <ErrorState error={reviewsError} onRetry={reviewsRefetch} />
            )}

            {!reviewsLoading && !reviewsError && !hasReviews && (
              <EmptyState message="Aún no hay reseñas" />
            )}

            {!reviewsLoading && !reviewsError && hasReviews && (
              <div className="space-y-4">
                {reviewsData.data.map(r => (
                  <ReviewItem key={r.id} review={r} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          {/* Caja de reserva */}
          {event.status === 'PUBLISHED' && (
            <ReserveSection
              eventId={event.id}
              price={event.price}
              availableCapacity={event.availableCapacity ?? event.capacity}
            />
          )}

          {event.status !== 'PUBLISHED' && (
            <div className="rounded-lg border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
              {event.status === 'CANCELLED'
                ? 'Este evento ha sido cancelado.'
                : event.status === 'COMPLETED'
                ? 'Este evento ya ha finalizado.'
                : 'Este evento aún no está publicado.'}
            </div>
          )}

          {/* Resumen de ratings */}
          {event._count && event._count.reviews > 0 && (
            <div className="rounded-lg border p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Reseñas</span>
                <span className="font-medium">{event._count.reviews}</span>
              </div>
              {event.averageRating != null && (
                <div className="mt-2 flex items-center gap-2">
                  <StarRating rating={Math.round(event.averageRating as number)} />
                  <span className="font-semibold">
                    {(event.averageRating as number).toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
