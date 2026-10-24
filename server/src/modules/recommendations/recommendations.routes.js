import { Router } from 'express';
import * as recommendationsController from './recommendations.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

// Recommended projects for current developer
router.get('/projects', requireAuth, recommendationsController.getRecommendedProjects);

// Recommended developers for a project (owner only)
router.get('/projects/:id/developers', requireAuth, recommendationsController.getRecommendedDevelopersForProject);

// Detailed match score breakdown between a project and user
router.get('/projects/:id/match/:userId', requireAuth, recommendationsController.getProjectDeveloperMatch);

export default router;
