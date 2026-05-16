import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const ORG_EMAIL = 'test.org.reviews@convoca.test';
const ORG_PASSWORD = 'OrgTest1';
const USER_EMAIL = 'test.user.reviews@convoca.test';
const USER_PASSWORD = 'UserTest1';

let userCookies = '';
let userId = '';
let orgId = '';
let attendedEventId = '';

beforeAll(async () => {
  for (const email of [ORG_EMAIL, USER_EMAIL]) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) {
      await prisma.review.deleteMany({ where: { userId: u.id } });
      await prisma.reservation.deleteMany({ where: { userId: u.id } });
      await prisma.event.deleteMany({ where: { organizerId: u.id } });
      await prisma.refreshToken.deleteMany({ where: { userId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
    }
  }

  const orgReg = await request(app)
    .post('/api/auth/register')
    .send({ email: ORG_EMAIL, password: ORG_PASSWORD, name: 'Org Reviews' });
  orgId = orgReg.body.user.id;
  await prisma.user.update({ where: { id: orgId }, data: { role: 'ORGANIZER' } });

  const userReg = await request(app)
    .post('/api/auth/register')
    .send({ email: USER_EMAIL, password: USER_PASSWORD, name: 'User Reviews' });
  userId = userReg.body.user.id;

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: USER_EMAIL, password: USER_PASSWORD });
  const setCookie = loginRes.headers['set-cookie'] as string[];
  userCookies = setCookie.map((c: string) => c.split(';')[0]).join('; ');

  const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const event = await prisma.event.create({
    data: {
      title: 'Evento con Asistencia',
      description: 'Evento al que el usuario asistió.',
      category: 'CONCIERTO',
      startDate: new Date(pastDate.getTime() - 3600000),
      endDate: pastDate,
      venue: 'Sala Test',
      city: 'Madrid',
      capacity: 50,
      price: 10,
      status: 'COMPLETED',
      organizerId: orgId,
    },
  });
  attendedEventId = event.id;

  await prisma.reservation.create({
    data: { eventId: attendedEventId, userId, quantity: 1, totalPrice: 10, status: 'ATTENDED' },
  });
});

afterAll(async () => {
  await prisma.review.deleteMany({ where: { eventId: attendedEventId } });
  await prisma.reservation.deleteMany({ where: { eventId: attendedEventId } });
  await prisma.event.deleteMany({ where: { id: attendedEventId } });
  for (const email of [ORG_EMAIL, USER_EMAIL]) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) {
      await prisma.refreshToken.deleteMany({ where: { userId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
    }
  }
  await prisma.$disconnect();
});

describe('POST /api/reviews', () => {
  it('devuelve 401 sin autenticación', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .send({ eventId: attendedEventId, rating: 4, comment: 'Sin auth.' });
    expect(res.status).toBe(401);
  });

  it('crea una reseña correctamente y devuelve 201', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Cookie', userCookies)
      .send({ eventId: attendedEventId, rating: 5, comment: 'Muy buen evento.' });

    expect(res.status).toBe(201);
    expect(res.body.data.rating).toBe(5);
  });

  it('devuelve 409 al intentar publicar una segunda reseña', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Cookie', userCookies)
      .send({ eventId: attendedEventId, rating: 3, comment: 'Segunda reseña.' });

    expect(res.status).toBe(409);
  });
});

describe('GET /api/reviews/event/:eventId', () => {
  it('devuelve las reseñas del evento', async () => {
    const res = await request(app).get(`/api/reviews/event/${attendedEventId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
