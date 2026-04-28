import { NextFunction, Request, Response } from 'express';

import * as usersService from './users.service';
import type { UpdateRoleInput } from './users.schemas';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await usersService.listUsers(
      req.query as { page?: string; limit?: string; role?: string }
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await usersService.updateUserRole(req.params['id'] as string, req.body as UpdateRoleInput);
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await usersService.deleteUser(req.params['id'] as string, req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
