import { cn } from '@/lib/utils';

interface LoadingProps {
  variant?: 'spinner' | 'skeleton';
  className?: string;
}

function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-16', className)}>
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg border bg-card p-4">
          <div className="mb-3 h-40 rounded bg-muted" />
          <div className="mb-2 h-4 w-2/3 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function Loading({ variant = 'spinner', className }: LoadingProps) {
  if (variant === 'skeleton') return <Skeleton className={className} />;
  return <Spinner className={className} />;
}
