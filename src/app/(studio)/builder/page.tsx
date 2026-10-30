'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileQuestion } from 'lucide-react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { getLastEditedResume } from '@/lib/storage/resumeRepository';
import { Workspace } from '@/components/workspace/Workspace';
import { CreateResumeForm } from '@/components/workspace/CreateResumeForm';
import { useNewResumeFlow } from '@/components/workspace/NewResumeDialog';
import { ButtonLink } from '@/components/ui/Button';
import { Card, EmptyState, Skeleton } from '@/components/ui/Primitives';
import { Dialog } from '@/components/ui/Dialog';

function WorkspaceSkeleton() {
  return (
    <div className="flex flex-1 flex-col" aria-busy="true" aria-label="Loading your resume">
      <div className="flex h-16 items-center gap-3 border-b border-line bg-surface px-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="ml-auto h-10 w-36" />
      </div>
      <div className="flex flex-1 gap-6 p-6">
        <Skeleton className="hidden h-96 w-56 xl:block" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="hidden h-[32rem] w-[40%] lg:block" />
      </div>
    </div>
  );
}

function CreateFirstResume({ onCancel, templateId }: { onCancel?: () => void; templateId?: string }) {
  const router = useRouter();
  const hasResumes = useWorkspaceStore((state) => state.resumes.length > 0);
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-title font-bold tracking-tight text-ink">{hasResumes ? 'Create a new resume' : 'Create your first resume'}</h1>
      <p className="mt-1.5 text-body text-ink-2">
        {hasResumes
          ? 'Your other resumes stay exactly as they are.'
          : 'No sign-up needed. Your resume is saved automatically in this browser as you type.'}
      </p>
      <Card className="mt-6 p-6">
        <CreateResumeForm
          onCancel={onCancel}
          initialTemplateId={templateId}
          onCreated={(record) => router.replace(`/builder?id=${record.id}`)}
        />
      </Card>
      {!hasResumes && (
        <p className="mt-4 text-small text-ink-2">
          Used AI Resume Studio before on this browser and your resumes are gone? Browser data may have been cleared.{' '}
          <Link href="/resumes" className="font-semibold text-primary hover:underline">
            Import a backup
          </Link>{' '}
          if you exported one.
        </p>
      )}
    </div>
  );
}

function BuilderRoute() {
  const router = useRouter();
  const params = useSearchParams();
  const requestedId = params.get('id');
  const creatingNew = params.get('new') === '1';
  const requestedSection = params.get('section');
  const requestedTemplate = params.get('template') ?? undefined;
  const phase = useWorkspaceStore((state) => state.phase);
  const current = useWorkspaceStore((state) => state.current);
  const hasResumes = useWorkspaceStore((state) => state.resumes.length > 0);
  const openResume = useWorkspaceStore((state) => state.openResume);
  const [missingId, setMissingId] = useState<string | null>(null);
  const [noResumes, setNoResumes] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const newResume = useNewResumeFlow();

  // Deterministic selection: the ?id in the URL, otherwise the last edited
  // resume. A refresh never creates a blank resume.
  useEffect(() => {
    if (phase !== 'ready' || creatingNew) return;
    let cancelled = false;
    void (async () => {
      if (requestedId) {
        if (useWorkspaceStore.getState().current?.id === requestedId) return;
        const ok = await openResume(requestedId);
        if (!cancelled) setMissingId(ok ? null : requestedId);
        return;
      }
      const currentId = useWorkspaceStore.getState().current?.id;
      const last = currentId ? { id: currentId } : await getLastEditedResume();
      if (cancelled) return;
      if (last) router.replace(`/builder?id=${last.id}`);
      else setNoResumes(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, requestedId, creatingNew, openResume, router]);

  if (phase === 'error') {
    return (
      <div className="p-6">
        <EmptyState icon={FileQuestion} title="Your resumes could not be loaded" description="See the message above, then try reloading the page." />
      </div>
    );
  }

  if (phase !== 'ready') return <WorkspaceSkeleton />;

  if (creatingNew) {
    return <CreateFirstResume templateId={requestedTemplate} onCancel={hasResumes ? () => router.back() : undefined} />;
  }

  if (missingId && missingId === requestedId) {
    return (
      <div className="p-6">
        <EmptyState
          icon={FileQuestion}
          title="This resume is not on this device"
          description="It may have been deleted, or it was created in another browser. Resumes are saved only in the browser where you made them."
          actions={
            <>
              <ButtonLink href="/resumes" variant="primary">
                Go to My Resumes
              </ButtonLink>
              <ButtonLink href="/builder?new=1" variant="secondary">
                Create a new resume
              </ButtonLink>
            </>
          }
        />
      </div>
    );
  }

  if (!requestedId && noResumes && !hasResumes) return <CreateFirstResume />;

  if (!current || current.id !== requestedId) return <WorkspaceSkeleton />;

  return (
    <>
      <Workspace
        key={current.id}
        initialSection={requestedSection}
        onNewResume={() => void newResume.start({ templateId: current.templateId, accentColor: current.accentColor })}
        onImportPdf={() => setImportOpen(true)}
      />
      {newResume.dialog}
      <Dialog open={importOpen} onClose={() => setImportOpen(false)} title="Import a PDF as a new resume" description="Your current resume is not changed." size="md">
        <CreateResumeForm
          initialMethod="pdf"
          submitLabel="Import resume"
          onCancel={() => setImportOpen(false)}
          onCreated={(record) => {
            setImportOpen(false);
            router.push(`/builder?id=${record.id}`);
          }}
        />
      </Dialog>
    </>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={<WorkspaceSkeleton />}>
      <BuilderRoute />
    </Suspense>
  );
}
