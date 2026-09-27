import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  ResumeData,
  SectionItem,
  SectionKey,
  SocialLink,
  Skill,
  Experience,
  Project,
  Education,
  Certification,
  Achievement,
  PersonalInfo,
} from '@/types/resume';

export type { SectionKey, SectionItem };

const initialResumeData: ResumeData = {
  personalInfo: {
    fullName: '',
    targetRole: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    yearsOfExperience: 0,
    experienceField: '',
  },
  skills: [],
  experiences: [],
  projects: [],
  education: [],
  certifications: [],
  achievements: [],
  links: [],
};

const defaultSectionOrder: SectionItem[] = [
  { id: 'summary', label: 'Professional Summary', visible: true },
  { id: 'skills', label: 'Skills & Competencies', visible: true },
  { id: 'experience', label: 'Work Experience', visible: true },
  { id: 'projects', label: 'Key Projects', visible: true },
  { id: 'education', label: 'Education', visible: true },
  { id: 'certifications', label: 'Certifications', visible: true },
  { id: 'achievements', label: 'Achievements', visible: true },
];

export interface ResumeState {
  resumeData: ResumeData;
  activeTemplate: string;
  accentColor: string;
  zoomLevel: number;
  sectionOrder: SectionItem[];

  // Global Actions
  setResumeData: (data: ResumeData) => void;
  setActiveTemplate: (templateId: string) => void;
  setAccentColor: (color: string) => void;
  setZoomLevel: (level: number) => void;
  resetToBlank: () => void;

  // Section Reorder & Visibility Actions
  setSectionOrder: (order: SectionItem[]) => void;
  reorderSections: (startIndex: number, endIndex: number) => void;
  moveSection: (startIndex: number, endIndex: number) => void;
  toggleSectionVisibility: (sectionId: SectionKey) => void;
  resetSectionOrder: () => void;

  // Personal Info Actions
  updatePersonalInfo: (field: keyof PersonalInfo, value: any) => void;

  // Links Actions
  addLink: (link: SocialLink) => void;
  removeLink: (id: string) => void;
  updateLink: (id: string, updatedLink: Partial<SocialLink>) => void;

  // Skills Actions
  addSkill: (skill: Skill) => void;
  removeSkill: (id: string) => void;
  updateSkill: (id: string, updatedSkill: Partial<Skill>) => void;

  // Experience Actions
  addExperience: (exp: Experience) => void;
  removeExperience: (id: string) => void;
  updateExperience: (id: string, updatedExp: Partial<Experience>) => void;

  // Project Actions
  addProject: (proj: Project) => void;
  removeProject: (id: string) => void;
  updateProject: (id: string, updatedProj: Partial<Project>) => void;

  // Education Actions
  addEducation: (edu: Education) => void;
  removeEducation: (id: string) => void;
  updateEducation: (id: string, updatedEdu: Partial<Education>) => void;

  // Certification Actions
  addCertification: (cert: Certification) => void;
  removeCertification: (id: string) => void;
  updateCertification: (id: string, updatedCert: Partial<Certification>) => void;

  // Achievement Actions
  addAchievement: (ach: Achievement) => void;
  removeAchievement: (id: string) => void;
  updateAchievement: (id: string, updatedAch: Partial<Achievement>) => void;
}

export const useResumeStore = create<ResumeState>()(
  persist(
    (set) => ({
      resumeData: initialResumeData,
      activeTemplate: 'modern',
      accentColor: '#2563eb',
      zoomLevel: 1,
      sectionOrder: defaultSectionOrder,

      // Global Actions
      setResumeData: (data) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            ...data,
            personalInfo: {
              ...state.resumeData.personalInfo,
              ...(data.personalInfo || {}),
            },
            links: data.links || [],
            skills: data.skills || [],
            experiences: data.experiences || [],
            projects: data.projects || [],
            education: data.education || [],
            certifications: data.certifications || [],
            achievements: data.achievements || [],
          },
        })),

      setActiveTemplate: (templateId) => set({ activeTemplate: templateId }),
      setAccentColor: (color) => set({ accentColor: color }),
      setZoomLevel: (level) => set({ zoomLevel: level }),

      resetToBlank: () =>
        set({
          resumeData: {
            personalInfo: {
              fullName: '',
              targetRole: '',
              email: '',
              phone: '',
              location: '',
              summary: '',
              yearsOfExperience: 0,
              experienceField: '',
            },
            skills: [],
            experiences: [],
            projects: [],
            education: [],
            certifications: [],
            achievements: [],
            links: [],
          },
          sectionOrder: defaultSectionOrder,
        }),

      // Section Reorder & Visibility
      setSectionOrder: (order) => set({ sectionOrder: order }),

      reorderSections: (startIndex, endIndex) =>
        set((state) => {
          const result = Array.from(state.sectionOrder);
          const [removed] = result.splice(startIndex, 1);
          result.splice(endIndex, 0, removed);
          return { sectionOrder: result };
        }),

      moveSection: (startIndex, endIndex) =>
        set((state) => {
          const result = Array.from(state.sectionOrder);
          const [removed] = result.splice(startIndex, 1);
          result.splice(endIndex, 0, removed);
          return { sectionOrder: result };
        }),

      toggleSectionVisibility: (sectionId) =>
        set((state) => ({
          sectionOrder: state.sectionOrder.map((sec) =>
            sec.id === sectionId ? { ...sec, visible: !sec.visible } : sec
          ),
        })),

      resetSectionOrder: () => set({ sectionOrder: defaultSectionOrder }),

      // Personal Info
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

      // Links
      addLink: (link) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            links: [...(state.resumeData.links || []), link],
          },
        })),

      removeLink: (id) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            links: (state.resumeData.links || []).filter((l) => l.id !== id),
          },
        })),

      updateLink: (id, updatedLink) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            links: (state.resumeData.links || []).map((l) =>
              l.id === id ? { ...l, ...updatedLink } : l
            ),
          },
        })),

      // Skills
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

      updateSkill: (id, updatedSkill) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            skills: state.resumeData.skills.map((s) =>
              s.id === id ? { ...s, ...updatedSkill } : s
            ),
          },
        })),

      // Experience
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

      updateExperience: (id, updatedExp) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            experiences: state.resumeData.experiences.map((e) =>
              e.id === id ? { ...e, ...updatedExp } : e
            ),
          },
        })),

      // Projects
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

      updateProject: (id, updatedProj) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            projects: state.resumeData.projects.map((p) =>
              p.id === id ? { ...p, ...updatedProj } : p
            ),
          },
        })),

      // Education
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

      updateEducation: (id, updatedEdu) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            education: state.resumeData.education.map((e) =>
              e.id === id ? { ...e, ...updatedEdu } : e
            ),
          },
        })),

      // Certifications
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

      updateCertification: (id, updatedCert) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            certifications: (state.resumeData.certifications || []).map((c) =>
              c.id === id ? { ...c, ...updatedCert } : c
            ),
          },
        })),

      // Achievements
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

      updateAchievement: (id, updatedAch) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            achievements: (state.resumeData.achievements || []).map((a) =>
              a.id === id ? { ...a, ...updatedAch } : a
            ),
          },
        })),
    }),
    {
      name: 'ai_resume_studio_store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);