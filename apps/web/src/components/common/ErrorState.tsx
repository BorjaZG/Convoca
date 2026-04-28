import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ApiError } from '@/services/api';

interface ErrorStateProps {
  error: ApiError;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const isNetworkError = error.status === 0 || error.status >= 500;

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <div className="space-y-1">
        <p className="text-base font-medium text-foreground">
          {isNetworkError ? 'Error de conexión' : 'Algo salió mal'}
        </p>
        <p className="text-sm text-muted-foreground">
          {error.error ?? 'No se pudo completar la solicitud.'}
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}
