import { EventStatus, Prisma, ReservationStatus, Role } from '@prisma/client';

import { deleteAsset } from '../../config/cloudinary';
import { prisma } from '../../lib/prisma';
import { ConflictError, ForbiddenError, NotFoundError } from '../../middleware/errorHandler';
import { paginate, paginatedResponse } from '../../utils/paginate';
import type { CreateEventInput, UpdateEventInput } from './events.schemas';

export interface EventFilters {
  page?: string;
  limit?: string;
  category?: string;
  city?: string;
  q?: string;
  startDate?: string;
  endDate?: string;
  maxPrice?: string;
  sortBy?: string;
  order?: string;
}

const ORGANIZER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatarUrl: true,
} as const;

const VALID_SORT_FIELDS = ['startDate', 'price', 'createdAt', 'title'] as const;

function markEventAsCompletedIfNeeded<
  T extends { id: string; status: EventStatus; endDate: Date },
>(event: T): T {
  if (event.status === EventStatus.PUBLISHED && event.endDate < new Date()) {
    prisma.event
      .update({ where: { id: event.id }, data: { status: EventStatus.COMPLETED } })
      .catch(() => null);
    return { ...event, status: EventStatus.COMPLETED };
  }
  return event;
}

export async function listEvents(filters: EventFilters) {
  const { page, limit, skip } = paginate(filters);

  const where: Prisma.EventWhereInput = {
    status: { in: [EventStatus.PUBLISHED, EventStatus.DRAFT] },
    ...(filters.category && { category: filters.category as Prisma.EnumCategoryFilter }),
    ...(filters.city && { city: { contains: filters.city, mode: 'insensitive' } }),
    ...(filters.q && { title: { contains: filters.q, mode: 'insensitive' } }),
    ...((filters.startDate || filters.endDate) && {
      startDate: {
        ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
        ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
      },
    }),
    ...(filters.maxPrice && { price: { lte: parseFloat(filters.maxPrice) } }),
  };

  const sortField = VALID_SORT_FIELDS.includes(filters.sortBy as (typeof VALID_SORT_FIELDS)[number])
    ? (filters.sortBy as string)
    : 'startDate';
  const order: Prisma.SortOrder = filters.order === 'desc' ? 'desc' : 'asc';

  const [events, total] = await prisma.$transaction([
    prisma.event.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortField]: order },
      include: {
        organizer: { select: ORGANIZER_SELECT },
        _count: { select: { reservations: true, reviews: true } },
      },
    }),
    prisma.event.count({ where }),
  ]);

  return paginatedResponse(events.map(markEventAsCompletedIfNeeded), total, page, limit);
}

export async function getEventById(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      organizer: { select: ORGANIZER_SELECT },
      _count: { select: { reviews: true, reservations: true } },
    },
  });

  if (!event) throw new NotFoundError('Evento no encontrado');

  const checkedEvent = markEventAsCompletedIfNeeded(event);

  const [avgResult, confirmedResult] = await prisma.$transaction([
    prisma.review.aggregate({ where: { eventId: id }, _avg: { rating: true } }),
    prisma.reservation.aggregate({
      where: { eventId: id, status: ReservationStatus.CONFIRMED },
      _sum: { quantity: true },
    }),
  ]);

  const confirmedQuantity = confirmedResult._sum.quantity ?? 0;
  return {
    ...checkedEvent,
    averageRating: avgResult._avg.rating,
    availableCapacity: checkedEvent.capacity - confirmedQuantity,
  };
}

export async function createEvent(data: CreateEventInput, organizerId: string) {
  return prisma.event.create({
    data: {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      organizerId,
    },
    include: { organizer: { select: ORGANIZER_SELECT } },
  });
}

export async function updateEvent(
  id: string,
  data: UpdateEventInput,
  userId: string,
  userRole: Role
) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw new NotFoundError('Evento no encontrado');
  if (event.organizerId !== userId && userRole !== Role.ADMIN) throw new ForbiddenError();

  if (
    data.imagePublicId !== undefined &&
    event.imagePublicId &&
    data.imagePublicId !== event.imagePublicId
  ) {
    await deleteAsset(event.imagePublicId).catch(() => null);
  }

  return prisma.event.update({
    where: { id },
    data: {
      ...data,
      ...(data.startDate && { startDate: new Date(data.startDate) }),
      ...(data.endDate && { endDate: new Date(data.endDate) }),
    },
    include: { organizer: { select: ORGANIZER_SELECT } },
  });
}

export async function deleteEvent(id: string, userId: string, userRole: Role) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw new NotFoundError('Evento no encontrado');
  if (event.organizerId !== userId && userRole !== Role.ADMIN) throw new ForbiddenError();

  const confirmedCount = await prisma.reservation.count({
    where: { eventId: id, status: ReservationStatus.CONFIRMED },
  });

  if (confirmedCount > 0) {
    if (event.status === EventStatus.CANCELLED)
      throw new ConflictError('El evento ya está cancelado');
    await prisma.event.update({ where: { id }, data: { status: EventStatus.CANCELLED } });
  } else {
    if (event.imagePublicId) await deleteAsset(event.imagePublicId).catch(() => null);
    await prisma.event.delete({ where: { id } });
  }
}

export async function getPendingEvents() {
  return prisma.event.findMany({
    where: { status: EventStatus.DRAFT },
    orderBy: { createdAt: 'desc' },
    include: {
      organizer: { select: ORGANIZER_SELECT },
      _count: { select: { reservations: true, reviews: true } },
    },
  });
}

export async function getMyEvents(organizerId: string) {
  const events = await prisma.event.findMany({
    where: { organizerId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { reservations: true, reviews: true } },
    },
  });
  return events.map(markEventAsCompletedIfNeeded);
}
