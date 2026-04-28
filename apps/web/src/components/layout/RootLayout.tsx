import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ToastViewport } from '@/components/ui/ToastViewport';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function RootLayout() {
  const { status, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuToggle={() => setSidebarOpen(o => !o)} />

      <div className="flex">
        {isAuthenticated && (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      <ToastViewport />
    </div>
  );
}
