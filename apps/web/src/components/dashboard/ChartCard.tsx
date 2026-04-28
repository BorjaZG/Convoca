import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, loading, children, className }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className={cn('space-y-2')}>
            <Skeleton className="h-[200px] w-full rounded-md" />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
