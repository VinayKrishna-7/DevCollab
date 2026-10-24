import { Router } from 'express';
import * as activityController from './activity.controller.js';

const router = Router();

router.get('/projects/:id', activityController.getProjectActivity);

export default router;
