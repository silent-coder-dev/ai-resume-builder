'use client';

// The resume workspace: which resume is open, the list of saved resumes,
// autosave, save status, undo/redo, and every edit action.
// Persistence goes through src/lib/storage (IndexedDB), never through here directly.

import { create } from 'zustand';
import type {
  CareerStage,
  CustomSectionItem,
  PersonalInfo,
  ResumeData,
  SectionItem,
  SectionKey,
} from '@/types/resume';
import { cleanTitle, type NewResumeInput, type ResumeRecord } from '@/lib/resume/record';
import {
  customSectionKey,
  normalizeSectionOrder,
  recommendedSectionOrder,
  sectionLabel,
} from '@/lib/resume/sections';
import * as repo from '@/lib/storage/resumeRepository';
import { importResumes as importBackupRecords } from '@/lib/storage/backup';
import {
  clearJournal,
  migrateLegacyDraft,
  recoverJournal,
  writeJournal,
} from '@/lib/storage/recovery';
import { createId } from '@/utils/resumeContent';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict' | 'recovering';

export type ListKey =
  | 'skills'
  | 'experiences'
  | 'internships'
  | 'projects'
  | 'education'
  | 'certifications'
  | 'achievements'
  | 'languages'
  | 'links';

export type ListItem<K extends ListKey> = NonNullable<ResumeData[K]>[number];

interface ResumeSnapshot {
  title: string;
  careerStage: CareerStage | null;
  templateId: string;
  accentColor: string;
  sectionOrder: SectionItem[];
  data: ResumeData;
}

interface MutateOptions {
  // Edits with the same key within a second become one undo step (typing).
  key?: string;
  // Structural changes are saved right away instead of after the typing pause.
  immediate?: boolean;
}

export interface WorkspaceState {
  phase: 'idle' | 'loading' | 'ready' | 'error';
  storageKind: 'indexeddb' | 'memory' | null;
  loadError: string | null;
  resumes: ResumeRecord[];
  current: ResumeRecord | null;
  saveStatus: SaveStatus;
  saveError: string | null;
  lastSavedAt: string | null;
  dirty: boolean;
  notice: string | null;
  conflict: ResumeRecord | null;
  missing: boolean;
  past: ResumeSnapshot[];
  future: ResumeSnapshot[];

  init: () => Promise<void>;
  refreshResumes: () => Promise<void>;
  openResume: (id: string) => Promise<boolean>;
  reloadCurrent: () => Promise<void>;
  closeResume: () => Promise<void>;
  // open: false creates the resume without switching to it (e.g. tailored copies).
  createResume: (input: NewResumeInput, options?: { open?: boolean }) => Promise<ResumeRecord>;
  duplicateResume: (id: string, title?: string) => Promise<ResumeRecord>;
  renameResume: (id: string, title: string) => Promise<void>;
  deleteResume: (id: string) => Promise<void>;
  importResumes: (records: ResumeRecord[]) => Promise<ResumeRecord[]>;
  deleteAllData: () => Promise<void>;
  flushSave: () => Promise<void>;
  retrySave: () => Promise<void>;
  resolveConflict: (choice: 'keep-mine' | 'load-theirs') => Promise<void>;
  saveCurrentAsNew: () => Promise<ResumeRecord | null>;
  checkpoint: (label: string) => Promise<void>;
  restoreVersion: (version: repo.ResumeVersion) => Promise<void>;
  writeJournalIfDirty: () => void;
  dismissNotice: () => void;
  undo: () => void;
  redo: () => void;

