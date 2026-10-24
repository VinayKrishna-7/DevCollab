import { Router } from 'express';
import * as reportsController from './reports.controller.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createReportSchema, updateReportSchema } from './reports.validation.js';

const router = Router();

// Submit report
router.post('/', requireAuth, validate(createReportSchema), reportsController.createReport);

// Admin moderation
router.get('/admin', requireAuth, requireAdmin, reportsController.listReports);
router.patch('/admin/:id', requireAuth, requireAdmin, validate(updateReportSchema), reportsController.resolveReport);

export default router;
