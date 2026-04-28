import { useCallback, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import type { Role, User } from '@convoca/shared';
import { DataTable } from '@/components/dashboard/DataTable';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useFetch } from '@/hooks/useFetch';
import { usersService } from '@/services/usersService';

const ROLE_LABELS: Record<Role, string> = {
  USER: 'Usuario',
  ORGANIZER: 'Organizador',
  ADMIN: 'Admin',
};

const ROLE_VARIANT: Record<Role, 'secondary' | 'warning' | 'destructive'> = {
  USER: 'secondary',
  ORGANIZER: 'warning',
  ADMIN: 'destructive',
};

export function AdminUsersPage() {
  const { user: me } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL');

  const { data: response, loading, error, refetch } = useFetch<Awaited<ReturnType<typeof usersService.list>>>(
    () => usersService.list(1, 100, roleFilter !== 'ALL' ? roleFilter : undefined),
    [roleFilter]
  );

  const handleRoleChange = useCallback(async (id: string, role: Role) => {
    try {
      await usersService.updateRole(id, role);
      toast.success('Rol actualizado');
      refetch();
    } catch {
      toast.error('No se pudo actualizar el rol');
    }
  }, [toast, refetch]);

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!confirm(`¿Eliminar el usuario "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await usersService.remove(id);
      toast.success('Usuario eliminado');
      refetch();
    } catch {
      toast.error('No se pudo eliminar el usuario');
    }
  }, [toast, refetch]);

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Rol',
      cell: ({ row }) => {
        const isSelf = row.original.id === me?.id;
        if (isSelf) {
          return <Badge variant={ROLE_VARIANT[row.original.role]}>{ROLE_LABELS[row.original.role]}</Badge>;
        }
        return (
          <Select
            value={row.original.role}
            onValueChange={v => handleRoleChange(row.original.id, v as Role)}
          >
            <SelectTrigger className="h-7 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USER">Usuario</SelectItem>
              <SelectItem value="ORGANIZER">Organizador</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
        );
      },
    },
    {
      id: 'createdAt',
      accessorFn: row => new Date(row.createdAt).getTime(),
      header: 'Registrado',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.createdAt), 'd MMM yyyy', { locale: es })}
        </span>
      ),
    },
    {
      id: 'acciones',
      header: '',
      cell: ({ row }) => {
        const isSelf = row.original.id === me?.id;
        if (isSelf) return null;
        return (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => handleDelete(row.original.id, row.original.name)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        );
      },
    },
  ];

  const users = response?.data ?? [];
  const total = response?.pagination.total ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestión de usuarios</h1>
        <p className="text-sm text-muted-foreground">
          {total > 0 ? `${total} usuarios registrados` : 'Cargando…'}
        </p>
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setRoleFilter('ALL'); }}
        searchPlaceholder="Buscar por nombre o email…"
      >
        <Select value={roleFilter} onValueChange={v => setRoleFilter(v as Role | 'ALL')}>
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los roles</SelectItem>
            <SelectItem value="USER">Usuario</SelectItem>
            <SelectItem value="ORGANIZER">Organizador</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        error={error}
        onRetry={refetch}
        globalFilter={search}
        emptyMessage="No hay usuarios"
        emptyDescription="Prueba con otros filtros"
        pageSize={20}
      />
    </div>
  );
}
