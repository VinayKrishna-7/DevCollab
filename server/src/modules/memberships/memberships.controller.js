import prisma from '../../config/prisma.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export async function getProjectMembers(req, res, next) {
  try {
    const { id: projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return sendError(res, 'NOT_FOUND', 'Project not found', [], 404);
    }

    const members = await prisma.projectMembership.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: true,
            skills: { include: { skill: true } }
          }
        }
      },
      orderBy: { joinedAt: 'asc' }
    });

    return sendSuccess(res, members);
  } catch (err) {
    next(err);
  }
}

export async function removeMember(req, res, next) {
  try {
    const { id: projectId, userId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true }
    });

    if (!project) {
      return sendError(res, 'NOT_FOUND', 'Project not found', [], 404);
    }

    // Owner authorization
    if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return sendError(res, 'FORBIDDEN', 'Only the project owner can remove team members.', [], 403);
    }

    // Protect owner from removal
    if (userId === project.ownerId) {
      return sendError(res, 'CANNOT_REMOVE_OWNER', 'The project owner cannot be removed from the team.', [], 400);
    }

    const membership = await prisma.projectMembership.findUnique({
      where: {
        projectId_userId: { projectId, userId }
      },
      include: {
        user: { select: { username: true } }
      }
    });

    if (!membership) {
      return sendError(res, 'NOT_FOUND', 'Member not found in this project', [], 404);
    }

    await prisma.$transaction(async (tx) => {
      // Remove membership
      await tx.projectMembership.delete({
        where: { id: membership.id }
      });

      // Unassign active tasks assigned to this user in this project
      await tx.task.updateMany({
        where: { projectId, assigneeId: userId },
        data: { assigneeId: null }
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          projectId,
          actorId: req.user.id,
          action: 'MEMBER_REMOVED',
          entityType: 'USER',
          entityId: userId,
          metadata: JSON.stringify({ username: membership.user.username })
        }
      });
    });

    return sendSuccess(res, null, { message: 'Member removed from project' });
  } catch (err) {
    next(err);
  }
}

export async function leaveProject(req, res, next) {
  try {
    const { id: projectId } = req.params;
    const userId = req.user.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return sendError(res, 'NOT_FOUND', 'Project not found', [], 404);
    }

    // Owner cannot leave
    if (project.ownerId === userId) {
      return sendError(res, 'CANNOT_LEAVE', 'Project owner cannot leave the project.', [], 400);
    }

    const membership = await prisma.projectMembership.findUnique({
      where: {
        projectId_userId: { projectId, userId }
      }
    });

    if (!membership) {
      return sendError(res, 'NOT_FOUND', 'You are not a member of this project.', [], 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.projectMembership.delete({
        where: { id: membership.id }
      });

      // Unassign active tasks
      await tx.task.updateMany({
        where: { projectId, assigneeId: userId },
        data: { assigneeId: null }
      });

      await tx.activityLog.create({
        data: {
          projectId,
          actorId: userId,
          action: 'MEMBER_LEFT',
          entityType: 'USER',
          entityId: userId,
          metadata: JSON.stringify({ username: req.user.username })
        }
      });
    });

    return sendSuccess(res, null, { message: 'You have left the project' });
  } catch (err) {
    next(err);
  }
}
