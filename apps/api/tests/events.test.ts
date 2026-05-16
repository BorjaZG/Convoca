import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const ORG_EMAIL = 'test.org.events@convoca.test';
const ORG_PASSWORD = 'OrgTest1';

let orgCookies = '';
let orgId = '';
const createdEventIds: string[] = [];

beforeAll(async () => {
  const existing = await prisma.user.findUnique({ where: { email: ORG_EMAIL } });
  if (existing) {
    await prisma.review.deleteMany({ where: { event: { organizerId: existing.id } } });
    await prisma.reservation.deleteMany({ where: { event: { organizerId: existing.id } } });
    await prisma.event.deleteMany({ where: { organizerId: existing.id } });
    await prisma.refreshToken.deleteMany({ where: { userId: existing.id } });
    await prisma.user.delete({ where: { id: existing.id } });
  }

  const regRes = await request(app)
    .post('/api/auth/register')
    .send({ email: ORG_EMAIL, password: ORG_PASSWORD, name: 'Test Organizer' });
  orgId = regRes.body.user.id;

  await prisma.user.update({ where: { id: orgId }, data: { role: 'ORGANIZER' } });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: ORG_EMAIL, password: ORG_PASSWORD });
  const setCookie = loginRes.headers['set-cookie'] as string[];
  orgCookies = setCookie.map((c: string) => c.split(';')[0]).join('; ');
});

afterAll(async () => {
  await prisma.review.deleteMany({ where: { event: { organizerId: orgId } } });
  await prisma.reservation.deleteMany({ where: { event: { organizerId: orgId } } });
  for (const id of createdEventIds) {
    await prisma.event.deleteMany({ where: { id } }).catch(() => null);
  }
  await prisma.refreshToken.deleteMany({ where: { userId: orgId } });
  await prisma.user.deleteMany({ where: { id: orgId } });
  await prisma.$disconnect();
});

const eventBase = {
  title: 'Evento de Prueba',
  description: 'Descripción del evento de prueba.',
  category: 'CONCIERTO',
  startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
  venue: 'Sala Test',
  city: 'Madrid',
  capacity: 50,
  price: 10,
  status: 'PUBLISHED',
};

describe('GET /api/events', () => {
  it('devuelve lista de eventos con código 200', async () => {
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('pagination');
  });
});

describe('POST /api/events', () => {
  it('crea un evento y devuelve 201', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Cookie', orgCookies)
      .send(eventBase);

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe(eventBase.title);
    if (res.body.data?.id) createdEventIds.push(res.body.data.id);
  });

  it('devuelve 401 sin autenticación', async () => {
    const res = await request(app).post('/api/events').send(eventBase);
    expect(res.status).toBe(401);
  });

  it('devuelve 400 con datos inválidos', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Cookie', orgCookies)
      .send({ title: 'X', capacity: -1 });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/events/:id', () => {
  it('devuelve 404 para un evento que no existe', async () => {
    const res = await request(app).get('/api/events/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  it('devuelve el evento con sus datos', async () => {
    const createRes = await request(app)
      .post('/api/events')
      .set('Cookie', orgCookies)
      .send(eventBase);
    const eventId = createRes.body.data.id;
    createdEventIds.push(eventId);

    const res = await request(app).get(`/api/events/${eventId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(eventId);
  });
});
