import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rateLimiter.js';
import { registerSchema, loginSchema, changePasswordSchema } from './auth.validation.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.me);
router.get('/sessions', requireAuth, authController.getSessions);
router.post('/sessions/revoke-others', requireAuth, authController.revokeOtherSessions);
router.post('/change-password', requireAuth, validate(changePasswordSchema), authController.changePassword);
router.post('/deactivate', requireAuth, authController.deactivateAccount);

export default router;
