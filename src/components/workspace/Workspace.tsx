'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, ListOrdered, PenLine } from 'lucide-react';
import type { SectionKey } from '@/types/resume';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { usePreferences } from '@/store/usePreferences';
import { customSectionIdFromKey, isCustomSectionKey, sectionLabel } from '@/lib/resume/sections';
import { renderResumeTemplate } from '@/components/preview/templateCatalog';
import { ResumeCanvasContainer } from '@/components/preview/ResumeCanvasContainer';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Select } from '@/components/ui/Field';
import { SectionNav, type EditorSection } from '@/components/workspace/SectionNav';
import { WorkspaceToolbar } from '@/components/workspace/WorkspaceToolbar';
import { PersonalEditor } from '@/components/workspace/editors/PersonalEditor';
import {
  AchievementsEditor,
  CertificationsEditor,
  CustomSectionEditor,
  EducationEditor,
  ExperienceEditor,
  LanguagesEditor,
  ProjectsEditor,
  SkillsEditor,
  SummaryEditor,
} from '@/components/workspace/editors/ContentEditors';

function SectionEditor({ section, onNavigate }: { section: EditorSection; onNavigate: (section: EditorSection) => void }) {
  if (section === 'personal') return <PersonalEditor />;
  if (isCustomSectionKey(section)) {
    return <CustomSectionEditor sectionId={customSectionIdFromKey(section)} onRemoved={() => onNavigate('personal')} />;
  }
  switch (section) {
    case 'summary':
      return <SummaryEditor onNavigate={(next) => onNavigate(next as EditorSection)} />;
    case 'experience':
      return <ExperienceEditor list="experiences" />;
    case 'internships':
      return <ExperienceEditor list="internships" />;
    case 'projects':
      return <ProjectsEditor />;
    case 'education':
      return <EducationEditor />;
    case 'skills':
      return <SkillsEditor />;
    case 'certifications':
      return <CertificationsEditor />;
    case 'achievements':
      return <AchievementsEditor />;
    case 'languages':
      return <LanguagesEditor />;
    default:
      return null;
  }
}

function ResumePreviewPane() {
  const current = useWorkspaceStore((state) => state.current);
  // Typing stays fast: the preview may lag a frame behind the form.
  const deferred = useDeferredValue(current);
  if (!deferred) return null;
  return (
    <ResumeCanvasContainer activeTemplate={deferred.templateId}>
      {renderResumeTemplate(deferred.templateId, deferred.data, deferred.accentColor, deferred.sectionOrder)}
    </ResumeCanvasContainer>
  );
}

