import { EventStatus, ReservationStatus, Role } from '@prisma/client';

import { prisma } from '../../lib/prisma';

export async function getStats(userId: string, userRole: Role) {
  if (userRole === Role.USER) {
    return getUserStats(userId);
  }
  if (userRole === Role.ORGANIZER) {
    return getOrganizerStats(userId);
  }
  return getAdminStats();
}

async function getUserStats(userId: string) {
  const [totalReservations, eventsAttended, upcomingEvents] = await Promise.all([
    prisma.reservation.count({ where: { userId } }),
    prisma.reservation.count({ where: { userId, status: ReservationStatus.ATTENDED } }),
    prisma.reservation.count({
      where: {
        userId,
        status: ReservationStatus.CONFIRMED,
        event: { startDate: { gte: new Date() } },
      },
    }),
  ]);

  return { totalReservations, eventsAttended, upcomingEvents };
}

async function getOrganizerStats(userId: string) {
  const [totalEvents, upcomingEvents, reservationsAgg, revenueAgg, avgRating, categoryGroups] =
    await Promise.all([
      prisma.event.count({ where: { organizerId: userId } }),
      prisma.event.count({
        where: { organizerId: userId, status: EventStatus.PUBLISHED, startDate: { gte: new Date() } },
      }),
      prisma.reservation.count({
        where: {
          event: { organizerId: userId },
          status: { not: ReservationStatus.CANCELLED },
        },
      }),
      prisma.reservation.aggregate({
        where: {
          event: { organizerId: userId },
          status: { not: ReservationStatus.CANCELLED },
        },
        _sum: { totalPrice: true },
      }),
      prisma.review.aggregate({
        where: { event: { organizerId: userId } },
        _avg: { rating: true },
      }),
      prisma.event.groupBy({
        by: ['category'],
        where: { organizerId: userId },
        _count: { _all: true },
      }),
    ]);

  return {
    totalEvents,
    upcomingEvents,
    totalReservations: reservationsAgg,
    totalRevenue: revenueAgg._sum.totalPrice ?? 0,
    averageRating: avgRating._avg.rating,
    eventsByCategory: categoryGroups.map(g => ({ category: g.category, count: g._count._all })),
  };
}

async function getAdminStats() {
  const [totalUsers, totalEvents, totalReservations, revenueAgg, allEvents, organizers] =
    await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.reservation.count({ where: { status: { not: ReservationStatus.CANCELLED } } }),
      prisma.reservation.aggregate({
        where: { status: { not: ReservationStatus.CANCELLED } },
        _sum: { totalPrice: true },
      }),
      prisma.event.findMany({ select: { startDate: true } }),
      prisma.user.findMany({
        where: { role: Role.ORGANIZER },
        select: { id: true, name: true, _count: { select: { events: true } } },
      }),
    ]);

  const eventsByMonth = Object.entries(
    allEvents.reduce<Record<string, number>>((acc, ev) => {
      const month = ev.startDate.toISOString().slice(0, 7);
      acc[month] = (acc[month] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const topOrganizers = organizers
    .sort((a, b) => b._count.events - a._count.events)
    .slice(0, 5)
    .map(u => ({ id: u.id, name: u.name, totalEvents: u._count.events }));

  return {
    totalUsers,
    totalEvents,
    totalReservations,
    totalRevenue: revenueAgg._sum.totalPrice ?? 0,
    eventsByMonth,
    topOrganizers,
  };
}
