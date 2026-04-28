import { NextFunction, Request, Response } from 'express';

import * as statsService from './stats.service';

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await statsService.getStats(req.user!.id, req.user!.role);
    res.json({ data: stats });
  } catch (err) {
    next(err);
  }
}
