'use client';

import { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { Menu } from '@/components/ui/Menu';
import { buttonClasses } from '@/components/ui/Button';
import { callAi } from '@/utils/aiClient';
import { SuggestionDialog } from '@/components/workspace/ai/SuggestionReview';

export const AI_WRITING_ACTIONS = [
  { id: 'improve', label: 'Improve writing' },
  { id: 'concise', label: 'Make concise' },
  { id: 'professional', label: 'Make professional' },
  { id: 'grammar', label: 'Fix grammar' },
  { id: 'clarity', label: 'Improve clarity' },
  { id: 'achievement', label: 'Rewrite as achievement' },
  { id: 'keywords', label: 'Add relevant keywords' },
] as const;

export type AiWritingAction = (typeof AI_WRITING_ACTIONS)[number]['id'];

export interface AiWritingContext {
  // What the text is, e.g. "project description" or "work experience bullets".
  field: string;
  targetRole?: string;
  skills?: string[];
  // Bullet fields: one bullet per line in and out.
  bullets?: boolean;
}

interface RewriteResult {
  suggestion: string;
  notes: string[];
}

// The "AI" button next to a text field. Every result goes through the
// approval dialog; nothing changes until the user accepts.
export function AiAssistMenu({
  text,
  context,
  onAccept,
}: {
  text: string;
  context: AiWritingContext;
  onAccept: (value: string) => void;
}) {
  const [action, setAction] = useState<(typeof AI_WRITING_ACTIONS)[number] | null>(null);
  const [original, setOriginal] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [notes, setNotes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (chosen: (typeof AI_WRITING_ACTIONS)[number], source: string) => {
    setAction(chosen);
    setOriginal(source);
    setSuggestion('');
    setNotes([]);
    setError(null);
    setLoading(true);
    try {
      const result = await callAi<RewriteResult>('rewrite-text', { text: source, action: chosen.id, context });
      setSuggestion(result.suggestion);
      setNotes(result.notes ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The AI could not write a suggestion.');
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setAction(null);
    setLoading(false);
  };

  const empty = !text.trim();

  return (
    <>
      <Menu
        label={`AI writing help for ${context.field}`}
        entries={AI_WRITING_ACTIONS.map((item) => ({
          label: item.label,
          disabled: empty,
          onSelect: () => void run(item, text),
        }))}
        trigger={(props) => (
          <button
            type="button"
            {...props}
            disabled={empty}
            title={empty ? 'Write something first, then AI can improve it' : undefined}
            className={buttonClasses('ghost', 'sm', 'h-7 gap-1 px-2 text-primary hover:text-primary-hover')}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            AI
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
          </button>
        )}
      />
      <SuggestionDialog
        open={action !== null}
        title={action?.label ?? ''}
        original={original}
        suggestion={suggestion}
        onSuggestionChange={setSuggestion}
        notes={notes}
        loading={loading}
        error={error}
        onRetry={action ? () => void run(action, original) : undefined}
        onReject={close}
        onAccept={() => {
          onAccept(context.bullets ? suggestion.split('\n').map((line) => line.trim()).filter(Boolean).join('\n') : suggestion.trim());
          close();
        }}
      />
    </>
  );
}
