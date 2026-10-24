import { Router } from 'express';
import * as projectsController from './projects.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createProjectSchema, updateProjectSchema, updateStatusSchema } from './projects.validation.js';

import * as recommendationsController from '../recommendations/recommendations.controller.js';

const router = Router();

// Current user project collections (must come before /:slug)
router.get('/me/owned', requireAuth, projectsController.getOwnedProjects);
router.get('/me/joined', requireAuth, projectsController.getJoinedProjects);
router.get('/me/bookmarks', requireAuth, projectsController.getMyBookmarks);

// Recommendations alias endpoints (Section 25)
router.get('/:id/recommended-developers', requireAuth, recommendationsController.getRecommendedDevelopersForProject);
router.get('/:id/match/:userId', requireAuth, recommendationsController.getProjectDeveloperMatch);

// Discovery and public project browsing
router.get('/', projectsController.listProjects);
router.get('/categories', projectsController.getCategories);
router.get('/:slug', projectsController.getProjectBySlug);

// Mutating operations
router.post('/', requireAuth, validate(createProjectSchema), projectsController.createProject);
router.patch('/:id', requireAuth, validate(updateProjectSchema), projectsController.updateProject);
router.patch('/:id/status', requireAuth, validate(updateStatusSchema), projectsController.updateProjectStatus);
router.delete('/:id', requireAuth, projectsController.deleteProject);

// Bookmarks
router.post('/:id/bookmark', requireAuth, projectsController.toggleBookmark);
router.delete('/:id/bookmark', requireAuth, projectsController.removeBookmark);

export default router;
