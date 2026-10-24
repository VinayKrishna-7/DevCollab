import { z } from 'zod';

export const createMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(4000).trim()
});

export const updateMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(4000).trim()
});
