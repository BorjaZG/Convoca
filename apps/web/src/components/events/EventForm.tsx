import { useEffect } from 'react';
import { type Resolver, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { EventWithOrganizer } from '@convoca/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIES = [
  'CONCIERTO', 'EXPOSICION', 'TALLER', 'MERCADILLO',
  'TEATRO', 'CONFERENCIA', 'GASTRONOMIA', 'DEPORTE',
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  CONCIERTO: 'Concierto', EXPOSICION: 'Exposición', TALLER: 'Taller',
  MERCADILLO: 'Mercadillo', TEATRO: 'Teatro', CONFERENCIA: 'Conferencia',
  GASTRONOMIA: 'Gastronomía', DEPORTE: 'Deporte',
};

export const eventSchema = z.object({
  title: z.string().min(3, 'Mínimo 3 caracteres').max(100),
  description: z.string().min(10, 'Mínimo 10 caracteres'),
  category: z.enum(CATEGORIES),
  startDate: z.string().min(1, 'Requerido'),
  endDate: z.string().min(1, 'Requerido'),
  venue: z.string().min(3),
  city: z.string().min(2),
  capacity: z.coerce.number().int().positive('Debe ser positivo'),
  price: z.coerce.number().min(0, 'No puede ser negativo'),
  imageUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  featured: z.boolean(),
});

export type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  defaultValues?: Partial<EventFormData>;
  onSubmit: (data: EventFormData) => Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
}

function toDatetimeLocal(date: string | Date | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function eventToFormValues(event: EventWithOrganizer): Partial<EventFormData> {
  return {
    title: event.title,
    description: event.description,
    category: event.category as EventFormData['category'],
    startDate: toDatetimeLocal(event.startDate),
    endDate: toDatetimeLocal(event.endDate),
    venue: event.venue,
    city: event.city,
    capacity: event.capacity,
    price: event.price,
    imageUrl: event.imageUrl ?? '',
    status: event.status as 'DRAFT' | 'PUBLISHED',
    featured: event.featured,
  };
}

const DEFAULT_VALUES: EventFormData = {
  title: '',
  description: '',
  category: 'CONCIERTO',
  startDate: '',
  endDate: '',
  venue: '',
  city: '',
  capacity: 1,
  price: 0,
  imageUrl: '',
  status: 'DRAFT',
  featured: false,
};

export function EventForm({ defaultValues, onSubmit, submitLabel = 'Guardar', isSubmitting }: EventFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema) as Resolver<EventFormData>,
    defaultValues: { ...DEFAULT_VALUES, ...defaultValues },
  });

  useEffect(() => {
    if (defaultValues) reset({ ...DEFAULT_VALUES, ...defaultValues });
  }, [defaultValues, reset]);

  const categoryValue = watch('category');
  const statusValue = watch('status');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Title */}
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="title">Título</Label>
          <Input id="title" {...register('title')} placeholder="Nombre del evento" />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>

        {/* Description */}
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="description">Descripción</Label>
          <textarea
            id="description"
            {...register('description')}
            rows={3}
            placeholder="Describe el evento…"
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label>Categoría</Label>
          <Select
            value={categoryValue}
            onValueChange={v => setValue('category', v as EventFormData['category'], { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => (
                <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <Label>Estado</Label>
          <Select
            value={statusValue}
            onValueChange={v => setValue('status', v as 'DRAFT' | 'PUBLISHED', { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Borrador</SelectItem>
              <SelectItem value="PUBLISHED">Publicado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Start / End dates */}
        <div className="space-y-1.5">
          <Label htmlFor="startDate">Fecha de inicio</Label>
          <Input type="datetime-local" id="startDate" {...register('startDate')} />
          {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate">Fecha de fin</Label>
          <Input type="datetime-local" id="endDate" {...register('endDate')} />
          {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
        </div>

        {/* Venue / City */}
        <div className="space-y-1.5">
          <Label htmlFor="venue">Lugar</Label>
          <Input id="venue" {...register('venue')} placeholder="Nombre del recinto" />
          {errors.venue && <p className="text-xs text-destructive">{errors.venue.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">Ciudad</Label>
          <Input id="city" {...register('city')} placeholder="Madrid" />
          {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
        </div>

        {/* Capacity / Price */}
        <div className="space-y-1.5">
          <Label htmlFor="capacity">Capacidad</Label>
          <Input type="number" min={1} id="capacity" {...register('capacity')} />
          {errors.capacity && <p className="text-xs text-destructive">{errors.capacity.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price">Precio (€)</Label>
          <Input type="number" min={0} step="0.01" id="price" {...register('price')} />
          {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
        </div>

        {/* Image URL */}
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="imageUrl">URL de imagen (opcional)</Label>
          <Input id="imageUrl" {...register('imageUrl')} placeholder="https://…" />
          {errors.imageUrl && <p className="text-xs text-destructive">{errors.imageUrl.message}</p>}
        </div>

        {/* Featured */}
        <div className="sm:col-span-2 flex items-center gap-2">
          <input type="checkbox" id="featured" {...register('featured')} className="h-4 w-4 rounded border-input" />
          <Label htmlFor="featured" className="cursor-pointer">Evento destacado</Label>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? 'Guardando…' : submitLabel}
      </Button>
    </form>
  );
}
