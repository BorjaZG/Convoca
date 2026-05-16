import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const USER_EMAIL = 'stats.user@convoca.test';
const ORG_EMAIL = 'stats.org@convoca.test';
const PASSWORD = 'StatsTest1';

let userCookies = '';
let orgCookies = '';

beforeAll(async () => {
  for (const email of [USER_EMAIL, ORG_EMAIL]) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) {
      await prisma.refreshToken.deleteMany({ where: { userId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
    }
  }

  const userReg = await request(app)
    .post('/api/auth/register')
    .send({ email: USER_EMAIL, password: PASSWORD, name: 'Stats User' });

  const orgReg = await request(app)
    .post('/api/auth/register')
    .send({ email: ORG_EMAIL, password: PASSWORD, name: 'Stats Org' });

  await prisma.user.update({ where: { id: orgReg.body.user.id }, data: { role: 'ORGANIZER' } });

  const userLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: USER_EMAIL, password: PASSWORD });
  const userCookieHeader = userLogin.headers['set-cookie'] as string[];
  userCookies = userCookieHeader.map((c: string) => c.split(';')[0]).join('; ');

  const orgLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: ORG_EMAIL, password: PASSWORD });
  const orgCookieHeader = orgLogin.headers['set-cookie'] as string[];
  orgCookies = orgCookieHeader.map((c: string) => c.split(';')[0]).join('; ');
});

afterAll(async () => {
  for (const email of [USER_EMAIL, ORG_EMAIL]) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) {
      await prisma.refreshToken.deleteMany({ where: { userId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
    }
  }
  await prisma.$disconnect();
});

describe('GET /api/stats/me', () => {
  it('devuelve 401 sin autenticación', async () => {
    const res = await request(app).get('/api/stats/me');
    expect(res.status).toBe(401);
  });

  it('USER recibe sus estadísticas', async () => {
    const res = await request(app).get('/api/stats/me').set('Cookie', userCookies);
    expect(res.status).toBe(200);
    expect(typeof res.body.data.totalReservations).toBe('number');
    expect(typeof res.body.data.eventsAttended).toBe('number');
  });

  it('ORGANIZER recibe sus estadísticas', async () => {
    const res = await request(app).get('/api/stats/me').set('Cookie', orgCookies);
    expect(res.status).toBe(200);
    expect(typeof res.body.data.activeEvents).toBe('number');
    expect(typeof res.body.data.totalRevenue).toBe('number');
  });
});
