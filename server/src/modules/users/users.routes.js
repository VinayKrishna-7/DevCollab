import { Router } from 'express';
import * as usersController from './users.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { updateProfileSchema, updateSkillsSchema } from './users.validation.js';

const router = Router();

// Current user profile & skills
router.get('/me', requireAuth, usersController.getMyProfile);
router.patch('/me', requireAuth, validate(updateProfileSchema), usersController.updateMyProfile);
router.get('/me/skills', requireAuth, usersController.getMySkills);
router.put('/me/skills', requireAuth, validate(updateSkillsSchema), usersController.updateMySkills);

// Public Developer Directory & Profile
router.get('/', usersController.listDevelopers);
router.get('/:username', usersController.getDeveloperByUsername);

export default router;
