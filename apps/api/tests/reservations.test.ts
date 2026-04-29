import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const ORG_EMAIL = 'test.org.reservations@convoca.test';
const ORG_PASSWORD = 'OrgTest1';
const USER_EMAIL = 'test.user.reservations@convoca.test';
const USER_PASSWORD = 'UserTest1';

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
let userCookies = '';
let orgId = '';
let userId = '';
let testEventId = '';

beforeAll(async () => {
  // Limpiar usuarios de prueba previos
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

  // Crear organizer
  const orgReg = await request(app)
    .post('/api/auth/register')
    .send({ email: ORG_EMAIL, password: ORG_PASSWORD, name: 'Org Reservations Test' });
  orgId = orgReg.body.user.id;
  await prisma.user.update({ where: { id: orgId }, data: { role: 'ORGANIZER' } });
  orgCookies = await loginAs(ORG_EMAIL, ORG_PASSWORD);

  // Crear user
  const userReg = await request(app)
    .post('/api/auth/register')
    .send({ email: USER_EMAIL, password: USER_PASSWORD, name: 'User Reservations Test' });
  userId = userReg.body.user.id;
  userCookies = await loginAs(USER_EMAIL, USER_PASSWORD);

  // Crear evento con capacidad 2 para tests de capacity
  const eventRes = await request(app)
    .post('/api/events')
    .set('Cookie', orgCookies)
    .send({
      title: 'Evento Capacity Test',
      description: 'Evento con capacidad muy limitada para pruebas de reserva.',
      category: 'TALLER',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
      venue: 'Sala Test',
      city: 'Madrid',
      capacity: 2,
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
  it('crea reserva y devuelve 201', async () => {
    const res = await request(app)
      .post('/api/reservations')
      .set('Cookie', userCookies)
      .send({ eventId: testEventId, quantity: 1 });

    expect(res.status).toBe(201);
    expect(res.body.data.quantity).toBe(1);
    expect(res.body.data.totalPrice).toBe(10);
  });

  it('devuelve 409 cuando la capacidad está llena', async () => {
    // El evento tiene capacity=2; ya hay 1 reserva CONFIRMED de la prueba anterior
    // Intentar reservar 2 más (total sería 3 > 2)
    const res = await request(app)
      .post('/api/reservations')
      .set('Cookie', userCookies)
      .send({ eventId: testEventId, quantity: 2 });

    expect(res.status).toBe(409);
  });

  it('devuelve 401 sin autenticación', async () => {
    const res = await request(app)
      .post('/api/reservations')
      .send({ eventId: testEventId, quantity: 1 });
    expect(res.status).toBe(401);
  });

  it('devuelve 400 con quantity cero (validación zod)', async () => {
    const res = await request(app)
      .post('/api/reservations')
      .set('Cookie', userCookies)
      .send({ eventId: testEventId, quantity: 0 });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/reservations/:id/cancel', () => {
  it('cancela la reserva y libera capacity para otra', async () => {
    // Obtener la reserva creada en el test anterior
    const myRes = await request(app)
      .get('/api/reservations/me')
      .set('Cookie', userCookies);
    expect(myRes.status).toBe(200);

    const reservation = myRes.body.data.find(
      (r: { eventId: string; status: string }) =>
        r.eventId === testEventId && r.status === 'CONFIRMED'
    );
    expect(reservation).toBeDefined();

    // Cancelar
    const cancelRes = await request(app)
      .patch(`/api/reservations/${reservation.id}/cancel`)
      .set('Cookie', userCookies);
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');

    // Ahora debería haber capacity libre (2 libres, reservamos 2)
    const newRes = await request(app)
      .post('/api/reservations')
      .set('Cookie', userCookies)
      .send({ eventId: testEventId, quantity: 2 });
    expect(newRes.status).toBe(201);
  });

  it('devuelve 409 al cancelar una reserva ya cancelada', async () => {
    const myRes = await request(app)
      .get('/api/reservations/me')
      .set('Cookie', userCookies);

    const cancelled = myRes.body.data.find(
      (r: { eventId: string; status: string }) =>
        r.eventId === testEventId && r.status === 'CANCELLED'
    );
    expect(cancelled).toBeDefined();

    const res = await request(app)
      .patch(`/api/reservations/${cancelled.id}/cancel`)
      .set('Cookie', userCookies);
    expect(res.status).toBe(409);
  });

  it('devuelve 403 al cancelar la reserva de otro usuario', async () => {
    // Crear un segundo usuario
    const otherEmail = 'test.other.cancel@convoca.test';
    const otherReg = await request(app)
      .post('/api/auth/register')
      .send({ email: otherEmail, password: 'Other1234', name: 'Other User' });
    const otherCookies = parseCookies(otherReg.headers['set-cookie']);

    const myRes = await request(app)
      .get('/api/reservations/me')
      .set('Cookie', userCookies);
    const confirmed = myRes.body.data.find(
      (r: { status: string }) => r.status === 'CONFIRMED'
    );

    if (confirmed) {
      const res = await request(app)
        .patch(`/api/reservations/${confirmed.id}/cancel`)
        .set('Cookie', otherCookies);
      expect(res.status).toBe(403);
    }

    // Limpieza
    const otherUser = await prisma.user.findUnique({ where: { email: otherEmail } });
    if (otherUser) {
      await prisma.refreshToken.deleteMany({ where: { userId: otherUser.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    }
  });
});
