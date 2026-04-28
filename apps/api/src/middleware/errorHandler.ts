import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'No encontrado') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acceso denegado') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflicto') {
    super(409, message);
    this.name = 'ConflictError';
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Datos inválidos', details: err.flatten().fieldErrors });
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
