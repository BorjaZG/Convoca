import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const USER_EMAIL = 'stats.user@convoca.test';
const ORG_EMAIL = 'stats.org@convoca.test';
const ADMIN_EMAIL = 'stats.admin@convoca.test';
const PASSWORD = 'StatsTest1';

function parseCookies(setCookie: string[] | string | undefined): string {
  if (!setCookie) return '';
  const entries = Array.isArray(setCookie) ? setCookie : [setCookie];
  return entries.map(c => c.split(';')[0]).join('; ');
}

async function loginAs(email: string): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
  return parseCookies(res.headers['set-cookie']);
}

let userCookies = '';
let orgCookies = '';
let adminCookies = '';

beforeAll(async () => {
  for (const email of [USER_EMAIL, ORG_EMAIL, ADMIN_EMAIL]) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) {
      await prisma.refreshToken.deleteMany({ where: { userId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
    }
  }

  const [userReg, orgReg, adminReg] = await Promise.all([
    request(app)
      .post('/api/auth/register')
      .send({ email: USER_EMAIL, password: PASSWORD, name: 'Stats User' }),
    request(app)
      .post('/api/auth/register')
      .send({ email: ORG_EMAIL, password: PASSWORD, name: 'Stats Org' }),
    request(app)
      .post('/api/auth/register')
      .send({ email: ADMIN_EMAIL, password: PASSWORD, name: 'Stats Admin' }),
  ]);

  await Promise.all([
    prisma.user.update({ where: { id: orgReg.body.user.id }, data: { role: 'ORGANIZER' } }),
    prisma.user.update({ where: { id: adminReg.body.user.id }, data: { role: 'ADMIN' } }),
  ]);

  [userCookies, orgCookies, adminCookies] = await Promise.all([
    loginAs(USER_EMAIL),
    loginAs(ORG_EMAIL),
    loginAs(ADMIN_EMAIL),
  ]);
});

afterAll(async () => {
  for (const email of [USER_EMAIL, ORG_EMAIL, ADMIN_EMAIL]) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) {
      await prisma.refreshToken.deleteMany({ where: { userId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
    }
  }
  await prisma.$disconnect();
});

describe('GET /api/stats/me', () => {
  it('USER recibe shape { totalReservations, eventsAttended, upcomingEvents } sin claves de otros roles', async () => {
    const res = await request(app).get('/api/stats/me').set('Cookie', userCookies);
    expect(res.status).toBe(200);
    const { data } = res.body;
    expect(typeof data.totalReservations).toBe('number');
    expect(typeof data.eventsAttended).toBe('number');
    expect(typeof data.upcomingEvents).toBe('number');
    expect(data).not.toHaveProperty('activeEvents');
    expect(data).not.toHaveProperty('totalUsers');
  });

  it('ORGANIZER recibe shape { activeEvents, totalRevenue, eventsByCategory, reservationsByMonth } sin claves de otros roles', async () => {
    const res = await request(app).get('/api/stats/me').set('Cookie', orgCookies);
    expect(res.status).toBe(200);
    const { data } = res.body;
    expect(typeof data.activeEvents).toBe('number');
    expect(typeof data.totalRevenue).toBe('number');
    expect(Array.isArray(data.eventsByCategory)).toBe(true);
    expect(Array.isArray(data.reservationsByMonth)).toBe(true);
    expect(data).not.toHaveProperty('totalUsers');
    expect(data).not.toHaveProperty('upcomingEvents');
  });

  it('ADMIN recibe shape { totalUsers, publishedEvents, topOrganizers, categoryDistribution } sin claves de otros roles', async () => {
    const res = await request(app).get('/api/stats/me').set('Cookie', adminCookies);
    expect(res.status).toBe(200);
    const { data } = res.body;
    expect(typeof data.totalUsers).toBe('number');
    expect(typeof data.publishedEvents).toBe('number');
    expect(Array.isArray(data.topOrganizers)).toBe(true);
    expect(Array.isArray(data.categoryDistribution)).toBe(true);
    expect(Array.isArray(data.eventsByMonth)).toBe(true);
    expect(data).not.toHaveProperty('upcomingEvents');
    expect(data).not.toHaveProperty('activeEvents');
  });
});
