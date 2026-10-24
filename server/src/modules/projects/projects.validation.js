import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100).trim(),
  summary: z.string().min(10, 'Summary must be at least 10 characters').max(250).trim(),
  description: z.string().min(20, 'Description must be at least 20 characters').max(10000).trim(),
  category: z.enum([
    'WEB_DEVELOPMENT',
    'MOBILE_DEVELOPMENT',
    'AI_ML',
    'DATA_SCIENCE',
    'DEVTOOLS',
    'GAME_DEVELOPMENT',
    'CYBERSECURITY',
    'OPEN_SOURCE',
    'OTHER'
  ]).default('WEB_DEVELOPMENT'),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
  recruitmentStatus: z.enum(['DRAFT', 'RECRUITING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']).default('RECRUITING'),
  desiredTeamSize: z.number().int().min(1).max(50).default(3),
  experiencePreference: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).default('INTERMEDIATE'),
  collaborationType: z.enum([
    'HACKATHON',
    'LEARNING',
    'OPEN_SOURCE',
    'STARTUP',
    'PERSONAL_PROJECT',
    'FREELANCE_COLLABORATION'
  ]).default('PERSONAL_PROJECT'),
  expectedDuration: z.string().max(100).optional().nullable(),
  bannerImageUrl: z.string().url('Invalid banner URL').max(500).optional().nullable().or(z.literal('')),
  repoUrl: z.string().url('Invalid repository URL').max(300).optional().nullable().or(z.literal('')),
  demoUrl: z.string().url('Invalid demo URL').max(300).optional().nullable().or(z.literal('')),
  startDate: z.string().datetime().optional().nullable(),
  targetCompletionDate: z.string().datetime().optional().nullable(),
  skills: z.array(z.string().uuid()).max(20).optional().default([])
});

export const updateProjectSchema = z.object({
  title: z.string().min(3).max(100).trim().optional(),
  summary: z.string().min(10).max(250).trim().optional(),
  description: z.string().min(20).max(10000).trim().optional(),
  category: z.enum([
    'WEB_DEVELOPMENT',
    'MOBILE_DEVELOPMENT',
    'AI_ML',
    'DATA_SCIENCE',
    'DEVTOOLS',
    'GAME_DEVELOPMENT',
    'CYBERSECURITY',
    'OPEN_SOURCE',
    'OTHER'
  ]).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  desiredTeamSize: z.number().int().min(1).max(50).optional(),
  experiencePreference: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
  collaborationType: z.enum([
    'HACKATHON',
    'LEARNING',
    'OPEN_SOURCE',
    'STARTUP',
    'PERSONAL_PROJECT',
    'FREELANCE_COLLABORATION'
  ]).optional(),
  expectedDuration: z.string().max(100).optional().nullable(),
  bannerImageUrl: z.string().url().max(500).optional().nullable().or(z.literal('')),
  repoUrl: z.string().url().max(300).optional().nullable().or(z.literal('')),
  demoUrl: z.string().url().max(300).optional().nullable().or(z.literal('')),
  startDate: z.string().datetime().optional().nullable(),
  targetCompletionDate: z.string().datetime().optional().nullable(),
  skills: z.array(z.string().uuid()).max(20).optional()
});

export const updateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'RECRUITING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'])
});
