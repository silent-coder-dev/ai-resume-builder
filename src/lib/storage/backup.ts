// Resume JSON export / import (PRD §20). Imports always create new resumes
// with new IDs, so a backup can never overwrite something already saved.

import { coerceResumeRecord, suggestResumeTitle, type ResumeRecord } from '@/lib/resume/record';
import { createResume } from '@/lib/storage/resumeRepository';
import { coerceResumeData } from '@/utils/normalizeResumeData';
import { hasResumeContent } from '@/utils/resumeContent';

export const BACKUP_FORMAT = 'ai-resume-studio-backup';
export const BACKUP_VERSION = 1;
const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  resumes: ResumeRecord[];
}

export function buildBackupJson(resumes: ResumeRecord[]): string {
  const backup: BackupFile = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    resumes,
  };
  return JSON.stringify(backup, null, 2);
}

export function backupFileName(resumes: ResumeRecord[]): string {
  const date = new Date().toISOString().slice(0, 10);
  if (resumes.length === 1) {
    const slug = resumes[0].title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'resume';
    return `${slug}-${date}.json`;
  }
  return `ai-resume-studio-backup-${date}.json`;
}

export function downloadTextFile(fileName: string, content: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportResumes(resumes: ResumeRecord[]) {
  downloadTextFile(backupFileName(resumes), buildBackupJson(resumes));
}

// Reads a backup file. Accepts our backup format, a single exported resume,
// or the older single-draft format saved by previous versions of the app.
export function parseBackupJson(text: string): ResumeRecord[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('This file is not valid JSON. Choose a backup exported from AI Resume Studio.');
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('This file does not contain a resume backup.');
  }
  const source = parsed as Record<string, unknown>;

  if (source.format === BACKUP_FORMAT && Array.isArray(source.resumes)) {
    const records = source.resumes.flatMap((entry) => {
      try {
        return [coerceResumeRecord(entry)];
      } catch {
        return [];
      }
    });
    if (records.length === 0) throw new Error('The backup file does not contain any readable resumes.');
    return records;
  }

  // A single resume record.
  if ('data' in source && 'title' in source) return [coerceResumeRecord(source)];

  // The older one-draft format: { state: { resumeData, activeTemplate, ... } }.
  const state = (source.state ?? source) as Record<string, unknown>;
  if (state && typeof state === 'object' && 'resumeData' in state) {
    const data = coerceResumeData(state.resumeData);
    if (!hasResumeContent(data)) throw new Error('The backup file is empty.');
    return [
      coerceResumeRecord({
        title: suggestResumeTitle(data),
        data,
        templateId: state.activeTemplate,
        accentColor: state.accentColor,
        sectionOrder: state.sectionOrder,
      }),
    ];
  }

  throw new Error('This file is not an AI Resume Studio backup.');
}

export async function readBackupFile(file: File): Promise<ResumeRecord[]> {
  if (file.size === 0) throw new Error('The selected file is empty.');
  if (file.size > MAX_BACKUP_BYTES) throw new Error('Backup files must be smaller than 5 MB.');
  return parseBackupJson(await file.text());
}

// Saves imported resumes as brand-new resumes. Returns the created records.
export async function importResumes(records: ResumeRecord[]): Promise<ResumeRecord[]> {
  const created: ResumeRecord[] = [];
  for (const record of records) {
    created.push(
      await createResume({
        title: record.title,
        careerStage: record.careerStage,
        data: record.data,
        templateId: record.templateId,
        accentColor: record.accentColor,
        sectionOrder: record.sectionOrder,
        tailoredFor: record.tailoredFor,
      })
    );
  }
  return created;
}
