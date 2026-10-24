import { z } from 'zod';

export const createSkillSchema = z.object({
  name: z.string().min(1, 'Skill name is required').max(50).trim(),
  category: z.string().max(50).optional()
});

export const updateSkillSchema = z.object({
  name: z.string().min(1).max(50).trim().optional(),
  category: z.string().max(50).optional()
});