// The resume workspace (PRD §11): sections on the left, the form in the
// middle, and the live A4 preview on the right. Phones get Editor/Preview tabs.
export function Workspace({
  initialSection,
  onNewResume,
  onImportPdf,
}: {
  initialSection?: string | null;
  onNewResume: () => void;
  onImportPdf: () => void;
}) {
  const resumeId = useWorkspaceStore((state) => state.current?.id);
  const sectionOrder = useWorkspaceStore((state) => state.current?.sectionOrder);
  const customSections = useWorkspaceStore((state) => state.current?.data.customSections);
  const undo = useWorkspaceStore((state) => state.undo);
  const redo = useWorkspaceStore((state) => state.redo);
  const rememberSection = usePreferences((state) => state.rememberSection);
  const lastSection = usePreferences((state) => (resumeId ? state.lastSection[resumeId] : undefined));
  const [chosenSection, setChosenSection] = useState<EditorSection | null>(null);
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const [arrangeOpen, setArrangeOpen] = useState(false);

  const order: EditorSection[] = ['personal', ...(sectionOrder ?? []).map((item) => item.id)];
  const requested = (chosenSection ?? initialSection ?? lastSection ?? 'personal') as EditorSection;
  // Fall back to Personal Information if the remembered section no longer exists.
  const section = order.includes(requested) ? requested : 'personal';
  const position = order.indexOf(section);

  const select = (next: EditorSection) => {
    setChosenSection(next);
    if (resumeId) rememberSection(resumeId, next);
    setArrangeOpen(false);
    setMobileView('editor');
    window.scrollTo({ top: 0 });
  };

  // Undo / redo shortcuts for the whole workspace (not inside dialogs).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      if ((event.target as HTMLElement | null)?.closest('dialog')) return;
      const key = event.key.toLowerCase();
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if ((key === 'z' && event.shiftKey) || key === 'y') {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo]);

  const labelFor = (key: EditorSection) => (key === 'personal' ? 'Personal Information' : sectionLabel(key as SectionKey, customSections));

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <WorkspaceToolbar onNewResume={onNewResume} onImportPdf={onImportPdf} />

      {/* Phones and tablets: Editor / Preview tabs */}
      <div className="no-print border-b border-line bg-surface px-4 py-2 lg:hidden">
        <div role="tablist" aria-label="Workspace view" className="grid grid-cols-2 gap-1 rounded-lg bg-surface-2 p-1">
          {[
            { value: 'editor' as const, label: 'Editor', icon: PenLine },
            { value: 'preview' as const, label: 'Preview', icon: Eye },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mobileView === value}
              onClick={() => setMobileView(value)}
              className={`flex h-9 items-center justify-center gap-2 rounded-md text-body font-medium transition-colors duration-200 ${
                mobileView === value ? 'bg-surface text-ink shadow-xs' : 'text-ink-2 hover:text-ink'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-w-0 flex-1">
        {/* Desktop: persistent section list */}
        <aside className="no-print sticky top-16 hidden h-[calc(100dvh-4rem)] w-60 shrink-0 self-start overflow-y-auto border-r border-line bg-surface px-3 py-5 xl:block">
          <SectionNav active={section} onSelect={select} />
        </aside>

        {/* Editor */}
        <section
          aria-label="Editor"
          className={`no-print min-w-0 flex-1 px-4 py-6 sm:px-6 lg:block lg:px-8 ${mobileView === 'editor' ? 'block' : 'hidden'}`}
        >
          <div className="mx-auto max-w-2xl">
            <div className="mb-6 flex items-center gap-2 xl:hidden">
              <Select aria-label="Choose a section to edit" value={section} onChange={(event) => select(event.target.value as EditorSection)} className="flex-1">
                {order.map((key) => (
                  <option key={key} value={key}>
                    {labelFor(key)}
                  </option>
                ))}
              </Select>
              <Button variant="secondary" onClick={() => setArrangeOpen(true)}>
                <ListOrdered className="h-4 w-4" aria-hidden="true" /> Arrange
              </Button>
            </div>

            <SectionEditor section={section} onNavigate={select} />

            <div className="mt-8 flex items-center justify-between gap-2 border-t border-line pt-5">
              <Button variant="secondary" className="min-w-0 shrink" onClick={() => select(order[position - 1])} disabled={position <= 0}>
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{position > 0 ? labelFor(order[position - 1]) : 'Previous'}</span>
              </Button>
              <Button variant="secondary" className="hidden sm:inline-flex lg:hidden" onClick={() => setMobileView('preview')}>
                <Eye className="h-4 w-4" aria-hidden="true" /> Preview
              </Button>
              <Button variant="primary" className="min-w-0 shrink" onClick={() => select(order[position + 1])} disabled={position >= order.length - 1}>
                <span className="truncate">{position < order.length - 1 ? labelFor(order[position + 1]) : 'Next'}</span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </section>

        {/* Live A4 preview */}
        <section
          aria-label="Resume preview"
          className={`min-w-0 border-l border-line bg-surface-2 px-3 py-6 sm:px-6 lg:sticky lg:top-16 lg:block lg:h-[calc(100dvh-4rem)] lg:w-[46%] lg:max-w-[760px] lg:shrink-0 lg:self-start lg:overflow-y-auto ${
            mobileView === 'preview' ? 'block flex-1' : 'hidden'
          }`}
        >
          <ResumePreviewPane />
        </section>
      </div>

      <Dialog open={arrangeOpen} onClose={() => setArrangeOpen(false)} title="Sections" description="Choose a section to edit, move sections, or hide them on the resume." size="sm">
        <SectionNav active={section} onSelect={select} />
      </Dialog>
    </div>
  );
}
