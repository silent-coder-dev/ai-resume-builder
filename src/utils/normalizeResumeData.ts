import type {
  Achievement,
  Certification,
  CustomSection,
  CustomSectionItem,
  Education,
  Experience,
  Language,
  PersonalInfo,
  Project,
  ResumeData,
  Skill,
  SocialLink,
} from '@/types/resume';

interface SanitizeOptions {
  // true: drop entries with no content (AI output). false: keep every entry (saved data).
  dropEmpty: boolean;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asText(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function asTextList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string').map((entry) => entry.trim()).filter(Boolean)
    : [];
}

function hasAny(...values: unknown[]) {
  return values.some((value) =>
    Array.isArray(value) ? value.length > 0 : typeof value === 'string' ? value.trim().length > 0 : Boolean(value)
  );
}

// AI output sometimes repeats an ID inside one section. Editing by ID would
// then change two entries at once, so repeated or missing IDs get a unique one.
function withUniqueIds<T extends { id: string }>(items: T[], prefix: string): T[] {
  const seen = new Set<string>();
  return items.map((item, index) => {
    let id = item.id.trim() || `${prefix}-${index + 1}`;
    while (seen.has(id)) id = `${id}-${index + 1}`;
    seen.add(id);
    return id === item.id ? item : { ...item, id };
  });
}

function sanitizeList<T extends { id: string }>(
  value: unknown,
  prefix: string,
  build: (item: Record<string, unknown>, index: number) => T,
  isEmpty: (item: T) => boolean,
  options: SanitizeOptions
): T[] {
  if (!Array.isArray(value)) return [];
  const items = value.flatMap((entry, index) => {
    const record = asRecord(entry);
    if (!record) return [];
    const built = build(record, index);
    return options.dropEmpty && isEmpty(built) ? [] : [built];
  });
  return withUniqueIds(items, prefix);
}

const buildExperience = (prefix: string) => (item: Record<string, unknown>, index: number): Experience => ({
  id: asText(item.id) || `${prefix}-${index + 1}`,
  company: asText(item.company).trim(),
  role: asText(item.role).trim(),
  location: asText(item.location).trim(),
  startDate: asText(item.startDate),
  endDate: asText(item.endDate),
  isCurrent: item.isCurrent === true,
  rawDetails: asText(item.rawDetails),
  enhancedBullets: Array.isArray(item.enhancedBullets)
    ? item.enhancedBullets.filter((bullet): bullet is string => typeof bullet === 'string')
    : [],
});

const experienceIsEmpty = (item: Experience) =>
  !hasAny(item.company, item.role, item.rawDetails, (item.enhancedBullets ?? []).filter((bullet) => bullet.trim()));

const LINK_FIELDS: Array<{ pattern: RegExp; field: 'linkedinUrl' | 'githubUrl' | 'portfolioUrl' }> = [
  { pattern: /linked\s*in/i, field: 'linkedinUrl' },
  { pattern: /git\s*hub/i, field: 'githubUrl' },
  { pattern: /portfolio|website|personal site/i, field: 'portfolioUrl' },
];

function sanitizeResumeData(value: unknown, options: SanitizeOptions): ResumeData {
  const source = asRecord(value);
  if (!source) throw new Error('The resume data is not a valid object.');
  const personal = asRecord(source.personalInfo) || {};

  const skills: Skill[] = Array.isArray(source.skills)
    ? withUniqueIds(
        source.skills.flatMap((entry, index): Skill[] => {
          if (typeof entry === 'string') {
            return entry.trim() || !options.dropEmpty ? [{ id: `skill-${index + 1}`, name: entry.trim() }] : [];
          }
          const record = asRecord(entry);
          if (!record) return [];
          const name = asText(record.name).trim();
          if (!name && options.dropEmpty) return [];
          return [{
            id: asText(record.id) || `skill-${index + 1}`,
            name,
            level:
              record.level === 'Beginner' || record.level === 'Intermediate' || record.level === 'Professional'
                ? record.level
                : undefined,
          }];
        }),
        'skill'
      )
    : [];

  const experiences = sanitizeList(source.experiences, 'experience', buildExperience('experience'), experienceIsEmpty, options);
  const internships = sanitizeList(source.internships, 'internship', buildExperience('internship'), experienceIsEmpty, options);

  const projects = sanitizeList<Project>(
    source.projects,
    'project',
    (item, index) => ({
      id: asText(item.id) || `project-${index + 1}`,
      title: asText(item.title).trim(),
      description: asText(item.description),
      techStack: asTextList(item.techStack),
      githubUrl: asText(item.githubUrl).trim(),
      liveUrl: asText(item.liveUrl).trim(),
    }),
    (item) => !hasAny(item.title, item.description, item.techStack, item.githubUrl, item.liveUrl),
    options
  );

  const education = sanitizeList<Education>(
    source.education,
    'education',
    (item, index) => ({
      id: asText(item.id) || `education-${index + 1}`,
      institution: asText(item.institution).trim(),
      degree: asText(item.degree).trim(),
      fieldOfStudy: asText(item.fieldOfStudy),
      graduationYear: asText(item.graduationYear),
      scoreOrGpa: asText(item.scoreOrGpa),
    }),
    (item) => !hasAny(item.institution, item.degree, item.fieldOfStudy, item.graduationYear, item.scoreOrGpa),
    options
  );

  let links = sanitizeList<SocialLink>(
    source.links,
    'link',
    (item, index) => ({
      id: asText(item.id) || `link-${index + 1}`,
      platform: asText(item.platform).trim(),
      url: asText(item.url).trim(),
    }),
    (item) => !hasAny(item.platform, item.url),
    options
  );

  const certifications = sanitizeList<Certification>(
    source.certifications,
    'certification',
    (item, index) => ({
      id: asText(item.id) || `certification-${index + 1}`,
      name: asText(item.name).trim(),
      issuer: asText(item.issuer),
      date: asText(item.date),
    }),
    (item) => !hasAny(item.name),
    options
  );

  const achievements = sanitizeList<Achievement>(
    source.achievements,
    'achievement',
    (item, index) => ({
      id: asText(item.id) || `achievement-${index + 1}`,
      title: asText(item.title).trim(),
      description: asText(item.description),
    }),
    (item) => !hasAny(item.title, item.description),
    options
  );

  const languages = sanitizeList<Language>(
    source.languages,
    'language',
    (item, index) => ({
      id: asText(item.id) || `language-${index + 1}`,
      name: asText(item.name).trim(),
      proficiency: asText(item.proficiency).trim(),
    }),
    (item) => !hasAny(item.name),
    options
  );

  const customSections = sanitizeList<CustomSection>(
    source.customSections,
    'custom',
    (item, index) => ({
      id: asText(item.id) || `custom-${index + 1}`,
      title: asText(item.title).trim(),
      items: sanitizeList<CustomSectionItem>(
        item.items,
        'item',
        (entry, entryIndex) => ({
          id: asText(entry.id) || `item-${entryIndex + 1}`,
          title: asText(entry.title).trim(),
          subtitle: asText(entry.subtitle),
          date: asText(entry.date),
          description: asText(entry.description),
        }),
        (entry) => !hasAny(entry.title, entry.subtitle, entry.description),
        options
      ),
    }),
    (item) => !hasAny(item.title, item.items),
    options
  );

  const personalInfo: PersonalInfo = {
    fullName: asText(personal.fullName),
    targetRole: asText(personal.targetRole),
    email: asText(personal.email),
    phone: asText(personal.phone),
    location: asText(personal.location),
    summary: asText(personal.summary),
    linkedinUrl: asText(personal.linkedinUrl).trim(),
    githubUrl: asText(personal.githubUrl).trim(),
    portfolioUrl: asText(personal.portfolioUrl).trim(),
    yearsOfExperience:
      typeof personal.yearsOfExperience === 'number' || typeof personal.yearsOfExperience === 'string'
        ? personal.yearsOfExperience
        : '',
    experienceField: asText(personal.experienceField),
    photoUrl: asText(personal.photoUrl),
    showPhoto: personal.showPhoto === true,
  };

  // Older resumes kept LinkedIn / GitHub / Portfolio in the generic link list.
  // Move them into their dedicated fields the first time they are seen.
  for (const { pattern, field } of LINK_FIELDS) {
    if (personalInfo[field]) continue;
    const match = links.find((link) => link.url && pattern.test(`${link.platform} ${link.url}`));
    if (match) {
      personalInfo[field] = match.url;
      links = links.filter((link) => link !== match);
    }
  }

  return {
    personalInfo,
    links,
    skills,
    experiences,
    internships,
    projects,
    education,
    certifications,
    achievements,
    languages,
    customSections,
  };
}

// Cleans AI output: fills fields, drops empty entries, fixes repeated IDs.
export function normalizeResumeData(value: unknown): ResumeData {
  return sanitizeResumeData(value, { dropEmpty: true });
}

// Repairs saved or imported resumes: fills missing fields but keeps every entry,
// including rows the user added and has not filled in yet.
export function coerceResumeData(value: unknown): ResumeData {
  return sanitizeResumeData(value, { dropEmpty: false });
}
