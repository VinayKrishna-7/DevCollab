import { Router } from 'express';
import * as tasksController from './tasks.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createTaskSchema, updateTaskSchema, updateTaskStatusSchema } from './tasks.validation.js';

const router = Router();

// Current user assigned tasks across all projects
router.get('/me', requireAuth, tasksController.getMyAssignedTasks);

// Project tasks
router.get('/projects/:id', requireAuth, tasksController.getProjectTasks);
router.post('/projects/:id', requireAuth, validate(createTaskSchema), tasksController.createTask);

// Individual task
router.get('/:id', requireAuth, tasksController.getTaskById);
router.patch('/:id', requireAuth, validate(updateTaskSchema), tasksController.updateTask);
router.patch('/:id/status', requireAuth, validate(updateTaskStatusSchema), tasksController.updateTaskStatus);
router.delete('/:id', requireAuth, tasksController.deleteTask);

export default router;
