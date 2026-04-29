import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const ORG_EMAIL = 'test.org.reviews@convoca.test';
const ORG_PASSWORD = 'OrgTest1';
const USER_EMAIL = 'test.user.reviews@convoca.test';
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

let userCookies = '';
let userId = '';
let orgId = '';
let attendedEventId = '';
let nonAttendedEventId = '';

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
    .send({ email: ORG_EMAIL, password: ORG_PASSWORD, name: 'Org Reviews Test' });
  orgId = orgReg.body.user.id;
  await prisma.user.update({ where: { id: orgId }, data: { role: 'ORGANIZER' } });

  // Crear user
  const userReg = await request(app)
    .post('/api/auth/register')
    .send({ email: USER_EMAIL, password: USER_PASSWORD, name: 'User Reviews Test' });
  userId = userReg.body.user.id;
  userCookies = await loginAs(USER_EMAIL, USER_PASSWORD);

  // Crear dos eventos (pasados, status COMPLETED para realismo)
  const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const pastEnd = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 3600000).toISOString();

  const [ev1, ev2] = await prisma.$transaction([
    prisma.event.create({
      data: {
        title: 'Evento con Asistencia',
        description: 'Evento al que el usuario asistió, puede reseñar.',
        category: 'CONCIERTO',
        startDate: new Date(pastDate),
        endDate: new Date(pastEnd),
        venue: 'Sala Test',
        city: 'Madrid',
        capacity: 50,
        price: 10,
        status: 'COMPLETED',
        organizerId: orgId,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Evento sin Asistencia',
        description: 'Evento al que el usuario no asistió, no puede reseñar.',
        category: 'TALLER',
        startDate: new Date(pastDate),
        endDate: new Date(pastEnd),
        venue: 'Sala Test 2',
        city: 'Barcelona',
        capacity: 50,
        price: 0,
        status: 'COMPLETED',
        organizerId: orgId,
      },
    }),
  ]);

  attendedEventId = ev1.id;
  nonAttendedEventId = ev2.id;

  // Crear reserva ATTENDED para el primer evento (directamente en BD)
  await prisma.reservation.create({
    data: {
      eventId: attendedEventId,
      userId,
      quantity: 1,
      totalPrice: 10,
      status: 'ATTENDED',
    },
  });
  // NO crear reserva para nonAttendedEventId
});

afterAll(async () => {
  await prisma.review.deleteMany({ where: { eventId: { in: [attendedEventId, nonAttendedEventId] } } });
  await prisma.reservation.deleteMany({ where: { eventId: { in: [attendedEventId, nonAttendedEventId] } } });
  await prisma.event.deleteMany({ where: { id: { in: [attendedEventId, nonAttendedEventId] } } });
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
  it('devuelve 403 si el usuario no ha asistido al evento', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Cookie', userCookies)
      .send({
        eventId: nonAttendedEventId,
        rating: 4,
        comment: 'Comentario de prueba para evento sin asistencia.',
      });

    expect(res.status).toBe(403);
  });

  it('crea reseña correctamente con reserva ATTENDED y devuelve 201', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Cookie', userCookies)
      .send({
        eventId: attendedEventId,
        rating: 5,
        comment: 'Evento increíble, repetiría sin dudarlo. Gran organización y ambiente.',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.rating).toBe(5);
    expect(res.body.data.eventId).toBe(attendedEventId);
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
  });

  it('devuelve 409 al intentar publicar una segunda reseña para el mismo evento', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Cookie', userCookies)
      .send({
        eventId: attendedEventId,
        rating: 3,
        comment: 'Segundo intento de reseña para el mismo evento — debe fallar.',
      });

    expect(res.status).toBe(409);
  });

  it('devuelve 401 sin autenticación', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .send({ eventId: attendedEventId, rating: 4, comment: 'Sin autenticación.' });
    expect(res.status).toBe(401);
  });

  it('devuelve 400 con rating fuera de rango', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Cookie', userCookies)
      .send({ eventId: attendedEventId, rating: 6, comment: 'Rating inválido para prueba.' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/reviews/event/:eventId', () => {
  it('devuelve lista paginada de reseñas del evento', async () => {
    const res = await request(app).get(`/api/reviews/event/${attendedEventId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('no expone passwordHash en el autor', async () => {
    const res = await request(app).get(`/api/reviews/event/${attendedEventId}`);
    res.body.data.forEach((review: { user: Record<string, unknown> }) => {
      expect(review.user).not.toHaveProperty('passwordHash');
    });
  });
});

describe('DELETE /api/reviews/:id', () => {
  it('devuelve 403 al intentar eliminar la reseña de otro usuario', async () => {
    const anotherUser = await prisma.user.create({
      data: {
        email: 'delete.review.user@convoca.test',
        passwordHash: 'x',
        name: 'Delete Review User',
      },
    });
    await prisma.reservation.create({
      data: { eventId: attendedEventId, userId: anotherUser.id, quantity: 1, totalPrice: 10, status: 'ATTENDED' },
    });
    const review = await prisma.review.create({
      data: {
        eventId: attendedEventId,
        userId: anotherUser.id,
        rating: 2,
        comment: 'Reseña que será usada para verificar que otro usuario no puede borrarla.',
      },
    });

    const deleteRes = await request(app)
      .delete(`/api/reviews/${review.id}`)
      .set('Cookie', userCookies); // userCookies ≠ anotherUser → 403

    expect(deleteRes.status).toBe(403);

    await prisma.review.delete({ where: { id: review.id } });
    await prisma.reservation.deleteMany({ where: { userId: anotherUser.id } });
    await prisma.user.delete({ where: { id: anotherUser.id } });
  });

  it('el autor puede eliminar su propia reseña → 204', async () => {
    const authorEmail = 'author.delete.review@convoca.test';
    const authorReg = await request(app)
      .post('/api/auth/register')
      .send({ email: authorEmail, password: 'AuthorPass1', name: 'Author Delete' });
    const authorId = authorReg.body.user.id;
    const authorCookies = parseCookies(authorReg.headers['set-cookie']);

    await prisma.reservation.create({
      data: { eventId: attendedEventId, userId: authorId, quantity: 1, totalPrice: 10, status: 'ATTENDED' },
    });

    const reviewRes = await request(app)
      .post('/api/reviews')
      .set('Cookie', authorCookies)
      .send({
        eventId: attendedEventId,
        rating: 3,
        comment: 'Reseña propia que el autor va a eliminar en este test.',
      });
    expect(reviewRes.status).toBe(201);

    const deleteRes = await request(app)
      .delete(`/api/reviews/${reviewRes.body.data.id}`)
      .set('Cookie', authorCookies);
    expect(deleteRes.status).toBe(204);

    await prisma.reservation.deleteMany({ where: { userId: authorId } });
    await prisma.refreshToken.deleteMany({ where: { userId: authorId } });
    await prisma.user.delete({ where: { id: authorId } });
  });
});
