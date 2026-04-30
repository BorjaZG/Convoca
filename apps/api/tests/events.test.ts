import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const ORG_EMAIL = 'test.org.events@convoca.test';
const ORG_PASSWORD = 'OrgTest1';
const ORG_NAME = 'Test Organizer Events';

function parseCookies(setCookie: string[] | string | undefined): string {
  if (!setCookie) return '';
  const entries = Array.isArray(setCookie) ? setCookie : [setCookie];
  return entries.map(c => c.split(';')[0]).join('; ');
}

async function loginAs(email: string, password: string): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return parseCookies(res.headers['set-cookie']);
}

let orgCookies = '';
let orgId = '';

const createdEventIds: string[] = [];

beforeAll(async () => {
  // Limpieza previa
  const existing = await prisma.user.findUnique({ where: { email: ORG_EMAIL } });
  if (existing) {
    await prisma.review.deleteMany({ where: { event: { organizerId: existing.id } } });
    await prisma.reservation.deleteMany({ where: { event: { organizerId: existing.id } } });
    await prisma.event.deleteMany({ where: { organizerId: existing.id } });
    await prisma.refreshToken.deleteMany({ where: { userId: existing.id } });
    await prisma.user.delete({ where: { id: existing.id } });
  }

  // Crear organizer de prueba
  const regRes = await request(app)
    .post('/api/auth/register')
    .send({ email: ORG_EMAIL, password: ORG_PASSWORD, name: ORG_NAME });
  orgId = regRes.body.user.id;

  // Elevar a ORGANIZER directamente en BD
  await prisma.user.update({ where: { id: orgId }, data: { role: 'ORGANIZER' } });

  orgCookies = await loginAs(ORG_EMAIL, ORG_PASSWORD);
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

// ── Helpers ──────────────────────────────────────────────────────────────────

async function createEvent(overrides: Record<string, unknown> = {}) {
  const base = {
    title: 'Concierto de Prueba',
    description: 'Descripción del evento de prueba para tests automatizados.',
    category: 'CONCIERTO',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
    venue: 'Sala Test',
    city: 'Madrid',
    capacity: 50,
    price: 10,
    status: 'PUBLISHED',
    ...overrides,
  };
  const res = await request(app).post('/api/events').set('Cookie', orgCookies).send(base);
  if (res.body.data?.id) createdEventIds.push(res.body.data.id);
  return res;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/events — listado público', () => {
  it('devuelve lista paginada con estructura correcta', async () => {
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.pagination).toHaveProperty('total');
    expect(res.body.pagination).toHaveProperty('totalPages');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('respeta limit y devuelve la paginación correcta', async () => {
    // Crear 3 eventos publicados para que haya datos suficientes
    await createEvent({ title: 'Paginación Test 1', category: 'CONCIERTO' });
    await createEvent({ title: 'Paginación Test 2', category: 'CONCIERTO' });
    await createEvent({ title: 'Paginación Test 3', category: 'CONCIERTO' });

    const res = await request(app).get('/api/events?limit=2&page=1');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.pagination.limit).toBe(2);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.totalPages).toBeGreaterThanOrEqual(1);
  });

  it('filtra por categoría', async () => {
    await createEvent({ title: 'Taller Único', category: 'TALLER', city: 'TestCity' });

    const res = await request(app).get('/api/events?category=TALLER');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach((ev: { category: string }) => {
      expect(ev.category).toBe('TALLER');
    });
  });

  it('solo devuelve eventos con status PUBLISHED', async () => {
    await createEvent({ title: 'Evento DRAFT', status: 'DRAFT' });

    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
    res.body.data.forEach((ev: { status: string }) => {
      expect(ev.status).toBe('PUBLISHED');
    });
  });
});

