import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Loading } from '@/components/common/Loading';
import { EventCard } from '@/components/events/EventCard';
import { Pagination } from '@/components/events/Pagination';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { useEvents } from '@/hooks/useEvents';
import type { EventFilters } from '@/services/eventsService';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: '', label: 'Todas las categorías' },
  { value: 'CONCIERTO', label: 'Concierto' },
  { value: 'EXPOSICION', label: 'Exposición' },
  { value: 'TALLER', label: 'Taller' },
  { value: 'MERCADILLO', label: 'Mercadillo' },
  { value: 'TEATRO', label: 'Teatro' },
  { value: 'CONFERENCIA', label: 'Conferencia' },
  { value: 'GASTRONOMIA', label: 'Gastronomía' },
  { value: 'DEPORTE', label: 'Deporte' },
];

const SELECT_CLASSES = cn(
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
  'ring-offset-background focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-ring focus-visible:ring-offset-2'
);

const LIMIT = 9;

export function EventsPage() {
  // ── Controlled filter state ──────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);

  const [filters, setFilters] = useState<EventFilters>({ page: 1, limit: LIMIT });

  // Sync debounced search into filters and reset to page 1
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      q: debouncedSearch || undefined,
      page: 1,
    }));
  }, [debouncedSearch]);

  const { data, loading, error, refetch } = useEvents(filters);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const setFilter = <K extends keyof EventFilters>(key: K, value: EventFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({ page: 1, limit: LIMIT });
  };

  const hasActiveFilters =
    !!filters.category ||
    !!filters.city ||
    !!filters.startDate ||
    !!filters.endDate ||
    !!filters.maxPrice ||
    !!debouncedSearch;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Cabecera */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Eventos</h1>
        <p className="mt-1 text-muted-foreground">
          Descubre los mejores eventos culturales de tu ciudad.
        </p>
      </div>

      {/* Barra de filtros */}
      <div className="mb-6 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          {/* Búsqueda libre — con debounce */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar eventos…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Categoría */}
          <select
            value={filters.category ?? ''}
            onChange={e => setFilter('category', e.target.value)}
            className={SELECT_CLASSES}
            style={{ width: '180px' }}
            aria-label="Filtrar por categoría"
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Ciudad */}
          <Input
            placeholder="Ciudad"
            value={filters.city ?? ''}
            onChange={e => setFilter('city', e.target.value)}
            className="w-36"
          />

          {/* Fecha desde */}
          <Input
            type="date"
            value={filters.startDate ?? ''}
            onChange={e => setFilter('startDate', e.target.value)}
            className="w-40"
            aria-label="Desde"
          />

          {/* Fecha hasta */}
          <Input
            type="date"
            value={filters.endDate ?? ''}
            onChange={e => setFilter('endDate', e.target.value)}
            className="w-40"
            aria-label="Hasta"
          />

          {/* Precio máximo */}
          <Input
            type="number"
            placeholder="Precio máx."
            min={0}
            value={filters.maxPrice ?? ''}
            onChange={e =>
              setFilter('maxPrice', e.target.value ? Number(e.target.value) : undefined)
            }
            className="w-32"
          />

          {/* Limpiar filtros */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Contador de resultados */}
      {data && !loading && (
        <p className="mb-4 text-sm text-muted-foreground">
          {data.pagination.total === 0
            ? 'Sin resultados'
            : `${data.pagination.total} evento${data.pagination.total !== 1 ? 's' : ''} encontrado${data.pagination.total !== 1 ? 's' : ''}`}
        </p>
      )}

      {/* Estados */}
      {loading && <Loading variant="skeleton" />}

      {!loading && error && <ErrorState error={error} onRetry={refetch} />}

      {!loading && !error && data?.data.length === 0 && (
        <EmptyState
          message="No se encontraron eventos"
          description={
            hasActiveFilters
              ? 'Prueba a ajustar los filtros para ver más resultados.'
              : 'Aún no hay eventos publicados. ¡Vuelve pronto!'
          }
          action={
            hasActiveFilters ? { label: 'Limpiar filtros', onClick: clearFilters } : undefined
          }
        />
      )}

      {!loading && !error && data && data.data.length > 0 && (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.data.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          <div className="mt-8">
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}
    </main>
  );
}
