import prisma from '../../config/prisma.js';
import { calculateMatchScore } from '../../utils/matching.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export async function getRecommendedProjects(req, res, next) {
  try {
    const userId = req.user.id;

    // Fetch developer with profile and skills
    const developer = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        skills: {
          include: { skill: true }
        }
      }
    });

    if (!developer) {
      return sendError(res, 'NOT_FOUND', 'User profile not found', [], 404);
    }

    // Fetch projects open for recruitment that user is NOT already a member of
    const candidateProjects = await prisma.project.findMany({
      where: {
        recruitmentStatus: 'RECRUITING',
        visibility: 'PUBLIC',
        ownerId: { not: userId },
        members: {
          none: { userId }
        }
      },
      include: {
        owner: { select: { id: true, username: true, profile: true } },
        skills: { include: { skill: true } },
        _count: { select: { members: true } }
      },
      take: 50
    });

    const recommendations = candidateProjects.map(project => {
      const matchResult = calculateMatchScore(developer, project);
      return {
        ...project,
        matchScore: matchResult.score,
        matchDetails: matchResult
      };
    });

    // Sort by match score descending
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    return sendSuccess(res, recommendations.slice(0, 15));
  } catch (err) {
    next(err);
  }
}

export async function getRecommendedDevelopersForProject(req, res, next) {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        skills: { include: { skill: true } },
        members: { select: { userId: true } }
      }
    });

    if (!project) {
      return sendError(res, 'NOT_FOUND', 'Project not found', [], 404);
    }

    // Only project owner or admin can request candidate recommendations for this project
    if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return sendError(res, 'FORBIDDEN', 'Only the project owner can view developer recommendations for this project.', [], 403);
    }

    const existingMemberIds = project.members.map(m => m.userId);

    // Fetch candidate developers with public visibility
    const candidateDevelopers = await prisma.user.findMany({
      where: {
        isSuspended: false,
        id: { notIn: existingMemberIds },
        profile: {
          visibility: 'PUBLIC'
        }
      },
      include: {
        profile: true,
        skills: { include: { skill: true } }
      },
      take: 60
    });

    const recommendations = candidateDevelopers.map(dev => {
      const matchResult = calculateMatchScore(dev, project);
      return {
        id: dev.id,
        username: dev.username,
        profile: dev.profile,
        skills: dev.skills,
        matchScore: matchResult.score,
        matchDetails: matchResult
      };
    });

    // Sort by match score descending
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    return sendSuccess(res, recommendations.slice(0, 20));
  } catch (err) {
    next(err);
  }
}

export async function getProjectDeveloperMatch(req, res, next) {
  try {
    const { id, userId } = req.params;

    const [project, developer] = await Promise.all([
      prisma.project.findUnique({
        where: { id },
        include: { skills: { include: { skill: true } } }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true, skills: { include: { skill: true } } }
      })
    ]);

    if (!project || !developer) {
      return sendError(res, 'NOT_FOUND', 'Project or developer not found', [], 404);
    }

    const matchResult = calculateMatchScore(developer, project);

    return sendSuccess(res, matchResult);
  } catch (err) {
    next(err);
  }
}
