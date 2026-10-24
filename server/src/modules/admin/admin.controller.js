import prisma from '../../config/prisma.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export async function getAdminDashboard(req, res, next) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersPastMonth,
      totalProjects,
      publicProjects,
      recruitingProjects,
      inProgressProjects,
      completedProjects,
      archivedProjects,
      totalJoinRequests,
      pendingJoinRequests,
      acceptedJoinRequests,
      totalTasks,
      completedTasks,
      pendingReports,
      categoryDistribution
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.project.count(),
      prisma.project.count({ where: { visibility: 'PUBLIC' } }),
      prisma.project.count({ where: { recruitmentStatus: 'RECRUITING' } }),
      prisma.project.count({ where: { recruitmentStatus: 'IN_PROGRESS' } }),
      prisma.project.count({ where: { recruitmentStatus: 'COMPLETED' } }),
      prisma.project.count({ where: { recruitmentStatus: 'ARCHIVED' } }),
      prisma.joinRequest.count(),
      prisma.joinRequest.count({ where: { status: 'PENDING' } }),
      prisma.joinRequest.count({ where: { status: 'ACCEPTED' } }),
      prisma.task.count(),
      prisma.task.count({ where: { status: 'DONE' } }),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.project.groupBy({
        by: ['category'],
        _count: { id: true }
      })
    ]);

    const formattedCategoryStats = categoryDistribution.map(c => ({
      category: c.category.replace(/_/g, ' '),
      rawCategory: c.category,
      count: c._count.id
    }));

    return sendSuccess(res, {
      metrics: {
        totalUsers,
        newUsersPastMonth,
        totalProjects,
        publicProjects,
        recruitingProjects,
        inProgressProjects,
        completedProjects,
        archivedProjects,
        totalJoinRequests,
        pendingJoinRequests,
        acceptedJoinRequests,
        totalTasks,
        completedTasks,
        pendingReports
      },
      categoryDistribution: formattedCategoryStats
    });
  } catch (err) {
    next(err);
  }
}

export async function listAdminUsers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const { search, role, status } = req.query;
    const where = {};

    if (role) {
      where.role = role;
    }

    if (status === 'suspended') {
      where.isSuspended = true;
    } else if (status === 'active') {
      where.isSuspended = false;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { username: { contains: q, mode: 'insensitive' } },
        { profile: { displayName: { contains: q, mode: 'insensitive' } } }
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          isSuspended: true,
          suspendedReason: true,
          createdAt: true,
          profile: true,
          _count: {
            select: {
              ownedProjects: true,
              memberships: true,
              applications: true
            }
          }
        }
      })
    ]);

    return sendSuccess(res, users, {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function toggleUserSuspension(req, res, next) {
  try {
    const { id } = req.params;
    const { isSuspended, reason } = req.body;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return sendError(res, 'NOT_FOUND', 'User not found', [], 404);
    }

    if (targetUser.role === 'ADMIN') {
      return sendError(res, 'CANNOT_SUSPEND_ADMIN', 'Administrators cannot be suspended.', [], 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          isSuspended: Boolean(isSuspended),
          suspendedReason: isSuspended ? (reason || 'Suspended by administrator') : null
        }
      });

      // If suspended, invalidate all active sessions immediately
      if (isSuspended) {
        await tx.session.deleteMany({
          where: { userId: id }
        });
      }

      await tx.adminAuditLog.create({
        data: {
          actorId: req.user.id,
          action: isSuspended ? 'SUSPEND_USER' : 'REACTIVATE_USER',
          targetType: 'USER',
          targetId: id,
          metadata: JSON.stringify({ reason, targetUsername: targetUser.username })
        }
      });
    });

    return sendSuccess(res, null, {
      message: isSuspended ? 'User suspended and sessions terminated' : 'User account reactivated'
    });
  } catch (err) {
    next(err);
  }
}

export async function getAdminAuditLogs(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '25', 10)));
    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      prisma.adminAuditLog.count(),
      prisma.adminAuditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, username: true, email: true }
          }
        }
      })
    ]);

    return sendSuccess(res, logs, {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
}
