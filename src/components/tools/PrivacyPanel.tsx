'use client';

import { useEffect, useRef, useState } from 'react';
import { Database, FileJson, HardDrive, Trash2, Upload } from 'lucide-react';
import { exportResumes, readBackupFile } from '@/lib/storage/backup';
import { clearLegacyDrafts } from '@/lib/storage/recovery';
import { getStorageInfo, requestPersistentStorage, type StorageInfo } from '@/lib/storage/resumeRepository';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Alert, Card, PageHeader } from '@/components/ui/Primitives';
import { toast } from '@/components/ui/Toast';

const AI_DATA = [
  { feature: 'Import or upload a PDF', sent: 'The PDF file you choose (a resume, or a job description).' },
  { feature: 'Write summary / AI writing help', sent: 'The text you are improving, your target role, and your skills list.' },
  { feature: 'Polish wording / AI review', sent: 'Your resume content (not your file or browser data).' },
  { feature: 'Job matcher', sent: 'The selected or uploaded resume and the job description.' },
  { feature: 'GitHub import', sent: 'Public repository details from GitHub (name, description, languages, README).' },
  { feature: 'AI interview', sent: 'Your resume, the job description if you add one, target role, the question, and your answer. In Chrome, speech is also turned into text by the browser’s speech service. Your camera preview is never recorded or sent.' },
  { feature: 'Assessment Center', sent: 'Your chosen topics go to the AI service. SQL answers run on this site’s server. Code you run goes to the code-running service this site uses.' },
];

function formatBytes(bytes: number | null) {
  if (bytes === null) return 'Unknown';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function PrivacyPanel() {
  const resumes = useWorkspaceStore((state) => state.resumes);
  const importResumes = useWorkspaceStore((state) => state.importResumes);
  const deleteAllData = useWorkspaceStore((state) => state.deleteAllData);
  const flushSave = useWorkspaceStore((state) => state.flushSave);
  const [info, setInfo] = useState<StorageInfo | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    void getStorageInfo().then((value) => {
      if (!cancelled) setInfo(value);
    });
    return () => {
      cancelled = true;
    };
  }, [resumes.length]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Privacy & Data"
        description="How your resume is stored, what is shared with AI services, and how to back up or delete everything."
      />

      <div className="mt-6 space-y-4">
        <Card className="p-5 sm:p-6">
          <h2 className="text-card font-semibold text-ink">No account needed</h2>
          <p className="mt-2 text-body text-ink-2">
            You never sign up or log in. There is no user database: we do not store your resumes on our servers.
          </p>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-card font-semibold text-ink">
            <HardDrive className="h-4 w-4 text-primary" aria-hidden="true" /> Where your resumes are saved
          </h2>
          <p className="mt-2 text-body text-ink-2">
            Resumes are saved automatically in this browser’s storage (IndexedDB) on this device. Small preferences, such as your
            default template, are kept in localStorage.
          </p>
          <dl className="mt-4 grid gap-4 rounded-lg bg-surface-2 p-4 sm:grid-cols-3">
            <div>
              <dt className="text-label text-ink-2">Saved resumes</dt>
              <dd className="text-body font-semibold text-ink">{resumes.length}</dd>
            </div>
            <div>
              <dt className="text-label text-ink-2">Storage used</dt>
              <dd className="text-body font-semibold text-ink">{info ? formatBytes(info.usageBytes) : '…'}</dd>
            </div>
            <div>
              <dt className="text-label text-ink-2">Protected from automatic cleanup</dt>
              <dd className="text-body font-semibold text-ink">
                {info?.kind === 'memory' ? 'No — storage is blocked' : info?.persisted ? 'Yes' : 'Not yet'}
              </dd>
            </div>
          </dl>
          {info && info.kind !== 'memory' && !info.persisted && (
            <Button
              size="sm"
              variant="secondary"
              className="mt-3"
              onClick={async () => {
                const granted = await requestPersistentStorage();
                setInfo(await getStorageInfo());
                toast(granted ? 'Your browser will keep this data unless you clear it yourself.' : 'Your browser decides this automatically; keep a backup to be safe.', { tone: granted ? 'success' : 'info' });
              }}
            >
              Ask the browser to keep my data
            </Button>
          )}

          <h3 className="mt-6 text-body font-semibold text-ink">Limits of browser storage</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-body text-ink-2">
            <li>Clearing your browser data (cookies and site data) deletes your resumes.</li>
            <li>Private or incognito windows forget everything when closed.</li>
            <li>Resumes do not move to another browser or device by themselves.</li>
          </ul>
          <p className="mt-2 text-body text-ink-2">Download a PDF, or export a backup file, to keep a safe copy.</p>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-card font-semibold text-ink">
            <Database className="h-4 w-4 text-primary" aria-hidden="true" /> What is sent to AI services
          </h2>
          <p className="mt-2 text-body text-ink-2">
            Your data leaves this device only when you use an AI feature, and only what that feature needs. It is sent to the AI
            provider that runs this app (Google Gemini or OpenRouter) to produce the answer. Typing, saving, templates, and PDF
            downloads never send anything.
          </p>
          <div className="mt-4 overflow-hidden rounded-lg border border-line">
            <table className="w-full text-left text-small">
              <thead className="bg-surface-2 text-label text-ink-2">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">Feature</th>
                  <th scope="col" className="px-4 py-2 font-medium">What is sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {AI_DATA.map((row) => (
                  <tr key={row.feature}>
                    <td className="px-4 py-2.5 font-medium text-ink">{row.feature}</td>
                    <td className="px-4 py-2.5 text-ink-2">{row.sent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-small text-ink-2">Remove anything you do not want to share (for example your phone number) before using AI features.</p>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="text-card font-semibold text-ink">Back up, restore, or delete</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={resumes.length === 0}
              onClick={async () => {
                await flushSave();
                exportResumes(useWorkspaceStore.getState().resumes);
              }}
            >
              <FileJson className="h-4 w-4" aria-hidden="true" /> Export all resumes (.json)
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="sr-only"
              aria-label="Backup file"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file) return;
                setError(null);
                try {
                  const created = await importResumes(await readBackupFile(file));
                  toast(`Imported ${created.length} resume${created.length === 1 ? '' : 's'}.`);
                } catch (caught) {
                  setError(caught instanceof Error ? caught.message : 'The backup could not be imported.');
                }
              }}
            />
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" aria-hidden="true" /> Import a backup
            </Button>
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete all data
            </Button>
          </div>
          <p className="mt-3 text-small text-ink-2">To delete one resume, use its menu in My Resumes.</p>
          {error && <Alert tone="error" className="mt-3">{error}</Alert>}
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete all resumes and data?"
        description={`This permanently removes ${resumes.length} resume${resumes.length === 1 ? '' : 's'}, all version history, and earlier saved drafts from this browser. It cannot be undone. Export a backup first if you might need them.`}
        confirmLabel="Delete everything"
        danger
        busy={busy}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setBusy(true);
          await deleteAllData();
          clearLegacyDrafts();
          setBusy(false);
          setConfirmOpen(false);
          toast('All resume data was deleted from this browser.');
        }}
      />
    </div>
  );
}
