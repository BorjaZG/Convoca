import { EventStatus, ReservationStatus, Role } from '@prisma/client';

import { prisma } from '../../lib/prisma';
import { ConflictError, ForbiddenError, NotFoundError } from '../../middleware/errorHandler';
import type { CreateReservationInput } from './reservations.schemas';

export async function createReservation(data: CreateReservationInput, userId: string) {
  const event = await prisma.event.findUnique({ where: { id: data.eventId } });
  if (!event) throw new NotFoundError('Evento no encontrado');
  if (event.status !== EventStatus.PUBLISHED)
    throw new ConflictError('El evento no está disponible para reservas');

  const occupied = await prisma.reservation.aggregate({
    where: { eventId: data.eventId, status: ReservationStatus.CONFIRMED },
    _sum: { quantity: true },
  });

  const currentlyOccupied = occupied._sum.quantity ?? 0;
  if (currentlyOccupied + data.quantity > event.capacity) {
    throw new ConflictError('No hay suficiente capacidad disponible');
  }

  return prisma.reservation.create({
    data: {
      eventId: data.eventId,
      userId,
      quantity: data.quantity,
      totalPrice: event.price * data.quantity,
    },
    include: {
      event: { select: { id: true, title: true, startDate: true, venue: true, city: true } },
    },
  });
}

export interface ReservationFilters {
  status?: ReservationStatus;
  startDate?: string;
  endDate?: string;
}

export async function getMyReservations(userId: string, filters: ReservationFilters = {}) {
  return prisma.reservation.findMany({
    where: {
      userId,
      ...(filters.status && { status: filters.status }),
      ...((filters.startDate || filters.endDate) && {
        event: {
          startDate: {
            ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
            ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
          },
        },
      }),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      event: { select: { id: true, title: true, startDate: true, venue: true, city: true, imageUrl: true } },
    },
  });
}

export async function getEventReservations(eventId: string, userId: string, userRole: Role) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw new NotFoundError('Evento no encontrado');
  if (event.organizerId !== userId && userRole !== Role.ADMIN) throw new ForbiddenError();

  return prisma.reservation.findMany({
    where: { eventId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function cancelReservation(id: string, userId: string, userRole: Role) {
  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) throw new NotFoundError('Reserva no encontrada');
  if (reservation.userId !== userId && userRole !== Role.ADMIN) throw new ForbiddenError();
  if (reservation.status === ReservationStatus.CANCELLED)
    throw new ConflictError('La reserva ya está cancelada');

  return prisma.reservation.update({
    where: { id },
    data: { status: ReservationStatus.CANCELLED },
  });
}
