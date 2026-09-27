import { ResumeData } from '@/types/resume';

export function calculateAtsScore(data: ResumeData): {
  score: number;
  suggestions: string[];
} {
  let score = 0;
  const suggestions: string[] = [];

  // 1. Personal Info Check (25 pts)
  const { fullName, email, phone, location, summary } = data.personalInfo || {};
  if (fullName && fullName.trim()) score += 5;
  else suggestions.push('Add your full name.');

  if (email && email.trim()) score += 5;
  else suggestions.push('Provide a valid email address.');

  if (phone && phone.trim()) score += 5;
  else suggestions.push('Add your phone number.');

  if (location && location.trim()) score += 5;
  else suggestions.push('Include your location.');

  if (summary && summary.trim().length > 30) score += 5;
  else suggestions.push('Write a strong professional summary.');

  // 2. Skills Check (20 pts)
  if (data.skills && data.skills.length >= 5) score += 20;
  else if (data.skills && data.skills.length > 0) score += 10;
  else suggestions.push('Add at least 5 key skills.');

  // 3. Work Experience Check (25 pts)
  if (data.experiences && data.experiences.length > 0) {
    score += 15;
    const hasBullets = data.experiences.some(
      (exp) => (exp.enhancedBullets?.length ?? 0) > 0 || exp.rawDetails?.trim().length > 20
    );
    if (hasBullets) score += 10;
  } else {
    suggestions.push('Add your relevant work experiences.');
  }

  // 4. Projects Check (15 pts)
  if (data.projects && data.projects.length > 0) {
    score += 15;
  } else {
    suggestions.push('Add at least 1-2 major projects.');
  }

  // 5. Education Check (10 pts)
  if (data.education && data.education.length > 0) {
    score += 10;
  } else {
    suggestions.push('Include your educational qualifications.');
  }

  // 6. Links Bonus (5 pts)
  if (data.links && (data.links?.length ?? 0) > 0) {
    score += 5;
  }

  return {
    score: Math.min(100, score),
    suggestions,
  };
}