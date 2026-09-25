import { ResumeData } from '@/types/resume';

export function calculateAtsScore(data: ResumeData): { score: number; tips: string[] } {
  let score = 0;
  const tips: string[] = [];

  // 1. Personal Info check (20 pts)
  if (data.personalInfo.fullName && data.personalInfo.email && data.personalInfo.targetRole) {
    score += 20;
  } else {
    tips.push('Complete your Full Name, Email, and Target Role (+20 pts)');
  }

  // 2. Summary check (20 pts)
  if (data.personalInfo.summary && data.personalInfo.summary.length > 60) {
    score += 20;
  } else {
    tips.push('Generate or write an ATS summary over 60 characters (+20 pts)');
  }

  // 3. Skills density check (20 pts)
  if (data.skills.length >= 4) {
    score += 20;
  } else {
    tips.push('Add at least 4 technical or professional skills (+20 pts)');
  }

  // 4. Experience metrics check (25 pts)
  const hasExperiences = data.experiences.length > 0;
  const hasMetrics = data.experiences.some((exp) =>
    exp.enhancedBullets.some((b) => /\d+|%|\$|reduced|increased|engineered/i.test(b))
  );

  if (hasExperiences && hasMetrics) {
    score += 25;
  } else {
    tips.push('Use AI to generate bullet points with measurable metrics & action verbs (+25 pts)');
  }

  // 5. Links check (15 pts)
  if (data.links.length > 0) {
    score += 15;
  } else {
    tips.push('Add at least one professional link like GitHub or LinkedIn (+15 pts)');
  }

  return { score: Math.min(100, score), tips };
}