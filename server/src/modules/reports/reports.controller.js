import prisma from '../../config/prisma.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export async function createReport(req, res, next) {
  try {
    const { targetType, projectId, reason, explanation } = req.body;
    const reporterId = req.user.id;

    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) {
        return sendError(res, 'NOT_FOUND', 'Project not found', [], 404);
      }
    }

    // Check duplicate active pending report from same reporter for same target
    const existing = await prisma.report.findFirst({
      where: {
        reporterId,
        projectId,
        status: 'PENDING'
      }
    });

    if (existing) {
      return sendError(res, 'DUPLICATE_REPORT', 'You already have a pending report under review for this resource.', [], 409);
    }

    const report = await prisma.report.create({
      data: {
        reporterId,
        targetType,
        projectId,
        reason,
        explanation
      }
    });

    return sendSuccess(res, report, { message: 'Report submitted for administrator review' }, 201);
  } catch (err) {
    next(err);
  }
}

export async function listReports(req, res, next) {
  try {
    const { status } = req.query;
    const where = {};
    if (status) {
      where.status = status;
    }

    const reports = await prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: { id: true, username: true, email: true }
        },
        project: {
          select: { id: true, slug: true, title: true, ownerId: true }
        }
      }
    });

    return sendSuccess(res, reports);
  } catch (err) {
    next(err);
  }
}

export async function resolveReport(req, res, next) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      return sendError(res, 'NOT_FOUND', 'Report not found', [], 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const r = await tx.report.update({
        where: { id },
        data: {
          status,
          notes,
          resolvedBy: req.user.id,
          resolvedAt: new Date()
        }
      });

      await tx.adminAuditLog.create({
        data: {
          actorId: req.user.id,
          action: `REPORT_${status}`,
          targetType: 'REPORT',
          targetId: id,
          metadata: JSON.stringify({ notes, reportReason: report.reason })
        }
      });

      return r;
    });

    return sendSuccess(res, updated, { message: `Report marked as ${status.toLowerCase()}` });
  } catch (err) {
    next(err);
  }
}
