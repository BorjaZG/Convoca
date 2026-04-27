import { Navigate, Outlet } from 'react-router-dom';
import type { Role } from '@convoca/shared';
import { useAuth } from '@/context/AuthContext';

interface RoleRouteProps {
  roles: Role[];
}

export function RoleRoute({ roles }: RoleRouteProps) {
  const { status, user } = useAuth();

  if (status === 'idle' || status === 'loading') return null;

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
