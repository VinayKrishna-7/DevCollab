import { z } from 'zod';

export const createMilestoneSchema = z.object({
  title: z.string().min(2, 'Milestone title is required').max(150).trim(),
  description: z.string().max(3000).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  status: z.enum(['UPCOMING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('UPCOMING')
});

export const updateMilestoneSchema = z.object({
  title: z.string().min(2).max(150).trim().optional(),
  description: z.string().max(3000).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  status: z.enum(['UPCOMING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional()
});
