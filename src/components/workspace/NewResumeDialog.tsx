'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, FilePlus2 } from 'lucide-react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { formatRelativeTime } from '@/components/ui/Primitives';
import { CreateResumeForm } from '@/components/workspace/CreateResumeForm';

type Step = 'choice' | 'pick' | 'create';

interface NewResumeOptions {
  templateId?: string;
  accentColor?: string;
}

// PRD §10 — New Resume Confirmation. When resumes already exist, the user is
// asked to continue one or create a new one. Nothing is ever overwritten.
function NewResumeDialog({
  open,
  options,
  onClose,
}: {
  open: boolean;
  options: NewResumeOptions;
  onClose: () => void;
}) {
  const router = useRouter();
  const resumes = useWorkspaceStore((state) => state.resumes);
  const [step, setStep] = useState<Step>('choice');
  const [wasOpen, setWasOpen] = useState(false);

  // Choose the first step each time the dialog opens.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setStep(resumes.length > 0 ? 'choice' : 'create');
  }

  const latest = resumes[0];
  const activeStep: Step = resumes.length === 0 ? 'create' : step;

  const goTo = (id: string) => {
    onClose();
    router.push(`/builder?id=${id}`);
  };

  let title: string;
  let description: string | undefined;
  let body: React.ReactNode;
  let footer: React.ReactNode = null;

  if (activeStep === 'create') {
    title = 'Create a new resume';
    description = resumes.length > 0 ? 'Your other resumes stay exactly as they are.' : undefined;
    body = (
      <CreateResumeForm
        initialTemplateId={options.templateId}
        initialAccentColor={options.accentColor}
        onCancel={resumes.length > 0 ? () => setStep('choice') : onClose}
        onCreated={(record) => goTo(record.id)}
      />
    );
  } else if (activeStep === 'pick') {
    title = 'Which resume do you want to continue?';
    footer = (
      <Button variant="secondary" onClick={() => setStep('choice')}>
        Back
      </Button>
    );
    body = (
      <ul className="space-y-2">
        {resumes.map((resume) => (
          <li key={resume.id}>
            <button
              type="button"
              onClick={() => goTo(resume.id)}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-line px-4 py-3 text-left transition-colors hover:border-primary hover:bg-primary-light"
            >
              <span className="min-w-0">
                <span className="block truncate text-body font-semibold text-ink">{resume.title}</span>
                <span className="block text-small text-ink-2">Edited {formatRelativeTime(resume.updatedAt)}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-ink-2" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    );
  } else {
    title = 'What would you like to do?';
    description = 'You already have an existing resume. Would you like to continue editing it or create a new one?';
    footer = (
      <Button variant="ghost" onClick={onClose}>
        Cancel
      </Button>
    );
    body = (
      <div className="space-y-2">
        {resumes.length > 1 ? (
          <Button variant="primary" size="lg" className="w-full justify-between text-body" onClick={() => setStep('pick')}>
            <span className="truncate">Continue an existing resume</span>
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Button>
        ) : (
          <Button variant="primary" size="lg" className="w-full justify-between text-body" onClick={() => goTo(latest.id)}>
            <span className="truncate">Continue “{latest.title}”</span>
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Button>
        )}
        <Button variant="secondary" size="lg" className="w-full justify-start text-body" onClick={() => setStep('create')}>
          <FilePlus2 className="h-4 w-4" aria-hidden="true" /> Create a new resume
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} title={title} description={description} size={activeStep === 'choice' ? 'sm' : 'md'} footer={footer}>
      {body}
    </Dialog>
  );
}

// Opens the new-resume flow from anywhere ("Create Resume", "Build My Resume",
// the dashboard). Loads saved resumes first so the right question is asked.
export function useNewResumeFlow() {
  const [state, setState] = useState<{ open: boolean; options: NewResumeOptions }>({ open: false, options: {} });

  const start = useCallback(async (options: NewResumeOptions = {}) => {
    await useWorkspaceStore.getState().init();
    setState({ open: true, options });
  }, []);

  const dialog = (
    <NewResumeDialog
      open={state.open}
      options={state.options}
      onClose={() => setState((previous) => ({ ...previous, open: false }))}
    />
  );

  return { start, dialog };
}
