'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { Alert } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';

// App-wide messages about storage: recovered drafts, failed saves,
// edits from another tab, and browsers that block storage.
export function WorkspaceBanners() {
  const router = useRouter();
  const phase = useWorkspaceStore((state) => state.phase);
  const loadError = useWorkspaceStore((state) => state.loadError);
  const storageKind = useWorkspaceStore((state) => state.storageKind);
  const notice = useWorkspaceStore((state) => state.notice);
  const saveStatus = useWorkspaceStore((state) => state.saveStatus);
  const saveError = useWorkspaceStore((state) => state.saveError);
  const missing = useWorkspaceStore((state) => state.missing);
  const dismissNotice = useWorkspaceStore((state) => state.dismissNotice);
  const retrySave = useWorkspaceStore((state) => state.retrySave);
  const resolveConflict = useWorkspaceStore((state) => state.resolveConflict);
  const saveCurrentAsNew = useWorkspaceStore((state) => state.saveCurrentAsNew);

  const banners: React.ReactNode[] = [];

  if (phase === 'error') {
    banners.push(
      <Alert key="load" tone="error" title="Saved resumes could not be loaded.">
        {loadError} Try reloading the page. If it keeps happening, your browser may be blocking site storage.
      </Alert>
    );
  }

  if (storageKind === 'memory') {
    banners.push(
      <Alert
        key="memory"
        tone="warning"
        title="This browser is not allowing saved data."
        actions={
          <Link href="/privacy" className="font-semibold underline underline-offset-2">
            What this means
          </Link>
        }
      >
        Your resume stays only until this tab closes (for example, in some private windows). Download a PDF or export a
        backup before you leave.
      </Alert>
    );
  }

  if (saveStatus === 'conflict') {
    banners.push(
      <Alert
        key="conflict"
        tone="warning"
        title="This resume was changed in another tab or window."
        actions={
          <>
            <Button size="sm" variant="secondary" onClick={() => void resolveConflict('load-theirs')}>
              Load the other version
            </Button>
            <Button size="sm" variant="primary" onClick={() => void resolveConflict('keep-mine')}>
              Keep my version
            </Button>
          </>
        }
      >
        Choose which version to keep. The one you do not keep is saved in Version history, so nothing is lost.
      </Alert>
    );
  } else if (saveStatus === 'error') {
    banners.push(
      <Alert
        key="save"
        tone="error"
        title="Your latest changes are not saved yet."
        actions={
          missing ? (
            <Button
              size="sm"
              variant="primary"
              onClick={async () => {
                const record = await saveCurrentAsNew();
                if (record) router.replace(`/builder?id=${record.id}`);
              }}
            >
              Save as a new resume
            </Button>
          ) : (
            <Button size="sm" variant="primary" onClick={() => void retrySave()}>
              Try again
            </Button>
          )
        }
      >
        {saveError}
      </Alert>
    );
  }

  if (notice) {
    banners.push(
      <Alert
        key="notice"
        tone="success"
        actions={
          <Button size="sm" variant="ghost" onClick={dismissNotice}>
            Dismiss
          </Button>
        }
      >
        {notice}
      </Alert>
    );
  }

  if (banners.length === 0) return null;
  return <div className="no-print space-y-2 px-4 pt-4 sm:px-6">{banners}</div>;
}
