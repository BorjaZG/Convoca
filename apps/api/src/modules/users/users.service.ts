import { Role } from '@prisma/client';

import { prisma } from '../../lib/prisma';
import { ConflictError, NotFoundError } from '../../middleware/errorHandler';
import { paginate, paginatedResponse } from '../../utils/paginate';
import type { UpdateRoleInput } from './users.schemas';

const SAFE_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listUsers(query: { page?: string; limit?: string; role?: string }) {
  const { page, limit, skip } = paginate(query);

  const where = query.role ? { role: query.role as Role } : {};

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: SAFE_SELECT,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return paginatedResponse(users, total, page, limit);
}

export async function updateUserRole(id: string, data: UpdateRoleInput) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('Usuario no encontrado');

  return prisma.user.update({
    where: { id },
    data: { role: data.role as Role },
    select: SAFE_SELECT,
  });
}

export async function deleteUser(id: string, requesterId: string) {
  if (id === requesterId) throw new ConflictError('No puedes eliminar tu propia cuenta');

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('Usuario no encontrado');

  await prisma.user.delete({ where: { id } });
}
