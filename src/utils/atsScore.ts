import { ResumeData } from '@/types/resume';
import {
  hasText,
  isFilledEducation,
  isFilledExperience,
  isFilledLink,
  isFilledProject,
  isFilledSkill,
} from '@/utils/resumeContent';

export function calculateAtsScore(data: ResumeData): {
  score: number;
  tips: string[];
} {
  let score = 0;
  const tips: string[] = [];

  // 1. Personal Info Check (25 pts)
  const { fullName, email, phone, location, summary } = data.personalInfo || {};
  if (hasText(fullName)) score += 5;
  else tips.push('Add your full name.');

  if (hasText(email)) score += 5;
  else tips.push('Provide a valid email address.');

  if (hasText(phone)) score += 5;
  else tips.push('Add your phone number.');

  if (hasText(location)) score += 5;
  else tips.push('Include your location.');

  if (hasText(summary) && summary.trim().length > 30) score += 5;
  else tips.push('Write a strong professional summary.');

  // Only entries with real content count. Blank rows added in the editor are ignored.
  const skills = (data.skills ?? []).filter(isFilledSkill);
  const experiences = (data.experiences ?? []).filter(isFilledExperience);
  const projects = (data.projects ?? []).filter(isFilledProject);
  const education = (data.education ?? []).filter(isFilledEducation);
  const links = (data.links ?? []).filter(isFilledLink);

  // 2. Skills Check (20 pts)
  if (skills.length >= 5) score += 20;
  else if (skills.length > 0) {
    score += 10;
    tips.push('Add at least 5 key skills.');
  } else tips.push('Add at least 5 key skills.');

  // 3. Work Experience Check (25 pts)
  if (experiences.length > 0) {
    score += 15;
    const hasBullets = experiences.some(
      (exp) => (exp.enhancedBullets ?? []).some(hasText) || (exp.rawDetails?.trim().length ?? 0) > 20
    );
    if (hasBullets) score += 10;
    else tips.push('Describe what you did in each role (a few clear bullet points).');
  } else {
    tips.push('Add your relevant work experiences.');
  }

  // 4. Projects Check (15 pts)
  if (projects.length > 0) {
    score += 15;
  } else {
    tips.push('Add at least 1-2 major projects.');
  }

  // 5. Education Check (10 pts)
  if (education.length > 0) {
    score += 10;
  } else {
    tips.push('Include your educational qualifications.');
  }

  // 6. Links Bonus (5 pts)
  if (links.length > 0) {
    score += 5;
  }

  return {
    score: Math.min(100, score),
    tips,
  };
}
