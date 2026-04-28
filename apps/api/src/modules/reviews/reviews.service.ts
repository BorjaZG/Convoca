import { ReservationStatus, Role } from '@prisma/client';

import { prisma } from '../../lib/prisma';
import { ConflictError, ForbiddenError, NotFoundError } from '../../middleware/errorHandler';
import { paginate, paginatedResponse } from '../../utils/paginate';
import type { CreateReviewInput } from './reviews.schemas';

const AUTHOR_SELECT = {
  id: true,
  name: true,
  avatarUrl: true,
} as const;

export async function createReview(data: CreateReviewInput, userId: string) {
  const attended = await prisma.reservation.findFirst({
    where: { userId, eventId: data.eventId, status: ReservationStatus.ATTENDED },
  });
  if (!attended) throw new ForbiddenError('Debes haber asistido al evento para publicar una reseña');

  const existing = await prisma.review.findUnique({
    where: { userId_eventId: { userId, eventId: data.eventId } },
  });
  if (existing) throw new ConflictError('Ya has publicado una reseña para este evento');

  return prisma.review.create({
    data: { ...data, userId },
    include: { user: { select: AUTHOR_SELECT } },
  });
}

export async function getEventReviews(
  eventId: string,
  query: { page?: string; limit?: string }
) {
  const { page, limit, skip } = paginate(query);

  const [reviews, total] = await prisma.$transaction([
    prisma.review.findMany({
      where: { eventId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: AUTHOR_SELECT } },
    }),
    prisma.review.count({ where: { eventId } }),
  ]);

  return paginatedResponse(reviews, total, page, limit);
}

export async function deleteReview(id: string, userId: string, userRole: Role) {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw new NotFoundError('Reseña no encontrada');
  if (review.userId !== userId && userRole !== Role.ADMIN) throw new ForbiddenError();

  await prisma.review.delete({ where: { id } });
}