describe('GET /api/events/:id', () => {
  it('devuelve evento con organizer y averageRating', async () => {
    const createRes = await createEvent({ title: 'Evento Detalle' });
    const eventId = createRes.body.data.id;

    const res = await request(app).get(`/api/events/${eventId}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('organizer');
    expect(res.body.data.organizer).not.toHaveProperty('passwordHash');
    expect(res.body.data).toHaveProperty('averageRating');
  });

  it('devuelve 404 para evento inexistente', async () => {
    const res = await request(app).get('/api/events/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/events', () => {
  it('crea evento y devuelve 201', async () => {
    const res = await createEvent({ title: 'Nuevo Evento POST' });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Nuevo Evento POST');
    expect(res.body.data.organizer.id).toBe(orgId);
  });

  it('devuelve 401 sin autenticación', async () => {
    const res = await request(app).post('/api/events').send({ title: 'Sin auth' });
    expect(res.status).toBe(401);
  });

  it('devuelve 400 con datos inválidos', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Cookie', orgCookies)
      .send({ title: 'X', capacity: -1 });
    expect(res.status).toBe(400);
  });

  it('devuelve 403 si el usuario autenticado tiene rol USER', async () => {
    const userEmail = 'test.user.events.role@convoca.test';
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ email: userEmail, password: 'UserPass1', name: 'Test User Role' });
    const userCookies = parseCookies(regRes.headers['set-cookie']);

    const res = await request(app)
      .post('/api/events')
      .set('Cookie', userCookies)
      .send({ title: 'Intento de USER', capacity: 10 });
    expect(res.status).toBe(403);

    const u = await prisma.user.findUnique({ where: { email: userEmail } });
    if (u) {
      await prisma.refreshToken.deleteMany({ where: { userId: u.id } });
      await prisma.user.delete({ where: { id: u.id } });
    }
  });
});

describe('PUT /api/events/:id', () => {
  it('devuelve 403 si el organizador no es propietario del evento', async () => {
    const createRes = await createEvent({ title: 'Evento Ajeno PUT' });
    const eventId = createRes.body.data.id;

    const otherEmail = 'test.other.org.put@convoca.test';
    const otherReg = await request(app)
      .post('/api/auth/register')
      .send({ email: otherEmail, password: 'OtherOrg1', name: 'Other Org PUT' });
    const otherId = otherReg.body.user.id;
    await prisma.user.update({ where: { id: otherId }, data: { role: 'ORGANIZER' } });
    const otherCookies = parseCookies(otherReg.headers['set-cookie']);

    const res = await request(app)
      .put(`/api/events/${eventId}`)
      .set('Cookie', otherCookies)
      .send({ title: 'Intento de modificación ajena' });
    expect(res.status).toBe(403);

    await prisma.refreshToken.deleteMany({ where: { userId: otherId } });
    await prisma.user.delete({ where: { id: otherId } });
  });
});

describe('DELETE /api/events/:id — soft delete', () => {
  it('hard delete cuando no hay reservas CONFIRMED', async () => {
    const createRes = await createEvent({ title: 'Evento Sin Reservas' });
    const eventId = createRes.body.data.id;

    const deleteRes = await request(app).delete(`/api/events/${eventId}`).set('Cookie', orgCookies);
    expect(deleteRes.status).toBe(204);

    const getRes = await request(app).get(`/api/events/${eventId}`);
    expect(getRes.status).toBe(404);

    // Ya borrado de BD, quitar del array de limpieza
    const idx = createdEventIds.indexOf(eventId);
    if (idx !== -1) createdEventIds.splice(idx, 1);
  });

  it('soft delete (CANCELLED) cuando hay reservas CONFIRMED', async () => {
    const createRes = await createEvent({ title: 'Evento Con Reservas' });
    const eventId = createRes.body.data.id;

    // Crear una reserva directamente en BD (sin pasar por la API de reservas)
    const testUser = await prisma.user.create({
      data: {
        email: 'soft.delete.user@convoca.test',
        passwordHash: 'x',
        name: 'Soft Delete User',
      },
    });
    await prisma.reservation.create({
      data: { eventId, userId: testUser.id, quantity: 1, totalPrice: 10, status: 'CONFIRMED' },
    });

    const deleteRes = await request(app).delete(`/api/events/${eventId}`).set('Cookie', orgCookies);
    expect(deleteRes.status).toBe(204);

    // El evento sigue existiendo pero con status CANCELLED
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    expect(event).not.toBeNull();
    expect(event!.status).toBe('CANCELLED');

    // Limpieza
    await prisma.reservation.deleteMany({ where: { eventId } });
    await prisma.user.delete({ where: { id: testUser.id } });
  });
});
