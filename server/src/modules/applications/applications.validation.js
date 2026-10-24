import { z } from 'zod';

export const submitApplicationSchema = z.object({
  introductoryMessage: z.string().min(10, 'Message must be at least 10 characters').max(2000).trim()
});

export const reviewApplicationSchema = z.object({
  reviewNotes: z.string().max(1000).optional()
});
