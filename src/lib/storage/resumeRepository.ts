// The resume storage service (PRD §20). UI code talks to these functions only,
// never to IndexedDB directly, so storage can later move to the cloud.

import { IndexedDbBackend, MemoryBackend, type StorageBackend } from '@/lib/storage/backend';
import {
  buildResumeRecord,
  cleanTitle,
  coerceResumeRecord,
  type NewResumeInput,
  type ResumeRecord,
} from '@/lib/resume/record';
import { createId } from '@/utils/resumeContent';

const LAST_EDITED_KEY = 'lastEditedResumeId';
const MAX_VERSIONS_PER_RESUME = 20;

export interface ResumeVersion {
  id: string;
  resumeId: string;
  savedAt: string;
  label: string;
  record: ResumeRecord;
}

interface MetaEntry {
  key: string;
  value: unknown;
}

// Thrown when the saved copy changed since this tab loaded it (another tab or
// window saved it). The caller decides; nothing is overwritten silently.
export class ResumeConflictError extends Error {
  constructor(public readonly latest: ResumeRecord) {
    super('This resume was changed in another tab or window.');
    this.name = 'ResumeConflictError';
  }
}

export class ResumeNotFoundError extends Error {
  constructor(id: string) {
    super(`Resume ${id} no longer exists on this device.`);
    this.name = 'ResumeNotFoundError';
  }
}

let backendPromise: Promise<StorageBackend> | null = null;

export function getStorageBackend(): Promise<StorageBackend> {
  if (!backendPromise) {
    backendPromise = (async () => {
      try {
        if (typeof indexedDB === 'undefined') throw new Error('IndexedDB is not available.');
        return await IndexedDbBackend.open();
      } catch (error) {
        console.warn('Browser storage unavailable; changes will only last for this visit.', error);
        return new MemoryBackend();
      }
    })();
  }
  return backendPromise;
}

// Tests swap in a fresh backend.
export function setStorageBackend(backend: StorageBackend | null) {
  backendPromise = backend ? Promise.resolve(backend) : null;
}

// ISO time that is always later than `previous`, even within the same millisecond.
function nextTimestamp(previous?: string): string {
  const now = Date.now();
  const last = previous ? Date.parse(previous) : 0;
  return new Date(Math.max(now, last + 1)).toISOString();
}

const byNewest = (a: { updatedAt: string }, b: { updatedAt: string }) => b.updatedAt.localeCompare(a.updatedAt);

export async function createResume(input: NewResumeInput): Promise<ResumeRecord> {
  const backend = await getStorageBackend();
  const record = buildResumeRecord(input);
  await backend.put('resumes', record);
  await setLastEditedResume(record.id);
  return record;
}

export async function getResume(id: string): Promise<ResumeRecord | null> {
  const backend = await getStorageBackend();
  const stored = await backend.get<unknown>('resumes', id);
  if (!stored) return null;
  try {
    return coerceResumeRecord(stored);
  } catch {
    return null;
  }
}

export async function getAllResumes(): Promise<ResumeRecord[]> {
  const backend = await getStorageBackend();
  const stored = await backend.getAll<unknown>('resumes');
  return stored
    .flatMap((value) => {
      try {
        return [coerceResumeRecord(value)];
      } catch {
        return [];
      }
    })
    .sort(byNewest);
}

// Saves a resume. Pass `expectedUpdatedAt` (the version this tab last saw) to
// refuse the write when someone else saved a newer copy in the meantime.
export async function updateResume(
  record: ResumeRecord,
  options: { expectedUpdatedAt?: string } = {}
): Promise<ResumeRecord> {
  const backend = await getStorageBackend();
  const next: ResumeRecord = { ...record, title: cleanTitle(record.title), updatedAt: nextTimestamp(record.updatedAt) };
  await backend.compareAndPut<ResumeRecord>('resumes', record.id, next, (existing) => {
    if (!existing) throw new ResumeNotFoundError(record.id);
    if (options.expectedUpdatedAt && existing.updatedAt !== options.expectedUpdatedAt) {
      throw new ResumeConflictError(coerceResumeRecord(existing));
    }
  });
  return next;
}

