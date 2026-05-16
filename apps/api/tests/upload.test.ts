import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const ORG_EMAIL = 'test.org.upload@convoca.test';
const ORG_PASSWORD = 'OrgTest1!';
const USER_EMAIL = 'test.user.upload@convoca.test';
const USER_PASSWORD = 'UserTest1!';

let orgCookies = '';
let userCookies = '';
let orgId = '';
let userId = '';

beforeAll(async () => {
  for (const email of [ORG_EMAIL, USER_EMAIL]) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.refreshToken.deleteMany({ where: { userId: existing.id } });
      await prisma.user.delete({ where: { id: existing.id } });
    }
  }

  const orgRes = await request(app)
    .post('/api/auth/register')
    .send({ email: ORG_EMAIL, password: ORG_PASSWORD, name: 'Test Org Upload' });
  orgId = orgRes.body.user.id;
  await prisma.user.update({ where: { id: orgId }, data: { role: 'ORGANIZER' } });

  const orgLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: ORG_EMAIL, password: ORG_PASSWORD });
  const orgCookieHeader = orgLogin.headers['set-cookie'] as string[];
  orgCookies = orgCookieHeader.map((c: string) => c.split(';')[0]).join('; ');

  const userRes = await request(app)
    .post('/api/auth/register')
    .send({ email: USER_EMAIL, password: USER_PASSWORD, name: 'Test User Upload' });
  userId = userRes.body.user.id;

  const userLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: USER_EMAIL, password: USER_PASSWORD });
  const userCookieHeader = userLogin.headers['set-cookie'] as string[];
  userCookies = userCookieHeader.map((c: string) => c.split(';')[0]).join('; ');
});

afterAll(async () => {
  await prisma.refreshToken.deleteMany({ where: { userId: { in: [orgId, userId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [orgId, userId] } } });
  await prisma.$disconnect();
});

describe('POST /api/upload/sign', () => {
  it('devuelve 401 si no está autenticado', async () => {
    const res = await request(app).post('/api/upload/sign');
    expect(res.status).toBe(401);
  });

  it('devuelve 403 si el rol es USER', async () => {
    const res = await request(app).post('/api/upload/sign').set('Cookie', userCookies);
    expect(res.status).toBe(403);
  });

  it('devuelve los datos de firma para ORGANIZER', async () => {
    const res = await request(app).post('/api/upload/sign').set('Cookie', orgCookies);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('signature');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('cloudName');
  });
});
