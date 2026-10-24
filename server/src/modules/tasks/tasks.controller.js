import prisma from '../../config/prisma.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export async function getProjectTasks(req, res, next) {
  try {
    const { id: projectId } = req.params;
    const { status, priority, assigneeId, search } = req.query;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true }
    });

    if (!project) {
      return sendError(res, 'NOT_FOUND', 'Project not found', [], 404);
    }

    // Must be member, owner, or admin
    const isMember = project.members.some(m => m.userId === req.user.id);
    const isOwner = project.ownerId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isMember && !isOwner && !isAdmin) {
      return sendError(res, 'FORBIDDEN', 'Only project team members can access project tasks.', [], 403);
    }

    const where = { projectId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;
    if (search && search.trim()) {
      where.title = { contains: search.trim(), mode: 'insensitive' };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        creator: { select: { id: true, username: true, profile: true } },
        assignee: { select: { id: true, username: true, profile: true } }
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
    });

    return sendSuccess(res, tasks);
  } catch (err) {
    next(err);
  }
}

export async function createTask(req, res, next) {
  try {
    const { id: projectId } = req.params;
    const data = req.body;
    const creatorId = req.user.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true }
    });

    if (!project) {
      return sendError(res, 'NOT_FOUND', 'Project not found', [], 404);
    }

    // Must be member, owner, or admin
    const isMember = project.members.some(m => m.userId === creatorId);
    const isOwner = project.ownerId === creatorId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isMember && !isOwner && !isAdmin) {
      return sendError(res, 'FORBIDDEN', 'Only project members can create tasks.', [], 403);
    }

    // Validate that assignee is an active project member
    if (data.assigneeId) {
      const isAssigneeMember = project.members.some(m => m.userId === data.assigneeId);
      if (!isAssigneeMember) {
        return sendError(res, 'INVALID_ASSIGNEE', 'Task assignee must be an active member of this project.', [], 400);
      }
    }

    const task = await prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          ...data,
          projectId,
          creatorId,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          completedAt: data.status === 'DONE' ? new Date() : null
        },
        include: {
          creator: { select: { id: true, username: true, profile: true } },
          assignee: { select: { id: true, username: true, profile: true } }
        }
      });

      // Activity log
      await tx.activityLog.create({
        data: {
          projectId,
          actorId: creatorId,
          action: 'TASK_CREATED',
          entityType: 'TASK',
          entityId: created.id,
          metadata: JSON.stringify({ title: created.title, priority: created.priority })
        }
      });

      return created;
    });

    return sendSuccess(res, task, { message: 'Task created successfully' }, 201);
  } catch (err) {
    next(err);
  }
}

export async function getTaskById(req, res, next) {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: { members: true }
        },
        creator: { select: { id: true, username: true, profile: true } },
        assignee: { select: { id: true, username: true, profile: true } }
      }
    });

    if (!task) {
      return sendError(res, 'NOT_FOUND', 'Task not found', [], 404);
    }

    const isMember = task.project.members.some(m => m.userId === req.user.id);
    const isOwner = task.project.ownerId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isMember && !isOwner && !isAdmin) {
      return sendError(res, 'FORBIDDEN', 'Access denied to this task.', [], 403);
    }

    return sendSuccess(res, task);
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req, res, next) {
  try {
    const { id } = req.params;
    const data = req.body;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: { members: true }
        }
      }
    });

    if (!task) {
      return sendError(res, 'NOT_FOUND', 'Task not found', [], 404);
    }

    const isMember = task.project.members.some(m => m.userId === req.user.id);
    const isOwner = task.project.ownerId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isMember && !isOwner && !isAdmin) {
      return sendError(res, 'FORBIDDEN', 'Access denied.', [], 403);
    }

    // Validate new assignee is member
    if (data.assigneeId) {
      const isAssigneeMember = task.project.members.some(m => m.userId === data.assigneeId);
      if (!isAssigneeMember) {
        return sendError(res, 'INVALID_ASSIGNEE', 'Assignee must be a project member.', [], 400);
      }
    }

    const completedAt = data.status === 'DONE' && task.status !== 'DONE'
      ? new Date()
      : (data.status && data.status !== 'DONE' ? null : task.completedAt);

    const updatedTask = await prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id },
        data: {
          ...data,
          dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
          completedAt
        },
        include: {
          creator: { select: { id: true, username: true, profile: true } },
          assignee: { select: { id: true, username: true, profile: true } }
        }
      });

      // Check status change log
      if (data.status && data.status !== task.status) {
        await tx.activityLog.create({
          data: {
            projectId: task.projectId,
            actorId: req.user.id,
            action: 'TASK_STATUS_CHANGED',
            entityType: 'TASK',
            entityId: id,
            metadata: JSON.stringify({ taskTitle: task.title, from: task.status, to: data.status })
          }
        });
      }

      return updated;
    });

    return sendSuccess(res, updatedTask, { message: 'Task updated successfully' });
  } catch (err) {
    next(err);
  }
}

export async function updateTaskStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: { include: { members: true } }
      }
    });

    if (!task) {
      return sendError(res, 'NOT_FOUND', 'Task not found', [], 404);
    }

    const isMember = task.project.members.some(m => m.userId === req.user.id);
    const isOwner = task.project.ownerId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isMember && !isOwner && !isAdmin) {
      return sendError(res, 'FORBIDDEN', 'Access denied', [], 403);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.task.update({
        where: { id },
        data: {
          status,
          completedAt: status === 'DONE' ? new Date() : (task.status === 'DONE' ? null : task.completedAt)
        },
        include: {
          creator: { select: { id: true, username: true, profile: true } },
          assignee: { select: { id: true, username: true, profile: true } }
        }
      });

      await tx.activityLog.create({
        data: {
          projectId: task.projectId,
          actorId: req.user.id,
          action: 'TASK_STATUS_CHANGED',
          entityType: 'TASK',
          entityId: id,
          metadata: JSON.stringify({ taskTitle: task.title, from: task.status, to: status })
        }
      });

      return t;
    });

    return sendSuccess(res, updated, { message: 'Task status updated' });
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!task) {
      return sendError(res, 'NOT_FOUND', 'Task not found', [], 404);
    }

    // Owner, task creator, or admin can delete
    const isOwner = task.project.ownerId === req.user.id;
    const isCreator = task.creatorId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isCreator && !isAdmin) {
      return sendError(res, 'FORBIDDEN', 'Only the project owner or task creator can delete this task.', [], 403);
    }

    await prisma.task.delete({ where: { id } });

    return sendSuccess(res, null, { message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getMyAssignedTasks(req, res, next) {
  try {
    const tasks = await prisma.task.findMany({
      where: { assigneeId: req.user.id },
      include: {
        project: {
          select: { id: true, slug: true, title: true, category: true }
        },
        creator: { select: { id: true, username: true, profile: true } }
      },
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' }
      ]
    });

    return sendSuccess(res, tasks);
  } catch (err) {
    next(err);
  }
}
