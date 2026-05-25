import { Router } from 'express';
import { WorkspacesController } from './workspaces.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, WorkspacesController.list);
router.post('/', authenticate, WorkspacesController.create);
router.get('/:id', authenticate, WorkspacesController.getById);

export default router;
