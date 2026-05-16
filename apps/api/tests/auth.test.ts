import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const TEST_EMAIL = 'test.auth@convoca.test';
const TEST_PASSWORD = 'TestPass1';
const TEST_NAME = 'Test User';

beforeAll(async () => {
  await prisma.refreshToken.deleteMany({ where: { user: { email: TEST_EMAIL } } });
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
});

afterAll(async () => {
  await prisma.refreshToken.deleteMany({ where: { user: { email: TEST_EMAIL } } });
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  await prisma.$disconnect();
});

describe('POST /api/auth/register', () => {
  it('registra un usuario nuevo y devuelve 201', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD, name: TEST_NAME });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(TEST_EMAIL);
  });

  it('devuelve 409 si el email ya existe', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD, name: TEST_NAME });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('devuelve 200 con credenciales correctas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(TEST_EMAIL);
  });

  it('devuelve 401 con contraseña incorrecta', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: 'wrongpassword1' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('devuelve 401 sin token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('hace logout correctamente', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    const setCookie = loginRes.headers['set-cookie'] as string[];
    const cookies = setCookie.map((c: string) => c.split(';')[0]).join('; ');

    const res = await request(app).post('/api/auth/logout').set('Cookie', cookies);
    expect(res.status).toBe(200);
  });
});
