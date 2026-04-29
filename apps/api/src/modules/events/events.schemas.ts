import { z } from 'zod';

const CATEGORIES = [
  'CONCIERTO',
  'EXPOSICION',
  'TALLER',
  'MERCADILLO',
  'TEATRO',
  'CONFERENCIA',
  'GASTRONOMIA',
  'DEPORTE',
] as const;

export const createEventSchema = z.object({
  title: z.string().min(3, 'Mínimo 3 caracteres').max(100),
  description: z.string().min(10, 'Mínimo 10 caracteres'),
  category: z.enum(CATEGORIES),
  startDate: z.string().datetime({ message: 'Fecha de inicio inválida' }),
  endDate: z.string().datetime({ message: 'Fecha de fin inválida' }),
  venue: z.string().min(3),
  city: z.string().min(2),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  capacity: z.number().int().positive(),
  price: z.number().min(0),
  imageUrl: z.string().url().optional(),
  imagePublicId: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  featured: z.boolean().default(false),
});

export const updateEventSchema = createEventSchema
  .partial()
  .extend({ status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED']).optional() });

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
