import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart2, Euro, Plus, Star, Ticket } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import type { Category, EventStatus, EventWithOrganizer } from '@convoca/shared';
import { ErrorState } from '@/components/common/ErrorState';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { StatCard } from '@/components/dashboard/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/context/ToastContext';
import { useOrganizerStats } from '@/hooks/useStats';
import { useFetch } from '@/hooks/useFetch';
import { eventsService } from '@/services/eventsService';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const STATUS_STYLES: Record<EventStatus, string> = {
  DRAFT: 'secondary',
  PUBLISHED: 'success',
  CANCELLED: 'destructive',
  COMPLETED: 'outline',
};

const STATUS_LABELS: Record<EventStatus, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Completado',
};

const CATEGORY_LABELS: Record<Category, string> = {
  CONCIERTO: 'Concierto', EXPOSICION: 'Exposición', TALLER: 'Taller',
  MERCADILLO: 'Mercadillo', TEATRO: 'Teatro', CONFERENCIA: 'Conferencia',
  GASTRONOMIA: 'Gastronomía', DEPORTE: 'Deporte',
};

export function OrganizerDashboardPage() {
  const { data: stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useOrganizerStats();
  const { data: events, loading: eventsLoading, error: eventsError, refetch: refetchEvents } =
    useFetch<EventWithOrganizer[]>(() => eventsService.mine());

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'ALL'>('ALL');
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined });
  const navigate = useNavigate();
  const { toast } = useToast();
  const success = toast.success;
  const toastError = toast.error;

  const reset = () => {
    setSearch('');
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
    setDateRange({ from: undefined });
  };

  const filteredEvents = (events ?? []).filter(ev => {
    if (categoryFilter !== 'ALL' && ev.category !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && ev.status !== statusFilter) return false;
    if (dateRange.from && new Date(ev.startDate) < dateRange.from) return false;
    if (dateRange.to && new Date(ev.startDate) > dateRange.to) return false;
    return true;
  });

  const handleCancel = useCallback(async (id: string) => {
    try {
      await eventsService.update(id, { status: 'CANCELLED' });
      success('Evento cancelado');
      refetchEvents();
      refetchStats();
    } catch {
      toastError('No se pudo cancelar el evento');
    }
  }, [success, toastError, refetchEvents, refetchStats]);

  const columns: ColumnDef<EventWithOrganizer>[] = [
    {
      accessorKey: 'title',
      header: 'Título',
      cell: ({ row }) => (
        <button
          className="max-w-[200px] truncate text-left font-medium hover:underline"
          onClick={() => navigate(`/events/${row.original.id}`)}
        >
          {row.original.title}
        </button>
      ),
    },
    {
      id: 'categoria',
      accessorFn: row => row.category,
      header: 'Categoría',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{CATEGORY_LABELS[row.original.category]}</span>
      ),
    },
    {
      id: 'fecha',
      accessorFn: row => new Date(row.startDate).getTime(),
      header: 'Fecha',
      cell: ({ row }) => format(new Date(row.original.startDate), 'd MMM yyyy', { locale: es }),
    },
    {
      accessorKey: 'capacity',
      header: 'Capacidad',
    },
    {
      id: 'vendidas',
      accessorFn: row => row._count?.reservations ?? 0,
      header: 'Vendidas',
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={STATUS_STYLES[row.original.status] as 'success' | 'destructive' | 'secondary' | 'outline'}>
          {STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    {
      id: 'acciones',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => navigate(`/organizer/events/${row.original.id}/edit`)}>
            Editar
          </Button>
          {row.original.status !== 'CANCELLED' && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => handleCancel(row.original.id)}
            >
              Cancelar
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (statsError) return <div className="p-8"><ErrorState error={statsError} onRetry={refetchStats} /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard del organizador</h1>
          <p className="text-sm text-muted-foreground">Gestiona tus eventos y analiza su rendimiento</p>
        </div>
        <Button onClick={() => navigate('/organizer/events/new')} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo evento
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Eventos activos" value={stats?.activeEvents ?? 0} icon={BarChart2} loading={statsLoading} />
        <StatCard title="Reservas totales" value={stats?.totalReservations ?? 0} icon={Ticket} loading={statsLoading} />
        <StatCard
          title="Ingresos (€)"
          value={stats ? `${stats.totalRevenue.toFixed(2)} €` : '—'}
          icon={Euro}
          loading={statsLoading}
        />
        <StatCard
          title="Valoración media"
          value={stats?.averageRating != null ? stats.averageRating.toFixed(1) : '—'}
          icon={Star}
          loading={statsLoading}
          description="Basado en todas las reseñas"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Eventos por categoría" loading={statsLoading}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats?.eventsByCategory ?? []} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 11 }}
                tickFormatter={v => CATEGORY_LABELS[v as Category]?.slice(0, 5) ?? v}
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip formatter={(_v, _n, props) => [props.value, CATEGORY_LABELS[props.payload.category as Category] ?? props.payload.category]} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Reservas por mes (últimos 6)" loading={statsLoading}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats?.reservationsByMonth ?? []} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Events table */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold">Mis eventos</h2>

        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          onReset={reset}
          searchPlaceholder="Buscar evento…"
        >
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 w-36">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as EventStatus | 'ALL')}>
            <SelectTrigger className="h-9 w-36">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="DRAFT">Borrador</SelectItem>
              <SelectItem value="PUBLISHED">Publicado</SelectItem>
              <SelectItem value="CANCELLED">Cancelado</SelectItem>
              <SelectItem value="COMPLETED">Completado</SelectItem>
            </SelectContent>
          </Select>

          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </FilterBar>

        <DataTable
          columns={columns}
          data={filteredEvents}
          loading={eventsLoading}
          error={eventsError}
          onRetry={refetchEvents}
          globalFilter={search}
          emptyMessage="No tienes eventos todavía"
          emptyDescription="Crea tu primer evento con el botón de arriba"
          pageSize={8}
        />
      </div>
    </div>
  );
}
