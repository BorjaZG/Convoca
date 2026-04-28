import { Router } from 'express';

import { requireAuth } from '../../middleware/requireAuth';
import { validate } from '../../middleware/validate';
import * as reservationsController from './reservations.controller';
import { createReservationSchema } from './reservations.schemas';

const router = Router();

router.use(requireAuth);

router.post('/', validate(createReservationSchema), reservationsController.create);
router.get('/me', reservationsController.me);
router.get('/event/:eventId', reservationsController.byEvent);
router.patch('/:id/cancel', reservationsController.cancel);

export default router;
