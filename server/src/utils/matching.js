const EXPERIENCE_LEVEL_RANKS = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  EXPERT: 4
};

/**
 * Calculate deterministic explainable match score between a developer profile and a project
 */
export function calculateMatchScore(developer, project) {
  // Normalize developer skills (case-insensitive)
  const devSkills = (developer.skills || []).map(s => {
    const name = s.skill ? s.skill.name : (s.name || '');
    return name.trim().toLowerCase();
  });

  const projectSkills = (project.skills || []).map(ps => {
    const name = ps.skill ? ps.skill.name : (ps.name || '');
    return {
      originalName: ps.skill ? ps.skill.name : (ps.name || ''),
      normalized: name.trim().toLowerCase(),
      importance: ps.importance || 'REQUIRED'
    };
  });

  // 1. Skill Match (50%)
  let skillScore = 0;
  const matchedSkills = [];
  const missingSkills = [];

  if (projectSkills.length === 0) {
    // Project has no specific skills specified
    skillScore = 50; // Neutral baseline
  } else {
    for (const ps of projectSkills) {
      if (devSkills.includes(ps.normalized)) {
        matchedSkills.push(ps.originalName);
      } else {
        missingSkills.push(ps.originalName);
      }
    }
    skillScore = Math.round((matchedSkills.length / projectSkills.length) * 100);
  }

  // 2. Experience Compatibility (20%)
  let experienceScore = 70; // baseline if unspecified
  const devLevel = developer.profile?.experienceLevel || developer.experienceLevel || 'BEGINNER';
  const projLevel = project.experiencePreference || 'INTERMEDIATE';

  const devRank = EXPERIENCE_LEVEL_RANKS[devLevel] || 1;
  const projRank = EXPERIENCE_LEVEL_RANKS[projLevel] || 2;

  const diff = devRank - projRank;
  if (diff >= 0) {
    experienceScore = 100;
  } else if (diff === -1) {
    experienceScore = 75;
  } else if (diff === -2) {
    experienceScore = 40;
  } else {
    experienceScore = 15;
  }

  // 3. Availability Compatibility (15%)
  let availabilityScore = 50;
  const availability = developer.profile?.availability || developer.availability || 'AVAILABLE';
  const weeklyHours = developer.profile?.weeklyHours ?? developer.weeklyHours ?? 10;

  if (availability === 'AVAILABLE') {
    availabilityScore = weeklyHours >= 15 ? 100 : (weeklyHours >= 10 ? 90 : 75);
  } else if (availability === 'LIMITED') {
    availabilityScore = weeklyHours >= 10 ? 65 : 50;
  } else {
    availabilityScore = 15;
  }

  // 4. Interest & Category Compatibility (15%)
  let interestScore = 40;
  const devInterests = (developer.profile?.areasOfInterest || developer.areasOfInterest || []).map(i => i.toLowerCase().replace(/[-_]/g, ' '));
  const projectCat = (project.category || '').toLowerCase().replace(/[-_]/g, ' ');

  if (devInterests.length === 0) {
    interestScore = 50; // Missing data fallback
  } else {
    const directMatch = devInterests.some(i => projectCat.includes(i) || i.includes(projectCat));
    if (directMatch) {
      interestScore = 100;
    } else {
      // Check partial token overlap
      const catTokens = projectCat.split(' ');
      const hasPartial = devInterests.some(i => catTokens.some(tok => tok.length > 2 && i.includes(tok)));
      interestScore = hasPartial ? 75 : 40;
    }
  }

  // Weighted Total Score (0 - 100)
  const finalScore = Math.min(100, Math.max(0, Math.round(
    (skillScore * 0.50) +
    (experienceScore * 0.20) +
    (availabilityScore * 0.15) +
    (interestScore * 0.15)
  )));

  // Generate explainable human-readable description
  let explanation = '';
  if (finalScore >= 80) {
    explanation = `Excellent match: Matched ${matchedSkills.length}/${projectSkills.length || 0} skills (${matchedSkills.slice(0, 3).join(', ')}). High experience compatibility (${devLevel}) and compatible availability (${availability}).`;
  } else if (finalScore >= 60) {
    explanation = `Good compatibility: Matched skills include ${matchedSkills.length > 0 ? matchedSkills.join(', ') : 'general development background'}. ${missingSkills.length > 0 ? `Lacks: ${missingSkills.slice(0, 2).join(', ')}.` : ''}`;
  } else if (finalScore >= 40) {
    explanation = `Moderate fit: Partial skill alignment (${matchedSkills.length} matches, ${missingSkills.length} missing). Experience level is ${devLevel}.`;
  } else {
    explanation = `Low compatibility: Missing key required skills (${missingSkills.slice(0, 3).join(', ')}).`;
  }

  return {
    score: finalScore,
    breakdown: {
      skillScore,
      experienceScore,
      availabilityScore,
      interestScore
    },
    matchedSkills,
    missingSkills,
    explanation,
    developerExperience: devLevel,
    projectExperiencePreference: projLevel,
    developerAvailability: availability
  };
}
