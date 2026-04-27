import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function ForbiddenPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-6xl font-bold text-destructive">403</h1>
      <p className="text-xl font-medium">Acceso denegado</p>
      <p className="text-muted-foreground">No tienes permisos para ver esta página.</p>
      <Button asChild variant="outline">
        <Link to="/">Volver al inicio</Link>
      </Button>
    </main>
  );
}