export async function renameResume(id: string, title: string): Promise<ResumeRecord> {
  const record = await getResume(id);
  if (!record) throw new ResumeNotFoundError(id);
  return updateResume({ ...record, title });
}

export async function deleteResume(id: string): Promise<void> {
  const backend = await getStorageBackend();
  await backend.delete('resumes', id);
  const versions = await backend.getAllByIndex<ResumeVersion>('versions', 'byResume', id);
  await Promise.all(versions.map((version) => backend.delete('versions', version.id)));
  const lastEdited = await backend.get<MetaEntry>('meta', LAST_EDITED_KEY);
  if (lastEdited?.value === id) await backend.delete('meta', LAST_EDITED_KEY);
}

// Creates an independent copy with a new ID. The original is not touched.
export async function duplicateResume(id: string, title?: string): Promise<ResumeRecord> {
  const original = await getResume(id);
  if (!original) throw new ResumeNotFoundError(id);
  return createResume({
    title: title ?? `${original.title} (copy)`,
    careerStage: original.careerStage,
    data: structuredClone(original.data),
    templateId: original.templateId,
    accentColor: original.accentColor,
    sectionOrder: structuredClone(original.sectionOrder),
    sourceResumeId: original.id,
  });
}

export async function setLastEditedResume(id: string): Promise<void> {
  const backend = await getStorageBackend();
  await backend.put<MetaEntry>('meta', { key: LAST_EDITED_KEY, value: id });
}

// The resume the user worked on last. Falls back to the most recently saved one.
export async function getLastEditedResume(): Promise<ResumeRecord | null> {
  const backend = await getStorageBackend();
  const entry = await backend.get<MetaEntry>('meta', LAST_EDITED_KEY);
  if (typeof entry?.value === 'string') {
    const record = await getResume(entry.value);
    if (record) return record;
  }
  const [newest] = await getAllResumes();
  return newest ?? null;
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const backend = await getStorageBackend();
  return (await backend.get<MetaEntry>('meta', key))?.value as T | undefined;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  const backend = await getStorageBackend();
  await backend.put<MetaEntry>('meta', { key, value });
}

// ---------- Version history (recovery) ----------

export async function saveVersion(record: ResumeRecord, label: string): Promise<ResumeVersion> {
  const backend = await getStorageBackend();
  const version: ResumeVersion = {
    id: createId(),
    resumeId: record.id,
    savedAt: new Date().toISOString(),
    label,
    record: structuredClone(record),
  };
  await backend.put('versions', version);
  const versions = await listVersions(record.id);
  await Promise.all(versions.slice(MAX_VERSIONS_PER_RESUME).map((old) => backend.delete('versions', old.id)));
  return version;
}

export async function listVersions(resumeId: string): Promise<ResumeVersion[]> {
  const backend = await getStorageBackend();
  const versions = await backend.getAllByIndex<ResumeVersion>('versions', 'byResume', resumeId);
  return versions.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

// ---------- Whole-device data ----------

export async function deleteAllData(): Promise<void> {
  const backend = await getStorageBackend();
  await Promise.all([backend.clear('resumes'), backend.clear('versions'), backend.clear('meta')]);
}

export interface StorageInfo {
  kind: 'indexeddb' | 'memory';
  persisted: boolean | null;
  usageBytes: number | null;
  quotaBytes: number | null;
}

export async function getStorageInfo(): Promise<StorageInfo> {
  const backend = await getStorageBackend();
  let persisted: boolean | null = null;
  let usageBytes: number | null = null;
  let quotaBytes: number | null = null;
  try {
    if (typeof navigator !== 'undefined' && navigator.storage) {
      persisted = (await navigator.storage.persisted?.()) ?? null;
      const estimate = await navigator.storage.estimate?.();
      usageBytes = estimate?.usage ?? null;
      quotaBytes = estimate?.quota ?? null;
    }
  } catch {
    // Not supported in this browser.
  }
  return { kind: backend.kind, persisted, usageBytes, quotaBytes };
}

// Asks the browser not to clear this site's data under storage pressure.
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
      return await navigator.storage.persist();
    }
  } catch {
    // Not supported.
  }
  return false;
}
