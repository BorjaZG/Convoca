import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  placeholder?: string;
}

export function DateRangePicker({ value, onChange, className, placeholder = 'Selecciona un rango' }: DateRangePickerProps) {
  const from = value.from;
  const to = value.to;

  let label = placeholder;
  if (from && to) {
    label = `${format(from, 'd MMM yyyy', { locale: es })} – ${format(to, 'd MMM yyyy', { locale: es })}`;
  } else if (from) {
    label = format(from, 'd MMM yyyy', { locale: es });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('min-w-[220px] justify-start gap-2 text-left font-normal', !from && 'text-muted-foreground', className)}
        >
          <CalendarIcon className="h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={value}
          onSelect={r => onChange(r ?? { from: undefined })}
          numberOfMonths={2}
          locale={es}
        />
      </PopoverContent>
    </Popover>
  );
}
