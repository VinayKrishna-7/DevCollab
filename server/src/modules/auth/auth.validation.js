import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address').max(100).toLowerCase().trim(),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain alphanumeric characters, underscores, and hyphens')
    .toLowerCase()
    .trim(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  displayName: z.string().min(1, 'Display name cannot be empty').max(50).trim().optional()
});

export const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required').trim(),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(true)
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').max(128)
});
