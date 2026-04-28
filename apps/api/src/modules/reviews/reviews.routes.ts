import { Router } from 'express';

import { requireAuth } from '../../middleware/requireAuth';
import { validate } from '../../middleware/validate';
import * as reviewsController from './reviews.controller';
import { createReviewSchema } from './reviews.schemas';

const router = Router();

router.post('/', requireAuth, validate(createReviewSchema), reviewsController.create);
router.get('/event/:eventId', reviewsController.byEvent);
router.delete('/:id', requireAuth, reviewsController.remove);

export default router;
