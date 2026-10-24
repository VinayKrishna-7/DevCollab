import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response.js';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      'TOO_MANY_REQUESTS',
      'Too many authentication attempts. Please try again after 15 minutes.',
      [],
      429
    );
  }
});

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      'TOO_MANY_REQUESTS',
      'Rate limit exceeded. Please slow down your requests.',
      [],
      429
    );
  }
});
