import { Router } from 'express';
import { ProjectsController } from './project.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { createProjectSchema, updateProjectSchema, chatSchema, createClaimSchema, createAssetSchema } from './project.validation';
import multer from 'multer';
import * as path from 'path';

const upload = multer({
  dest: path.join(__dirname, '../../../uploads/'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const router = Router();

// CRUD
router.get('/', authenticate, ProjectsController.list);
router.post('/', authenticate, validateRequest(createProjectSchema), ProjectsController.create);
router.get('/:id', authenticate, ProjectsController.getById);
router.patch('/:id', authenticate, validateRequest(updateProjectSchema), ProjectsController.update);
router.delete('/:id', authenticate, ProjectsController.delete);

// Engineering calculations
router.post('/:projectId/generate-design', authenticate, ProjectsController.generateDesign);

// BOQ
router.post('/:projectId/generate-boq', authenticate, ProjectsController.generateBOQ);
router.get('/:projectId/boq', authenticate, ProjectsController.getBOQ);

// Reports
router.post('/:projectId/generate-report', authenticate, ProjectsController.generateReport);
router.get('/:projectId/reports', authenticate, ProjectsController.getReports);

// AI Chat
router.post('/:projectId/chat', authenticate, validateRequest(chatSchema), ProjectsController.chat);
router.get('/:projectId/conversations', authenticate, ProjectsController.getConversations);

// Document Ingestion
router.post('/:projectId/files', authenticate, upload.single('file'), ProjectsController.uploadProjectFile);
router.get('/:projectId/files', authenticate, ProjectsController.getProjectFiles);
router.delete('/files/:id', authenticate, ProjectsController.deleteProjectFile);

// Site validation / photos
router.post('/:projectId/site-photos', authenticate, upload.single('photo'), ProjectsController.uploadSitePhoto);
router.get('/:projectId/site-photos', authenticate, ProjectsController.getSitePhotos);
router.post('/site-photos/:id/inspect', authenticate, ProjectsController.runInspection);

// Claims
router.get('/:projectId/variation-claims', authenticate, ProjectsController.getClaims);
router.post('/:projectId/variation-claims', authenticate, validateRequest(createClaimSchema), ProjectsController.createClaim);

// Twin Assets
router.get('/:projectId/assets', authenticate, ProjectsController.getAssets);
router.post('/:projectId/assets', authenticate, validateRequest(createAssetSchema), ProjectsController.createAsset);

export default router;
