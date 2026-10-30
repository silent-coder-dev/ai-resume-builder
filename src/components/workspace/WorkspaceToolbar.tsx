'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Copy,
  Download,
  Ellipsis,
  FileJson,
  FilePlus2,
  FileUp,
  Files,
  History,
  LayoutTemplate,
  Redo2,
  Sparkles,
  Undo2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { analyzeResume } from '@/lib/resume/analyzer';
import { exportResumes } from '@/lib/storage/backup';
import { printResumeDocument } from '@/utils/exportPdf';
import { getTemplateEntry } from '@/components/preview/templateCatalog';
import { Button, buttonClasses } from '@/components/ui/Button';
import { Menu } from '@/components/ui/Menu';
import { toast } from '@/components/ui/Toast';
import { SaveStatusIndicator } from '@/components/workspace/SaveStatusIndicator';
import { TemplatePickerDialog } from '@/components/workspace/TemplatePickerDialog';
import { VersionHistoryDialog } from '@/components/workspace/VersionHistoryDialog';
import { PolishResumeDialog } from '@/components/workspace/ai/PolishResumeDialog';

export function WorkspaceToolbar({ onNewResume, onImportPdf }: { onNewResume: () => void; onImportPdf: () => void }) {
  const router = useRouter();
  const current = useWorkspaceStore((state) => state.current);
  const canUndo = useWorkspaceStore((state) => state.past.length > 0);
  const canRedo = useWorkspaceStore((state) => state.future.length > 0);
  const setTitle = useWorkspaceStore((state) => state.setTitle);
  const undo = useWorkspaceStore((state) => state.undo);
  const redo = useWorkspaceStore((state) => state.redo);
  const duplicateResume = useWorkspaceStore((state) => state.duplicateResume);
  const flushSave = useWorkspaceStore((state) => state.flushSave);
  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const [dialog, setDialog] = useState<'template' | 'history' | 'polish' | null>(null);

  const readiness = useMemo(
    () => (current ? analyzeResume({ data: current.data, careerStage: current.careerStage }) : null),
    [current]
  );

  if (!current || !readiness) return null;
  const template = getTemplateEntry(current.templateId);
  const readinessTone =
    readiness.score >= 85 ? 'text-success' : readiness.score >= 50 ? 'text-warning' : 'text-error';

  return (
    <div className="no-print sticky top-14 z-30 border-b border-line bg-surface md:top-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 sm:px-6 md:min-h-16">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
          <input
            aria-label="Resume name"
            value={titleDraft ?? current.title}
            onChange={(event) => setTitleDraft(event.target.value)}
            onFocus={() => setTitleDraft(current.title)}
            onBlur={() => {
              if (titleDraft !== null && titleDraft.trim() && titleDraft !== current.title) setTitle(titleDraft);
              setTitleDraft(null);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
              if (event.key === 'Escape') {
                setTitleDraft(null);
                event.currentTarget.blur();
              }
            }}
            maxLength={80}
            className="min-w-0 max-w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-card font-semibold text-ink hover:border-line focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:max-w-xs"
          />
          <SaveStatusIndicator />
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo (Ctrl+Z)">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">
            <Redo2 className="h-4 w-4" />
          </Button>
          <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden="true" />
          <Link
            href={`/analyzer?resume=${current.id}`}
            className={buttonClasses('ghost', 'md', 'hidden px-3 sm:inline-flex')}
            title="Open the resume analyzer"
          >
            <span className={`text-body font-bold ${readinessTone}`}>{readiness.score}</span>
            <span className="text-small font-medium text-ink-2">Readiness</span>
          </Link>
          <Button variant="secondary" onClick={() => setDialog('template')} className="px-3">
            <LayoutTemplate className="h-4 w-4" aria-hidden="true" />
            <span className="hidden lg:inline">{template.name}</span>
            <span className="lg:hidden">Template</span>
          </Button>
          <Menu
            label="More actions"
            entries={[
              { label: 'New resume', icon: FilePlus2, onSelect: onNewResume },
              { label: 'Import a PDF as a new resume', icon: FileUp, onSelect: onImportPdf },
              {
                label: 'Duplicate this resume',
                icon: Copy,
                onSelect: async () => {
                  const copy = await duplicateResume(current.id);
                  toast(`Created “${copy.title}”.`, { action: { label: 'Open', href: `/builder?id=${copy.id}` } });
                },
              },
              'separator',
              { label: 'Polish wording with AI', icon: Sparkles, onSelect: () => setDialog('polish') },
              { label: 'Version history', icon: History, onSelect: () => setDialog('history') },
              {
                label: 'Export backup (.json)',
                icon: FileJson,
                onSelect: async () => {
                  await flushSave();
                  const latest = useWorkspaceStore.getState().current;
                  if (latest) exportResumes([latest]);
                },
              },
              'separator',
              { label: 'My resumes', icon: Files, onSelect: () => router.push('/resumes') },
            ]}
            trigger={(props) => (
              <button type="button" {...props} className={buttonClasses('secondary', 'icon')}>
                <Ellipsis className="h-4 w-4" />
              </button>
            )}
          />
          <Button
            variant="primary"
            onClick={() => printResumeDocument('printable-resume-canvas', current.data.personalInfo.fullName || current.title)}
            className="px-3 sm:px-4"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Download PDF</span>
            <span className="sr-only sm:hidden">Download PDF</span>
          </Button>
        </div>
      </div>

      <TemplatePickerDialog open={dialog === 'template'} onClose={() => setDialog(null)} />
      <VersionHistoryDialog open={dialog === 'history'} onClose={() => setDialog(null)} />
      <PolishResumeDialog open={dialog === 'polish'} onClose={() => setDialog(null)} />
    </div>
  );
}
