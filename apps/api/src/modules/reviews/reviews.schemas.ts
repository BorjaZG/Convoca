import { z } from 'zod';

export const createReviewSchema = z.object({
  eventId: z.string().min(1, 'eventId requerido'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10, 'El comentario debe tener al menos 10 caracteres').max(1000),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
