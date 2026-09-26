import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  ResumeData,
  PersonalInfo,
  SkillItem,
  ExperienceItem,
  EducationItem,
  ProjectItem,
  CertificationItem,
  AchievementItem,
  SocialLink,
} from '@/types/resume';
import { emptyResumeData } from '@/types/initialResumeData';

interface ResumeState {
  resumeData: ResumeData;
  activeStep: number;
  selectedTemplate: string;
  accentColor: string;

  // Navigation & UI Setters
  setActiveStep: (step: number) => void;
  setSelectedTemplate: (templateId: string) => void;
  setAccentColor: (color: string) => void;
  setResumeData: (data: ResumeData) => void;
  resetToBlank: () => void;

  // Personal Info
  updatePersonalInfo: <K extends keyof PersonalInfo>(field: K, value: PersonalInfo[K]) => void;

  // Skills
  addSkill: (skill: SkillItem) => void;
  removeSkill: (id: string) => void;

  // Links
  addLink: (link: SocialLink) => void;
  removeLink: (id: string) => void;

  // Experience
  addExperience: (exp: ExperienceItem) => void;
  removeExperience: (id: string) => void;
  updateExperience: (id: string, updates: Partial<ExperienceItem>) => void;
  setEnhancedBullets: (id: string, bullets: string[]) => void;

  // Education
  addEducation: (edu: EducationItem) => void;
  removeEducation: (id: string) => void;
  updateEducation: (id: string, updates: Partial<EducationItem>) => void;

  // Projects
  addProject: (proj: ProjectItem) => void;
  removeProject: (id: string) => void;
  updateProject: (id: string, updates: Partial<ProjectItem>) => void;

  // Certifications
  addCertification: (cert: CertificationItem) => void;
  removeCertification: (id: string) => void;
  updateCertification: (id: string, updates: Partial<CertificationItem>) => void;

  // Achievements
  addAchievement: (ach: AchievementItem) => void;
  removeAchievement: (id: string) => void;
  updateAchievement: (id: string, updates: Partial<AchievementItem>) => void;
}

export const useResumeStore = create<ResumeState>()(
  persist(
    (set) => ({
      resumeData: emptyResumeData,
      activeStep: 0,
      selectedTemplate: 'modern',
      accentColor: '#2563eb',

      setActiveStep: (step) => set({ activeStep: step }),
      setSelectedTemplate: (templateId) => set({ selectedTemplate: templateId }),
      setAccentColor: (color) => set({ accentColor: color }),
      setResumeData: (data) => set({ resumeData: data }),

      // Reset store state and clear persistent local storage
      resetToBlank: () => {
        set({
          resumeData: emptyResumeData,
          activeStep: 0,
        });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('ai-resume-builder-store');
        }
      },

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

      addExperience: (exp) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            experiences: [exp, ...state.resumeData.experiences],
          },
        })),

      removeExperience: (id) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            experiences: state.resumeData.experiences.filter((e) => e.id !== id),
          },
        })),

      updateExperience: (id, updates) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            experiences: state.resumeData.experiences.map((e) =>
              e.id === id ? { ...e, ...updates } : e
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
            education: state.resumeData.education.filter((e) => e.id !== id),
          },
        })),

      updateEducation: (id, updates) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            education: state.resumeData.education.map((e) =>
              e.id === id ? { ...e, ...updates } : e
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

      updateProject: (id, updates) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            projects: state.resumeData.projects.map((p) =>
              p.id === id ? { ...p, ...updates } : p
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

      updateCertification: (id, updates) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            certifications: (state.resumeData.certifications || []).map((c) =>
              c.id === id ? { ...c, ...updates } : c
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

      updateAchievement: (id, updates) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            achievements: (state.resumeData.achievements || []).map((a) =>
              a.id === id ? { ...a, ...updates } : a
            ),
          },
        })),
    }),
    {
      name: 'ai-resume-builder-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);