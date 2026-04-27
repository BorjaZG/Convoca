import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';

import { AppError } from './errorHandler';

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new AppError(403, 'Acceso denegado'));
      return;
    }
    next();
  };
}
