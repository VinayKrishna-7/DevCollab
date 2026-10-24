import prisma from '../../config/prisma.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { emitToProject } from '../../sockets/socketEmitter.js';

export async function getProjectMessages(req, res, next) {
  try {
    const { id: projectId } = req.params;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const before = req.query.before; // ISO timestamp for cursor pagination

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
      return sendError(res, 'FORBIDDEN', 'Access denied to project discussions.', [], 403);
    }

    const where = { projectId };
    if (before) {
      where.createdAt = { lt: new Date(before) };
    }

    const messages = await prisma.discussionMessage.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    // Return in chronological order
    return sendSuccess(res, messages.reverse());
  } catch (err) {
    next(err);
  }
}

export async function sendMessage(req, res, next) {
  try {
    const { id: projectId } = req.params;
    const { message } = req.body;
    const senderId = req.user.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true }
    });

    if (!project) {
      return sendError(res, 'NOT_FOUND', 'Project not found', [], 404);
    }

    const isMember = project.members.some(m => m.userId === senderId);
    const isOwner = project.ownerId === senderId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isMember && !isOwner && !isAdmin) {
      return sendError(res, 'FORBIDDEN', 'Access denied to send messages in this project.', [], 403);
    }

    const newMessage = await prisma.discussionMessage.create({
      data: {
        projectId,
        senderId,
        message
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    // Broadcast to real-time socket room for project
    emitToProject(projectId, 'message:new', newMessage);

    return sendSuccess(res, newMessage, { message: 'Message sent' }, 201);
  } catch (err) {
    next(err);
  }
}

export async function editMessage(req, res, next) {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const existingMessage = await prisma.discussionMessage.findUnique({
      where: { id }
    });

    if (!existingMessage) {
      return sendError(res, 'NOT_FOUND', 'Message not found', [], 404);
    }

    if (existingMessage.senderId !== req.user.id && req.user.role !== 'ADMIN') {
      return sendError(res, 'FORBIDDEN', 'You can only edit your own messages.', [], 403);
    }

    const updated = await prisma.discussionMessage.update({
      where: { id },
      data: {
        message,
        isEdited: true
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    emitToProject(updated.projectId, 'message:updated', updated);

    return sendSuccess(res, updated, { message: 'Message updated' });
  } catch (err) {
    next(err);
  }
}

export async function deleteMessage(req, res, next) {
  try {
    const { id } = req.params;

    const message = await prisma.discussionMessage.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!message) {
      return sendError(res, 'NOT_FOUND', 'Message not found', [], 404);
    }

    const isSender = message.senderId === req.user.id;
    const isOwner = message.project.ownerId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isSender && !isOwner && !isAdmin) {
      return sendError(res, 'FORBIDDEN', 'You do not have permission to delete this message.', [], 403);
    }

    await prisma.discussionMessage.delete({ where: { id } });

    emitToProject(message.projectId, 'message:deleted', { id, projectId: message.projectId });

    return sendSuccess(res, null, { message: 'Message deleted' });
  } catch (err) {
    next(err);
  }
}
