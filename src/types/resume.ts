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

export interface Experience {
  id: string;
  company: string;
  role: string;
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
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
}

export interface PersonalInfo {
  fullName: string;
  targetRole: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  yearsOfExperience?: number | string;
  experienceField?: string;
  photoUrl?: string;
  showPhoto?: boolean;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  skills: Skill[];
  experiences: Experience[];
  projects: Project[];
  education: Education[];
  certifications?: Certification[];
  achievements?: Achievement[];
  links?: SocialLink[];
}

export type SectionKey =
  | 'summary'
  | 'skills'
  | 'experience'
  | 'projects'
  | 'education'
  | 'certifications'
  | 'achievements';

export interface SectionItem {
  id: SectionKey;
  label: string;
  visible: boolean;
}