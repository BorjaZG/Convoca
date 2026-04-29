import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const ORG_EMAIL = 'test.org.upload@convoca.test';
const ORG_PASSWORD = 'OrgTest1!';
const USER_EMAIL = 'test.user.upload@convoca.test';
const USER_PASSWORD = 'UserTest1!';

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
  orgCookies = await loginAs(ORG_EMAIL, ORG_PASSWORD);

  const userRes = await request(app)
    .post('/api/auth/register')
    .send({ email: USER_EMAIL, password: USER_PASSWORD, name: 'Test User Upload' });
  userId = userRes.body.user.id;
  userCookies = await loginAs(USER_EMAIL, USER_PASSWORD);
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

  it('devuelve los parámetros de firma correctos para ORGANIZER', async () => {
    const res = await request(app).post('/api/upload/sign').set('Cookie', orgCookies);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('signature');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('apiKey');
    expect(res.body).toHaveProperty('cloudName');
    expect(res.body).toHaveProperty('folder');
    expect(typeof res.body.signature).toBe('string');
    expect(typeof res.body.timestamp).toBe('number');
  });

  it('usa convoca/events como folder por defecto', async () => {
    const res = await request(app).post('/api/upload/sign').set('Cookie', orgCookies);
    expect(res.status).toBe(200);
    expect(res.body.folder).toBe('convoca/events');
  });

  it('acepta un folder personalizado en el body', async () => {
    const res = await request(app)
      .post('/api/upload/sign')
      .set('Cookie', orgCookies)
      .send({ folder: 'convoca/test' });
    expect(res.status).toBe(200);
    expect(res.body.folder).toBe('convoca/test');
  });

  it('no expone el API secret en la respuesta', async () => {
    const res = await request(app).post('/api/upload/sign').set('Cookie', orgCookies);
    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('apiSecret');
    expect(JSON.stringify(res.body)).not.toContain(process.env.CLOUDINARY_API_SECRET ?? '');
  });
});
