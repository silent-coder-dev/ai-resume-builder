import { describe, expect, it } from 'vitest';
import { buildBackupJson, importResumes, parseBackupJson } from '@/lib/storage/backup';
import { JOURNAL_KEY, migrateLegacyDraft, recoverJournal, writeJournal } from '@/lib/storage/recovery';
import { createResume, getAllResumes, getResume, listVersions, updateResume } from '@/lib/storage/resumeRepository';
import { memoryStorage } from './setup';

describe('JSON backup', () => {
  it('round-trips resumes and imports them as new resumes with new IDs', async () => {
    const original = await createResume({ title: 'Backend Resume', careerStage: 'experienced', templateId: 'classic' });
    const parsed = parseBackupJson(buildBackupJson([original]));
    expect(parsed).toHaveLength(1);

    const [imported] = await importResumes(parsed);
    expect(imported.id).not.toBe(original.id);
    expect(imported.title).toBe('Backend Resume');
    expect(imported.templateId).toBe('classic');
    expect(await getAllResumes()).toHaveLength(2);
    // The original is untouched.
    expect(await getResume(original.id)).toEqual(original);
  });

  it('reads the older single-draft format', () => {
    const legacy = JSON.stringify({
      state: { resumeData: { personalInfo: { fullName: 'Ravi', targetRole: 'Data Analyst' } }, activeTemplate: 'minimal' },
    });
    const [record] = parseBackupJson(legacy);
    expect(record.title).toBe('Data Analyst Resume');
    expect(record.templateId).toBe('minimal');
  });

  it('rejects files that are not backups', () => {
    expect(() => parseBackupJson('not json')).toThrow(/not valid JSON/);
    expect(() => parseBackupJson('{"hello":1}')).toThrow(/not an AI Resume Studio backup/);
  });
});

describe('moving the earlier localStorage draft', () => {
  it('turns the old draft into a saved resume once', async () => {
    memoryStorage.setItem(
      'ai-resume-builder-store',
      JSON.stringify({
        state: {
          resumeData: {
            personalInfo: { fullName: 'Meera', targetRole: 'Physics Teacher', email: '', phone: '', location: '', summary: '' },
            skills: [{ id: '1', name: 'Physics' }],
            links: [{ id: 'l1', platform: 'LinkedIn', url: 'https://linkedin.com/in/meera' }],
          },
          activeTemplate: 'academic',
          accentColor: '#059669',
        },
      })
    );

    const migrated = await migrateLegacyDraft();
    expect(migrated?.title).toBe('Physics Teacher Resume');
    expect(migrated?.templateId).toBe('academic');
    // LinkedIn moved from the generic link list into its own field.
    expect(migrated?.data.personalInfo.linkedinUrl).toBe('https://linkedin.com/in/meera');
    expect(migrated?.data.links).toEqual([]);

    expect(await migrateLegacyDraft()).toBeNull();
    expect(await getAllResumes()).toHaveLength(1);
  });

  it('does nothing when there is no earlier draft', async () => {
    expect(await migrateLegacyDraft()).toBeNull();
    expect(await getAllResumes()).toHaveLength(0);
  });
});

describe('unsaved-changes journal', () => {
  it('recovers an edit that was not saved before the tab closed', async () => {
    const record = await createResume({ title: 'Draft' });
    const unsaved = { ...record, data: { ...record.data, personalInfo: { ...record.data.personalInfo, fullName: 'Typed before closing' } } };
    writeJournal(unsaved, new Date(Date.parse(record.updatedAt) + 5000).toISOString());

    const recovered = await recoverJournal();
    expect(recovered?.data.personalInfo.fullName).toBe('Typed before closing');
    expect((await getResume(record.id))?.data.personalInfo.fullName).toBe('Typed before closing');
    // The version before recovery is kept.
    expect((await listVersions(record.id))[0].label).toMatch(/Before recovering/);
    expect(memoryStorage.getItem(JOURNAL_KEY)).toBeNull();
  });

  it('ignores a journal that is older than the saved copy', async () => {
    const record = await createResume({ title: 'Draft' });
    writeJournal({ ...record, title: 'Old' }, new Date(Date.parse(record.updatedAt) - 5000).toISOString());
    const saved = await updateResume({ ...record, title: 'Newer save' });

    expect(await recoverJournal()).toBeNull();
    expect((await getResume(record.id))?.title).toBe(saved.title);
  });

  it('does not bring back a resume that was deleted on purpose', async () => {
    const record = await createResume({ title: 'Deleted' });
    writeJournal(record, new Date(Date.now() + 5000).toISOString());
    const { deleteResume } = await import('@/lib/storage/resumeRepository');
    await deleteResume(record.id);

    expect(await recoverJournal()).toBeNull();
    expect(await getAllResumes()).toHaveLength(0);
  });
});
