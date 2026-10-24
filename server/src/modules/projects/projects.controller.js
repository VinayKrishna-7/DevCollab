import prisma from '../../config/prisma.js';
import { generateSlug } from '../../utils/slug.js';
import { sendSuccess, sendError } from '../../utils/response.js';

const VALID_STATUS_TRANSITIONS = {
  DRAFT: ['RECRUITING', 'ARCHIVED'],
  RECRUITING: ['IN_PROGRESS', 'COMPLETED', 'ARCHIVED', 'DRAFT'],
  IN_PROGRESS: ['COMPLETED', 'ARCHIVED', 'RECRUITING'],
  COMPLETED: ['ARCHIVED', 'IN_PROGRESS', 'RECRUITING'],
  ARCHIVED: ['DRAFT', 'RECRUITING']
};

export async function getCategories(req, res, next) {
  try {
    const categories = [
      'WEB_DEVELOPMENT',
      'MOBILE_DEVELOPMENT',
      'AI_ML',
      'DATA_SCIENCE',
      'DEVTOOLS',
      'GAME_DEVELOPMENT',
      'CYBERSECURITY',
      'OPEN_SOURCE',
      'OTHER'
    ];
    return sendSuccess(res, categories);
  } catch (err) {
    next(err);
  }
}

export async function createProject(req, res, next) {
  try {
    const { skills = [], ...data } = req.body;
    const ownerId = req.user.id;
    const slug = generateSlug(data.title);

    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          ...data,
          slug,
          ownerId,
          startDate: data.startDate ? new Date(data.startDate) : null,
          targetCompletionDate: data.targetCompletionDate ? new Date(data.targetCompletionDate) : null
        }
      });

      // Add skills if provided
      if (skills.length > 0) {
        await tx.projectSkill.createMany({
          data: skills.map(skillId => ({
            projectId: project.id,
            skillId,
            importance: 'REQUIRED'
          }))
        });
      }

      // Add owner as a member with OWNER role
      await tx.projectMembership.create({
        data: {
          projectId: project.id,
          userId: ownerId,
          role: 'OWNER'
        }
      });

      // Record activity
      await tx.activityLog.create({
        data: {
          projectId: project.id,
          actorId: ownerId,
          action: 'PROJECT_CREATED',
          entityType: 'PROJECT',
          entityId: project.id,
          metadata: JSON.stringify({ title: project.title })
        }
      });

      return project;
    });

    const fullProject = await prisma.project.findUnique({
      where: { id: result.id },
      include: {
        owner: {
          select: { id: true, username: true, profile: true }
        },
        skills: {
          include: { skill: true }
        },
        members: {
          include: {
            user: { select: { id: true, username: true, profile: true } }
          }
        },
        _count: {
          select: { members: true, tasks: true }
        }
      }
    });

    return sendSuccess(res, fullProject, { message: 'Project created successfully' }, 201);
  } catch (err) {
    next(err);
  }
}

