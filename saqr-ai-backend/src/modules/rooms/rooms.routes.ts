import { Router } from 'express';
import { RoomsController } from './rooms.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { createRoomSchema, updateRoomSchema } from './rooms.validation';

const router = Router({ mergeParams: true });

// Note: /projects/:projectId/rooms is routed to list/create
router.get('/', authenticate, RoomsController.list);
router.post('/', authenticate, validateRequest(createRoomSchema), RoomsController.create);

// /rooms/:id is routed to update/delete
router.patch('/:id', authenticate, validateRequest(updateRoomSchema), RoomsController.update);
router.delete('/:id', authenticate, RoomsController.delete);

export default router;
