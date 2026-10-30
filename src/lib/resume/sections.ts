import type {
  BuiltInSectionKey,
  CareerStage,
  CustomSection,
  CustomSectionKey,
  SectionItem,
  SectionKey,
} from '@/types/resume';

export const SECTION_LABELS: Record<BuiltInSectionKey, string> = {
  summary: 'Professional Summary',
  skills: 'Technical Skills',
  experience: 'Work Experience',
  internships: 'Internships',
  projects: 'Projects',
  education: 'Education',
  certifications: 'Certifications',
  achievements: 'Achievements',
  languages: 'Languages',
};

export const BUILT_IN_SECTIONS = Object.keys(SECTION_LABELS) as BuiltInSectionKey[];

// Recommended order per career stage. Freshers and students lead with
// education and projects; experienced candidates lead with work history.
const STAGE_ORDERS: Record<CareerStage | 'default', BuiltInSectionKey[]> = {
  student: ['summary', 'education', 'projects', 'skills', 'internships', 'certifications', 'achievements', 'experience', 'languages'],
  fresher: ['summary', 'education', 'projects', 'skills', 'internships', 'certifications', 'achievements', 'experience', 'languages'],
  experienced: ['summary', 'experience', 'skills', 'projects', 'education', 'certifications', 'achievements', 'internships', 'languages'],
  default: ['summary', 'skills', 'experience', 'projects', 'education', 'certifications', 'achievements', 'internships', 'languages'],
};

export const customSectionKey = (id: string): CustomSectionKey => `custom:${id}`;

export const isCustomSectionKey = (key: string): key is CustomSectionKey => key.startsWith('custom:');

export const customSectionIdFromKey = (key: CustomSectionKey) => key.slice('custom:'.length);

export function sectionLabel(key: SectionKey, customSections: CustomSection[] = []): string {
  if (isCustomSectionKey(key)) {
    const section = customSections.find((item) => item.id === customSectionIdFromKey(key));
    return section?.title.trim() || 'Custom Section';
  }
  return SECTION_LABELS[key];
}

export function recommendedSectionOrder(stage: CareerStage | null | undefined): SectionItem[] {
  return STAGE_ORDERS[stage ?? 'default'].map((id) => ({ id, label: SECTION_LABELS[id], visible: true }));
}

// Repairs any saved order: known sections only, no duplicates, nothing missing,
// and one entry for every custom section that exists in the resume.
export function normalizeSectionOrder(
  value: unknown,
  customSections: CustomSection[] = [],
  stage: CareerStage | null = null
): SectionItem[] {
  const validCustomKeys = new Set(customSections.map((section) => customSectionKey(section.id)));
  const seen = new Set<SectionKey>();
  const ordered: SectionItem[] = [];

  if (Array.isArray(value)) {
    for (const entry of value) {
      if (typeof entry !== 'object' || entry === null) continue;
      const { id, visible } = entry as { id?: unknown; visible?: unknown };
      if (typeof id !== 'string') continue;
      const key = id as SectionKey;
      const known = isCustomSectionKey(key) ? validCustomKeys.has(key) : key in SECTION_LABELS;
      if (!known || seen.has(key)) continue;
      seen.add(key);
      ordered.push({ id: key, label: sectionLabel(key, customSections), visible: visible !== false });
    }
  }

  for (const section of recommendedSectionOrder(stage)) {
    if (!seen.has(section.id)) {
      seen.add(section.id);
      ordered.push(section);
    }
  }
  for (const key of validCustomKeys) {
    if (!seen.has(key)) ordered.push({ id: key, label: sectionLabel(key, customSections), visible: true });
  }
  return ordered;
}
