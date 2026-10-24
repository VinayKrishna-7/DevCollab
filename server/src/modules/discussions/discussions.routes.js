import { Router } from 'express';
import * as discussionsController from './discussions.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createMessageSchema, updateMessageSchema } from './discussions.validation.js';

const router = Router();

router.get('/projects/:id/messages', requireAuth, discussionsController.getProjectMessages);
router.post('/projects/:id/messages', requireAuth, validate(createMessageSchema), discussionsController.sendMessage);
router.patch('/messages/:id', requireAuth, validate(updateMessageSchema), discussionsController.editMessage);
router.delete('/messages/:id', requireAuth, discussionsController.deleteMessage);

export default router;
