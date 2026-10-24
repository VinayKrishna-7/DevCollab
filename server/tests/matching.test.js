import { describe, it, expect } from 'vitest';
import { calculateMatchScore } from '../src/utils/matching.js';

describe('Smart Developer-to-Project Matching Algorithm', () => {
  it('calculates high match score for complementary skills and high compatibility', () => {
    const developer = {
      profile: {
        experienceLevel: 'ADVANCED',
        availability: 'AVAILABLE',
        weeklyHours: 20,
        areasOfInterest: ['Web Development', 'DevTools']
      },
      skills: [
        { skill: { name: 'React' } },
        { skill: { name: 'Node.js' } },
        { skill: { name: 'TypeScript' } }
      ]
    };

    const project = {
      category: 'DEVTOOLS',
      experiencePreference: 'INTERMEDIATE',
      skills: [
        { skill: { name: 'React' } },
        { skill: { name: 'Node.js' } }
      ]
    };

    const result = calculateMatchScore(developer, project);

    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.matchedSkills).toEqual(['React', 'Node.js']);
    expect(result.missingSkills).toEqual([]);
    expect(result.breakdown.skillScore).toBe(100);
    expect(result.breakdown.experienceScore).toBe(100);
    expect(result.breakdown.availabilityScore).toBe(100);
  });

  it('handles partial skill match and missing skills appropriately', () => {
    const developer = {
      profile: {
        experienceLevel: 'INTERMEDIATE',
        availability: 'LIMITED',
        weeklyHours: 10,
        areasOfInterest: ['Frontend']
      },
      skills: [
        { skill: { name: 'React' } }
      ]
    };

    const project = {
      category: 'AI_ML',
      experiencePreference: 'EXPERT',
      skills: [
        { skill: { name: 'React' } },
        { skill: { name: 'Python' } },
        { skill: { name: 'PyTorch' } },
        { skill: { name: 'FastAPI' } }
      ]
    };

    const result = calculateMatchScore(developer, project);

    expect(result.matchedSkills).toEqual(['React']);
    expect(result.missingSkills).toContain('Python');
    expect(result.missingSkills).toContain('PyTorch');
    expect(result.breakdown.skillScore).toBe(25); // 1 out of 4
    expect(result.score).toBeLessThan(50);
  });

  it('handles projects with no required skills without awarding misleading 100%', () => {
    const developer = {
      profile: {
        experienceLevel: 'BEGINNER',
        availability: 'AVAILABLE',
        weeklyHours: 10,
        areasOfInterest: []
      },
      skills: []
    };

    const project = {
      category: 'OTHER',
      experiencePreference: 'BEGINNER',
      skills: []
    };

    const result = calculateMatchScore(developer, project);

    expect(result.breakdown.skillScore).toBe(50); // neutral baseline, not 100
    expect(result.score).toBeDefined();
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('handles missing developer profile data gracefully with fallbacks', () => {
    const developer = {
      skills: []
    };

    const project = {
      category: 'WEB_DEVELOPMENT',
      experiencePreference: 'INTERMEDIATE',
      skills: [{ skill: { name: 'Docker' } }]
    };

    const result = calculateMatchScore(developer, project);

    expect(result.score).toBeDefined();
    expect(result.explanation).toContain('compatibility');
  });
});
