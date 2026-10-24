import prisma from '../../config/prisma.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export async function getProjectActivity(req, res, next) {
  try {
    const { id: projectId } = req.params;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true }
    });

    if (!project) {
      return sendError(res, 'NOT_FOUND', 'Project not found', [], 404);
    }

    const isMember = project.members.some(m => m.userId === req.user?.id);
    const isOwner = project.ownerId === req.user?.id;
    const isAdmin = req.user?.role === 'ADMIN';

    // If private project, require membership
    if (project.visibility === 'PRIVATE' && !isMember && !isOwner && !isAdmin) {
      return sendError(res, 'FORBIDDEN', 'Access denied to private project activity.', [], 403);
    }

    const [total, activities] = await Promise.all([
      prisma.activityLog.count({ where: { projectId } }),
      prisma.activityLog.findMany({
        where: { projectId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              id: true,
              username: true,
              profile: {
                select: { displayName: true, avatarUrl: true }
              }
            }
          }
        }
      })
    ]);

    return sendSuccess(res, activities, {
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
