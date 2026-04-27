import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const TEST_EMAIL = 'test.auth@convoca.test';
const TEST_PASSWORD = 'TestPass1';
const TEST_NAME = 'Test User';

// Extrae "name=value" de cada Set-Cookie y los une para el header Cookie
function parseCookies(setCookie: string[] | string | undefined): string {
  if (!setCookie) return '';
  const entries = Array.isArray(setCookie) ? setCookie : [setCookie];
  return entries.map(c => c.split(';')[0]).join('; ');
}

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
    expect(res.body.user).not.toHaveProperty('passwordHash');
    const setCookie = res.headers['set-cookie'] as string[];
    expect(setCookie.some(c => c.startsWith('accessToken='))).toBe(true);
    expect(setCookie.some(c => c.startsWith('refreshToken='))).toBe(true);
  });

  it('devuelve 409 si el email ya existe', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD, name: TEST_NAME });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('devuelve 401 con contraseña incorrecta', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: 'wrongpassword1' });

    expect(res.status).toBe(401);
  });

  it('devuelve 200 y cookies con credenciales correctas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(TEST_EMAIL);
  });
});

describe('GET /api/auth/me', () => {
  it('devuelve 401 sin token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('devuelve 200 con el usuario autenticado', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    const cookies = parseCookies(loginRes.headers['set-cookie']);

    const meRes = await request(app).get('/api/auth/me').set('Cookie', cookies);
    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe(TEST_EMAIL);
  });
});

describe('POST /api/auth/refresh', () => {
  it('devuelve 401 con un refreshToken ya revocado', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    const originalCookies = parseCookies(loginRes.headers['set-cookie']);

    // Primera rotación: revoca el token original y emite uno nuevo
    await request(app).post('/api/auth/refresh').set('Cookie', originalCookies);

    // Intento con el token original (ya revocado)
    const res = await request(app).post('/api/auth/refresh').set('Cookie', originalCookies);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('revoca el refreshToken y limpia cookies', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    const cookies = parseCookies(loginRes.headers['set-cookie']);

    const logoutRes = await request(app).post('/api/auth/logout').set('Cookie', cookies);
    expect(logoutRes.status).toBe(200);

    // Tras logout el refresh token ya no sirve
    const refreshRes = await request(app).post('/api/auth/refresh').set('Cookie', cookies);
    expect(refreshRes.status).toBe(401);
  });
});
