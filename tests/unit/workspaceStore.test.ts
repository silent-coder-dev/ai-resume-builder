import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAllResumes, getResume } from '@/lib/storage/resumeRepository';

// A fresh store module (and fresh autosave timers) for every test.
async function loadStore() {
  vi.resetModules();
  const storage = await import('@/lib/storage/resumeRepository');
  const { IndexedDbBackend } = await import('@/lib/storage/backend');
  const { IDBFactory } = await import('fake-indexeddb');
  storage.setStorageBackend(await IndexedDbBackend.open(new IDBFactory()));
  const { useWorkspaceStore } = await import('@/store/useWorkspaceStore');
  await useWorkspaceStore.getState().init();
  return { store: useWorkspaceStore, storage };
}

describe('workspace store', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('autosaves edits and restores them after a "refresh"', async () => {
    const { store, storage } = await loadStore();
    const record = await store.getState().createResume({ title: 'Java Developer Resume' });

    store.getState().updatePersonalInfo('fullName', 'Satyam');
    store.getState().addItem('skills', { id: 's1', name: 'Spring Boot' });
    await store.getState().flushSave();

    expect(store.getState().saveStatus).toBe('saved');
    const saved = await storage.getResume(record.id);
    expect(saved?.data.personalInfo.fullName).toBe('Satyam');
    expect(saved?.data.skills.map((skill) => skill.name)).toEqual(['Spring Boot']);
    expect((await storage.getLastEditedResume())?.id).toBe(record.id);
  });

  it('never overwrites another resume when switching between them', async () => {
    const { store, storage } = await loadStore();
    const java = await store.getState().createResume({ title: 'Java' });
    store.getState().updatePersonalInfo('targetRole', 'Java Developer');
    const python = await store.getState().createResume({ title: 'Python' });
    store.getState().updatePersonalInfo('targetRole', 'Python Developer');
    await store.getState().flushSave();

    expect((await storage.getResume(java.id))?.data.personalInfo.targetRole).toBe('Java Developer');
    expect((await storage.getResume(python.id))?.data.personalInfo.targetRole).toBe('Python Developer');

    await store.getState().openResume(java.id);
    expect(store.getState().current?.data.personalInfo.targetRole).toBe('Java Developer');
  });

  it('groups typing into one undo step and supports redo', async () => {
    const { store } = await loadStore();
    await store.getState().createResume({ title: 'Undo test' });
    store.getState().updatePersonalInfo('fullName', 'A');
    store.getState().updatePersonalInfo('fullName', 'An');
    store.getState().updatePersonalInfo('fullName', 'Ann');
    store.getState().addItem('skills', { id: 's1', name: 'SQL' });

    store.getState().undo();
    expect(store.getState().current?.data.skills).toHaveLength(0);
    expect(store.getState().current?.data.personalInfo.fullName).toBe('Ann');
    store.getState().undo();
    expect(store.getState().current?.data.personalInfo.fullName).toBe('');
    store.getState().redo();
    expect(store.getState().current?.data.personalInfo.fullName).toBe('Ann');
  });

  it('shows a conflict instead of overwriting a newer copy from another tab', async () => {
    const { store, storage } = await loadStore();
    const record = await store.getState().createResume({ title: 'Shared' });
    await storage.updateResume({ ...record, title: 'Saved in another tab' });

    store.getState().updatePersonalInfo('fullName', 'Edit in this tab');
    await store.getState().flushSave();

    expect(store.getState().saveStatus).toBe('conflict');
    expect((await storage.getResume(record.id))?.title).toBe('Saved in another tab');

    await store.getState().resolveConflict('keep-mine');
    expect(store.getState().saveStatus).toBe('saved');
    expect((await storage.getResume(record.id))?.data.personalInfo.fullName).toBe('Edit in this tab');
    // The other tab's copy is still recoverable from history.
    expect((await storage.listVersions(record.id)).some((version) => version.label.includes('another tab'))).toBe(true);
  });

  it('duplicates and deletes without affecting other resumes', async () => {
    const { store, storage } = await loadStore();
    const original = await store.getState().createResume({ title: 'Original' });
    store.getState().updatePersonalInfo('fullName', 'Kept');
    await store.getState().flushSave();

    const copy = await store.getState().duplicateResume(original.id);
    await store.getState().deleteResume(copy.id);

    expect(await storage.getResume(copy.id)).toBeNull();
    expect((await storage.getResume(original.id))?.data.personalInfo.fullName).toBe('Kept');
    expect(store.getState().resumes.map((item) => item.id)).toEqual([original.id]);
  });

  it('adds custom sections to the section order and removes them cleanly', async () => {
    const { store } = await loadStore();
    await store.getState().createResume({ title: 'Custom' });
    const id = store.getState().addCustomSection('Volunteering');
    expect(store.getState().current?.sectionOrder.some((section) => section.id === `custom:${id}`)).toBe(true);
    store.getState().removeCustomSection(id!);
    expect(store.getState().current?.sectionOrder.some((section) => section.id === `custom:${id}`)).toBe(false);
  });
});

// Imported only for type side effects in this file.
void getAllResumes;
void getResume;
