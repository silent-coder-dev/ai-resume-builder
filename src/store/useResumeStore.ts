import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ResumeData,
  SkillItem,
  ExperienceItem,
  EducationItem,
  ProjectItem,
  SocialLink,
  CertificationItem,
  AchievementItem,
} from '@/types/resume';
import { initialResumeData } from '@/types/initialResumeData';

interface ResumeStore {
  resumeData: ResumeData;
  activeStep: number;
  selectedTemplate: string;
  accentColor: string;

  // Global Hydration/Parser Action
  setResumeData: (data: ResumeData) => void;

  // Navigation
  setActiveStep: (step: number) => void;
  setSelectedTemplate: (template: string) => void;
  setAccentColor: (color: string) => void;

  // Personal Info
  updatePersonalInfo: (field: keyof ResumeData['personalInfo'], value: any) => void;

  // Links
  addLink: (link: SocialLink) => void;
  removeLink: (id: string) => void;

  // Skills
  addSkill: (skill: SkillItem) => void;
  removeSkill: (id: string) => void;

  // Experiences
  addExperience: (experience: ExperienceItem) => void;
  removeExperience: (id: string) => void;
  updateExperience: (id: string, updated: Partial<ExperienceItem>) => void;
  setEnhancedBullets: (id: string, bullets: string[]) => void;

  // Education
  addEducation: (edu: EducationItem) => void;
  removeEducation: (id: string) => void;
  updateEducation: (id: string, updated: Partial<EducationItem>) => void;

  // Projects
  addProject: (project: ProjectItem) => void;
  removeProject: (id: string) => void;
  updateProject: (id: string, updated: Partial<ProjectItem>) => void;

  // Certifications (Optional)
  addCertification: (cert: CertificationItem) => void;
  removeCertification: (id: string) => void;
  updateCertification: (id: string, updated: Partial<CertificationItem>) => void;

  // Achievements (Optional)
  addAchievement: (ach: AchievementItem) => void;
  removeAchievement: (id: string) => void;
  updateAchievement: (id: string, updated: Partial<AchievementItem>) => void;

  // Reset
  resetToDefault: () => void;
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set) => ({
      resumeData: initialResumeData,
      activeStep: 0,
      selectedTemplate: 'modern',
      accentColor: '#2563eb',

      setResumeData: (data) =>
        set({
          resumeData: {
            ...data,
            certifications: data.certifications || [],
            achievements: data.achievements || [],
          },
        }),

      setActiveStep: (step) => set({ activeStep: step }),
      setSelectedTemplate: (template) => set({ selectedTemplate: template }),
      setAccentColor: (color) => set({ accentColor: color }),

      updatePersonalInfo: (field, value) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            personalInfo: {
              ...state.resumeData.personalInfo,
              [field]: value,
            },
          },
        })),

      addLink: (link) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            links: [...state.resumeData.links, link],
          },
        })),

      removeLink: (id) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            links: state.resumeData.links.filter((l) => l.id !== id),
          },
        })),

      addSkill: (skill) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            skills: [...state.resumeData.skills, skill],
          },
        })),

      removeSkill: (id) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            skills: state.resumeData.skills.filter((s) => s.id !== id),
          },
        })),

      addExperience: (exp) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            experiences: [...state.resumeData.experiences, exp],
          },
        })),

      removeExperience: (id) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            experiences: state.resumeData.experiences.filter((e) => e.id !== id),
          },
        })),

      updateExperience: (id, updated) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            experiences: state.resumeData.experiences.map((e) =>
              e.id === id ? { ...e, ...updated } : e
            ),
          },
        })),

      setEnhancedBullets: (id, bullets) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            experiences: state.resumeData.experiences.map((e) =>
              e.id === id ? { ...e, enhancedBullets: bullets } : e
            ),
          },
        })),

      addEducation: (edu) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            education: [...state.resumeData.education, edu],
          },
        })),

      removeEducation: (id) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            education: state.resumeData.education.filter((ed) => ed.id !== id),
          },
        })),

      updateEducation: (id, updated) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            education: state.resumeData.education.map((ed) =>
              ed.id === id ? { ...ed, ...updated } : ed
            ),
          },
        })),

      addProject: (proj) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            projects: [...state.resumeData.projects, proj],
          },
        })),

      removeProject: (id) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            projects: state.resumeData.projects.filter((p) => p.id !== id),
          },
        })),

      updateProject: (id, updated) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            projects: state.resumeData.projects.map((p) =>
              p.id === id ? { ...p, ...updated } : p
            ),
          },
        })),

      addCertification: (cert) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            certifications: [...(state.resumeData.certifications || []), cert],
          },
        })),

      removeCertification: (id) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            certifications: (state.resumeData.certifications || []).filter((c) => c.id !== id),
          },
        })),

      updateCertification: (id, updated) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            certifications: (state.resumeData.certifications || []).map((c) =>
              c.id === id ? { ...c, ...updated } : c
            ),
          },
        })),

      addAchievement: (ach) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            achievements: [...(state.resumeData.achievements || []), ach],
          },
        })),

      removeAchievement: (id) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            achievements: (state.resumeData.achievements || []).filter((a) => a.id !== id),
          },
        })),

      updateAchievement: (id, updated) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            achievements: (state.resumeData.achievements || []).map((a) =>
              a.id === id ? { ...a, ...updated } : a
            ),
          },
        })),

      resetToDefault: () =>
        set({
          resumeData: initialResumeData,
          activeStep: 0,
        }),
    }),
    {
      name: 'ai-resume-builder-store',
    }
  )
);