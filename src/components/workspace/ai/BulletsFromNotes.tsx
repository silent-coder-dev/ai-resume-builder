'use client';

import { useState } from 'react';
import { ListChecks } from 'lucide-react';
import { callAi } from '@/utils/aiClient';
import { Button } from '@/components/ui/Button';
import { SuggestionDialog } from '@/components/workspace/ai/SuggestionReview';

// Turns rough notes about a role into 2–3 bullet points, shown for approval.
export function BulletsFromNotes({
  notes,
  currentBullets,
  role,
  company,
  targetRole,
  onAccept,
}: {
  notes: string;
  currentBullets: string[];
  role: string;
  company: string;
  targetRole: string;
  onAccept: (bullets: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setOpen(true);
    setSuggestion('');
    setError(null);
    setLoading(true);
    try {
      const bullets = await callAi<unknown>('enhance-experience', { company, role, rawDetails: notes, targetRole });
      const clean = Array.isArray(bullets) ? bullets.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
      if (clean.length === 0) throw new Error('AI did not return any bullet points. Add a little more detail and try again.');
      setSuggestion(clean.join('\n'));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Bullet points could not be written.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => void run()}
        disabled={!notes.trim()}
        title={!notes.trim() ? 'Write a few notes first' : undefined}
        className="h-7 px-2 text-primary hover:text-primary-hover"
      >
        <ListChecks className="h-3.5 w-3.5" aria-hidden="true" /> Turn notes into bullets
      </Button>
      <SuggestionDialog
        open={open}
        title="Bullet points from your notes"
        original={currentBullets.length > 0 ? currentBullets.join('\n') : notes}
        suggestion={suggestion}
        onSuggestionChange={setSuggestion}
        loading={loading}
        error={error}
        onRetry={() => void run()}
        onReject={() => setOpen(false)}
        onAccept={() => {
          onAccept(suggestion.split('\n').map((line) => line.replace(/^[-•*]\s*/, '').trim()).filter(Boolean));
          setOpen(false);
        }}
      />
    </>
  );
}
