import { sendError } from '../utils/response.js';

/**
 * Zod validation middleware factory
 * @param {import('zod').ZodSchema} schema
 * @param {'body' | 'query' | 'params'} source
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      return next();
    } catch (err) {
      if (err.errors) {
        const details = err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }));
        return sendError(res, 'VALIDATION_ERROR', 'The submitted data is invalid.', details, 400);
      }
      return sendError(res, 'VALIDATION_ERROR', err.message || 'Validation failed', [], 400);
    }
  };
}
