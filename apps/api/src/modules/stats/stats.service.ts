import { EventStatus, ReservationStatus, Role } from '@prisma/client';

import { prisma } from '../../lib/prisma';

export interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

export async function getStats(userId: string, userRole: Role, range: DateRange = {}) {
  if (userRole === Role.USER) return getUserStats(userId);
  if (userRole === Role.ORGANIZER) return getOrganizerStats(userId);
  return getAdminStats(range);
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
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [activeEvents, reservationsAgg, revenueAgg, avgRating, categoryGroups, rawReservations] =
    await Promise.all([
      prisma.event.count({ where: { organizerId: userId, status: EventStatus.PUBLISHED } }),
      prisma.reservation.count({
        where: { event: { organizerId: userId }, status: { not: ReservationStatus.CANCELLED } },
      }),
      prisma.reservation.aggregate({
        where: { event: { organizerId: userId }, status: { not: ReservationStatus.CANCELLED } },
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
      prisma.reservation.findMany({
        where: {
          event: { organizerId: userId },
          status: { not: ReservationStatus.CANCELLED },
          createdAt: { gte: sixMonthsAgo },
        },
        select: { createdAt: true },
      }),
    ]);

  return {
    activeEvents,
    totalReservations: reservationsAgg,
    totalRevenue: revenueAgg._sum.totalPrice ?? 0,
    averageRating: avgRating._avg.rating,
    eventsByCategory: categoryGroups.map(g => ({ category: g.category, count: g._count._all })),
    reservationsByMonth: buildMonthlyBuckets(rawReservations.map(r => r.createdAt), 6),
  };
}

async function getAdminStats(range: DateRange) {
  const dateFilter = buildDateFilter(range);

  const [totalUsers, publishedEvents, totalReservations, revenueAgg, allEvents, categoryGroups, topOrganizersRaw] =
    await Promise.all([
      prisma.user.count(),
      prisma.event.count({ where: { status: EventStatus.PUBLISHED, ...dateFilter } }),
      prisma.reservation.count({ where: { status: { not: ReservationStatus.CANCELLED } } }),
      prisma.reservation.aggregate({
        where: { status: { not: ReservationStatus.CANCELLED } },
        _sum: { totalPrice: true },
      }),
      prisma.event.findMany({ where: dateFilter, select: { startDate: true } }),
      prisma.event.groupBy({
        by: ['category'],
        where: { status: EventStatus.PUBLISHED, ...dateFilter },
        _count: { _all: true },
      }),
      prisma.user.findMany({
        where: { role: Role.ORGANIZER },
        select: {
          id: true,
          name: true,
          _count: { select: { events: true } },
          events: {
            select: {
              reservations: {
                where: { status: { not: ReservationStatus.CANCELLED } },
                select: { totalPrice: true },
              },
            },
          },
        },
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
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12);

  const topOrganizers = topOrganizersRaw
    .map(u => ({
      id: u.id,
      name: u.name,
      totalEvents: u._count.events,
      totalRevenue: u.events.flatMap(e => e.reservations).reduce((sum, r) => sum + r.totalPrice, 0),
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  return {
    totalUsers,
    publishedEvents,
    totalReservations,
    totalRevenue: revenueAgg._sum.totalPrice ?? 0,
    eventsByMonth,
    categoryDistribution: categoryGroups.map(g => ({ category: g.category, count: g._count._all })),
    topOrganizers,
  };
}

function buildDateFilter(range: DateRange): Record<string, unknown> {
  if (!range.startDate && !range.endDate) return {};
  return {
    startDate: {
      ...(range.startDate ? { gte: range.startDate } : {}),
      ...(range.endDate ? { lte: range.endDate } : {}),
    },
  };
}

function buildMonthlyBuckets(dates: Date[], months: number): { month: string; count: number }[] {
  const now = new Date();
  const buckets: Record<string, number> = {};
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets[d.toISOString().slice(0, 7)] = 0;
  }
  for (const date of dates) {
    const key = date.toISOString().slice(0, 7);
    if (key in buckets) buckets[key] = (buckets[key] ?? 0) + 1;
  }
  return Object.entries(buckets).map(([month, count]) => ({ month, count }));
}
