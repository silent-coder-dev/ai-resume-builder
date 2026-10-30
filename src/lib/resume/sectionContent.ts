import type { ResumeData, SectionKey } from '@/types/resume';
import { customSectionIdFromKey, isCustomSectionKey } from '@/lib/resume/sections';
import {
  hasText,
  isFilledAchievement,
  isFilledCertification,
  isFilledCustomItem,
  isFilledEducation,
  isFilledExperience,
  isFilledLanguage,
  isFilledProject,
  isFilledSkill,
} from '@/utils/resumeContent';

// Whether a section has anything that would show on the resume.
export function sectionHasContent(key: SectionKey | 'personal', data: ResumeData): boolean {
  if (key === 'personal') return hasText(data.personalInfo.fullName) || hasText(data.personalInfo.email);
  if (isCustomSectionKey(key)) {
    const section = (data.customSections ?? []).find((item) => item.id === customSectionIdFromKey(key));
    return Boolean(section?.items.some(isFilledCustomItem));
  }
  switch (key) {
    case 'summary':
      return hasText(data.personalInfo.summary);
    case 'skills':
      return data.skills.some(isFilledSkill);
    case 'experience':
      return data.experiences.some(isFilledExperience);
    case 'internships':
      return (data.internships ?? []).some(isFilledExperience);
    case 'projects':
      return data.projects.some(isFilledProject);
    case 'education':
      return data.education.some(isFilledEducation);
    case 'certifications':
      return (data.certifications ?? []).some(isFilledCertification);
    case 'achievements':
      return (data.achievements ?? []).some(isFilledAchievement);
    case 'languages':
      return (data.languages ?? []).some(isFilledLanguage);
    default:
      return false;
  }
}
