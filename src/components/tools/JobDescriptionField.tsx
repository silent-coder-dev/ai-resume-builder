'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { readJobDescriptionFile } from '@/utils/resumeImport';
import { Field, Textarea } from '@/components/ui/Field';

export const MIN_JOB_DESCRIPTION_CHARS = 80;

// Paste a job description, or upload it as a PDF or text file.
// Shared by the job matcher and interview prep.
export function JobDescriptionField({
  value,
  onChange,
  onError,
  onBusyChange,
  optional = false,
  rows = 9,
  hint = 'Paste the full posting: responsibilities, requirements, and nice-to-haves. Or upload it as a PDF or .txt file.',
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  onError: (message: string | null) => void;
  onBusyChange?: (busy: boolean) => void;
  optional?: boolean;
  rows?: number;
  hint?: string;
  className?: string;
}) {
  const [reading, setReading] = useState(false);
  const length = value.trim().length;

  const setBusy = (busy: boolean) => {
    setReading(busy);
    onBusyChange?.(busy);
  };

  const readFile = async (file: File) => {
    setBusy(true);
    onError(null);
    try {
      onChange(await readJobDescriptionFile(file));
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : 'The job description could not be read.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Field
      label="Job description"
      optional={optional}
      className={className}
      hint={
        reading
          ? 'Reading the job description from your PDF…'
          : length > 0 && length < MIN_JOB_DESCRIPTION_CHARS
            ? `${MIN_JOB_DESCRIPTION_CHARS - length} more characters needed`
            : hint
      }
      actions={
        <label
          className={`inline-flex shrink-0 cursor-pointer items-center gap-1 rounded text-small font-semibold text-primary focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary hover:underline ${
            reading ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          <Upload className="h-3.5 w-3.5" aria-hidden="true" />
          {reading ? 'Reading…' : 'Upload PDF or .txt'}
          <input
            type="file"
            accept=".pdf,application/pdf,.txt,.md,text/plain,text/markdown"
            className="sr-only"
            aria-label="Upload the job description as a PDF or text file"
            disabled={reading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void readFile(file);
            }}
          />
        </label>
      }
    >
      {(control) => (
        <Textarea
          {...control}
          rows={rows}
          maxLength={30000}
          value={value}
          disabled={reading}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Paste the job description here…"
        />
      )}
    </Field>
  );
}
