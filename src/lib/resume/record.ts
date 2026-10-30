import type { CareerStage, ResumeData, SectionItem } from '@/types/resume';
import { coerceResumeData } from '@/utils/normalizeResumeData';
import { normalizeSectionOrder } from '@/lib/resume/sections';
import { createId } from '@/utils/resumeContent';

export const RESUME_SCHEMA_VERSION = 2;
export const DEFAULT_TEMPLATE_ID = 'modern';
export const DEFAULT_ACCENT_COLOR = '#4f46e5';

// One saved resume. Every resume is fully independent of the others.
export interface ResumeRecord {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  careerStage: CareerStage | null;
  templateId: string;
  accentColor: string;
  sectionOrder: SectionItem[];
  data: ResumeData;
  schemaVersion: number;
  // Set when this resume was duplicated or tailored from another one.
  sourceResumeId?: string;
  tailoredFor?: string;
}

export interface NewResumeInput {
  title: string;
  careerStage?: CareerStage | null;
  data?: ResumeData;
  templateId?: string;
  accentColor?: string;
  sectionOrder?: SectionItem[];
  sourceResumeId?: string;
  tailoredFor?: string;
}

export function createBlankResumeData(): ResumeData {
  return {
    personalInfo: {
      fullName: '',
      targetRole: '',
      email: '',
      phone: '',
      location: '',
      summary: '',
      linkedinUrl: '',
      githubUrl: '',
      portfolioUrl: '',
    },
    skills: [],
    experiences: [],
    internships: [],
    projects: [],
    education: [],
    certifications: [],
    achievements: [],
    languages: [],
    customSections: [],
    links: [],
  };
}

export const isCareerStage = (value: unknown): value is CareerStage =>
  value === 'student' || value === 'fresher' || value === 'experienced';

export function cleanTitle(title: string, fallback = 'Untitled Resume') {
  const trimmed = title.replace(/\s+/g, ' ').trim().slice(0, 80);
  return trimmed || fallback;
}

export function buildResumeRecord(input: NewResumeInput, now = new Date().toISOString()): ResumeRecord {
  // Always coerce so a new record has exactly the shape it will have when read back.
  const data = coerceResumeData(input.data ?? createBlankResumeData());
  const careerStage = input.careerStage ?? null;
  return {
    id: createId(),
    title: cleanTitle(input.title),
    createdAt: now,
    updatedAt: now,
    careerStage,
    templateId: input.templateId || DEFAULT_TEMPLATE_ID,
    accentColor: input.accentColor || DEFAULT_ACCENT_COLOR,
    sectionOrder: normalizeSectionOrder(input.sectionOrder, data.customSections, careerStage),
    data,
    schemaVersion: RESUME_SCHEMA_VERSION,
    ...(input.sourceResumeId ? { sourceResumeId: input.sourceResumeId } : {}),
    ...(input.tailoredFor ? { tailoredFor: input.tailoredFor } : {}),
  };
}

// Validates a record that came from storage or an imported file.
// Throws when the value cannot be a resume at all.
export function coerceResumeRecord(value: unknown): ResumeRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('This is not a valid resume record.');
  }
  const source = value as Record<string, unknown>;
  const data = coerceResumeData(source.data);
  const careerStage = isCareerStage(source.careerStage) ? source.careerStage : null;
  const createdAt = typeof source.createdAt === 'string' && !Number.isNaN(Date.parse(source.createdAt))
    ? source.createdAt
    : new Date().toISOString();
  const updatedAt = typeof source.updatedAt === 'string' && !Number.isNaN(Date.parse(source.updatedAt))
    ? source.updatedAt
    : createdAt;
  return {
    id: typeof source.id === 'string' && source.id.trim() ? source.id : createId(),
    title: cleanTitle(typeof source.title === 'string' ? source.title : ''),
    createdAt,
    updatedAt,
    careerStage,
    templateId: typeof source.templateId === 'string' && source.templateId ? source.templateId : DEFAULT_TEMPLATE_ID,
    accentColor:
      typeof source.accentColor === 'string' && /^#[0-9a-f]{3,8}$/i.test(source.accentColor)
        ? source.accentColor
        : DEFAULT_ACCENT_COLOR,
    sectionOrder: normalizeSectionOrder(source.sectionOrder, data.customSections, careerStage),
    data,
    schemaVersion: RESUME_SCHEMA_VERSION,
    ...(typeof source.sourceResumeId === 'string' ? { sourceResumeId: source.sourceResumeId } : {}),
    ...(typeof source.tailoredFor === 'string' ? { tailoredFor: source.tailoredFor } : {}),
  };
}

// A suggested title based on the resume content, e.g. "Java Developer Resume".
export function suggestResumeTitle(data: ResumeData | undefined): string {
  const role = data?.personalInfo.targetRole.trim();
  if (role) return cleanTitle(`${role.split(/[/|,]/)[0].trim()} Resume`);
  const name = data?.personalInfo.fullName.trim();
  if (name) return cleanTitle(`${name} Resume`);
  return 'Untitled Resume';
}
