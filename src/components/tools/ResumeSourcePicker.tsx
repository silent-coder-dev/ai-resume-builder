'use client';

import { useId, useRef, useState } from 'react';
import Link from 'next/link';
import { Upload } from 'lucide-react';
import type { ResumeData } from '@/types/resume';
import { parseResumePdf } from '@/utils/resumeImport';
import { Button } from '@/components/ui/Button';
import { ResumeSelect } from '@/components/tools/useToolResume';

export type ResumeSource = { kind: 'saved' } | { kind: 'upload'; fileName: string; data: ResumeData };

// "Use a saved resume" or "Upload a PDF" — shared by the analyzer, job matcher,
// and interview prep. An uploaded PDF is read by the AI and kept only on this
// page; it is not saved unless the tool offers that explicitly.
export function ResumeSourcePicker({
  name,
  resumes,
  currentId,
  source,
  onSelectResume,
  onSourceChange,
  onError,
  onBusyChange,
  uploadHint = 'Used only on this page. It is not saved as a resume.',
}: {
  name: string;
  resumes: Array<{ id: string; title: string }>;
  currentId: string | undefined;
  source: ResumeSource;
  onSelectResume: (id: string) => void;
  onSourceChange: (source: ResumeSource) => void;
  onError: (message: string | null) => void;
  onBusyChange?: (busy: boolean) => void;
  uploadHint?: string;
}) {
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  // Switching back to "Upload" reuses the last PDF instead of asking again.
  const [lastUpload, setLastUpload] = useState<Extract<ResumeSource, { kind: 'upload' }> | null>(null);

  const setBusy = (busy: boolean) => {
    setParsing(busy);
    onBusyChange?.(busy);
  };

  const upload = async (file: File) => {
    setBusy(true);
    onError(null);
    try {
      const next = { kind: 'upload' as const, fileName: file.name, data: await parseResumePdf(file) };
      setLastUpload(next);
      onSourceChange(next);
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : 'The PDF could not be read.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {resumes.length > 0 && (
        <div className="flex items-start gap-3">
          <input
            id={`${id}-saved`}
            type="radio"
            name={name}
            className="mt-1 accent-primary"
            checked={source.kind === 'saved'}
            onChange={() => onSourceChange({ kind: 'saved' })}
          />
          <div className="min-w-0 flex-1">
            <label htmlFor={`${id}-saved`} className="block cursor-pointer text-body font-medium text-ink">
              Use a saved resume
            </label>
            {source.kind === 'saved' && (
              <div className="mt-2">
                <ResumeSelect resumes={resumes} value={currentId} onChange={onSelectResume} label="Saved resume" />
              </div>
            )}
          </div>
        </div>
      )}
      <div className="flex items-start gap-3">
        {resumes.length > 0 && (
          <input
            id={`${id}-upload`}
            type="radio"
            name={name}
            className="mt-1 accent-primary"
            checked={source.kind === 'upload'}
            onChange={() => (lastUpload ? onSourceChange(lastUpload) : fileRef.current?.click())}
          />
        )}
        <div className="min-w-0 flex-1">
          {resumes.length > 0 ? (
            <label htmlFor={`${id}-upload`} className="block cursor-pointer text-body font-medium text-ink">
              Upload a PDF
            </label>
          ) : (
            <p className="text-body font-medium text-ink">Upload a PDF</p>
          )}
          <p className="text-small text-ink-2">{uploadHint}</p>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            aria-label="Resume PDF"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void upload(file);
            }}
          />
          <Button variant="secondary" size="sm" className="mt-2 max-w-full" onClick={() => fileRef.current?.click()} loading={parsing}>
            {!parsing && <Upload className="h-4 w-4" aria-hidden="true" />}
            <span className="min-w-0 truncate">
              {parsing ? 'Reading your PDF…' : source.kind === 'upload' ? source.fileName : 'Choose PDF'}
            </span>
          </Button>
        </div>
      </div>
      {resumes.length === 0 && source.kind === 'saved' && (
        <p className="text-small text-ink-2">
          No saved resumes yet. Upload a PDF, or{' '}
          <Link href="/builder" className="font-semibold text-primary hover:underline">
            create a resume
          </Link>
          .
        </p>
      )}
    </div>
  );
}
