import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

export const EventCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  venue: z.string().min(1),
  city: z.string().min(1),
  capacity: z.number().int().positive(),
  price: z.number().min(0),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type EventCreateInput = z.infer<typeof EventCreateSchema>;
