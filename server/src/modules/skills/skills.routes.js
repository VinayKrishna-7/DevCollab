import { Router } from 'express';
import * as skillsController from './skills.controller.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createSkillSchema, updateSkillSchema } from './skills.validation.js';

const router = Router();

// Public skill search and list
router.get('/', skillsController.listSkills);
router.get('/search', skillsController.searchSkills);

// Admin skill management
router.post('/admin', requireAuth, requireAdmin, validate(createSkillSchema), skillsController.createSkill);
router.patch('/admin/:id', requireAuth, requireAdmin, validate(updateSkillSchema), skillsController.updateSkill);
router.delete('/admin/:id', requireAuth, requireAdmin, skillsController.deleteSkill);

export default router;
