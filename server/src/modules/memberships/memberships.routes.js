import { Router } from 'express';
import * as memberController from './memberships.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

router.get('/projects/:id/members', memberController.getProjectMembers);
router.delete('/projects/:id/members/:userId', requireAuth, memberController.removeMember);
router.post('/projects/:id/leave', requireAuth, memberController.leaveProject);

export default router;
