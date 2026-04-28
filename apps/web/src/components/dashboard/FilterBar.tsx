import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onReset: () => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
  className?: string;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  onReset,
  searchPlaceholder = 'Buscar…',
  children,
  className,
}: FilterBarProps) {
  const hasFilters = searchValue.length > 0;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Input
        value={searchValue}
        onChange={e => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        className="h-9 w-48 lg:w-64"
      />
      {children}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onReset} className="gap-1 text-muted-foreground">
          <X className="h-3.5 w-3.5" />
          Limpiar
        </Button>
      )}
    </div>
  );
}
