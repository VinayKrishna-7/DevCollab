import prisma from '../../config/prisma.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export function calculateProfileCompletion(profile, skillsCount = 0) {
  if (!profile) return 0;
  let score = 0;
  if (profile.avatarUrl) score += 10;
  if (profile.headline) score += 10;
  if (profile.bio && profile.bio.trim().length >= 20) score += 15;
  if (profile.location) score += 5;
  if (profile.experienceLevel) score += 10;
  if (profile.availability) score += 10;
  if (profile.weeklyHours) score += 5;
  if (profile.areasOfInterest && profile.areasOfInterest.length > 0) score += 10;
  if (skillsCount > 0) score += 15;
  if (profile.githubUrl || profile.portfolioUrl) score += 10;
  return Math.min(100, score);
}

export async function getMyProfile(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: true,
        skills: {
          include: { skill: true },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!user) {
      return sendError(res, 'NOT_FOUND', 'User not found', [], 404);
    }

    const { passwordHash, ...safeUser } = user;
    const completionPercentage = calculateProfileCompletion(user.profile, user.skills.length);

    return sendSuccess(res, {
      ...safeUser,
      completionPercentage
    });
  } catch (err) {
    next(err);
  }
}

export async function updateMyProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const data = req.body;

    const updatedProfile = await prisma.developerProfile.upsert({
      where: { userId },
      create: {
        userId,
        displayName: data.displayName || req.user.username,
        ...data
      },
      update: {
        ...data
      }
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        skills: { include: { skill: true } }
      }
    });

    const { passwordHash, ...safeUser } = user;
    const completionPercentage = calculateProfileCompletion(user.profile, user.skills.length);

    return sendSuccess(res, {
      ...safeUser,
      completionPercentage
    }, { message: 'Profile updated successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getMySkills(req, res, next) {
  try {
    const userSkills = await prisma.userSkill.findMany({
      where: { userId: req.user.id },
      include: { skill: true },
      orderBy: { createdAt: 'asc' }
    });

    return sendSuccess(res, userSkills);
  } catch (err) {
    next(err);
  }
}

export async function updateMySkills(req, res, next) {
  try {
    const userId = req.user.id;
    const { skills } = req.body;

    // Deduplicate by skillId
    const uniqueSkills = [];
    const seen = new Set();
    for (const s of skills) {
      if (!seen.has(s.skillId)) {
        seen.add(s.skillId);
        uniqueSkills.push(s);
      }
    }

    // Replace user skills inside transaction
    await prisma.$transaction(async (tx) => {
      await tx.userSkill.deleteMany({
        where: { userId }
      });

      if (uniqueSkills.length > 0) {
        await tx.userSkill.createMany({
          data: uniqueSkills.map(s => ({
            userId,
            skillId: s.skillId,
            proficiency: s.proficiency || 'INTERMEDIATE',
            yearsOfExperience: s.yearsOfExperience ?? 1
          }))
        });
      }
    });

    const updatedSkills = await prisma.userSkill.findMany({
      where: { userId },
      include: { skill: true }
    });

    return sendSuccess(res, updatedSkills, { message: 'Skills updated successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getDeveloperByUsername(req, res, next) {
  try {
    const { username } = req.params;
    const targetUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
      include: {
        profile: true,
        skills: {
          include: { skill: true }
        },
        ownedProjects: {
          where: { visibility: 'PUBLIC' },
          select: {
            id: true,
            slug: true,
            title: true,
            summary: true,
            category: true,
            recruitmentStatus: true,
            createdAt: true
          }
        },
        memberships: {
          include: {
            project: {
              select: {
                id: true,
                slug: true,
                title: true,
                category: true,
                visibility: true
              }
            }
          }
        }
      }
    });

    if (!targetUser) {
      return sendError(res, 'NOT_FOUND', 'Developer profile not found', [], 404);
    }

    const isSelf = req.user?.id === targetUser.id;
    const isAdmin = req.user?.role === 'ADMIN';

    // Privacy check
    if (targetUser.profile?.visibility === 'PRIVATE' && !isSelf && !isAdmin) {
      return sendError(res, 'FORBIDDEN', 'This developer profile is private.', [], 403);
    }

    // Filter public memberships only
    const publicMemberships = (targetUser.memberships || [])
      .filter(m => m.project && (m.project.visibility === 'PUBLIC' || isSelf || isAdmin))
      .map(m => ({
        projectId: m.projectId,
        role: m.role,
        joinedAt: m.joinedAt,
        project: m.project
      }));

    const completionPercentage = calculateProfileCompletion(targetUser.profile, targetUser.skills.length);

    return sendSuccess(res, {
      id: targetUser.id,
      username: targetUser.username,
      createdAt: targetUser.createdAt,
      profile: targetUser.profile,
      skills: targetUser.skills,
      ownedProjects: targetUser.ownedProjects,
      memberships: publicMemberships,
      completionPercentage
    });
  } catch (err) {
    next(err);
  }
}

export async function listDevelopers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '12', 10)));
    const skip = (page - 1) * limit;

    const {
      search,
      experienceLevel,
      availability,
      collaborationType,
      skills,
      skillMatchMode = 'any' // 'any' or 'all'
    } = req.query;

    const where = {
      isSuspended: false
    };

    // Public visibility only (unless admin)
    if (req.user?.role !== 'ADMIN') {
      where.profile = {
        visibility: 'PUBLIC'
      };
    }

    if (experienceLevel) {
      where.profile = {
        ...where.profile,
        experienceLevel: experienceLevel
      };
    }

    if (availability) {
      where.profile = {
        ...where.profile,
        availability: availability
      };
    }

    if (collaborationType) {
      where.profile = {
        ...where.profile,
        collaborationType: collaborationType
      };
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { username: { contains: q, mode: 'insensitive' } },
        { profile: { displayName: { contains: q, mode: 'insensitive' } } },
        { profile: { headline: { contains: q, mode: 'insensitive' } } },
        { profile: { bio: { contains: q, mode: 'insensitive' } } }
      ];
    }

    // Filter by skills
    let skillList = [];
    if (skills) {
      skillList = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(Boolean);
    }

    if (skillList.length > 0) {
      if (skillMatchMode === 'all') {
        where.AND = skillList.map(skillName => ({
          skills: {
            some: {
              skill: {
                name: { equals: skillName, mode: 'insensitive' }
              }
            }
          }
        }));
      } else {
        where.skills = {
          some: {
            skill: {
              name: { in: skillList, mode: 'insensitive' }
            }
          }
        };
      }
    }

    const [total, developers] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          createdAt: true,
          profile: true,
          skills: {
            include: { skill: true },
            take: 10
          },
          _count: {
            select: {
              ownedProjects: true,
              memberships: true
            }
          }
        }
      })
    ]);

    const data = developers.map(dev => ({
      ...dev,
      completionPercentage: calculateProfileCompletion(dev.profile, dev.skills.length)
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