export async function listProjects(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '12', 10)));
    const skip = (page - 1) * limit;

    const {
      search,
      category,
      recruitmentStatus,
      experiencePreference,
      collaborationType,
      skills,
      sort = 'newest'
    } = req.query;

    const where = {};

    // Privacy filter: only show public projects to non-members
    if (req.user?.role !== 'ADMIN') {
      where.OR = [
        { visibility: 'PUBLIC' },
        ...(req.user ? [{ members: { some: { userId: req.user.id } } }] : [])
      ];
    }

    if (category) {
      where.category = category;
    }

    if (recruitmentStatus) {
      where.recruitmentStatus = recruitmentStatus;
    }

    if (experiencePreference) {
      where.experiencePreference = experiencePreference;
    }

    if (collaborationType) {
      where.collaborationType = collaborationType;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { summary: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            {
              skills: {
                some: {
                  skill: { name: { contains: q, mode: 'insensitive' } }
                }
              }
            }
          ]
        }
      ];
    }

    // Filter by specific skill names
    if (skills) {
      const skillList = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(Boolean);
      if (skillList.length > 0) {
        where.skills = {
          some: {
            skill: { name: { in: skillList, mode: 'insensitive' } }
          }
        };
      }
    }

    // Sorting
    let orderBy = { createdAt: 'desc' };
    if (sort === 'updated') {
      orderBy = { updatedAt: 'desc' };
    } else if (sort === 'team-size') {
      orderBy = { desiredTeamSize: 'desc' };
    }

    const [total, projects] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          owner: {
            select: { id: true, username: true, profile: true }
          },
          skills: {
            include: { skill: true }
          },
          _count: {
            select: { members: true, joinRequests: true, tasks: true }
          },
          ...(req.user ? {
            bookmarks: {
              where: { userId: req.user.id },
              select: { id: true }
            }
          } : {})
        }
      })
    ]);

    const data = projects.map(p => ({
      ...p,
      isBookmarked: Boolean(p.bookmarks && p.bookmarks.length > 0),
      bookmarks: undefined
    }));

    return sendSuccess(res, data, {
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

export async function getProjectBySlug(req, res, next) {
  try {
    const { slug } = req.params;

    const project = await prisma.project.findUnique({
      where: { slug },
      include: {
        owner: {
          select: { id: true, username: true, profile: true }
        },
        skills: {
          include: { skill: true }
        },
        members: {
          include: {
            user: { select: { id: true, username: true, profile: true } }
          },
          orderBy: { joinedAt: 'asc' }
        },
        _count: {
          select: { members: true, tasks: true, joinRequests: true }
        },
        ...(req.user ? {
          bookmarks: {
            where: { userId: req.user.id },
            select: { id: true }
          },
          joinRequests: {
            where: { applicantId: req.user.id },
            select: { id: true, status: true, createdAt: true }
          }
        } : {})
      }
    });

    if (!project) {
      return sendError(res, 'NOT_FOUND', 'Project not found', [], 404);
    }

    const isMember = req.user ? project.members.some(m => m.userId === req.user.id) : false;
    const isOwner = req.user ? project.ownerId === req.user.id : false;
    const isAdmin = req.user?.role === 'ADMIN';

    // Check private project visibility
    if (project.visibility === 'PRIVATE' && !isMember && !isAdmin) {
      return sendError(res, 'FORBIDDEN', 'This project is private and accessible only to members.', [], 403);
    }

    const isBookmarked = Boolean(project.bookmarks && project.bookmarks.length > 0);
    const userApplication = project.joinRequests && project.joinRequests.length > 0 ? project.joinRequests[0] : null;

    return sendSuccess(res, {
      ...project,
      isBookmarked,
      userApplication,
      isMember,
      isOwner,
      bookmarks: undefined,
      joinRequests: undefined
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProject(req, res, next) {
  try {
    const { id } = req.params;
    const { skills, ...data } = req.body;

    const project = await prisma.project.findUnique({
      where: { id }
    });

    if (!project) {
      return sendError(res, 'NOT_FOUND', 'Project not found', [], 404);
    }

    // Authorization: owner or admin
    if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return sendError(res, 'FORBIDDEN', 'Only the project owner or an administrator can update this project.', [], 403);
    }

    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id },
        data: {
          ...data,
          startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : undefined,
          targetCompletionDate: data.targetCompletionDate !== undefined ? (data.targetCompletionDate ? new Date(data.targetCompletionDate) : null) : undefined
        }
      });

      // Update skills if provided
      if (skills !== undefined) {
        await tx.projectSkill.deleteMany({ where: { projectId: id } });
        if (skills.length > 0) {
          await tx.projectSkill.createMany({
            data: skills.map(skillId => ({
              projectId: id,
              skillId,
              importance: 'REQUIRED'
            }))
          });
        }
      }

      await tx.activityLog.create({
        data: {
          projectId: id,
          actorId: req.user.id,
          action: 'PROJECT_UPDATED',
          entityType: 'PROJECT',
          entityId: id,
          metadata: JSON.stringify({ fields: Object.keys(data) })
        }
      });
    });

    const updated = await prisma.project.findUnique({
      where: { id },
      include: {
        skills: { include: { skill: true } },
        owner: { select: { id: true, username: true, profile: true } }
      }
    });

    return sendSuccess(res, updated, { message: 'Project updated successfully' });
  } catch (err) {
    next(err);
  }
}

