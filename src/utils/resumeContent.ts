import type {
  Achievement,
  Certification,
  Education,
  Experience,
  Project,
  ResumeData,
  Skill,
  SocialLink,
} from '@/types/resume';

export const hasText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

// "Filled" checks decide what counts as real content. Empty rows that a user
// added but never typed into are ignored by templates, scoring, and AI gates.
export const isFilledSkill = (skill: Skill) => hasText(skill.name);

export const isFilledExperience = (experience: Experience) =>
  hasText(experience.company) ||
  hasText(experience.role) ||
  hasText(experience.rawDetails) ||
  (experience.enhancedBullets ?? []).some(hasText);

export const isFilledProject = (project: Project) =>
  hasText(project.title) || hasText(project.description) || (project.techStack ?? []).some(hasText);

export const isFilledEducation = (education: Education) =>
  hasText(education.degree) ||
  hasText(education.institution) ||
  hasText(education.fieldOfStudy) ||
  hasText(education.graduationYear);

export const isFilledCertification = (certification: Certification) => hasText(certification.name);

export const isFilledAchievement = (achievement: Achievement) =>
  hasText(achievement.title) || hasText(achievement.description);

export const isFilledLink = (link: SocialLink) => hasText(link.url);

export function hasResumeContent(data: ResumeData | null | undefined): data is ResumeData {
  if (!data?.personalInfo) return false;
  const { fullName, targetRole, summary } = data.personalInfo;
  return (
    hasText(fullName) ||
    hasText(targetRole) ||
    hasText(summary) ||
    (data.skills ?? []).some(isFilledSkill) ||
    (data.experiences ?? []).some(isFilledExperience) ||
    (data.projects ?? []).some(isFilledProject) ||
    (data.education ?? []).some(isFilledEducation) ||
    (data.certifications ?? []).some(isFilledCertification) ||
    (data.achievements ?? []).some(isFilledAchievement)
  );
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
