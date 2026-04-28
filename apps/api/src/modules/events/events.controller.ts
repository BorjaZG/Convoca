import { NextFunction, Request, Response } from 'express';

import * as eventsService from './events.service';
import type { CreateEventInput, UpdateEventInput } from './events.schemas';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await eventsService.listEvents(req.query as eventsService.EventFilters);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const event = await eventsService.getEventById(req.params['id'] as string);
    res.json({ data: event });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const event = await eventsService.createEvent(req.body as CreateEventInput, req.user!.id);
    res.status(201).json({ data: event });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const event = await eventsService.updateEvent(
      req.params['id'] as string,
      req.body as UpdateEventInput,
      req.user!.id,
      req.user!.role
    );
    res.json({ data: event });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await eventsService.deleteEvent(req.params['id'] as string, req.user!.id, req.user!.role);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function pending(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const events = await eventsService.getPendingEvents();
    res.json({ data: events });
  } catch (err) {
    next(err);
  }
}

export async function mine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const events = await eventsService.getMyEvents(req.user!.id);
    res.json({ data: events });
  } catch (err) {
    next(err);
  }
}
