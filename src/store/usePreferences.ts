'use client';

// Small, lightweight preferences (PRD §9.3: localStorage only for preferences).
// Resume content never lives here.

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CareerStage } from '@/types/resume';
import { DEFAULT_ACCENT_COLOR, DEFAULT_TEMPLATE_ID } from '@/lib/resume/record';

export interface PreferencesState {
  defaultTemplateId: string;
  defaultAccentColor: string;
  defaultCareerStage: CareerStage | null;
  motion: 'system' | 'reduce';
  // null = automatic (collapsed on narrower screens).
  sidebarCollapsed: boolean | null;
  // The section each resume was last edited in, to restore the editing state.
  lastSection: Record<string, string>;
  setPreference: <K extends keyof Omit<PreferencesState, 'setPreference' | 'rememberSection'>>(
    key: K,
    value: PreferencesState[K]
  ) => void;
  rememberSection: (resumeId: string, section: string) => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set, get) => ({
      defaultTemplateId: DEFAULT_TEMPLATE_ID,
      defaultAccentColor: DEFAULT_ACCENT_COLOR,
      defaultCareerStage: null,
      motion: 'system',
      sidebarCollapsed: null,
      lastSection: {},
      setPreference: (key, value) => set({ [key]: value } as Partial<PreferencesState>),
      rememberSection: (resumeId, section) => {
        const entries = Object.entries({ ...get().lastSection, [resumeId]: section }).slice(-50);
        set({ lastSection: Object.fromEntries(entries) });
      },
    }),
    {
      name: 'ai-resume-studio:preferences',
      storage: createJSONStorage(() => localStorage),
      // Read in an effect after the first render, so server and browser HTML match.
      skipHydration: true,
      partialize: (state) => ({
        defaultTemplateId: state.defaultTemplateId,
        defaultAccentColor: state.defaultAccentColor,
        defaultCareerStage: state.defaultCareerStage,
        motion: state.motion,
        sidebarCollapsed: state.sidebarCollapsed,
        lastSection: state.lastSection,
      }),
    }
  )
);
