import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';
import { sign } from './upload.controller';

const uploadRouter = Router();

uploadRouter.post('/sign', requireAuth, requireRole('ORGANIZER', 'ADMIN'), sign);

export default uploadRouter;
