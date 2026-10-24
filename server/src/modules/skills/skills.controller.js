import prisma from '../../config/prisma.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export async function listSkills(req, res, next) {
  try {
    const { category, search } = req.query;

    const where = {};
    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const skills = await prisma.skill.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    return sendSuccess(res, skills);
  } catch (err) {
    next(err);
  }
}

export async function searchSkills(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      const popularSkills = await prisma.skill.findMany({
        take: 30,
        orderBy: { name: 'asc' }
      });
      return sendSuccess(res, popularSkills);
    }

    const skills = await prisma.skill.findMany({
      where: {
        name: { contains: q, mode: 'insensitive' }
      },
      take: 20,
      orderBy: { name: 'asc' }
    });

    return sendSuccess(res, skills);
  } catch (err) {
    next(err);
  }
}

export async function createSkill(req, res, next) {
  try {
    const { name, category } = req.body;
    const normalizedName = name.trim();

    // Check duplicate case-insensitively
    const existing = await prisma.skill.findFirst({
      where: { name: { equals: normalizedName, mode: 'insensitive' } }
    });

    if (existing) {
      return sendError(res, 'DUPLICATE_SKILL', `Skill "${existing.name}" already exists.`, [{ field: 'name', message: 'Skill already exists' }], 409);
    }

    const skill = await prisma.skill.create({
      data: {
        name: normalizedName,
        category: category?.trim() || 'General'
      }
    });

    // Audit log
    await prisma.adminAuditLog.create({
      data: {
        actorId: req.user.id,
        action: 'CREATE_SKILL',
        targetType: 'SKILL',
        targetId: skill.id,
        metadata: JSON.stringify({ name: skill.name, category: skill.category })
      }
    }).catch(() => {});

    return sendSuccess(res, skill, { message: 'Skill created' }, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateSkill(req, res, next) {
  try {
    const { id } = req.params;
    const { name, category } = req.body;

    const skill = await prisma.skill.findUnique({ where: { id } });
    if (!skill) {
      return sendError(res, 'NOT_FOUND', 'Skill not found', [], 404);
    }

    if (name && name.trim().toLowerCase() !== skill.name.toLowerCase()) {
      const duplicate = await prisma.skill.findFirst({
        where: {
          name: { equals: name.trim(), mode: 'insensitive' },
          id: { not: id }
        }
      });
      if (duplicate) {
        return sendError(res, 'DUPLICATE_SKILL', 'Another skill with this name already exists.', [], 409);
      }
    }

    const updated = await prisma.skill.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(category !== undefined ? { category: category.trim() } : {})
      }
    });

    return sendSuccess(res, updated, { message: 'Skill updated' });
  } catch (err) {
    next(err);
  }
}

export async function deleteSkill(req, res, next) {
  try {
    const { id } = req.params;
    const skill = await prisma.skill.findUnique({ where: { id } });
    if (!skill) {
      return sendError(res, 'NOT_FOUND', 'Skill not found', [], 404);
    }

    await prisma.skill.delete({ where: { id } });

    // Audit log
    await prisma.adminAuditLog.create({
      data: {
        actorId: req.user.id,
        action: 'DELETE_SKILL',
        targetType: 'SKILL',
        targetId: id,
        metadata: JSON.stringify({ name: skill.name })
      }
    }).catch(() => {});

    return sendSuccess(res, null, { message: 'Skill deleted' });
  } catch (err) {
    next(err);
  }
}
