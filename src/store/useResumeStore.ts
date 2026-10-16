import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
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

export const RESUME_STORE_KEY = 'ai-resume-builder-store';
// Older builds saved drafts under this key. Drafts are moved over on first load.
const LEGACY_STORE_KEYS = ['ai_resume_studio_store'];

export function createBlankResume(): ResumeData {
  return {
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
}

export const DEFAULT_SECTION_ORDER: readonly SectionItem[] = [
  { id: 'summary', label: 'Professional Summary', visible: true },
  { id: 'skills', label: 'Skills & Competencies', visible: true },
  { id: 'experience', label: 'Work Experience', visible: true },
  { id: 'projects', label: 'Key Projects', visible: true },
  { id: 'education', label: 'Education', visible: true },
  { id: 'certifications', label: 'Certifications', visible: true },
  { id: 'achievements', label: 'Achievements', visible: true },
];

const defaultSectionOrder = (): SectionItem[] => DEFAULT_SECTION_ORDER.map((section) => ({ ...section }));

const listOrEmpty = <T,>(value: T[] | undefined): T[] => (Array.isArray(value) ? value : []);

// Fills any missing fields so older drafts and partial imports never crash the editor.
function withResumeDefaults(data: Partial<ResumeData> | null | undefined): ResumeData {
  const blank = createBlankResume();
  return {
    personalInfo: { ...blank.personalInfo, ...(data?.personalInfo ?? {}) },
    skills: listOrEmpty(data?.skills),
    experiences: listOrEmpty(data?.experiences),
    projects: listOrEmpty(data?.projects),
    education: listOrEmpty(data?.education),
    certifications: listOrEmpty(data?.certifications),
    achievements: listOrEmpty(data?.achievements),
    links: listOrEmpty(data?.links),
  };
}

// Keeps a saved section order valid: known sections only, no duplicates, none missing.
function normalizeSectionOrder(value: unknown): SectionItem[] {
  const defaults = new Map(DEFAULT_SECTION_ORDER.map((section) => [section.id as string, section]));
  const seen = new Set<SectionKey>();
  const ordered: SectionItem[] = [];

  if (Array.isArray(value)) {
    for (const entry of value) {
      if (typeof entry !== 'object' || entry === null) continue;
      const { id, visible } = entry as { id?: unknown; visible?: unknown };
      const base = typeof id === 'string' ? defaults.get(id) : undefined;
      if (!base || seen.has(base.id)) continue;
      seen.add(base.id);
      ordered.push({ ...base, visible: visible !== false });
    }
  }

  for (const section of DEFAULT_SECTION_ORDER) {
    if (!seen.has(section.id)) ordered.push({ ...section });
  }
  return ordered;
}

function getBrowserStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

// localStorage wrapper that never throws (private mode, full quota) and
// migrates drafts saved under the legacy key.
const resumeStorage: StateStorage = {
  getItem: (name) => {
    const storage = getBrowserStorage();
    if (!storage) return null;
    try {
      const current = storage.getItem(name);
      if (current !== null) return current;
      for (const legacyKey of LEGACY_STORE_KEYS) {
        const legacy = storage.getItem(legacyKey);
        if (legacy === null) continue;
        storage.setItem(name, legacy);
        storage.removeItem(legacyKey);
        return legacy;
      }
    } catch (error) {
      console.error('Could not read the saved resume draft:', error);
    }
    return null;
  },
  setItem: (name, value) => {
    try {
      getBrowserStorage()?.setItem(name, value);
    } catch (error) {
      console.error('Could not save the resume draft in this browser:', error);
    }
  },
  removeItem: (name) => {
    try {
      getBrowserStorage()?.removeItem(name);
    } catch (error) {
      console.error('Could not clear the saved resume draft:', error);
    }
  },
};

export interface ResumeState {
  resumeData: ResumeData;
  activeTemplate: string;
  accentColor: string;
  sectionOrder: SectionItem[];

  // Global Actions
  setResumeData: (data: ResumeData) => void;
  setActiveTemplate: (templateId: string) => void;
  setAccentColor: (color: string) => void;
  resetToBlank: () => void;

  // Section Reorder & Visibility Actions
  setSectionOrder: (order: SectionItem[]) => void;
  moveSection: (startIndex: number, endIndex: number) => void;
  toggleSectionVisibility: (sectionId: SectionKey) => void;
  resetSectionOrder: () => void;

  // Personal Info Actions
  updatePersonalInfo: <K extends keyof PersonalInfo>(field: K, value: PersonalInfo[K]) => void;

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

type PersistedResumeState = Pick<
  ResumeState,
  'resumeData' | 'activeTemplate' | 'accentColor' | 'sectionOrder'
>;

export const useResumeStore = create<ResumeState>()(
  persist(
    (set) => ({
      resumeData: createBlankResume(),
      activeTemplate: 'modern',
      accentColor: '#2563eb',
      sectionOrder: defaultSectionOrder(),

      // Global Actions
      setResumeData: (data) => set({ resumeData: withResumeDefaults(data) }),

      setActiveTemplate: (templateId) => set({ activeTemplate: templateId }),
      setAccentColor: (color) => set({ accentColor: color }),

      resetToBlank: () =>
        set({
          resumeData: createBlankResume(),
          sectionOrder: defaultSectionOrder(),
        }),

      // Section Reorder & Visibility
      setSectionOrder: (order) => set({ sectionOrder: normalizeSectionOrder(order) }),

      moveSection: (startIndex, endIndex) =>
        set((state) => {
          const result = Array.from(state.sectionOrder);
          if (
            startIndex < 0 ||
            endIndex < 0 ||
            startIndex >= result.length ||
            endIndex >= result.length
          ) {
            return {};
          }
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

      resetSectionOrder: () => set({ sectionOrder: defaultSectionOrder() }),

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
      name: RESUME_STORE_KEY,
      storage: createJSONStorage(() => resumeStorage),
      partialize: (state): PersistedResumeState => ({
        resumeData: state.resumeData,
        activeTemplate: state.activeTemplate,
        accentColor: state.accentColor,
        sectionOrder: state.sectionOrder,
      }),
      merge: (persisted, current) => {
        const saved =
          typeof persisted === 'object' && persisted !== null
            ? (persisted as Partial<PersistedResumeState>)
            : {};
        return {
          ...current,
          resumeData: withResumeDefaults(saved.resumeData),
          activeTemplate:
            typeof saved.activeTemplate === 'string' ? saved.activeTemplate : current.activeTemplate,
          accentColor:
            typeof saved.accentColor === 'string' ? saved.accentColor : current.accentColor,
          sectionOrder: normalizeSectionOrder(saved.sectionOrder),
        };
      },
    }
  )
);
