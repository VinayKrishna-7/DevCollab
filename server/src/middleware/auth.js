import prisma from '../config/prisma.js';
import { sendError } from '../utils/response.js';

/**
 * Extracts and verifies session from HTTP-only cookie
 */
export async function authenticateSession(req, res, next) {
  try {
    const sessionToken = req.cookies?.devcollab_session || req.headers['authorization']?.replace(/^Bearer\s+/i, '');

    if (!sessionToken) {
      req.user = null;
      req.session = null;
      return next();
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    });

    if (!session) {
      res.clearCookie('devcollab_session');
      req.user = null;
      req.session = null;
      return next();
    }

    // Check expiration
    if (new Date() > new Date(session.expiresAt)) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      res.clearCookie('devcollab_session');
      req.user = null;
      req.session = null;
      return next();
    }

    // Check suspension
    if (session.user.isSuspended) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      res.clearCookie('devcollab_session');
      return sendError(res, 'ACCOUNT_SUSPENDED', 'Your account has been suspended by an administrator.', [], 403);
    }

    // Strip password hash from request user object
    const { passwordHash, ...safeUser } = session.user;
    req.user = safeUser;
    req.session = session;

    // Sliding session extension: if less than 15 days remain on an active session, refresh it by 30 days
    const remainingMs = new Date(session.expiresAt).getTime() - Date.now();
    if (remainingMs < 15 * 24 * 60 * 60 * 1000) {
      const refreshedExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      prisma.session.update({
        where: { id: session.id },
        data: { expiresAt: refreshedExpiresAt }
      }).catch(() => {});

      res.cookie('devcollab_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/'
      });
    }

    return next();
  } catch (error) {
    req.user = null;
    req.session = null;
    return next();
  }
}

/**
 * Middleware ensuring user is logged in
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return sendError(res, 'UNAUTHENTICATED', 'You must be logged in to perform this action.', [], 401);
  }
  return next();
}

/**
 * Middleware ensuring user has ADMIN role
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return sendError(res, 'UNAUTHENTICATED', 'Authentication required.', [], 401);
  }
  if (req.user.role !== 'ADMIN') {
    return sendError(res, 'FORBIDDEN', 'Administrative privileges required.', [], 403);
  }
  return next();
}
