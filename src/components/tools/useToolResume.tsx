'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { SelectField } from '@/components/ui/Field';

// Tool pages (analyzer, job matcher, GitHub import, interview prep) work on
// one saved resume: the ?resume= in the URL, the open one, or the newest.
// It is opened in the workspace store so edits autosave like in the builder.
export function useToolResume() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const requested = params.get('resume');
  const phase = useWorkspaceStore((state) => state.phase);
  const resumes = useWorkspaceStore((state) => state.resumes);
  const current = useWorkspaceStore((state) => state.current);
  const openResume = useWorkspaceStore((state) => state.openResume);

  useEffect(() => {
    if (phase !== 'ready' || resumes.length === 0) return;
    const target =
      requested && resumes.some((resume) => resume.id === requested)
        ? requested
        : current && resumes.some((resume) => resume.id === current.id)
          ? current.id
          : resumes[0].id;
    if (current?.id !== target) void openResume(target);
  }, [phase, requested, resumes, current, openResume]);

  const select = (id: string) => {
    const next = new URLSearchParams(params.toString());
    next.set('resume', id);
    router.replace(`${pathname}?${next.toString()}`);
    void openResume(id);
  };

  return { ready: phase === 'ready', resumes, current, select };
}

export function ResumeSelect({
  resumes,
  value,
  onChange,
  label = 'Resume',
}: {
  resumes: Array<{ id: string; title: string }>;
  value: string | undefined;
  onChange: (id: string) => void;
  label?: string;
}) {
  return (
    <SelectField label={label} value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="w-full sm:w-72">
      {resumes.map((resume) => (
        <option key={resume.id} value={resume.id}>
          {resume.title}
        </option>
      ))}
    </SelectField>
  );
}
