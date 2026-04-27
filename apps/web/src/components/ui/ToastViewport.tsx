import { cn } from '@/lib/utils';
import { useToast, type Toast } from '@/context/ToastContext';

const typeStyles: Record<Toast['type'], string> = {
  success:
    'border-green-500/40 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100',
  error:
    'border-destructive/40 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100',
  info:
    'border-blue-500/40 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100',
};

const iconStyles: Record<Toast['type'], string> = {
  success: 'text-green-600 dark:text-green-400',
  error: 'text-destructive',
  info: 'text-blue-600 dark:text-blue-400',
};

const icons: Record<Toast['type'], string> = {
  success: '✓',
  error: '✕',
  info: 'i',
};

export function ToastViewport() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notificaciones"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className={cn(
            'flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-toast-in',
            typeStyles[toast.type],
          )}
        >
          <span
            aria-hidden
            className={cn(
              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold',
              iconStyles[toast.type],
            )}
          >
            {icons[toast.type]}
          </span>
          <p className="flex-1 text-sm leading-snug">{toast.message}</p>
          <button
            onClick={() => dismiss(toast.id)}
            aria-label="Cerrar notificación"
            className="shrink-0 rounded p-0.5 text-sm leading-none opacity-60 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
