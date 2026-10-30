export interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

export interface Skill {
  id: string;
  name: string;
  level?: 'Beginner' | 'Intermediate' | 'Professional';
}

// Used for both work experience and internships.
export interface Experience {
  id: string;
  company: string;
  role: string;
  location?: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  rawDetails: string;
  enhancedBullets?: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  graduationYear: string;
  scoreOrGpa?: string;
}

export interface Project {
  id: string;
  title: string;
  techStack: string[];
  description: string;
  githubUrl?: string;
  liveUrl?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
}

export interface Language {
  id: string;
  name: string;
  proficiency: string;
}

export interface CustomSectionItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  description: string;
}

export interface CustomSection {
  id: string;
  title: string;
  items: CustomSectionItem[];
}

export interface PersonalInfo {
  fullName: string;
  targetRole: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  yearsOfExperience?: number | string;
  experienceField?: string;
  photoUrl?: string;
  showPhoto?: boolean;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  skills: Skill[];
  experiences: Experience[];
  internships?: Experience[];
  projects: Project[];
  education: Education[];
  certifications?: Certification[];
  achievements?: Achievement[];
  languages?: Language[];
  customSections?: CustomSection[];
  // Extra profile links beyond LinkedIn / GitHub / Portfolio (e.g. LeetCode).
  links?: SocialLink[];
}

export type BuiltInSectionKey =
  | 'summary'
  | 'skills'
  | 'experience'
  | 'internships'
  | 'projects'
  | 'education'
  | 'certifications'
  | 'achievements'
  | 'languages';

export type CustomSectionKey = `custom:${string}`;

export type SectionKey = BuiltInSectionKey | CustomSectionKey;

export interface SectionItem {
  id: SectionKey;
  label: string;
  visible: boolean;
}

export type CareerStage = 'student' | 'fresher' | 'experienced';
