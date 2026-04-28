import { useCallback, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Euro, FileCheck, Ticket, Users } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import type { Category, EventWithOrganizer } from '@convoca/shared';
import { ErrorState } from '@/components/common/ErrorState';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { DataTable } from '@/components/dashboard/DataTable';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import { StatCard } from '@/components/dashboard/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/context/ToastContext';
import { useAdminStats } from '@/hooks/useStats';
import { useFetch } from '@/hooks/useFetch';
import { eventsService } from '@/services/eventsService';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
];

const CATEGORY_LABELS: Record<Category, string> = {
  CONCIERTO: 'Concierto', EXPOSICION: 'Exposición', TALLER: 'Taller',
  MERCADILLO: 'Mercadillo', TEATRO: 'Teatro', CONFERENCIA: 'Conferencia',
  GASTRONOMIA: 'Gastronomía', DEPORTE: 'Deporte',
};

export function AdminDashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined });

  const statsRange = {
    startDate: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    endDate: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
  };

  const { data: stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useAdminStats(statsRange);
  const { data: pendingEvents, loading: pendingLoading, error: pendingError, refetch: refetchPending } =
    useFetch<EventWithOrganizer[]>(() => eventsService.pending());

  const { toast } = useToast();
  const success = toast.success;
  const toastError = toast.error;

  const handleApprove = useCallback(async (id: string) => {
    try {
      await eventsService.update(id, { status: 'PUBLISHED' });
      success('Evento publicado');
      refetchPending();
      refetchStats();
    } catch {
      toastError('Error al publicar el evento');
    }
  }, [success, toastError, refetchPending, refetchStats]);

  const handleReject = useCallback(async (id: string) => {
    try {
      await eventsService.update(id, { status: 'CANCELLED' });
      success('Evento rechazado');
      refetchPending();
      refetchStats();
    } catch {
      toastError('Error al rechazar el evento');
    }
  }, [success, toastError, refetchPending, refetchStats]);

  const pendingColumns: ColumnDef<EventWithOrganizer>[] = [
    {
      accessorKey: 'title',
      header: 'Título',
      cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
    },
    {
      id: 'organizador',
      accessorFn: row => row.organizer.name,
      header: 'Organizador',
    },
    {
      id: 'categoria',
      accessorFn: row => row.category,
      header: 'Categoría',
      cell: ({ row }) => CATEGORY_LABELS[row.original.category],
    },
    {
      id: 'fecha',
      accessorFn: row => new Date(row.startDate).getTime(),
      header: 'Fecha',
      cell: ({ row }) => format(new Date(row.original.startDate), 'd MMM yyyy', { locale: es }),
    },
    {
      id: 'acciones',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="text-green-700 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950"
            onClick={() => handleApprove(row.original.id)}>
            Aprobar
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"
            onClick={() => handleReject(row.original.id)}>
            Rechazar
          </Button>
        </div>
      ),
    },
  ];

  const topOrgColumns: ColumnDef<{ id: string; name: string; totalEvents: number; totalRevenue: number }>[] = [
    { accessorKey: 'name', header: 'Nombre' },
    { accessorKey: 'totalEvents', header: 'Eventos' },
    {
      accessorKey: 'totalRevenue',
      header: 'Ingresos',
      cell: ({ row }) => `${row.original.totalRevenue.toFixed(2)} €`,
    },
  ];

  if (statsError) return <div className="p-8"><ErrorState error={statsError} onRetry={refetchStats} /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Panel de administración</h1>
          <p className="text-sm text-muted-foreground">Visión global de la plataforma</p>
        </div>
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
          placeholder="Filtrar por fechas"
        />
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Usuarios totales" value={stats?.totalUsers ?? 0} icon={Users} loading={statsLoading} />
        <StatCard title="Eventos publicados" value={stats?.publishedEvents ?? 0} icon={FileCheck} loading={statsLoading} />
        <StatCard title="Reservas" value={stats?.totalReservations ?? 0} icon={Ticket} loading={statsLoading} />
        <StatCard
          title="Ingresos plataforma"
          value={stats ? `${stats.totalRevenue.toFixed(2)} €` : '—'}
          icon={Euro}
          loading={statsLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Eventos publicados por mes (últimos 12)" loading={statsLoading}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats?.eventsByMonth ?? []} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#areaGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Distribución por categoría" loading={statsLoading}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={(stats?.categoryDistribution ?? []).map(d => ({
                  ...d,
                  name: CATEGORY_LABELS[d.category as Category] ?? d.category,
                }))}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={75}
                label={({ name, percent }: { name?: string; percent?: number }) =>
                  `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {(stats?.categoryDistribution ?? []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top organizers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top organizadores por ingresos</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={topOrgColumns}
            data={stats?.topOrganizers ?? []}
            loading={statsLoading}
            emptyMessage="Sin organizadores todavía"
            pageSize={5}
          />
        </CardContent>
      </Card>

      {/* Pending events */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">Eventos por moderar</h2>
          {!pendingLoading && (
            <Badge variant="secondary">{pendingEvents?.length ?? 0}</Badge>
          )}
        </div>

        <DataTable
          columns={pendingColumns}
          data={pendingEvents ?? []}
          loading={pendingLoading}
          error={pendingError}
          onRetry={refetchPending}
          emptyMessage="No hay eventos pendientes de moderación"
          emptyDescription="Los nuevos eventos en estado borrador aparecerán aquí"
          pageSize={8}
        />
      </div>
    </div>
  );
}
