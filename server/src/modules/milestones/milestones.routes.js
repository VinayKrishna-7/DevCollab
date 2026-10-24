import { Router } from 'express';
import * as milestonesController from './milestones.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createMilestoneSchema, updateMilestoneSchema } from './milestones.validation.js';

const router = Router();

router.get('/projects/:id', requireAuth, milestonesController.getProjectMilestones);
router.post('/projects/:id', requireAuth, validate(createMilestoneSchema), milestonesController.createMilestone);
router.patch('/:id', requireAuth, validate(updateMilestoneSchema), milestonesController.updateMilestone);
router.delete('/:id', requireAuth, milestonesController.deleteMilestone);

export default router;
