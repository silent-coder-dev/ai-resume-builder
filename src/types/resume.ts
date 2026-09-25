export type SkillLevel = 'Beginner' | 'Intermediate' | 'Professional';

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

export interface SkillItem {
  id: string;
  name: string;
  level: SkillLevel;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  rawDetails: string;
  enhancedBullets: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: string;
  scoreOrGpa?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  techStack: string[];
  description: string;
  liveUrl?: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  issueDate?: string;
  url?: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  date?: string;
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  targetRole: string;
  yearsOfExperience: string;
  experienceField: string;
  summary: string;
  photoUrl?: string;
  showPhoto?: boolean;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  links: SocialLink[];
  skills: SkillItem[];
  experiences: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  certifications?: CertificationItem[];
  achievements?: AchievementItem[];
}