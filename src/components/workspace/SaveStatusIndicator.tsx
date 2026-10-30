'use client';

import { useSyncExternalStore } from 'react';
import { AlertCircle, CheckCircle2, CloudOff, LoaderCircle, RefreshCw } from 'lucide-react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { formatTime } from '@/components/ui/Primitives';

const subscribeToConnection = (onChange: () => void) => {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
};

// PRD §9.2 — visible save status. Never says "saved" when saving failed.
export function SaveStatusIndicator() {
  const status = useWorkspaceStore((state) => state.saveStatus);
  const lastSavedAt = useWorkspaceStore((state) => state.lastSavedAt);
  const storageKind = useWorkspaceStore((state) => state.storageKind);
  const online = useSyncExternalStore(subscribeToConnection, () => navigator.onLine, () => true);

  let icon = <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />;
  let text = 'All changes saved';
  let tone = 'text-ink-2';

  if (status === 'recovering') {
    icon = <RefreshCw className="h-4 w-4 animate-spin text-info" aria-hidden="true" />;
    text = 'Recovering previous changes…';
  } else if (status === 'saving') {
    icon = <LoaderCircle className="h-4 w-4 animate-spin text-ink-2" aria-hidden="true" />;
    text = 'Saving…';
  } else if (status === 'error') {
    icon = <AlertCircle className="h-4 w-4 text-error" aria-hidden="true" />;
    text = 'Save failed';
    tone = 'text-error font-medium';
  } else if (status === 'conflict') {
    icon = <AlertCircle className="h-4 w-4 text-warning" aria-hidden="true" />;
    text = 'Changed in another tab';
    tone = 'text-amber-800 font-medium';
  } else if (storageKind === 'memory') {
    icon = <AlertCircle className="h-4 w-4 text-warning" aria-hidden="true" />;
    text = 'Not saved — storage blocked';
    tone = 'text-amber-800 font-medium';
  } else if (!online) {
    icon = <CloudOff className="h-4 w-4 text-ink-2" aria-hidden="true" />;
    text = 'Offline · saved on this device';
  }

  return (
    <p
      role="status"
      aria-live="polite"
      className={`flex items-center gap-1.5 whitespace-nowrap text-small ${tone}`}
      title={lastSavedAt ? `Last saved at ${formatTime(lastSavedAt)}` : undefined}
    >
      {icon}
      <span>{text}</span>
    </p>
  );
}
