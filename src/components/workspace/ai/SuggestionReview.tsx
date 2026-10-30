'use client';

import React, { useId } from 'react';
import { CircleHelp, LoaderCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';

// Side-by-side "original vs suggestion" with an editable suggestion (PRD §13).
export function SuggestionReview({
  original,
  suggestion,
  onSuggestionChange,
  notes = [],
  loading = false,
  error = null,
  multiline = true,
}: {
  original: string;
  suggestion: string;
  onSuggestionChange: (value: string) => void;
  notes?: string[];
  loading?: boolean;
  error?: string | null;
  multiline?: boolean;
}) {
  const suggestionId = useId();
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-1.5 text-label font-medium text-ink-2">Original</p>
          <div className="min-h-32 whitespace-pre-wrap break-words rounded-lg border border-line bg-surface-2 px-3 py-2 text-body leading-6 text-ink-2">
            {original || <span className="italic">Empty</span>}
          </div>
        </div>
        <div>
          <label htmlFor={suggestionId} className="mb-1.5 block text-label font-medium text-ink">
            Suggestion <span className="font-normal text-ink-2">(you can edit it)</span>
          </label>
          {loading ? (
            <div className="flex min-h-32 items-center justify-center gap-2 rounded-lg border border-line bg-surface text-small text-ink-2">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Writing a suggestion…
            </div>
          ) : (
            <Textarea
              id={suggestionId}
              rows={multiline ? Math.min(12, Math.max(5, suggestion.split('\n').length + 1)) : 3}
              value={suggestion}
              onChange={(event) => onSuggestionChange(event.target.value)}
              disabled={Boolean(error)}
            />
          )}
        </div>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      {notes.length > 0 && !loading && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-small text-amber-900">
          <p className="flex items-center gap-1.5 font-semibold">
            <CircleHelp className="h-4 w-4" aria-hidden="true" /> To make this stronger, consider:
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-label text-ink-2">
        AI only rewrites what you wrote. Check that every fact is true before you accept.
      </p>
    </div>
  );
}

export function SuggestionDialog({
  open,
  title,
  original,
  suggestion,
  onSuggestionChange,
  notes,
  loading,
  error,
  onAccept,
  onReject,
  onRetry,
}: {
  open: boolean;
  title: string;
  original: string;
  suggestion: string;
  onSuggestionChange: (value: string) => void;
  notes?: string[];
  loading: boolean;
  error: string | null;
  onAccept: () => void;
  onReject: () => void;
  onRetry?: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onReject}
      title={title}
      description="Accept to update your resume, or reject to keep the original."
      size="lg"
      footer={
        <>
          {error && onRetry && (
            <Button variant="secondary" onClick={onRetry} className="sm:mr-auto">
              Try again
            </Button>
          )}
          <Button variant="secondary" onClick={onReject}>
            Reject
          </Button>
          <Button variant="primary" onClick={onAccept} disabled={loading || Boolean(error) || !suggestion.trim()}>
            Accept suggestion
          </Button>
        </>
      }
    >
      <SuggestionReview
        original={original}
        suggestion={suggestion}
        onSuggestionChange={onSuggestionChange}
        notes={notes}
        loading={loading}
        error={error}
      />
    </Dialog>
  );
}
