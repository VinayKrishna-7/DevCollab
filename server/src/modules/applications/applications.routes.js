import { Router } from 'express';
import * as appController from './applications.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { submitApplicationSchema, reviewApplicationSchema } from './applications.validation.js';

const router = Router();

// Current user applications
router.get('/me', requireAuth, appController.getMyApplications);

// Project join requests
router.post('/projects/:id', requireAuth, validate(submitApplicationSchema), appController.submitApplication);
router.get('/projects/:id', requireAuth, appController.getProjectApplications);

// Status updates
router.patch('/:id/accept', requireAuth, validate(reviewApplicationSchema), appController.acceptApplication);
router.patch('/:id/reject', requireAuth, validate(reviewApplicationSchema), appController.rejectApplication);
router.patch('/:id/withdraw', requireAuth, appController.withdrawApplication);

export default router;
