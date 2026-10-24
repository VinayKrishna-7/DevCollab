/**
 * Send standard DevCollab success response
 */
export function sendSuccess(res, data = null, meta = {}, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    meta
  });
}

/**
 * Send standard DevCollab error response
 */
export function sendError(res, code = 'INTERNAL_ERROR', message = 'An unexpected error occurred', details = [], statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details
    }
  });
}
