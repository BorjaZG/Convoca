import { NextFunction, Request, Response } from 'express';

import { AppError } from '../../middleware/errorHandler';
import { loginSchema, registerSchema } from './auth.schemas';
import * as authService from './auth.service';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = registerSchema.parse(req.body);
    const { user, accessToken, refreshToken } = await authService.register(input);
    authService.setAuthCookies(res, accessToken, refreshToken);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = loginSchema.parse(req.body);
    const { user, accessToken, refreshToken } = await authService.login(input);
    authService.setAuthCookies(res, accessToken, refreshToken);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies['refreshToken'] as string | undefined;
    if (!token) throw new AppError(401, 'No refresh token');
    const { user, accessToken, refreshToken } = await authService.refresh(token);
    authService.setAuthCookies(res, accessToken, refreshToken);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies['refreshToken'] as string | undefined;
    if (token) await authService.logout(token);
    authService.clearAuthCookies(res);
    res.json({ message: 'Sesión cerrada' });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getMe(req.user!.id);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}