  setTitle: (title: string) => void;
  setCareerStage: (stage: CareerStage | null, applyRecommendedOrder?: boolean) => void;
  setTemplate: (templateId: string) => void;
  setAccentColor: (color: string) => void;
  replaceData: (data: ResumeData) => void;
  updatePersonalInfo: <K extends keyof PersonalInfo>(field: K, value: PersonalInfo[K]) => void;
  addItem: <K extends ListKey>(list: K, item: ListItem<K>) => void;
  updateItem: <K extends ListKey>(list: K, id: string, patch: Partial<ListItem<K>>) => void;
  removeItem: <K extends ListKey>(list: K, id: string) => void;
  moveItem: <K extends ListKey>(list: K, id: string, direction: -1 | 1) => void;
  addCustomSection: (title: string) => string | null;
  renameCustomSection: (sectionId: string, title: string) => void;
  removeCustomSection: (sectionId: string) => void;
  addCustomItem: (sectionId: string) => void;
  updateCustomItem: (sectionId: string, itemId: string, patch: Partial<CustomSectionItem>) => void;
  removeCustomItem: (sectionId: string, itemId: string) => void;
  moveCustomItem: (sectionId: string, itemId: string, direction: -1 | 1) => void;
  moveSection: (id: SectionKey, direction: -1 | 1) => void;
  toggleSectionVisibility: (id: SectionKey) => void;
  resetSectionOrder: () => void;
}

const TYPING_SAVE_DELAY_MS = 700;
const AUTO_VERSION_INTERVAL_MS = 10 * 60 * 1000;
const UNDO_LIMIT = 100;
const COALESCE_WINDOW_MS = 1000;

let initPromise: Promise<void> | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let savingPromise: Promise<void> | null = null;
let lastEditAt: string | null = null;
let coalesceKey: string | null = null;
let coalesceAt = 0;
// Per resume: when the last automatic history snapshot was taken this visit.
const autoVersionAt = new Map<string, number>();

const toSnapshot = (record: ResumeRecord): ResumeSnapshot => ({
  title: record.title,
  careerStage: record.careerStage,
  templateId: record.templateId,
  accentColor: record.accentColor,
  sectionOrder: record.sectionOrder,
  data: record.data,
});

function storageErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    return 'Browser storage is full. Export a backup, then delete old resumes to free space.';
  }
  return error instanceof Error ? error.message : 'Your changes could not be saved on this device.';
}

