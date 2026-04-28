import { NextFunction, Request, Response } from 'express';

import * as reviewsService from './reviews.service';
import type { CreateReviewInput } from './reviews.schemas';

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const review = await reviewsService.createReview(
      req.body as CreateReviewInput,
      req.user!.id
    );
    res.status(201).json({ data: review });
  } catch (err) {
    next(err);
  }
}

export async function byEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await reviewsService.getEventReviews(req.params['eventId'] as string, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await reviewsService.deleteReview(req.params['id'] as string, req.user!.id, req.user!.role);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
