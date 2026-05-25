import { Router } from 'express';
import { CompaniesController } from './companies.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/me', authenticate, CompaniesController.getMyCompany);
router.patch('/me', authenticate, CompaniesController.updateMyCompany);

export default router;
