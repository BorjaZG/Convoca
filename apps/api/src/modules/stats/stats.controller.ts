import { NextFunction, Request, Response } from 'express';

import * as statsService from './stats.service';

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const stats = await statsService.getStats(req.user!.id, req.user!.role, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    res.json({ data: stats });
  } catch (err) {
    next(err);
  }
}
