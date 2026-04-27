import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

import { env } from '../config/env';
import { AppError } from './errorHandler';

interface AccessTokenPayload {
  sub: string;
  role: Role;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies['accessToken'] as string | undefined;
  if (!token) {
    next(new AppError(401, 'No autenticado'));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new AppError(401, 'Token inválido o expirado'));
  }
}
