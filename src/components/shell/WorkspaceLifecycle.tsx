'use client';

import { useEffect } from 'react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';

const CHANNEL_NAME = 'ai-resume-studio';

// Keeps resume data safe while the app is open (PRD §9):
// - loads saved resumes once,
// - saves right away when the tab is hidden or closed,
// - keeps a crash copy of unsaved edits,
// - warns before leaving only when changes really could be lost,
// - keeps other open tabs up to date.
export function WorkspaceLifecycle() {
  useEffect(() => {
    void useWorkspaceStore.getState().init();
  }, []);

  useEffect(() => {
    const saveNow = () => {
      const state = useWorkspaceStore.getState();
      state.writeJournalIfDirty();
      void state.flushSave();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') saveNow();
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      const state = useWorkspaceStore.getState();
      state.writeJournalIfDirty();
      const failing = state.dirty && (state.saveStatus === 'error' || state.saveStatus === 'conflict');
      const notPersistent = state.storageKind === 'memory' && state.current !== null;
      if (failing || notPersistent) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('pagehide', saveNow);
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', saveNow);
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  // Tell other tabs when this tab saves, and listen for theirs.
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    let lastAnnounced: string | null = null;

    const unsubscribe = useWorkspaceStore.subscribe((state) => {
      if (state.saveStatus === 'saved' && state.lastSavedAt && state.lastSavedAt !== lastAnnounced) {
        lastAnnounced = state.lastSavedAt;
        channel.postMessage({ type: 'saved', id: state.current?.id ?? null, updatedAt: state.lastSavedAt });
      }
    });

    channel.onmessage = (event: MessageEvent<{ type: string; id: string | null; updatedAt: string }>) => {
      if (event.data?.type !== 'saved') return;
      const state = useWorkspaceStore.getState();
      void state.refreshResumes();
      // Same resume open here with no local edits: load the newer copy quietly.
      if (state.current && state.current.id === event.data.id && !state.dirty && state.current.updatedAt < event.data.updatedAt) {
        void state.reloadCurrent();
      }
    };

    return () => {
      unsubscribe();
      channel.close();
    };
  }, []);

  return null;
}
