import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z.string().min(1, 'Display name cannot be empty').max(60).trim().optional(),
  headline: z.string().max(100).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  avatarUrl: z.string().url('Invalid avatar URL').max(500).optional().nullable().or(z.literal('')),
  location: z.string().max(100).optional().nullable(),
  experienceLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
  availability: z.enum(['AVAILABLE', 'LIMITED', 'UNAVAILABLE']).optional(),
  weeklyHours: z.number().int().min(1).max(100).optional().nullable(),
  timezone: z.string().max(50).optional().nullable(),
  collaborationType: z.enum([
    'HACKATHON',
    'LEARNING',
    'OPEN_SOURCE',
    'STARTUP',
    'PERSONAL_PROJECT',
    'FREELANCE_COLLABORATION'
  ]).optional(),
  areasOfInterest: z.array(z.string().max(50)).max(15).optional(),
  githubUrl: z.string().url('Invalid GitHub URL').max(300).optional().nullable().or(z.literal('')),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').max(300).optional().nullable().or(z.literal('')),
  portfolioUrl: z.string().url('Invalid Portfolio URL').max(300).optional().nullable().or(z.literal('')),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional()
});

export const updateSkillsSchema = z.object({
  skills: z.array(
    z.object({
      skillId: z.string().uuid('Invalid skill ID'),
      proficiency: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).default('INTERMEDIATE'),
      yearsOfExperience: z.number().int().min(0).max(50).default(1)
    })
  )
});
