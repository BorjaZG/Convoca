import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarClock, CalendarCheck, Ticket } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import type { ReservationStatus } from '@convoca/shared';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable } from '@/components/dashboard/DataTable';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { StatCard } from '@/components/dashboard/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/context/ToastContext';
import { useMyReservations } from '@/hooks/useMyReservations';
import { useUserStats } from '@/hooks/useStats';
import { reservationsService } from '@/services/reservationsService';
import type { ReservationWithEvent } from '@/types';

const STATUS_LABELS: Record<ReservationStatus, string> = {
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  ATTENDED: 'Asistida',
};

const STATUS_VARIANT: Record<ReservationStatus, 'success' | 'destructive' | 'secondary'> = {
  CONFIRMED: 'success',
  CANCELLED: 'destructive',
  ATTENDED: 'secondary',
};

export function UserDashboardPage() {
  const {
    data: stats,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useUserStats();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'ALL'>('ALL');
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined });
  const { toast } = useToast();
  const success = toast.success;
  const toastError = toast.error;
  const navigate = useNavigate();

  const reservationFilters = {
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    startDate: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    endDate: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
  };

  const {
    data: reservations,
    loading: resLoading,
    error: resError,
    refetch: refetchRes,
  } = useMyReservations(reservationFilters);

  const handleCancel = useCallback(
    async (id: string) => {
      try {
        await reservationsService.cancel(id);
        success('Reserva cancelada');
        refetchRes();
        refetchStats();
      } catch {
        toastError('No se pudo cancelar la reserva');
      }
    },
    [success, toastError, refetchRes, refetchStats]
  );

  const reset = () => {
    setSearch('');
    setStatusFilter('ALL');
    setDateRange({ from: undefined });
  };

  const columns: ColumnDef<ReservationWithEvent>[] = [
    {
      id: 'evento',
      accessorFn: row => row.event.title,
      header: 'Evento',
      cell: ({ row }) => (
        <button
          className="text-left font-medium hover:underline"
          onClick={() => navigate(`/events/${row.original.event.id}`)}
        >
          {row.original.event.title}
        </button>
      ),
    },
    {
      id: 'fecha',
      accessorFn: row => new Date(row.event.startDate).getTime(),
      header: 'Fecha',
      cell: ({ row }) =>
        format(new Date(row.original.event.startDate), 'd MMM yyyy', { locale: es }),
    },
    {
      id: 'lugar',
      accessorFn: row => row.event.venue,
      header: 'Lugar',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.event.venue}, {row.original.event.city}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.status]}>
          {STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    {
      id: 'acciones',
      header: '',
      cell: ({ row }) =>
        row.original.status === 'CONFIRMED' ? (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => handleCancel(row.original.id)}
          >
            Cancelar
          </Button>
        ) : null,
    },
  ];

  // Upcoming events for sidebar list
  const upcoming = (reservations ?? [])
    .filter(r => r.status === 'CONFIRMED' && new Date(r.event.startDate) > new Date())
    .sort((a, b) => new Date(a.event.startDate).getTime() - new Date(b.event.startDate).getTime())
    .slice(0, 5);

  if (statsError)
    return (
      <div className="p-8">
        <ErrorState error={statsError} onRetry={refetchStats} />
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen de tu actividad en Convoca</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Reservas activas"
          value={stats?.totalReservations ?? 0}
          icon={Ticket}
          loading={statsLoading}
        />
        <StatCard
          title="Eventos asistidos"
          value={stats?.eventsAttended ?? 0}
          icon={CalendarCheck}
          loading={statsLoading}
        />
        <StatCard
          title="Próximos eventos"
          value={stats?.upcomingEvents ?? 0}
          icon={CalendarClock}
          loading={statsLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Reservations table */}
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-base font-semibold">Mis reservas</h2>

          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            onReset={reset}
            searchPlaceholder="Buscar por evento…"
          >
            <Select
              value={statusFilter}
              onValueChange={v => setStatusFilter(v as ReservationStatus | 'ALL')}
            >
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="CONFIRMED">Confirmadas</SelectItem>
                <SelectItem value="CANCELLED">Canceladas</SelectItem>
                <SelectItem value="ATTENDED">Asistidas</SelectItem>
              </SelectContent>
            </Select>

            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="Fecha del evento"
            />
          </FilterBar>

          <DataTable
            columns={columns}
            data={reservations ?? []}
            loading={resLoading}
            error={resError}
            onRetry={refetchRes}
            globalFilter={search}
            emptyMessage="No tienes reservas todavía"
            emptyDescription="Explora eventos y reserva tu plaza"
            pageSize={8}
          />
        </div>

        {/* Upcoming events countdown */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Próximos eventos</h2>
          <Card>
            <CardContent className="p-0">
              {upcoming.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No tienes eventos próximos confirmados
                </div>
              ) : (
                <ul>
                  {upcoming.map((r, i) => (
                    <li
                      key={r.id}
                      className={`flex flex-col gap-0.5 px-4 py-3 ${i < upcoming.length - 1 ? 'border-b' : ''}`}
                    >
                      <button
                        className="truncate text-left text-sm font-medium hover:underline"
                        onClick={() => navigate(`/events/${r.event.id}`)}
                      >
                        {r.event.title}
                      </button>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(r.event.startDate), 'd MMM yyyy', { locale: es })}
                      </span>
                      <span className="text-xs font-medium text-primary">
                        {formatDistanceToNow(new Date(r.event.startDate), {
                          locale: es,
                          addSuffix: true,
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
