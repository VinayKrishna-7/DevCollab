import prisma from '../../config/prisma.js';
import { calculateMatchScore } from '../../utils/matching.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export async function submitApplication(req, res, next) {
  try {
    const { id: projectId } = req.params;
    const applicantId = req.user.id;
    const { introductoryMessage } = req.body;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true
      }
    });

    if (!project) {
      return sendError(res, 'NOT_FOUND', 'Project not found', [], 404);
    }

    // 1. Cannot apply to own project
    if (project.ownerId === applicantId) {
      return sendError(res, 'INVALID_ACTION', 'You cannot apply to your own project.', [], 400);
    }

    // 2. Cannot apply if already a member
    if (project.members.some(m => m.userId === applicantId)) {
      return sendError(res, 'ALREADY_MEMBER', 'You are already a member of this project.', [], 400);
    }

    // 3. Recruitment status must be RECRUITING
    if (project.recruitmentStatus !== 'RECRUITING') {
      return sendError(res, 'NOT_RECRUITING', 'This project is currently not accepting new applications.', [], 400);
    }

    // 4. Team size check
    if (project.members.length >= project.desiredTeamSize) {
      return sendError(res, 'TEAM_FULL', 'This project has already reached its desired team size.', [], 400);
    }

    // 5. Check duplicate active application
    const existingApp = await prisma.joinRequest.findFirst({
      where: {
        projectId,
        applicantId,
        status: 'PENDING'
      }
    });

    if (existingApp) {
      return sendError(res, 'DUPLICATE_APPLICATION', 'You already have a pending application for this project.', [], 409);
    }

    const application = await prisma.$transaction(async (tx) => {
      const app = await tx.joinRequest.create({
        data: {
          projectId,
          applicantId,
          introductoryMessage,
          status: 'PENDING'
        }
      });

      return app;
    });

    return sendSuccess(res, application, { message: 'Application submitted successfully' }, 201);
  } catch (err) {
    next(err);
  }
}

