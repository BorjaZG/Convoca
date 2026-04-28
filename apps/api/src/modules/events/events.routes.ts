import { Router } from 'express';

import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';
import { validate } from '../../middleware/validate';
import * as eventsController from './events.controller';
import { createEventSchema, updateEventSchema } from './events.schemas';

const router = Router();

// Rutas públicas
router.get('/', eventsController.list);

// ORGANIZER: sus propios eventos — debe ir antes de /:id
router.get('/mine', requireAuth, requireRole('ORGANIZER', 'ADMIN'), eventsController.mine);

// ADMIN: eventos en borrador para moderar — debe ir antes de /:id
router.get('/pending', requireAuth, requireRole('ADMIN'), eventsController.pending);

// Detalle público
router.get('/:id', eventsController.getById);

// Crear (ORGANIZER o ADMIN)
router.post(
  '/',
  requireAuth,
  requireRole('ORGANIZER', 'ADMIN'),
  validate(createEventSchema),
  eventsController.create
);

// Actualizar (propietario o ADMIN, verificado en servicio)
router.put(
  '/:id',
  requireAuth,
  requireRole('ORGANIZER', 'ADMIN'),
  validate(updateEventSchema),
  eventsController.update
);

// Eliminar (propietario o ADMIN, verificado en servicio)
router.delete('/:id', requireAuth, requireRole('ORGANIZER', 'ADMIN'), eventsController.remove);

export default router;
