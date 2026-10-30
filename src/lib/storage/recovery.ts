// Two safety nets around the main IndexedDB storage:
//
// 1. Legacy migration: earlier versions kept a single draft in localStorage.
//    The first time this version runs, that draft becomes a saved resume.
// 2. Unsaved-changes journal: autosave waits a moment after typing. If the tab
//    closes inside that window, the latest edit is written synchronously to
//    localStorage and recovered on the next visit.

import { coerceResumeRecord, suggestResumeTitle, type ResumeRecord } from '@/lib/resume/record';
import {
  createResume,
  getMeta,
  getResume,
  saveVersion,
  setMeta,
  updateResume,
} from '@/lib/storage/resumeRepository';
import { coerceResumeData } from '@/utils/normalizeResumeData';
import { hasResumeContent } from '@/utils/resumeContent';

export const LEGACY_STORAGE_KEYS = ['ai-resume-builder-store', 'ai_resume_studio_store'];
const LEGACY_MIGRATION_META = 'legacyLocalStorageMigrated';
export const JOURNAL_KEY = 'ai-resume-studio:unsaved-changes';

function safeLocalStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export async function migrateLegacyDraft(): Promise<ResumeRecord | null> {
  if (await getMeta<boolean>(LEGACY_MIGRATION_META)) return null;
  const storage = safeLocalStorage();
  let migrated: ResumeRecord | null = null;

  for (const key of LEGACY_STORAGE_KEYS) {
    const raw = storage?.getItem(key);
    if (!raw || migrated) continue;
    try {
      const parsed = JSON.parse(raw) as { state?: Record<string, unknown> };
      const state = parsed.state ?? {};
      const data = coerceResumeData(state.resumeData);
      if (!hasResumeContent(data)) continue;
      migrated = await createResume({
        title: suggestResumeTitle(data),
        data,
        templateId: typeof state.activeTemplate === 'string' ? state.activeTemplate : undefined,
        accentColor: typeof state.accentColor === 'string' ? state.accentColor : undefined,
        sectionOrder: Array.isArray(state.sectionOrder) ? state.sectionOrder : undefined,
      });
    } catch (error) {
      console.error('Could not move the earlier saved draft into the new storage:', error);
    }
  }

  // The old key is left in place as an extra copy; this flag stops a second import.
  await setMeta(LEGACY_MIGRATION_META, true);
  return migrated;
}

export function clearLegacyDrafts() {
  const storage = safeLocalStorage();
  for (const key of LEGACY_STORAGE_KEYS) {
    try {
      storage?.removeItem(key);
    } catch {
      // Ignore.
    }
  }
}

interface JournalEntry {
  editedAt: string;
  record: ResumeRecord;
}

// Synchronous on purpose: it runs while the page is closing.
export function writeJournal(record: ResumeRecord, editedAt: string) {
  try {
    safeLocalStorage()?.setItem(JOURNAL_KEY, JSON.stringify({ editedAt, record } satisfies JournalEntry));
  } catch {
    // Storage full or blocked: nothing more can be done while closing.
  }
}

export function clearJournal() {
  try {
    safeLocalStorage()?.removeItem(JOURNAL_KEY);
  } catch {
    // Ignore.
  }
}

// Restores edits that were made after the last successful save.
// Returns the recovered record, or null when there was nothing to recover.
export async function recoverJournal(): Promise<ResumeRecord | null> {
  const raw = safeLocalStorage()?.getItem(JOURNAL_KEY);
  if (!raw) return null;
  try {
    const entry = JSON.parse(raw) as Partial<JournalEntry>;
    if (typeof entry.editedAt !== 'string' || !entry.record) return null;
    const pending = coerceResumeRecord(entry.record);
    const stored = await getResume(pending.id);

    if (!stored) {
      // The resume was deleted on purpose; do not bring it back.
      return null;
    }
    if (stored.updatedAt >= entry.editedAt) return null; // already saved

    await saveVersion(stored, 'Before recovering unsaved changes');
    return await updateResume({ ...pending, updatedAt: stored.updatedAt });
  } catch (error) {
    console.error('Could not recover unsaved changes:', error);
    return null;
  } finally {
    clearJournal();
  }
}