export async function getProjectApplications(req, res, next) {
  try {
    const { id: projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { skills: { include: { skill: true } } }
    });

    if (!project) {
      return sendError(res, 'NOT_FOUND', 'Project not found', [], 404);
    }

    if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return sendError(res, 'FORBIDDEN', 'Only the project owner can review applications.', [], 403);
    }

    const applications = await prisma.joinRequest.findMany({
      where: { projectId },
      include: {
        applicant: {
          select: {
            id: true,
            username: true,
            createdAt: true,
            profile: true,
            skills: { include: { skill: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Augment with match score
    const withScores = applications.map(app => {
      const matchDetails = calculateMatchScore(app.applicant, project);
      return {
        ...app,
        matchScore: matchDetails.score,
        matchDetails
      };
    });

    return sendSuccess(res, withScores);
  } catch (err) {
    next(err);
  }
}

export async function acceptApplication(req, res, next) {
  try {
    const { id: applicationId } = req.params;
    const { reviewNotes } = req.body || {};

    const application = await prisma.joinRequest.findUnique({
      where: { id: applicationId },
      include: {
        project: {
          include: { members: true }
        },
        applicant: {
          select: { id: true, username: true }
        }
      }
    });

    if (!application) {
      return sendError(res, 'NOT_FOUND', 'Application not found', [], 404);
    }

    const project = application.project;

    // Check ownership
    if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return sendError(res, 'FORBIDDEN', 'Only the project owner can accept applications.', [], 403);
    }

    if (application.status !== 'PENDING') {
      return sendError(res, 'INVALID_STATE', `Application has already been ${application.status.toLowerCase()}.`, [], 400);
    }

    // Atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // Re-fetch project inside transaction to ensure concurrency safety
      const freshProject = await tx.project.findUnique({
        where: { id: project.id },
        include: { members: true }
      });

      if (freshProject.members.length >= freshProject.desiredTeamSize) {
        throw new Error('TEAM_LIMIT_REACHED');
      }

      if (freshProject.members.some(m => m.userId === application.applicantId)) {
        throw new Error('ALREADY_MEMBER');
      }

      // Update application
      const updatedApp = await tx.joinRequest.update({
        where: { id: applicationId },
        data: {
          status: 'ACCEPTED',
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
          reviewNotes: reviewNotes || null
        }
      });

      // Create membership
      await tx.projectMembership.create({
        data: {
          projectId: project.id,
          userId: application.applicantId,
          role: 'MEMBER'
        }
      });

      // If team size reached, automatically transition status or close recruitment
      if (freshProject.members.length + 1 >= freshProject.desiredTeamSize) {
        await tx.project.update({
          where: { id: project.id },
          data: { recruitmentStatus: 'IN_PROGRESS' }
        });
      }

      // Activity log
      await tx.activityLog.create({
        data: {
          projectId: project.id,
          actorId: req.user.id,
          action: 'MEMBER_JOINED',
          entityType: 'USER',
          entityId: application.applicantId,
          metadata: JSON.stringify({ applicantUsername: application.applicant.username })
        }
      });

      return updatedApp;
    });

    return sendSuccess(res, result, { message: 'Application accepted and member added to team' });
  } catch (err) {
    if (err.message === 'TEAM_LIMIT_REACHED') {
      return sendError(res, 'TEAM_LIMIT_REACHED', 'Project has reached its maximum team size limit.', [], 409);
    }
    if (err.message === 'ALREADY_MEMBER') {
      return sendError(res, 'ALREADY_MEMBER', 'Applicant is already a member of this project.', [], 409);
    }
    next(err);
  }
}

export async function rejectApplication(req, res, next) {
  try {
    const { id: applicationId } = req.params;
    const { reviewNotes } = req.body || {};

    const application = await prisma.joinRequest.findUnique({
      where: { id: applicationId },
      include: { project: true }
    });

    if (!application) {
      return sendError(res, 'NOT_FOUND', 'Application not found', [], 404);
    }

    if (application.project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return sendError(res, 'FORBIDDEN', 'Only project owner can reject applications.', [], 403);
    }

    if (application.status !== 'PENDING') {
      return sendError(res, 'INVALID_STATE', `Application is already ${application.status.toLowerCase()}.`, [], 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const app = await tx.joinRequest.update({
        where: { id: applicationId },
        data: {
          status: 'REJECTED',
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
          reviewNotes: reviewNotes || null
        }
      });

      return app;
    });

    return sendSuccess(res, updated, { message: 'Application rejected' });
  } catch (err) {
    next(err);
  }
}

export async function withdrawApplication(req, res, next) {
  try {
    const { id: applicationId } = req.params;

    const application = await prisma.joinRequest.findUnique({
      where: { id: applicationId }
    });

    if (!application) {
      return sendError(res, 'NOT_FOUND', 'Application not found', [], 404);
    }

    if (application.applicantId !== req.user.id) {
      return sendError(res, 'FORBIDDEN', 'You can only withdraw your own applications.', [], 403);
    }

    if (application.status !== 'PENDING') {
      return sendError(res, 'INVALID_STATE', 'Only pending applications can be withdrawn.', [], 400);
    }

    const updated = await prisma.joinRequest.update({
      where: { id: applicationId },
      data: { status: 'WITHDRAWN' }
    });

    return sendSuccess(res, updated, { message: 'Application withdrawn successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getMyApplications(req, res, next) {
  try {
    const { status } = req.query;
    const where = {
      applicantId: req.user.id
    };

    if (status) {
      where.status = status;
    }

    const applications = await prisma.joinRequest.findMany({
      where,
      include: {
        project: {
          include: {
            owner: { select: { id: true, username: true, profile: true } },
            skills: { include: { skill: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return sendSuccess(res, applications);
  } catch (err) {
    next(err);
  }
}
