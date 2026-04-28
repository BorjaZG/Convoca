import { Menu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  onMenuToggle?: () => void;
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <nav className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          {isAuthenticated && onMenuToggle && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onMenuToggle}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <Link to="/" className="text-lg font-bold text-primary">
            Convoca
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {!isAuthenticated ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/events">Eventos</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Iniciar sesión</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/register">Registrarse</Link>
              </Button>
            </>
          ) : (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">{user?.name}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Cerrar sesión
              </Button>
            </>
          )}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
