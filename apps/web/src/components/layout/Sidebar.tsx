import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  Plus,
  ShieldCheck,
  Ticket,
  User,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
}

const USER_NAV: NavItem[] = [
  { to: '/me/dashboard', label: 'Mi dashboard', icon: LayoutDashboard },
  { to: '/events', label: 'Explorar eventos', icon: CalendarDays },
  { to: '/me', label: 'Perfil', icon: User },
];

const ORGANIZER_NAV: NavItem[] = [
  { to: '/organizer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/organizer', label: 'Mis eventos', icon: CalendarDays },
  { to: '/organizer/events/new', label: 'Nuevo evento', icon: Plus },
  { to: '/me', label: 'Perfil', icon: User },
];

const ADMIN_NAV: NavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/events', label: 'Todos los eventos', icon: CalendarDays },
  { to: '/admin/users', label: 'Usuarios', icon: ShieldCheck },
  { to: '/me', label: 'Perfil', icon: User },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();

  const navItems =
    user?.role === 'ADMIN'
      ? ADMIN_NAV
      : user?.role === 'ORGANIZER'
        ? ORGANIZER_NAV
        : USER_NAV;

  const roleLabel =
    user?.role === 'ADMIN' ? 'Administrador' : user?.role === 'ORGANIZER' ? 'Organizador' : 'Usuario';

  const roleIcon =
    user?.role === 'ADMIN' ? ShieldCheck : user?.role === 'ORGANIZER' ? BarChart3 : Ticket;
  const RoleIcon = roleIcon;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed left-0 top-[57px] z-30 flex h-[calc(100vh-57px)] w-56 flex-col border-r bg-background transition-transform duration-200',
          'lg:sticky lg:translate-x-0 lg:shrink-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Role badge */}
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <RoleIcon className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">{roleLabel}</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-0.5">
            {navItems.map(item => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to !== '/events'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User info footer */}
        <div className="border-t px-4 py-3">
          <p className="truncate text-xs font-medium">{user?.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </aside>
    </>
  );
}
