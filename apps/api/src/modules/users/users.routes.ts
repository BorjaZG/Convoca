import { Router } from 'express';

import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';
import { validate } from '../../middleware/validate';
import * as usersController from './users.controller';
import { updateRoleSchema } from './users.schemas';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/', usersController.list);
router.patch('/:id/role', validate(updateRoleSchema), usersController.updateRole);
router.delete('/:id', usersController.remove);

export default router;
