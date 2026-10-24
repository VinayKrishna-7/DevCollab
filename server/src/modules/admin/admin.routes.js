import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/dashboard', adminController.getAdminDashboard);
router.get('/users', adminController.listAdminUsers);
router.patch('/users/:id/status', adminController.toggleUserSuspension);
router.get('/audit-logs', adminController.getAdminAuditLogs);

export default router;