const upsertRecord = (list: ResumeRecord[], record: ResumeRecord) =>
  [record, ...list.filter((item) => item.id !== record.id)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

function moveInArray<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (index < 0 || target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export const useWorkspaceStore = create<WorkspaceState>()((set, get) => {
  const clearSaveTimer = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = null;
  };

  const scheduleSave = (delay: number) => {
    clearSaveTimer();
    saveTimer = setTimeout(() => void runSave(), delay);
  };

  const maybeAutoVersion = (saved: ResumeRecord, before: ResumeRecord | null) => {
    const last = autoVersionAt.get(saved.id);
    if (last === undefined && before) {
      // First save this visit: keep the version as it was when the user opened it.
      autoVersionAt.set(saved.id, Date.now());
      void repo.saveVersion(before, 'Before this visit’s edits').catch(() => undefined);
    } else if (last !== undefined && Date.now() - last > AUTO_VERSION_INTERVAL_MS) {
      autoVersionAt.set(saved.id, Date.now());
      void repo.saveVersion(saved, 'Autosave').catch(() => undefined);
    }
  };

  // Stored copy of each resume as it was when it was opened (for the first history snapshot).
  const openedCopies = new Map<string, ResumeRecord>();

  const runSave = async (): Promise<void> => {
    clearSaveTimer();
    if (savingPromise) await savingPromise;
    const start = get().current;
    if (!start || !get().dirty) return;
    if (get().saveStatus === 'conflict') return;

    set({ saveStatus: 'saving' });
    savingPromise = (async () => {
      try {
        const saved = await repo.updateResume(start, { expectedUpdatedAt: start.updatedAt });
        const latest = get().current;
        const sameResume = latest?.id === saved.id;
        const unchangedSinceStart = latest === start;
        set({
          current: sameResume && latest ? { ...latest, updatedAt: saved.updatedAt } : latest,
          dirty: sameResume && !unchangedSinceStart,
          saveStatus: unchangedSinceStart ? 'saved' : 'saving',
          saveError: null,
          lastSavedAt: saved.updatedAt,
          missing: false,
          resumes: upsertRecord(get().resumes, saved),
        });
        if (unchangedSinceStart) clearJournal();
        else scheduleSave(TYPING_SAVE_DELAY_MS);
        maybeAutoVersion(saved, openedCopies.get(saved.id) ?? null);
      } catch (error) {
        if (error instanceof repo.ResumeConflictError) {
          set({ saveStatus: 'conflict', conflict: error.latest, saveError: error.message });
        } else if (error instanceof repo.ResumeNotFoundError) {
          set({
            saveStatus: 'error',
            missing: true,
            saveError: 'This resume was deleted in another tab. Save it as a new resume to keep your changes.',
          });
        } else {
          set({ saveStatus: 'error', saveError: storageErrorMessage(error) });
        }
      } finally {
        savingPromise = null;
      }
    })();
    await savingPromise;
  };

  // Applies an edit to the open resume, records undo history, and schedules a save.
  const mutate = (updater: (record: ResumeRecord) => ResumeRecord, options: MutateOptions = {}) => {
    const current = get().current;
    if (!current) return;
    const next = updater(current);
    if (next === current) return;

    const now = Date.now();
    const coalesce = Boolean(options.key) && options.key === coalesceKey && now - coalesceAt < COALESCE_WINDOW_MS;
    coalesceKey = options.key ?? null;
    coalesceAt = now;
    lastEditAt = new Date(now).toISOString();

    set({
      current: next,
      dirty: true,
      past: coalesce ? get().past : [...get().past, toSnapshot(current)].slice(-UNDO_LIMIT),
      future: [],
      saveStatus: get().saveStatus === 'conflict' ? 'conflict' : 'saving',
    });
    scheduleSave(options.immediate ? 0 : TYPING_SAVE_DELAY_MS);
  };

  const mutateData = (update: (data: ResumeData) => ResumeData, options?: MutateOptions) =>
    mutate((record) => {
      const data = update(record.data);
      return data === record.data ? record : { ...record, data };
    }, options);

  const loadIntoWorkspace = (record: ResumeRecord) => {
    clearSaveTimer();
    openedCopies.set(record.id, record);
    coalesceKey = null;
    set({
      current: record,
      dirty: false,
      past: [],
      future: [],
      saveStatus: 'saved',
      saveError: null,
      conflict: null,
      missing: false,
      lastSavedAt: record.updatedAt,
    });
  };

  return {
    phase: 'idle',
    storageKind: null,
    loadError: null,
    resumes: [],
    current: null,
    saveStatus: 'idle',
    saveError: null,
    lastSavedAt: null,
    dirty: false,
    notice: null,
    conflict: null,
    missing: false,
    past: [],
    future: [],

    init: () => {
      if (initPromise) return initPromise;
      initPromise = (async () => {
        set({ phase: 'loading' });
        try {
          const backend = await repo.getStorageBackend();
          set({ storageKind: backend.kind, saveStatus: 'recovering' });
          const migrated = await migrateLegacyDraft();
          const recovered = await recoverJournal();
          const resumes = await repo.getAllResumes();
          set({
            phase: 'ready',
            resumes,
            saveStatus: 'idle',
            notice: recovered
              ? `We recovered unsaved changes to “${recovered.title}”.`
              : migrated
                ? `Your earlier draft is now saved as “${migrated.title}”.`
                : null,
          });
          if (resumes.length > 0) void repo.requestPersistentStorage();
        } catch (error) {
          set({
            phase: 'error',
            saveStatus: 'error',
            loadError: storageErrorMessage(error),
          });
        }
      })();
      return initPromise;
    },

    refreshResumes: async () => {
      set({ resumes: await repo.getAllResumes() });
    },

    openResume: async (id) => {
      if (get().current?.id === id) return true;
      await get().flushSave();
      const record = await repo.getResume(id);
      if (!record) return false;
      loadIntoWorkspace(record);
      await repo.setLastEditedResume(id);
      return true;
    },

    // Loads a newer saved copy (from another tab) when there are no local edits.
    reloadCurrent: async () => {
      const current = get().current;
      if (!current || get().dirty) return;
      const record = await repo.getResume(current.id);
      if (record && record.updatedAt !== current.updatedAt && !get().dirty) loadIntoWorkspace(record);
    },

    closeResume: async () => {
      await get().flushSave();
      clearSaveTimer();
      set({ current: null, dirty: false, past: [], future: [], saveStatus: 'idle' });
    },

    createResume: async (input, options = {}) => {
      await get().flushSave();
      const record = await repo.createResume(input);
      set({ resumes: upsertRecord(get().resumes, record) });
      if (options.open === false) {
        // Keep the resume that is open as the "last edited" one.
        const openId = get().current?.id;
        if (openId) await repo.setLastEditedResume(openId);
      } else {
        loadIntoWorkspace(record);
      }
      void repo.requestPersistentStorage();
      return record;
    },

    duplicateResume: async (id, title) => {
      await get().flushSave();
      const copy = await repo.duplicateResume(id, title);
      set({ resumes: upsertRecord(get().resumes, copy) });
      return copy;
    },

    renameResume: async (id, title) => {
      if (get().current?.id === id) {
        get().setTitle(title);
        await get().flushSave();
        return;
      }
      const renamed = await repo.renameResume(id, title);
      set({ resumes: upsertRecord(get().resumes, renamed) });
    },

    deleteResume: async (id) => {
      if (get().current?.id === id) {
        clearSaveTimer();
        set({ current: null, dirty: false, past: [], future: [], saveStatus: 'idle' });
        clearJournal();
      }
      await repo.deleteResume(id);
      set({ resumes: get().resumes.filter((record) => record.id !== id) });
    },

    importResumes: async (records) => {
      const created = await importBackupRecords(records);
      set({ resumes: await repo.getAllResumes() });
      return created;
    },

    deleteAllData: async () => {
      clearSaveTimer();
      clearJournal();
      await repo.deleteAllData();
      set({ current: null, resumes: [], dirty: false, past: [], future: [], saveStatus: 'idle' });
    },

    flushSave: async () => {
      if (savingPromise) await savingPromise;
      if (get().dirty && get().saveStatus !== 'conflict') await runSave();
    },

    retrySave: async () => {
      if (!get().current) return;
      set({ dirty: true, saveStatus: 'saving', saveError: null });
      await runSave();
    },

    resolveConflict: async (choice) => {
      const { current, conflict } = get();
      if (!current || !conflict) return;
      if (choice === 'load-theirs') {
        // Keep this tab's edits as a version so nothing is lost.
        await repo.saveVersion({ ...current }, 'Edits from another tab (not kept)');
        loadIntoWorkspace(conflict);
        set({ resumes: upsertRecord(get().resumes, conflict) });
        return;
      }
      await repo.saveVersion(conflict, 'Version replaced from another tab');
      set({
        current: { ...current, updatedAt: conflict.updatedAt },
        conflict: null,
        saveStatus: 'saving',
        saveError: null,
        dirty: true,
      });
      await runSave();
    },

    saveCurrentAsNew: async () => {
      const current = get().current;
      if (!current) return null;
      const record = await repo.createResume({
        title: `${current.title} (recovered)`,
        careerStage: current.careerStage,
        data: current.data,
        templateId: current.templateId,
        accentColor: current.accentColor,
        sectionOrder: current.sectionOrder,
      });
      set({ resumes: upsertRecord(get().resumes, record) });
      loadIntoWorkspace(record);
      return record;
    },

    checkpoint: async (label) => {
      await get().flushSave();
      const current = get().current;
      if (current) await repo.saveVersion(current, label);
    },

    restoreVersion: async (version) => {
      const current = get().current;
      if (!current || version.resumeId !== current.id) return;
      await get().checkpoint('Before restoring an earlier version');
      const restored = version.record;
      mutate(
        (record) => ({
          ...record,
          title: restored.title,
          careerStage: restored.careerStage,
          templateId: restored.templateId,
          accentColor: restored.accentColor,
          sectionOrder: restored.sectionOrder,
          data: restored.data,
        }),
        { immediate: true }
      );
    },

    writeJournalIfDirty: () => {
      const { current, dirty } = get();
      if (current && dirty) writeJournal(current, lastEditAt ?? new Date().toISOString());
    },

    dismissNotice: () => set({ notice: null }),

    undo: () => {
      const { past, current } = get();
      if (!current || past.length === 0) return;
      const previous = past[past.length - 1];
      coalesceKey = null;
      lastEditAt = new Date().toISOString();
      set({
        current: { ...current, ...previous },
        past: past.slice(0, -1),
        future: [toSnapshot(current), ...get().future].slice(0, UNDO_LIMIT),
        dirty: true,
        saveStatus: 'saving',
      });
      scheduleSave(0);
    },

    redo: () => {
      const { future, current } = get();
      if (!current || future.length === 0) return;
      const [next, ...rest] = future;
      coalesceKey = null;
      lastEditAt = new Date().toISOString();
      set({
        current: { ...current, ...next },
        past: [...get().past, toSnapshot(current)].slice(-UNDO_LIMIT),
        future: rest,
        dirty: true,
        saveStatus: 'saving',
      });
      scheduleSave(0);
    },

    // ---------- Resume-level edits ----------

    setTitle: (title) =>
      mutate((record) => (record.title === title ? record : { ...record, title: cleanTitle(title, record.title) }), {
        key: 'title',
      }),

    setCareerStage: (stage, applyRecommendedOrder = false) =>
      mutate(
        (record) => ({
          ...record,
          careerStage: stage,
          sectionOrder: applyRecommendedOrder
            ? normalizeSectionOrder(
                recommendedSectionOrder(stage).map((section) => ({
                  ...section,
                  visible: record.sectionOrder.find((item) => item.id === section.id)?.visible ?? true,
                })).concat(record.sectionOrder.filter((item) => item.id.startsWith('custom:'))),
                record.data.customSections,
                stage
              )
            : record.sectionOrder,
        }),
        { immediate: true }
      ),

    setTemplate: (templateId) =>
      mutate((record) => (record.templateId === templateId ? record : { ...record, templateId }), { immediate: true }),

    setAccentColor: (accentColor) =>
      mutate((record) => (record.accentColor === accentColor ? record : { ...record, accentColor }), {
        immediate: true,
      }),

    replaceData: (data) => mutateData(() => data, { immediate: true }),

    updatePersonalInfo: (field, value) =>
      mutateData(
        (data) =>
          data.personalInfo[field] === value ? data : { ...data, personalInfo: { ...data.personalInfo, [field]: value } },
        { key: `personal.${String(field)}` }
      ),

    // ---------- List sections (by item ID, never by position) ----------

    addItem: (list, item) =>
      mutateData(
        (data) => ({ ...data, [list]: [...((data[list] ?? []) as ListItem<typeof list>[]), item] }),
        { immediate: true }
      ),

    updateItem: (list, id, patch) =>
      mutateData(
        (data) => ({
          ...data,
          [list]: ((data[list] ?? []) as Array<ListItem<typeof list>>).map((item) =>
            item.id === id ? { ...item, ...patch } : item
          ),
        }),
        { key: `${list}.${id}.${Object.keys(patch).join(',')}` }
      ),

    removeItem: (list, id) =>
      mutateData(
        (data) => ({
          ...data,
          [list]: ((data[list] ?? []) as Array<ListItem<typeof list>>).filter((item) => item.id !== id),
        }),
        { immediate: true }
      ),

    moveItem: (list, id, direction) =>
      mutateData(
        (data) => {
          const items = (data[list] ?? []) as Array<ListItem<typeof list>>;
          const moved = moveInArray(items, items.findIndex((item) => item.id === id), direction);
          return moved === items ? data : { ...data, [list]: moved };
        },
        { immediate: true }
      ),

    // ---------- Custom sections ----------

    addCustomSection: (title) => {
      if (!get().current) return null;
      const id = createId();
      mutate(
        (record) => {
          const customSections = [
            ...(record.data.customSections ?? []),
            { id, title: title.trim() || 'Custom Section', items: [] },
          ];
          return {
            ...record,
            data: { ...record.data, customSections },
            sectionOrder: normalizeSectionOrder(
              [...record.sectionOrder, { id: customSectionKey(id), label: title, visible: true }],
              customSections,
              record.careerStage
            ),
          };
        },
        { immediate: true }
      );
      return id;
    },

    renameCustomSection: (sectionId, title) =>
      mutate(
        (record) => {
          const customSections = (record.data.customSections ?? []).map((section) =>
            section.id === sectionId ? { ...section, title } : section
          );
          return {
            ...record,
            data: { ...record.data, customSections },
            sectionOrder: record.sectionOrder.map((item) =>
              item.id === customSectionKey(sectionId) ? { ...item, label: sectionLabel(item.id, customSections) } : item
            ),
          };
        },
        { key: `custom.${sectionId}.title` }
      ),

    removeCustomSection: (sectionId) =>
      mutate(
        (record) => ({
          ...record,
          data: {
            ...record.data,
            customSections: (record.data.customSections ?? []).filter((section) => section.id !== sectionId),
          },
          sectionOrder: record.sectionOrder.filter((item) => item.id !== customSectionKey(sectionId)),
        }),
        { immediate: true }
      ),

    addCustomItem: (sectionId) =>
      mutateData(
        (data) => ({
          ...data,
          customSections: (data.customSections ?? []).map((section) =>
            section.id === sectionId
              ? { ...section, items: [...section.items, { id: createId(), title: '', subtitle: '', date: '', description: '' }] }
              : section
          ),
        }),
        { immediate: true }
      ),

    updateCustomItem: (sectionId, itemId, patch) =>
      mutateData(
        (data) => ({
          ...data,
          customSections: (data.customSections ?? []).map((section) =>
            section.id === sectionId
              ? { ...section, items: section.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)) }
              : section
          ),
        }),
        { key: `custom.${sectionId}.${itemId}.${Object.keys(patch).join(',')}` }
      ),

    removeCustomItem: (sectionId, itemId) =>
      mutateData(
        (data) => ({
          ...data,
          customSections: (data.customSections ?? []).map((section) =>
            section.id === sectionId ? { ...section, items: section.items.filter((item) => item.id !== itemId) } : section
          ),
        }),
        { immediate: true }
      ),

    moveCustomItem: (sectionId, itemId, direction) =>
      mutateData(
        (data) => ({
          ...data,
          customSections: (data.customSections ?? []).map((section) =>
            section.id === sectionId
              ? {
                  ...section,
                  items: moveInArray(section.items, section.items.findIndex((item) => item.id === itemId), direction),
                }
              : section
          ),
        }),
        { immediate: true }
      ),

    // ---------- Section order and visibility ----------

    moveSection: (id, direction) =>
      mutate(
        (record) => {
          const moved = moveInArray(record.sectionOrder, record.sectionOrder.findIndex((item) => item.id === id), direction);
          return moved === record.sectionOrder ? record : { ...record, sectionOrder: moved };
        },
        { immediate: true }
      ),

    toggleSectionVisibility: (id) =>
      mutate(
        (record) => ({
          ...record,
          sectionOrder: record.sectionOrder.map((item) => (item.id === id ? { ...item, visible: !item.visible } : item)),
        }),
        { immediate: true }
      ),

    resetSectionOrder: () =>
      mutate(
        (record) => ({
          ...record,
          sectionOrder: normalizeSectionOrder(
            [...recommendedSectionOrder(record.careerStage), ...record.sectionOrder.filter((item) => item.id.startsWith('custom:'))],
            record.data.customSections,
            record.careerStage
          ),
        }),
        { immediate: true }
      ),
  };
});
