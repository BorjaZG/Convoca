import { z } from 'zod';

export const createReservationSchema = z.object({
  eventId: z.string().min(1, 'eventId requerido'),
  quantity: z.number().int().positive('La cantidad debe ser un entero positivo'),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
