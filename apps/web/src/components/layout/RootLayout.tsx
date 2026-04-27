import { Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from './Navbar';

export function RootLayout() {
  const { status } = useAuth();

  // Splash mientras se hidrata la sesión desde la cookie httpOnly
  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Outlet />
    </div>
  );
}
