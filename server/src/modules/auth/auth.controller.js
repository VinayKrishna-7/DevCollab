import crypto from 'crypto';
import prisma from '../../config/prisma.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { config } from '../../config/env.js';

const SESSION_COOKIE_NAME = 'devcollab_session';
const CSRF_COOKIE_NAME = 'devcollab_csrf';

function setSessionCookies(res, sessionToken, rememberMe = true) {
  const isProduction = config.nodeEnv === 'production';
  const durationDays = rememberMe ? 30 : 7;
  const maxAge = durationDays * 24 * 60 * 60 * 1000;

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge,
    path: '/'
  };

  res.cookie(SESSION_COOKIE_NAME, sessionToken, cookieOptions);

  // Issue CSRF cookie
  const csrfToken = crypto.randomBytes(24).toString('hex');
  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    maxAge,
    path: '/'
  });

  return csrfToken;
}

export async function register(req, res, next) {
  try {
    const { email, username, password, displayName } = req.body;

    // Check if email or username already taken
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return sendError(res, 'EMAIL_EXISTS', 'An account with this email address already exists.', [{ field: 'email', message: 'Email already registered' }], 409);
      }
      return sendError(res, 'USERNAME_EXISTS', 'This username is already taken.', [{ field: 'username', message: 'Username is taken' }], 409);
    }

    const passwordHash = await hashPassword(password);

    // Create user and initial profile in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          username,
          passwordHash,
          role: 'USER',
          profile: {
            create: {
              displayName: displayName || username,
              headline: 'Full-Stack Developer',
              bio: '',
              experienceLevel: 'BEGINNER',
              availability: 'AVAILABLE',
              weeklyHours: 10,
              collaborationType: 'PERSONAL_PROJECT',
              areasOfInterest: ['Web Development']
            }
          }
        },
        include: {
          profile: true
        }
      });

      // Create session
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + config.sessionDurationDays * 24 * 60 * 60 * 1000);

      await tx.session.create({
        data: {
          token: sessionToken,
          userId: user.id,
          expiresAt,
          userAgent: req.headers['user-agent'] || null,
          ipAddress: req.ip || null
        }
      });

      return { user, sessionToken };
    });

    const csrfToken = setSessionCookies(res, newUser.sessionToken);
    const { passwordHash: _, ...safeUser } = newUser.user;

    return sendSuccess(res, {
      user: safeUser,
      csrfToken
    }, { message: 'Registration successful' }, 201);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { emailOrUsername, password, rememberMe = true } = req.body;
    const identifier = emailOrUsername.toLowerCase().trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      },
      include: {
        profile: true
      }
    });

    if (!user) {
      return sendError(res, 'INVALID_CREDENTIALS', 'Invalid email/username or password.', [], 401);
    }

    if (user.isSuspended) {
      return sendError(res, 'ACCOUNT_SUSPENDED', `Account suspended: ${user.suspendedReason || 'Contact support.'}`, [], 403);
    }

    const isMatch = await verifyPassword(user.passwordHash, password);
    if (!isMatch) {
      return sendError(res, 'INVALID_CREDENTIALS', 'Invalid email/username or password.', [], 401);
    }

    // Determine session duration (30 days if rememberMe, otherwise 7 days)
    const durationDays = rememberMe ? 30 : 7;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const userAgent = req.headers['user-agent'] || 'Browser';
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    // Create session in database - persistent login details
    await prisma.session.create({
      data: {
        token: sessionToken,
        userId: user.id,
        expiresAt,
        userAgent,
        ipAddress
      }
    });

    // Record login details in system audit log
    await prisma.adminAuditLog.create({
      data: {
        actorId: user.id,
        action: 'USER_LOGIN',
        targetType: 'USER',
        targetId: user.id,
        metadata: JSON.stringify({
          ip: ipAddress,
          userAgent,
          rememberMe: Boolean(rememberMe),
          loginTime: new Date().toISOString()
        })
      }
    }).catch(() => {});

    const csrfToken = setSessionCookies(res, sessionToken, rememberMe);
    const { passwordHash: _, ...safeUser } = user;

    return sendSuccess(res, {
      user: safeUser,
      csrfToken
    }, { message: 'Login successful' });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    if (req.session) {
      await prisma.session.delete({
        where: { id: req.session.id }
      }).catch(() => {});
    }

    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    res.clearCookie(CSRF_COOKIE_NAME, { path: '/' });

    return sendSuccess(res, null, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    if (!req.user) {
      return sendSuccess(res, { user: null });
    }

    return sendSuccess(res, {
      user: req.user
    });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return sendError(res, 'NOT_FOUND', 'User not found.', [], 404);
    }

    const isMatch = await verifyPassword(user.passwordHash, currentPassword);
    if (!isMatch) {
      return sendError(res, 'INVALID_PASSWORD', 'The current password you entered is incorrect.', [{ field: 'currentPassword', message: 'Incorrect current password' }], 400);
    }

    const newHash = await hashPassword(newPassword);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash: newHash }
      });

      // Invalidate all sessions except current session
      if (req.session?.id) {
        await tx.session.deleteMany({
          where: {
            userId,
            id: { not: req.session.id }
          }
        });
      }
    });

    return sendSuccess(res, null, { message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
}

export async function deactivateAccount(req, res, next) {
  try {
    const userId = req.user.id;

    await prisma.$transaction(async (tx) => {
      // Invalidate all sessions
      await tx.session.deleteMany({
        where: { userId }
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          isSuspended: true,
          suspendedReason: 'Account deactivated by user request'
        }
      });
    });

    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    res.clearCookie(CSRF_COOKIE_NAME, { path: '/' });

    return sendSuccess(res, null, { message: 'Account deactivated successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getSessions(req, res, next) {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        expiresAt: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true
      }
    });

    const formatted = sessions.map(s => ({
      ...s,
      isCurrent: req.session?.id === s.id
    }));

    return sendSuccess(res, formatted);
  } catch (err) {
    next(err);
  }
}

export async function revokeOtherSessions(req, res, next) {
  try {
    if (req.session?.id) {
      await prisma.session.deleteMany({
        where: {
          userId: req.user.id,
          id: { not: req.session.id }
        }
      });
    }
    return sendSuccess(res, null, { message: 'Logged out of other devices successfully' });
  } catch (err) {
    next(err);
  }
}
