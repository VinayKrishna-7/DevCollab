import prisma from '../../config/prisma.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export async function getProjectMilestones(req, res, next) {
  try {
    const { id: projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true }
    });

    if (!project) {
      return sendError(res, 'NOT_FOUND', 'Project not found', [], 404);
    }

    const isMember = project.members.some(m => m.userId === req.user.id);
    const isOwner = project.ownerId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isMember && !isOwner && !isAdmin) {
      return sendError(res, 'FORBIDDEN', 'Access denied to project milestones.', [], 403);
    }

    const milestones = await prisma.milestone.findMany({
      where: { projectId },
      include: {
        creator: { select: { id: true, username: true, profile: true } }
      },
      orderBy: { dueDate: 'asc' }
    });

    return sendSuccess(res, milestones);
  } catch (err) {
    next(err);
  }
}

export async function createMilestone(req, res, next) {
  try {
    const { id: projectId } = req.params;
    const data = req.body;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true }
    });

    if (!project) {
      return sendError(res, 'NOT_FOUND', 'Project not found', [], 404);
    }

    const isMember = project.members.some(m => m.userId === req.user.id);
    const isOwner = project.ownerId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isMember && !isOwner && !isAdmin) {
      return sendError(res, 'FORBIDDEN', 'Access denied.', [], 403);
    }

    const milestone = await prisma.$transaction(async (tx) => {
      const ms = await tx.milestone.create({
        data: {
          ...data,
          projectId,
          creatorId: req.user.id,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          completedAt: data.status === 'COMPLETED' ? new Date() : null
        },
        include: {
          creator: { select: { id: true, username: true, profile: true } }
        }
      });

      await tx.activityLog.create({
        data: {
          projectId,
          actorId: req.user.id,
          action: 'MILESTONE_CREATED',
          entityType: 'MILESTONE',
          entityId: ms.id,
          metadata: JSON.stringify({ title: ms.title })
        }
      });

      return ms;
    });

    return sendSuccess(res, milestone, { message: 'Milestone created' }, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateMilestone(req, res, next) {
  try {
    const { id } = req.params;
    const data = req.body;

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: {
        project: { include: { members: true } }
      }
    });

    if (!milestone) {
      return sendError(res, 'NOT_FOUND', 'Milestone not found', [], 404);
    }

    const isMember = milestone.project.members.some(m => m.userId === req.user.id);
    const isOwner = milestone.project.ownerId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isMember && !isOwner && !isAdmin) {
      return sendError(res, 'FORBIDDEN', 'Access denied.', [], 403);
    }

    const completedAt = data.status === 'COMPLETED' && milestone.status !== 'COMPLETED'
      ? new Date()
      : (data.status && data.status !== 'COMPLETED' ? null : milestone.completedAt);

    const updated = await prisma.$transaction(async (tx) => {
      const ms = await tx.milestone.update({
        where: { id },
        data: {
          ...data,
          dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
          completedAt
        },
        include: {
          creator: { select: { id: true, username: true, profile: true } }
        }
      });

      if (data.status && data.status !== milestone.status) {
        await tx.activityLog.create({
          data: {
            projectId: milestone.projectId,
            actorId: req.user.id,
            action: 'MILESTONE_UPDATED',
            entityType: 'MILESTONE',
            entityId: id,
            metadata: JSON.stringify({ title: ms.title, from: milestone.status, to: data.status })
          }
        });
      }

      return ms;
    });

    return sendSuccess(res, updated, { message: 'Milestone updated' });
  } catch (err) {
    next(err);
  }
}

export async function deleteMilestone(req, res, next) {
  try {
    const { id } = req.params;

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!milestone) {
      return sendError(res, 'NOT_FOUND', 'Milestone not found', [], 404);
    }

    const isOwner = milestone.project.ownerId === req.user.id;
    const isCreator = milestone.creatorId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isCreator && !isAdmin) {
      return sendError(res, 'FORBIDDEN', 'Only project owner or milestone creator can delete this milestone.', [], 403);
    }

    await prisma.milestone.delete({ where: { id } });

    return sendSuccess(res, null, { message: 'Milestone deleted' });
  } catch (err) {
    next(err);
  }
}
