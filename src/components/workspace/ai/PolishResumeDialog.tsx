'use client';

import { useMemo, useState } from 'react';
import type { ResumeData } from '@/types/resume';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { callAi } from '@/utils/aiClient';
import { normalizeResumeData } from '@/utils/normalizeResumeData';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Alert, Skeleton } from '@/components/ui/Primitives';
import { toast } from '@/components/ui/Toast';

interface Change {
  key: string;
  label: string;
  before: string;
  after: string;
  apply: (data: ResumeData) => ResumeData;
}

const byId = <T extends { id: string }>(items: T[] = []) => new Map(items.map((item) => [item.id, item]));

// Builds one reviewable change per edited field, matched to the CURRENT resume by ID.
function buildChanges(current: ResumeData, polished: ResumeData): Change[] {
  const changes: Change[] = [];
  if (current.personalInfo.summary.trim() && polished.personalInfo.summary.trim() && polished.personalInfo.summary !== current.personalInfo.summary) {
    const after = polished.personalInfo.summary;
    changes.push({
      key: 'summary',
      label: 'Professional summary',
      before: current.personalInfo.summary,
      after,
      apply: (data) => ({ ...data, personalInfo: { ...data.personalInfo, summary: after } }),
    });
  }
  const experiences = byId(polished.experiences);
  current.experiences.forEach((item) => {
    const next = experiences.get(item.id);
    if (!next) return;
    const label = [item.role, item.company].filter(Boolean).join(' · ') || 'Work experience';
    const beforeBullets = (item.enhancedBullets ?? []).join('\n');
    const afterBullets = (next.enhancedBullets ?? []).join('\n');
    if (afterBullets && afterBullets !== beforeBullets && (next.enhancedBullets ?? []).length === (item.enhancedBullets ?? []).length) {
      changes.push({
        key: `${item.id}-bullets`,
        label: `${label} — bullet points`,
        before: beforeBullets,
        after: afterBullets,
        apply: (data) => ({
          ...data,
          experiences: data.experiences.map((entry) => (entry.id === item.id ? { ...entry, enhancedBullets: next.enhancedBullets } : entry)),
        }),
      });
    }
    if (next.rawDetails.trim() && item.rawDetails.trim() && next.rawDetails !== item.rawDetails) {
      changes.push({
        key: `${item.id}-notes`,
        label: `${label} — notes`,
        before: item.rawDetails,
        after: next.rawDetails,
        apply: (data) => ({
          ...data,
          experiences: data.experiences.map((entry) => (entry.id === item.id ? { ...entry, rawDetails: next.rawDetails } : entry)),
        }),
      });
    }
  });
  const projects = byId(polished.projects);
  current.projects.forEach((item) => {
    const next = projects.get(item.id);
    if (next && next.description.trim() && item.description.trim() && next.description !== item.description) {
      changes.push({
        key: `${item.id}-project`,
        label: `${item.title || 'Project'} — description`,
        before: item.description,
        after: next.description,
        apply: (data) => ({
          ...data,
          projects: data.projects.map((entry) => (entry.id === item.id ? { ...entry, description: next.description } : entry)),
        }),
      });
    }
  });
  const achievements = byId(polished.achievements);
  (current.achievements ?? []).forEach((item) => {
    const next = achievements.get(item.id);
    if (next && next.description.trim() && item.description.trim() && next.description !== item.description) {
      changes.push({
        key: `${item.id}-achievement`,
        label: `${item.title || 'Achievement'} — details`,
        before: item.description,
        after: next.description,
        apply: (data) => ({
          ...data,
          achievements: (data.achievements ?? []).map((entry) => (entry.id === item.id ? { ...entry, description: next.description } : entry)),
        }),
      });
    }
  });
  return changes;
}

// "Polish wording with AI": grammar and clarity across the whole resume,
// with every change shown and individually accepted or rejected.
export function PolishResumeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const current = useWorkspaceStore((state) => state.current);
  const replaceData = useWorkspaceStore((state) => state.replaceData);
  const checkpoint = useWorkspaceStore((state) => state.checkpoint);
  const [polished, setPolished] = useState<ResumeData | null>(null);
  const [rejected, setRejected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  const changes = useMemo(() => (current && polished ? buildChanges(current.data, polished) : []), [current, polished]);

  const run = async () => {
    if (!current) return;
    setStarted(true);
    setLoading(true);
    setError(null);
    setPolished(null);
    setRejected(new Set());
    try {
      const result = await callAi<unknown>('optimize-resume', { resumeData: current.data });
      setPolished(normalizeResumeData(result));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The AI could not review this resume.');
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setStarted(false);
    setPolished(null);
    setError(null);
    onClose();
  };

  const accepted = changes.filter((change) => !rejected.has(change.key));

  const apply = async () => {
    if (!current || accepted.length === 0) return close();
    await checkpoint('Before AI polish');
    const latest = useWorkspaceStore.getState().current;
    if (!latest) return close();
    replaceData(accepted.reduce((data, change) => change.apply(data), latest.data));
    toast(`${accepted.length} change${accepted.length === 1 ? '' : 's'} applied. The previous version is in Version history.`);
    close();
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      dismissible={!loading}
      title="Polish wording with AI"
      description="AI fixes grammar and clarity in your existing text. Names, dates, skills, and education are never changed."
      size="lg"
      footer={
        !started ? (
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void run()}>
              Review my resume
            </Button>
          </>
        ) : (
          <>
            {error && (
              <Button variant="secondary" onClick={() => void run()} className="sm:mr-auto">
                Try again
              </Button>
            )}
            <Button variant="secondary" onClick={close} disabled={loading}>
              Keep original
            </Button>
            <Button variant="primary" onClick={() => void apply()} disabled={loading || accepted.length === 0}>
              Apply {accepted.length} selected
            </Button>
          </>
        )
      }
    >
      {!started && (
        <p className="text-body text-ink-2">
          You will see every suggested change next to your original text and can accept or reject each one. Nothing
          changes until you press Apply.
        </p>
      )}
      {loading && (
        <div className="space-y-3" aria-label="Reviewing your resume">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      )}
      {error && <Alert tone="error">{error}</Alert>}
      {started && !loading && !error && polished && changes.length === 0 && (
        <Alert tone="success">No wording changes were suggested. Your resume already reads clearly.</Alert>
      )}
      {changes.length > 0 && !loading && (
        <ul className="space-y-3">
          {changes.map((change) => {
            const isAccepted = !rejected.has(change.key);
            return (
              <li key={change.key} className={`rounded-xl border p-4 ${isAccepted ? 'border-primary/40 bg-primary-light/40' : 'border-line'}`}>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-primary"
                    checked={isAccepted}
                    onChange={() =>
                      setRejected((previous) => {
                        const next = new Set(previous);
                        if (next.has(change.key)) next.delete(change.key);
                        else next.add(change.key);
                        return next;
                      })
                    }
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-small font-semibold text-ink">{change.label}</span>
                    <span className="mt-2 grid gap-2 sm:grid-cols-2">
                      <span className="block whitespace-pre-wrap rounded-lg bg-surface-2 p-3 text-small text-ink-2">
                        <span className="mb-1 block text-label font-medium">Original</span>
                        {change.before}
                      </span>
                      <span className="block whitespace-pre-wrap rounded-lg bg-surface p-3 text-small text-ink">
                        <span className="mb-1 block text-label font-medium text-primary">Suggestion</span>
                        {change.after}
                      </span>
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </Dialog>
  );
}
