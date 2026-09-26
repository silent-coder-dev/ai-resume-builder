import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { initialResumeData } from '@/types/initialResumeData';
import { ResumeData, Skill, Experience, Education, Project, Certification, Achievement, SocialLink } from '@/types/resume';

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

export const DEFAULT_SECTION_ORDER: SectionItem[] = [
  { id: 'summary', label: 'Professional Summary', visible: true },
  { id: 'skills', label: 'Technical & Core Skills', visible: true },
  { id: 'experience', label: 'Work Experience', visible: true },
  { id: 'projects', label: 'Key Projects', visible: true },
  { id: 'education', label: 'Education', visible: true },
  { id: 'certifications', label: 'Certifications', visible: true },
  { id: 'achievements', label: 'Key Achievements', visible: true },
];

interface ResumeState {
  resumeData: ResumeData;
  accentColor: string;
  sectionOrder: SectionItem[];
  
  // Actions
  setResumeData: (data: ResumeData) => void;
  setAccentColor: (color: string) => void;
  setSectionOrder: (newOrder: SectionItem[]) => void;
  toggleSectionVisibility: (id: SectionKey) => void;
  moveSection: (dragIndex: number, hoverIndex: number) => void;
  resetSectionOrder: () => void;

  // Personal Info
  updatePersonalInfo: (field: string, value: string) => void;

  // Skills
  addSkill: (skill: Skill) => void;
  removeSkill: (id: string) => void;
  updateSkill: (id: string, skill: Partial<Skill>) => void;

  // Links
  addLink: (link: SocialLink) => void;
  removeLink: (id: string) => void;
  updateLink: (id: string, link: Partial<SocialLink>) => void;

  // Experience
  addExperience: (exp: Experience) => void;
  removeExperience: (id: string) => void;
  updateExperience: (id: string, exp: Partial<Experience>) => void;

  // Education
  addEducation: (edu: Education) => void;
  removeEducation: (id: string) => void;
  updateEducation: (id: string, edu: Partial<Education>) => void;

  // Projects
  addProject: (proj: Project) => void;
  removeProject: (id: string) => void;
  updateProject: (id: string, proj: Partial<Project>) => void;

  // Certifications
  addCertification: (cert: Certification) => void;
  removeCertification: (id: string) => void;

  // Achievements
  addAchievement: (ach: Achievement) => void;
  removeAchievement: (id: string) => void;
}

export const useResumeStore = create<ResumeState>()(
  persist(
    (set) => ({
      resumeData: initialResumeData,
      accentColor: '#2563eb',
      sectionOrder: DEFAULT_SECTION_ORDER,

      setResumeData: (data) => set({ resumeData: data }),
      setAccentColor: (color) => set({ accentColor: color }),
      
      setSectionOrder: (newOrder) => set({ sectionOrder: newOrder }),

      toggleSectionVisibility: (id) =>
        set((state) => ({
          sectionOrder: state.sectionOrder.map((sec) =>
            sec.id === id ? { ...sec, visible: !sec.visible } : sec
          ),
        })),

      moveSection: (dragIndex, hoverIndex) =>
        set((state) => {
          const updated = [...state.sectionOrder];
          const [draggedItem] = updated.splice(dragIndex, 1);
          updated.splice(hoverIndex, 0, draggedItem);
          return { sectionOrder: updated };
        }),

      resetSectionOrder: () => set({ sectionOrder: DEFAULT_SECTION_ORDER }),

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

      updateSkill: (id, skill) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            skills: state.resumeData.skills.map((s) =>
              s.id === id ? { ...s, ...skill } : s
            ),
          },
        })),

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

      updateLink: (id, link) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            links: (state.resumeData.links || []).map((l) =>
              l.id === id ? { ...l, ...link } : l
            ),
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

      updateExperience: (id, exp) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            experiences: state.resumeData.experiences.map((e) =>
              e.id === id ? { ...e, ...exp } : e
            ),
          },
        })),

      addEducation: (edu) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            education: [edu, ...state.resumeData.education],
          },
        })),

      removeEducation: (id) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            education: state.resumeData.education.filter((e) => e.id !== id),
          },
        })),

      updateEducation: (id, edu) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            education: state.resumeData.education.map((e) =>
              e.id === id ? { ...e, ...edu } : e
            ),
          },
        })),

      addProject: (proj) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            projects: [proj, ...state.resumeData.projects],
          },
        })),

      removeProject: (id) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            projects: state.resumeData.projects.filter((p) => p.id !== id),
          },
        })),

      updateProject: (id, proj) =>
        set((state) => ({
          resumeData: {
            ...state.resumeData,
            projects: state.resumeData.projects.map((p) =>
              p.id === id ? { ...p, ...proj } : p
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
    }),
    {
      name: 'silent-resume-builder-storage',
    }
  )
);