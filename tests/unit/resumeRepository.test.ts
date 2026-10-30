import { describe, expect, it } from 'vitest';
import {
  ResumeConflictError,
  createResume,
  deleteResume,
  duplicateResume,
  getAllResumes,
  getLastEditedResume,
  getResume,
  listVersions,
  saveVersion,
  setLastEditedResume,
  updateResume,
} from '@/lib/storage/resumeRepository';
import { RESUME_SCHEMA_VERSION } from '@/lib/resume/record';

describe('resume storage service', () => {
  it('creates a resume with an ID, title, timestamps, template, career stage and schema version', async () => {
    const record = await createResume({ title: '  Java Developer   Resume ', careerStage: 'fresher' });
    expect(record.id).toBeTruthy();
    expect(record.title).toBe('Java Developer Resume');
    expect(record.careerStage).toBe('fresher');
    expect(record.templateId).toBe('modern');
    expect(record.schemaVersion).toBe(RESUME_SCHEMA_VERSION);
    expect(Date.parse(record.createdAt)).not.toBeNaN();
    expect(record.updatedAt).toBe(record.createdAt);
    // Freshers lead with education and projects.
    expect(record.sectionOrder.slice(0, 3).map((section) => section.id)).toEqual(['summary', 'education', 'projects']);
    expect(await getResume(record.id)).toEqual(record);
  });

  it('keeps multiple resumes independent', async () => {
    const java = await createResume({ title: 'Java Developer Resume' });
    const fullStack = await createResume({ title: 'Full Stack Developer Resume' });
    expect(java.id).not.toBe(fullStack.id);

    await updateResume({ ...fullStack, data: { ...fullStack.data, personalInfo: { ...fullStack.data.personalInfo, fullName: 'Asha' } } });

    expect((await getResume(java.id))?.data.personalInfo.fullName).toBe('');
    expect((await getResume(fullStack.id))?.data.personalInfo.fullName).toBe('Asha');
    expect(await getAllResumes()).toHaveLength(2);
  });

  it('returns resumes newest first and remembers the last edited one', async () => {
    const tick = () => new Promise((resolve) => setTimeout(resolve, 5));
    const first = await createResume({ title: 'First' });
    await tick();
    const second = await createResume({ title: 'Second' });
    await tick();
    await updateResume({ ...first, title: 'First (edited)' });

    expect((await getAllResumes()).map((record) => record.title)).toEqual(['First (edited)', 'Second']);
    expect((await getLastEditedResume())?.id).toBe(second.id);
    await setLastEditedResume(first.id);
    expect((await getLastEditedResume())?.id).toBe(first.id);
  });

  it('refuses to overwrite a newer copy saved elsewhere', async () => {
    const record = await createResume({ title: 'Shared' });
    const otherTab = await updateResume({ ...record, title: 'Saved in another tab' });

    await expect(
      updateResume({ ...record, title: 'Stale edit' }, { expectedUpdatedAt: record.updatedAt })
    ).rejects.toBeInstanceOf(ResumeConflictError);
    expect((await getResume(record.id))?.title).toBe(otherTab.title);
  });

  it('always moves updatedAt forward', async () => {
    const record = await createResume({ title: 'Clock' });
    const a = await updateResume(record);
    const b = await updateResume(a);
    expect(b.updatedAt > a.updatedAt).toBe(true);
    expect(a.updatedAt > record.updatedAt).toBe(true);
  });

  it('duplicates into a new independent resume without changing the original', async () => {
    const original = await createResume({ title: 'Original' });
    const edited = await updateResume({
      ...original,
      data: { ...original.data, skills: [{ id: 's1', name: 'Java' }] },
    });
    const copy = await duplicateResume(original.id);

    expect(copy.id).not.toBe(original.id);
    expect(copy.title).toBe('Original (copy)');
    expect(copy.sourceResumeId).toBe(original.id);
    expect(copy.data.skills).toEqual(edited.data.skills);

    await updateResume({ ...copy, data: { ...copy.data, skills: [] } });
    expect((await getResume(original.id))?.data.skills).toHaveLength(1);
  });

  it('deletes one resume and its history without touching others', async () => {
    const keep = await createResume({ title: 'Keep' });
    const remove = await createResume({ title: 'Remove' });
    await saveVersion(remove, 'Autosave');

    await deleteResume(remove.id);

    expect(await getResume(remove.id)).toBeNull();
    expect(await listVersions(remove.id)).toEqual([]);
    expect((await getAllResumes()).map((record) => record.id)).toEqual([keep.id]);
    expect((await getLastEditedResume())?.id).toBe(keep.id);
  });

  it('keeps at most 20 versions per resume, newest first', async () => {
    const record = await createResume({ title: 'Versions' });
    for (let index = 0; index < 23; index += 1) {
      await saveVersion({ ...record, title: `v${index}` }, `Version ${index}`);
    }
    const versions = await listVersions(record.id);
    expect(versions).toHaveLength(20);
    expect(versions[0].label).toBe('Version 22');
  });
});
