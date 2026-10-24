import crypto from 'crypto';
import { sendError } from '../utils/response.js';

export function csrfTokenGenerator(req, res, next) {
  // If no csrf cookie exists, issue one
  if (!req.cookies?.devcollab_csrf) {
    const token = crypto.randomBytes(24).toString('hex');
    res.cookie('devcollab_csrf', token, {
      httpOnly: false, // Accessible by frontend JS so it can send in header
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 14 * 24 * 60 * 60 * 1000
    });
  }
  next();
}

export function csrfProtection(req, res, next) {
  // Safe HTTP methods do not change state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Exempt test runs if needed
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const csrfCookie = req.cookies?.devcollab_csrf;
  const csrfHeader = req.headers['x-csrf-token'];
  const requestedWith = req.headers['x-requested-with'];

  // Protect against CSRF: require either matching CSRF token or verified custom application header
  if ((csrfCookie && csrfHeader && csrfCookie === csrfHeader) || requestedWith === 'XMLHttpRequest') {
    return next();
  }

  // If token is missing or mismatched:
  return sendError(
    res,
    'CSRF_DETECTED',
    'Cross-site request validation failed. Please refresh and try again.',
    [],
    403
  );
}
