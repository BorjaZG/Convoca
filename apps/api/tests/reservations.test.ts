import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const ORG_EMAIL = 'test.org.reservations@convoca.test';
const ORG_PASSWORD = 'OrgTest1';
const USER_EMAIL = 'test.user.reservations@convoca.test';
const USER_PASSWORD = 'UserTest1';

let orgCookies = '';
let userCookies = '';
let orgId = '';
let userId = '';
let testEventId = '';

beforeAll(async () => {
  for (const email of [ORG_EMAIL, USER_EMAIL]) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) {
      await prisma.reservation.deleteMany({ where: { userId: u.id } });
      await prisma.event.deleteMany({ where: { organizerId: u.id } });
      await prisma.refreshToken.deleteMany({ where: { userId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
    }
  }

  const orgReg = await request(app)
    .post('/api/auth/register')
    .send({ email: ORG_EMAIL, password: ORG_PASSWORD, name: 'Org Reservations' });
  orgId = orgReg.body.user.id;
  await prisma.user.update({ where: { id: orgId }, data: { role: 'ORGANIZER' } });

  const orgLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: ORG_EMAIL, password: ORG_PASSWORD });
  const orgCookieHeader = orgLogin.headers['set-cookie'] as string[];
  orgCookies = orgCookieHeader.map((c: string) => c.split(';')[0]).join('; ');

  const userReg = await request(app)
    .post('/api/auth/register')
    .send({ email: USER_EMAIL, password: USER_PASSWORD, name: 'User Reservations' });
  userId = userReg.body.user.id;

  const userLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: USER_EMAIL, password: USER_PASSWORD });
  const userCookieHeader = userLogin.headers['set-cookie'] as string[];
  userCookies = userCookieHeader.map((c: string) => c.split(';')[0]).join('; ');

  const eventRes = await request(app)
    .post('/api/events')
    .set('Cookie', orgCookies)
    .send({
      title: 'Evento para Reservas',
      description: 'Evento de prueba para tests de reserva.',
      category: 'TALLER',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
      venue: 'Sala Test',
      city: 'Madrid',
      capacity: 10,
      price: 10,
      status: 'PUBLISHED',
    });
  testEventId = eventRes.body.data.id;
});

afterAll(async () => {
  await prisma.reservation.deleteMany({ where: { eventId: testEventId } });
  await prisma.event.deleteMany({ where: { id: testEventId } });
  for (const email of [ORG_EMAIL, USER_EMAIL]) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) {
      await prisma.reservation.deleteMany({ where: { userId: u.id } });
      await prisma.refreshToken.deleteMany({ where: { userId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
    }
  }
  await prisma.$disconnect();
});

describe('POST /api/reservations', () => {
  it('devuelve 401 sin autenticación', async () => {
    const res = await request(app)
      .post('/api/reservations')
      .send({ eventId: testEventId, quantity: 1 });
    expect(res.status).toBe(401);
  });

  it('devuelve 400 con quantity 0', async () => {
    const res = await request(app)
      .post('/api/reservations')
      .set('Cookie', userCookies)
      .send({ eventId: testEventId, quantity: 0 });
    expect(res.status).toBe(400);
  });

  it('crea una reserva y devuelve 201', async () => {
    const res = await request(app)
      .post('/api/reservations')
      .set('Cookie', userCookies)
      .send({ eventId: testEventId, quantity: 1 });

    expect(res.status).toBe(201);
    expect(res.body.data.quantity).toBe(1);
  });
});

describe('GET /api/reservations/me', () => {
  it('devuelve las reservas del usuario autenticado', async () => {
    const res = await request(app).get('/api/reservations/me').set('Cookie', userCookies);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
