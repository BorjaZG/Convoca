import { NextFunction, Request, Response } from 'express';

import * as reservationsService from './reservations.service';
import type { CreateReservationInput } from './reservations.schemas';

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const reservation = await reservationsService.createReservation(
      req.body as CreateReservationInput,
      req.user!.id
    );
    res.status(201).json({ data: reservation });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, startDate, endDate } = req.query as {
      status?: string;
      startDate?: string;
      endDate?: string;
    };
    const reservations = await reservationsService.getMyReservations(req.user!.id, {
      status: status as reservationsService.ReservationFilters['status'],
      startDate,
      endDate,
    });
    res.json({ data: reservations });
  } catch (err) {
    next(err);
  }
}

export async function byEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const reservations = await reservationsService.getEventReservations(
      req.params['eventId'] as string,
      req.user!.id,
      req.user!.role
    );
    res.json({ data: reservations });
  } catch (err) {
    next(err);
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const reservation = await reservationsService.cancelReservation(
      req.params['id'] as string,
      req.user!.id,
      req.user!.role
    );
    res.json({ data: reservation });
  } catch (err) {
    next(err);
  }
}
