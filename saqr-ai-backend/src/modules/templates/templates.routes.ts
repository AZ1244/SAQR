import { Router } from 'express';
import { TemplatesController } from './templates.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { createTemplateSchema, updateTemplateSchema } from './templates.validation';

const router = Router();

router.get('/', authenticate, TemplatesController.list);
router.post('/', authenticate, validateRequest(createTemplateSchema), TemplatesController.create);
router.patch('/:id', authenticate, validateRequest(updateTemplateSchema), TemplatesController.update);

export default router;
