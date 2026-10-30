import type {
  Achievement,
  Certification,
  CustomSection,
  CustomSectionItem,
  Education,
  Experience,
  Language,
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

export const isFilledLanguage = (language: Language) => hasText(language.name);

export const isFilledCustomItem = (item: CustomSectionItem) =>
  hasText(item.title) || hasText(item.subtitle) || hasText(item.description);

export const isFilledCustomSection = (section: CustomSection) => section.items.some(isFilledCustomItem);

export const isFilledLink = (link: SocialLink) => hasText(link.url);

// Bullet text for an experience: written bullets first, otherwise the notes.
export function experienceBullets(experience: Experience): string[] {
  return (experience.enhancedBullets ?? []).map((bullet) => bullet.trim()).filter(Boolean);
}

export function hasResumeContent(data: ResumeData | null | undefined): data is ResumeData {
  if (!data?.personalInfo) return false;
  const { fullName, targetRole, summary } = data.personalInfo;
  return (
    hasText(fullName) ||
    hasText(targetRole) ||
    hasText(summary) ||
    (data.skills ?? []).some(isFilledSkill) ||
    (data.experiences ?? []).some(isFilledExperience) ||
    (data.internships ?? []).some(isFilledExperience) ||
    (data.projects ?? []).some(isFilledProject) ||
    (data.education ?? []).some(isFilledEducation) ||
    (data.certifications ?? []).some(isFilledCertification) ||
    (data.achievements ?? []).some(isFilledAchievement) ||
    (data.languages ?? []).some(isFilledLanguage) ||
    (data.customSections ?? []).some(isFilledCustomSection)
  );
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
