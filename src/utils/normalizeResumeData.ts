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

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asText(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function normalizeList<T>(
  value: unknown,
  normalize: (item: Record<string, unknown>, index: number) => T | null
): T[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry, index) => {
    const record = asRecord(entry);
    const normalized = record ? normalize(record, index) : null;
    return normalized ? [normalized] : [];
  });
}

export function normalizeResumeData(value: unknown): ResumeData {
  const source = asRecord(value);
  if (!source) throw new Error('The extracted resume data is not a valid object.');
  const personal = asRecord(source.personalInfo) || {};

  const skills: Skill[] = Array.isArray(source.skills)
    ? source.skills.flatMap((entry, index) => {
        if (typeof entry === 'string') {
          return entry.trim() ? [{ id: `skill-${index + 1}`, name: entry.trim() }] : [];
        }
        const record = asRecord(entry);
        const name = asText(record?.name).trim();
        if (!name) return [];
        return [{
          id: asText(record?.id) || `skill-${index + 1}`,
          name,
          level:
            record?.level === 'Beginner' ||
            record?.level === 'Intermediate' ||
            record?.level === 'Professional'
              ? record.level
              : undefined,
        }];
      })
    : [];

  const experiences = normalizeList<Experience>(source.experiences, (item, index) => {
    const company = asText(item.company).trim();
    const role = asText(item.role).trim();
    const rawDetails = asText(item.rawDetails);
    const enhancedBullets = Array.isArray(item.enhancedBullets)
      ? item.enhancedBullets.filter((bullet): bullet is string => typeof bullet === 'string')
      : [];
    if (!company && !role && !rawDetails.trim() && enhancedBullets.length === 0) return null;
    return {
      id: asText(item.id) || `experience-${index + 1}`,
      company,
      role,
      startDate: asText(item.startDate),
      endDate: asText(item.endDate),
      isCurrent: item.isCurrent === true,
      rawDetails,
      enhancedBullets,
    };
  });

  const projects = normalizeList<Project>(source.projects, (item, index) => {
    const title = asText(item.title).trim();
    const description = asText(item.description).trim();
    const techStack = Array.isArray(item.techStack)
      ? item.techStack.filter((technology): technology is string => typeof technology === 'string')
      : [];
    const githubUrl = asText(item.githubUrl);
    const liveUrl = asText(item.liveUrl);
    if (!title && !description && !techStack.length && !githubUrl && !liveUrl) return null;
    return {
      id: asText(item.id) || `project-${index + 1}`,
      title,
      description,
      techStack,
      githubUrl,
      liveUrl,
    };
  });

  const education = normalizeList<Education>(source.education, (item, index) => {
    const institution = asText(item.institution).trim();
    const degree = asText(item.degree).trim();
    const fieldOfStudy = asText(item.fieldOfStudy);
    const graduationYear = asText(item.graduationYear);
    const scoreOrGpa = asText(item.scoreOrGpa);
    if (!institution && !degree && !fieldOfStudy && !graduationYear && !scoreOrGpa) return null;
    return {
      id: asText(item.id) || `education-${index + 1}`,
      institution,
      degree,
      fieldOfStudy,
      graduationYear,
      scoreOrGpa,
    };
  });

  const links = normalizeList<SocialLink>(source.links, (item, index) => {
    const platform = asText(item.platform).trim();
    const url = asText(item.url).trim();
    if (!platform && !url) return null;
    return { id: asText(item.id) || `link-${index + 1}`, platform, url };
  });

  const certifications = normalizeList<Certification>(source.certifications, (item, index) => {
    const name = asText(item.name).trim();
    if (!name) return null;
    return {
      id: asText(item.id) || `certification-${index + 1}`,
      name,
      issuer: asText(item.issuer),
    };
  });

  const achievements = normalizeList<Achievement>(source.achievements, (item, index) => {
    const title = asText(item.title).trim();
    const description = asText(item.description).trim();
    if (!title && !description) return null;
    return {
      id: asText(item.id) || `achievement-${index + 1}`,
      title,
      description,
    };
  });

  return {
    personalInfo: {
      fullName: asText(personal.fullName),
      targetRole: asText(personal.targetRole),
      email: asText(personal.email),
      phone: asText(personal.phone),
      location: asText(personal.location),
      summary: asText(personal.summary),
      yearsOfExperience:
        typeof personal.yearsOfExperience === 'number' ||
        typeof personal.yearsOfExperience === 'string'
          ? personal.yearsOfExperience
          : '',
      experienceField: asText(personal.experienceField),
      photoUrl: asText(personal.photoUrl),
      showPhoto: personal.showPhoto === true,
    },
    links,
    skills,
    experiences,
    projects,
    education,
    certifications,
    achievements,
  };
}
