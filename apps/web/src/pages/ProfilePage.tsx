import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Ticket } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Loading } from '@/components/common/Loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMyReservations } from '@/hooks/useMyReservations';
import { reservationsService } from '@/services/reservationsService';
import { isApiError } from '@/services/api';
import type { ReservationWithEvent } from '@/types';

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  CANCELLED: 'bg-red-100   text-red-700   dark:bg-red-900/40   dark:text-red-300',
  ATTENDED:  'bg-blue-100  text-blue-700  dark:bg-blue-900/40  dark:text-blue-300',
};

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  ATTENDED:  'Asistida',
};

function ReservationItem({
  reservation,
  onCancelled,
}: {
  reservation: ReservationWithEvent;
  onCancelled: () => void;
}) {
  const { toast } = useToast();
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await reservationsService.cancel(reservation.id);
      toast.success('Reserva cancelada correctamente');
      onCancelled();
    } catch (err) {
      toast.error(isApiError(err) ? err.error : 'No se pudo cancelar la reserva');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="flex items-start justify-between gap-4 border-b py-4 last:border-0">
      <div className="min-w-0 flex-1 space-y-1">
        <Link
          to={`/events/${reservation.eventId}`}
          className="truncate font-medium hover:underline"
        >
          {reservation.event.title}
        </Link>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Intl.DateTimeFormat('es-ES', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }).format(new Date(reservation.event.startDate))}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {reservation.event.city} · {reservation.event.venue}
          </span>
          <span className="flex items-center gap-1">
            <Ticket className="h-3.5 w-3.5" />
            {reservation.quantity} {reservation.quantity === 1 ? 'entrada' : 'entradas'}
            {reservation.totalPrice > 0 && ` · ${reservation.totalPrice.toFixed(2)} €`}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[reservation.status] ?? ''}`}
        >
          {STATUS_LABELS[reservation.status] ?? reservation.status}
        </span>

        {reservation.status === 'CONFIRMED' && (
          <Button
            variant="outline"
            size="sm"
            disabled={cancelling}
            onClick={handleCancel}
            className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {cancelling ? 'Cancelando…' : 'Cancelar'}
          </Button>
        )}
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { user } = useAuth();
  const { data: reservations, loading, error, refetch } = useMyReservations();

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      {/* Datos del usuario */}
      <Card>
        <CardHeader>
          <CardTitle>Mi perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Nombre:</span> {user?.name}
          </p>
          <p>
            <span className="font-medium">Email:</span> {user?.email}
          </p>
          <p>
            <span className="font-medium">Rol:</span> {user?.role}
          </p>
        </CardContent>
      </Card>

      {/* Mis reservas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Mis reservas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <Loading />}

          {!loading && error && <ErrorState error={error} onRetry={refetch} />}

          {!loading && !error && (!reservations || reservations.length === 0) && (
            <EmptyState
              message="No tienes reservas todavía"
              description="Explora los eventos disponibles y reserva tus plazas."
              action={{
                label: 'Ver eventos',
                onClick: () => (window.location.href = '/events'),
              }}
            />
          )}

          {!loading && !error && reservations && reservations.length > 0 && (
            <div>
              {reservations.map(r => (
                <ReservationItem key={r.id} reservation={r} onCancelled={refetch} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
