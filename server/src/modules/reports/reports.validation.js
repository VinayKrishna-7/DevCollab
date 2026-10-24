import { z } from 'zod';

export const createReportSchema = z.object({
  targetType: z.enum(['PROJECT', 'USER']).default('PROJECT'),
  projectId: z.string().uuid().optional().nullable(),
  reason: z.string().min(3, 'Reason is required').max(100),
  explanation: z.string().max(2000).optional().nullable()
});

export const updateReportSchema = z.object({
  status: z.enum(['PENDING', 'RESOLVED', 'DISMISSED']),
  notes: z.string().max(1000).optional().nullable()
});
