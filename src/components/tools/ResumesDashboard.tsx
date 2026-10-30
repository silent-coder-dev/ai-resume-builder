'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Copy, Download, Ellipsis, FileJson, FilePlus2, Files, Pencil, Trash2, Upload } from 'lucide-react';
import type { ResumeRecord } from '@/lib/resume/record';
import { exportResumes, readBackupFile } from '@/lib/storage/backup';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { printResumeRecord } from '@/utils/printRecord';
import { getTemplateEntry, renderResumeTemplate } from '@/components/preview/templateCatalog';
import { ScaledResume } from '@/components/preview/ScaledResume';
import { Button, ButtonLink, buttonClasses } from '@/components/ui/Button';
import { ConfirmDialog, Dialog } from '@/components/ui/Dialog';
import { TextField } from '@/components/ui/Field';
import { Menu } from '@/components/ui/Menu';
import { Alert, Badge, Card, EmptyState, PageHeader, Skeleton, formatRelativeTime } from '@/components/ui/Primitives';
import { toast } from '@/components/ui/Toast';
import { useNewResumeFlow } from '@/components/workspace/NewResumeDialog';

function ResumeCard({
  resume,
  onRename,
  onDelete,
}: {
  resume: ResumeRecord;
  onRename: () => void;
  onDelete: () => void;
}) {
  const duplicateResume = useWorkspaceStore((state) => state.duplicateResume);
  const template = getTemplateEntry(resume.templateId);
  const role = resume.data.personalInfo.targetRole.trim();

  return (
    <Card className="flex flex-col overflow-hidden">
      <Link href={`/builder?id=${resume.id}`} className="block border-b border-line bg-surface-2 p-4" aria-label={`Open ${resume.title}`}>
        <ScaledResume initialScale={0.3} visibleHeight={640} className="rounded-md border border-line shadow-xs">
          {renderResumeTemplate(resume.templateId, resume.data, resume.accentColor, resume.sectionOrder)}
        </ScaledResume>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <h2 className="truncate text-card font-semibold text-ink">{resume.title}</h2>
          <p className="truncate text-small text-ink-2">{role || 'No target role yet'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-label text-ink-2">
          <span>Edited {formatRelativeTime(resume.updatedAt)}</span>
          <span aria-hidden="true">·</span>
          <span>{template.name}</span>
          {resume.tailoredFor && <Badge tone="primary">Tailored: {resume.tailoredFor}</Badge>}
        </div>
        <div className="mt-auto flex items-center gap-2 pt-1">
          <ButtonLink href={`/builder?id=${resume.id}`} variant="primary" size="sm" className="flex-1">
            Open
          </ButtonLink>
          <Menu
            label={`Actions for ${resume.title}`}
            entries={[
              { label: 'Rename', icon: Pencil, onSelect: onRename },
              {
                label: 'Duplicate',
                icon: Copy,
                onSelect: async () => {
                  const copy = await duplicateResume(resume.id);
                  toast(`Created “${copy.title}”.`);
                },
              },
              { label: 'Download PDF', icon: Download, onSelect: () => printResumeRecord(resume) },
              { label: 'Export backup (.json)', icon: FileJson, onSelect: () => exportResumes([resume]) },
              'separator',
              { label: 'Delete', icon: Trash2, danger: true, onSelect: onDelete },
            ]}
            trigger={(props) => (
              <button type="button" {...props} className={buttonClasses('secondary', 'icon-sm')}>
                <Ellipsis className="h-4 w-4" />
              </button>
            )}
          />
        </div>
      </div>
    </Card>
  );
}

export function ResumesDashboard() {
  const phase = useWorkspaceStore((state) => state.phase);
  const resumes = useWorkspaceStore((state) => state.resumes);
  const renameResume = useWorkspaceStore((state) => state.renameResume);
  const deleteResume = useWorkspaceStore((state) => state.deleteResume);
  const importResumes = useWorkspaceStore((state) => state.importResumes);
  const flushSave = useWorkspaceStore((state) => state.flushSave);
  const newResume = useNewResumeFlow();
  const fileRef = useRef<HTMLInputElement>(null);
  const [renaming, setRenaming] = useState<ResumeRecord | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleting, setDeleting] = useState<ResumeRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const importFile = async (file: File) => {
    setImportError(null);
    try {
      const records = await readBackupFile(file);
      const created = await importResumes(records);
      toast(`Imported ${created.length} resume${created.length === 1 ? '' : 's'}. Your existing resumes were not changed.`);
    } catch (caught) {
      setImportError(caught instanceof Error ? caught.message : 'The backup could not be imported.');
    }
  };

  const actions = (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        aria-label="Backup file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) void importFile(file);
        }}
      />
      <Button variant="secondary" onClick={() => fileRef.current?.click()}>
        <Upload className="h-4 w-4" aria-hidden="true" /> Import backup
      </Button>
      {resumes.length > 0 && (
        <Button
          variant="secondary"
          onClick={async () => {
            await flushSave();
            exportResumes(useWorkspaceStore.getState().resumes);
          }}
        >
          <FileJson className="h-4 w-4" aria-hidden="true" /> Export all
        </Button>
      )}
      <Button variant="primary" onClick={() => void newResume.start()}>
        <FilePlus2 className="h-4 w-4" aria-hidden="true" /> New resume
      </Button>
    </>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        title="My Resumes"
        description="Each resume is separate — editing one never changes another. Resumes are saved in this browser only."
        actions={actions}
      />
      {importError && <Alert tone="error" className="mt-4">{importError}</Alert>}

      {phase !== 'ready' ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      ) : resumes.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={Files}
          title="No resumes on this device yet"
          description={
            <>
              Create your first resume — no sign-up needed. If you used AI Resume Studio before and your resumes are missing,
              your browser data may have been cleared; import a backup file if you exported one.
            </>
          }
          actions={
            <>
              <ButtonLink href="/builder?new=1" variant="primary">
                Create a resume
              </ButtonLink>
              <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                Import backup
              </Button>
            </>
          }
        />
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => (
            <li key={resume.id}>
              <ResumeCard
                resume={resume}
                onRename={() => {
                  setRenaming(resume);
                  setRenameValue(resume.title);
                }}
                onDelete={() => setDeleting(resume)}
              />
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={renaming !== null}
        onClose={() => setRenaming(null)}
        title="Rename resume"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!renameValue.trim()}
              onClick={async () => {
                if (!renaming) return;
                await renameResume(renaming.id, renameValue);
                setRenaming(null);
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (!renaming || !renameValue.trim()) return;
            await renameResume(renaming.id, renameValue);
            setRenaming(null);
          }}
        >
          <TextField label="Resume name" autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} maxLength={80} />
        </form>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete “${deleting?.title ?? ''}”?`}
        description="This resume and its version history will be permanently removed from this browser. Your other resumes are not affected. Export a backup first if you might need it."
        confirmLabel="Delete resume"
        danger
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          setBusy(true);
          await deleteResume(deleting.id);
          setBusy(false);
          toast(`Deleted “${deleting.title}”.`);
          setDeleting(null);
        }}
      />
      {newResume.dialog}
    </div>
  );
}
