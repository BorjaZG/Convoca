import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label?: string };
  description?: string;
  loading?: boolean;
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, description, loading, className }: StatCardProps) {
  if (loading) {
    return (
      <Card className={cn('p-6', className)}>
        <Skeleton className="mb-4 h-4 w-24" />
        <Skeleton className="mb-2 h-8 w-16" />
        <Skeleton className="h-3 w-32" />
      </Card>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      <CardContent className="p-0">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend !== undefined && (
              <div
                className={cn(
                  'flex items-center gap-1 text-xs font-medium',
                  trend.value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                )}
              >
                {trend.value >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>
                  {trend.value >= 0 ? '+' : ''}
                  {trend.value}%{trend.label ? ` ${trend.label}` : ''}
                </span>
              </div>
            )}
          </div>
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
