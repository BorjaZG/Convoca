import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="border-b bg-background">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold text-primary">
          Convoca
        </Link>

        <div className="flex items-center gap-3">
          {!isAuthenticated ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Iniciar sesión</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/register">Registrarse</Link>
              </Button>
              <ThemeToggle />
            </>
          ) : (
            <>
              {user?.role === 'ORGANIZER' && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/organizer">Mis eventos</Link>
                </Button>
              )}
              {user?.role === 'ADMIN' && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin">Admin</Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="sm">
                <Link to="/me">{user?.name}</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Cerrar sesión
              </Button>
              <ThemeToggle />
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
