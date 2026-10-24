import { sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export function notFoundHandler(req, res) {
  return sendError(res, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`, [], 404);
}

export function errorHandler(err, req, res, next) {
  logger.error('Unhandled server error', {
    error: err.message,
    path: req.originalUrl,
    method: req.method
  });

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    const fields = err.meta?.target || ['field'];
    return sendError(
      res,
      'CONFLICT',
      `A record with this ${fields.join(', ')} already exists.`,
      [{ field: fields.join(', '), message: 'Value must be unique' }],
      409
    );
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return sendError(res, 'NOT_FOUND', 'Requested resource was not found.', [], 404);
  }

  // Zod syntax or unhandled validation
  if (err.name === 'ZodError') {
    return sendError(
      res,
      'VALIDATION_ERROR',
      'Validation failed',
      err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
      400
    );
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'An internal server error occurred.'
    : err.message || 'An internal error occurred.';

  return sendError(res, err.code || 'SERVER_ERROR', message, [], statusCode);
}
