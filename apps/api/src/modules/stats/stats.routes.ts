import { Router } from 'express';

import { requireAuth } from '../../middleware/requireAuth';
import * as statsController from './stats.controller';

const router = Router();

router.get('/me', requireAuth, statsController.me);

export default router;