export async function updateProjectStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status: nextStatus } = req.body;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return sendError(res, 'NOT_FOUND', 'Project not found', [], 404);
    }

    if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return sendError(res, 'FORBIDDEN', 'Only project owner can change status', [], 403);
    }

    // Validate lifecycle transition
    const currentStatus = project.recruitmentStatus;
    const allowed = VALID_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      return sendError(
        res,
        'INVALID_STATUS_TRANSITION',
        `Cannot transition project from ${currentStatus} to ${nextStatus}. Allowed transitions: ${allowed.join(', ') || 'none'}.`,
        [],
        400
      );
    }

    const updated = await prisma.project.update({
      where: { id },
      data: { recruitmentStatus: nextStatus }
    });

    await prisma.activityLog.create({
      data: {
        projectId: id,
        actorId: req.user.id,
        action: 'STATUS_CHANGED',
        entityType: 'PROJECT',
        entityId: id,
        metadata: JSON.stringify({ from: currentStatus, to: nextStatus })
      }
    });

    return sendSuccess(res, updated, { message: `Project status changed to ${nextStatus}` });
  } catch (err) {
    next(err);
  }
}

export async function deleteProject(req, res, next) {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return sendError(res, 'NOT_FOUND', 'Project not found', [], 404);
    }

    if (project.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return sendError(res, 'FORBIDDEN', 'Only the project owner can delete this project.', [], 403);
    }

    await prisma.project.delete({ where: { id } });

    return sendSuccess(res, null, { message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getOwnedProjects(req, res, next) {
  try {
    const projects = await prisma.project.findMany({
      where: { ownerId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        skills: { include: { skill: true } },
        _count: {
          select: { members: true, joinRequests: true, tasks: true }
        }
      }
    });

    return sendSuccess(res, projects);
  } catch (err) {
    next(err);
  }
}

export async function getJoinedProjects(req, res, next) {
  try {
    const memberships = await prisma.projectMembership.findMany({
      where: {
        userId: req.user.id,
        role: 'MEMBER'
      },
      include: {
        project: {
          include: {
            owner: { select: { id: true, username: true, profile: true } },
            skills: { include: { skill: true } },
            _count: {
              select: { members: true, tasks: true }
            }
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    });

    const projects = memberships.map(m => ({
      ...m.project,
      membershipRole: m.role,
      joinedAt: m.joinedAt
    }));

    return sendSuccess(res, projects);
  } catch (err) {
    next(err);
  }
}

export async function toggleBookmark(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return sendError(res, 'NOT_FOUND', 'Project not found', [], 404);
    }

    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId: id
        }
      }
    });

    if (existingBookmark) {
      await prisma.bookmark.delete({
        where: { id: existingBookmark.id }
      });
      return sendSuccess(res, { bookmarked: false }, { message: 'Bookmark removed' });
    }

    await prisma.bookmark.create({
      data: {
        userId,
        projectId: id
      }
    });

    return sendSuccess(res, { bookmarked: true }, { message: 'Project bookmarked' });
  } catch (err) {
    next(err);
  }
}

export async function removeBookmark(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await prisma.bookmark.deleteMany({
      where: { userId, projectId: id }
    });

    return sendSuccess(res, { bookmarked: false }, { message: 'Bookmark removed' });
  } catch (err) {
    next(err);
  }
}

export async function getMyBookmarks(req, res, next) {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: req.user.id },
      include: {
        project: {
          include: {
            owner: { select: { id: true, username: true, profile: true } },
            skills: { include: { skill: true } },
            _count: { select: { members: true, tasks: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const projects = bookmarks
      .filter(b => b.project)
      .map(b => ({
        ...b.project,
        isBookmarked: true,
        bookmarkedAt: b.createdAt
      }));

    return sendSuccess(res, projects);
  } catch (err) {
    next(err);
  }
}
