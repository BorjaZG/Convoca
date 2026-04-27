import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { type Response } from 'express';
import { Role } from '@prisma/client';

import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import type { LoginInput, RegisterInput } from './auth.schemas';

const COOKIE_BASE = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
};

type SafeUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function sanitize(user: SafeUser): SafeUser {
  const { id, email, name, role, avatarUrl, createdAt, updatedAt } = user;
  return { id, email, name, role, avatarUrl, createdAt, updatedAt };
}

function signAccess(userId: string, role: Role): string {
  return jwt.sign({ sub: userId, role }, env.JWT_SECRET, { expiresIn: '15m' });
}

async function createRefreshToken(userId: string): Promise<string> {
  // jti garantiza unicidad aunque se llame varias veces en el mismo segundo
  const token = jwt.sign({ sub: userId, jti: randomUUID() }, env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { token, userId, expiresAt } });
  return token;
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie('accessToken', accessToken, { ...COOKIE_BASE, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...COOKIE_BASE, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie('accessToken', COOKIE_BASE);
  res.clearCookie('refreshToken', COOKIE_BASE);
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError(409, 'El email ya está en uso');

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: { email: input.email, passwordHash, name: input.name },
  });

  const accessToken = signAccess(user.id, user.role);
  const refreshToken = await createRefreshToken(user.id);
  return { user: sanitize(user), accessToken, refreshToken };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new AppError(401, 'Credenciales inválidas');

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new AppError(401, 'Credenciales inválidas');

  const accessToken = signAccess(user.id, user.role);
  const refreshToken = await createRefreshToken(user.id);
  return { user: sanitize(user), accessToken, refreshToken };
}

export async function refresh(token: string) {
  let payload: { sub: string };
  try {
    payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string };
  } catch {
    throw new AppError(401, 'Refresh token inválido');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.revokedAt !== null || stored.expiresAt < new Date()) {
    throw new AppError(401, 'Refresh token inválido');
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });
  const accessToken = signAccess(user.id, user.role);
  const refreshToken = await createRefreshToken(user.id);
  return { user: sanitize(user), accessToken, refreshToken };
}

export async function logout(token: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { token, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getMe(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(401, 'Usuario no encontrado');
  return sanitize(user);
}
