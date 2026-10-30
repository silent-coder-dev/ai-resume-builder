'use client';

import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { listVersions, type ResumeVersion } from '@/lib/storage/resumeRepository';
import { renderResumeTemplate } from '@/components/preview/templateCatalog';
import { ScaledResume } from '@/components/preview/ScaledResume';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState, Skeleton } from '@/components/ui/Primitives';
import { toast } from '@/components/ui/Toast';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

// PRD §9.6 — recent-version recovery. Restoring keeps the current version too.
export function VersionHistoryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const current = useWorkspaceStore((state) => state.current);
  const restoreVersion = useWorkspaceStore((state) => state.restoreVersion);
  const [versions, setVersions] = useState<ResumeVersion[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const resumeId = current?.id;

  useEffect(() => {
    if (!open || !resumeId) return;
    let cancelled = false;
    void listVersions(resumeId).then((list) => {
      if (cancelled) return;
      setVersions(list);
      setSelectedId(list[0]?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [open, resumeId]);

  const selected = versions?.find((version) => version.id === selectedId) ?? null;

  const close = () => {
    setVersions(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Version history"
      description="Saved automatically before big changes and every few minutes while you edit. Restoring keeps your current version in this list."
      size="xl"
      dismissible={!restoring}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={restoring}>
            Close
          </Button>
          <Button
            variant="primary"
            disabled={!selected}
            loading={restoring}
            onClick={async () => {
              if (!selected) return;
              setRestoring(true);
              await restoreVersion(selected);
              setRestoring(false);
              toast('Earlier version restored. Your previous version is saved in Version history.');
              close();
            }}
          >
            Restore this version
          </Button>
        </>
      }
    >
      {versions === null ? (
        <div className="grid gap-4 md:grid-cols-[16rem_1fr]">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : versions.length === 0 ? (
        <EmptyState
          icon={History}
          title="No earlier versions yet"
          description="Versions appear here as you edit, and before changes like AI polishing or restoring."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-[16rem_1fr]">
          <ul className="max-h-[55vh] space-y-1 overflow-y-auto" aria-label="Saved versions">
            {versions.map((version) => (
              <li key={version.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(version.id)}
                  aria-pressed={version.id === selectedId}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                    version.id === selectedId ? 'border-primary bg-primary-light' : 'border-line hover:border-line-strong'
                  }`}
                >
                  <span className="block text-small font-semibold text-ink">{formatDateTime(version.savedAt)}</span>
                  <span className="block text-label text-ink-2">{version.label}</span>
                </button>
              </li>
            ))}
          </ul>
          {selected && (
            <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-line bg-surface-2 p-3">
              <ScaledResume initialScale={0.6} className="rounded-md shadow-sm">
                {renderResumeTemplate(
                  selected.record.templateId,
                  selected.record.data,
                  selected.record.accentColor,
                  selected.record.sectionOrder
                )}
              </ScaledResume>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}
