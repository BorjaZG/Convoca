import { z } from 'zod';

export const updateRoleSchema = z.object({
  role: z.enum(['USER', 'ORGANIZER', 'ADMIN']),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
