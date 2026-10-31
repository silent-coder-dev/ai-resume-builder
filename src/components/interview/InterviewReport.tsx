'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, RotateCcw, SkipForward } from 'lucide-react';
import { saveAttempt } from '@/lib/assessment/session';
import { callAi } from '@/utils/aiClient';
import { Button } from '@/components/ui/Button';
import { Alert, Badge, Card, Skeleton } from '@/components/ui/Primitives';
import { RATING_LABELS, averageRating, formatClock, interviewScore, type InterviewResult } from '@/components/interview/types';

interface WrittenReport {
  summary: string;
  strengths: string[];
  focusAreas: string[];
  nextSteps: string[];
}

const readiness = (score: number) =>
  score >= 80 ? { label: 'Strong', tone: 'text-success' } : score >= 60 ? { label: 'Getting there', tone: 'text-warning' } : { label: 'Needs practice', tone: 'text-error' };

// The score comes from the per-answer ratings, so the report still works if the
// AI can't write the summary.
export function InterviewReport({ result, onAgain, onDone }: { result: InterviewResult; onAgain: () => void; onDone: () => void }) {
  const [written, setWritten] = useState<WrittenReport | null>(null);
  const [loading, setLoading] = useState(true);
  const savedRef = useRef(false);

  const { turns, plan, seconds } = result;
  const score = interviewScore(turns);
  const answered = turns.filter((turn) => !turn.skipped);
  const skipped = turns.length - answered.length;
  const level = readiness(score);
  const title = plan.jobTitle || result.setup.targetRole || 'Interview';

  useEffect(() => {
    if (savedRef.current) return;
    savedRef.current = true;
    void saveAttempt({ kind: 'interview', title: `AI interview: ${title}`, percent: score, detail: `${answered.length} answered, ${skipped} skipped`, warnings: 0 });
    void (async () => {
      try {
        const report = await callAi<WrittenReport>('interview-report', {
          jobTitle: title,
          turns: turns.map((turn) => ({ question: turn.question, answer: turn.skipped ? '(skipped)' : turn.answer, ratings: turn.feedback?.ratings ?? null })),
        });
        setWritten(report);
      } catch {
        setWritten(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [answered.length, score, skipped, title, turns]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <p className="text-label font-medium uppercase tracking-wide text-ink-2">Interview report</p>
      <h1 className="mt-1 text-title font-bold tracking-tight text-ink">{title}</h1>

      <div className="mt-6 grid gap-4 md:grid-cols-[16rem_1fr]">
        <Card className="p-5">
          <p className="text-label font-medium text-ink-2">Overall (estimate)</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className={`text-title font-bold ${level.tone}`}>{score}</span>
            <span className="text-body text-ink-2">/ 100 · {level.label}</span>
          </p>
          <dl className="mt-4 space-y-1 text-small text-ink-2">
            <div className="flex justify-between"><dt>Answered</dt><dd className="font-medium text-ink">{answered.length}</dd></div>
            <div className="flex justify-between"><dt>Skipped</dt><dd className="font-medium text-ink">{skipped}</dd></div>
            <div className="flex justify-between"><dt>Time</dt><dd className="font-medium text-ink">{formatClock(seconds)}</dd></div>
          </dl>
        </Card>
        <Card className="p-5">
          <ul className="grid gap-3 sm:grid-cols-2" aria-label="Average ratings">
            {RATING_LABELS.map(({ key, label }) => {
              const value = averageRating(turns, key);
              return (
                <li key={key}>
                  <div className="flex justify-between text-small">
                    <span className="text-ink">{label}</span>
                    <span className="font-medium text-ink-2">{value === null ? 'n/a' : `${value.toFixed(1)}/5`}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(value ?? 0) * 20}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
          {loading ? (
            <Skeleton className="mt-5 h-16" />
          ) : written?.summary ? (
            <p className="mt-5 text-body text-ink">{written.summary}</p>
          ) : (
            <Alert className="mt-5">The written summary isn’t available right now. Your scores and per-question feedback are below.</Alert>
          )}
        </Card>
      </div>

      {written && (written.strengths.length > 0 || written.focusAreas.length > 0 || written.nextSteps.length > 0) && (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            { title: 'Strengths', items: written.strengths, tone: 'text-green-700' },
            { title: 'Improve first', items: written.focusAreas, tone: 'text-amber-800' },
            { title: 'Practise next', items: written.nextSteps, tone: 'text-primary' },
          ].map((group) => (
            <Card key={group.title} className="p-5">
              <h2 className={`text-small font-semibold ${group.tone}`}>{group.title}</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-small text-ink">
                {group.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mt-8 text-heading font-semibold text-ink">Question by question</h2>
      <ol className="mt-3 space-y-3">
        {turns.map((turn, index) => (
          <li key={turn.id}>
            <details className="group rounded-xl border border-line bg-surface">
              <summary className="flex cursor-pointer flex-wrap items-center gap-2 p-4 text-body font-semibold text-ink">
                <span className="text-ink-2">{index + 1}.</span>
                <span className="min-w-0 flex-1 basis-60">{turn.question}</span>
                {turn.skipped && (
                  <Badge><SkipForward className="h-3.5 w-3.5" aria-hidden="true" /> Skipped</Badge>
                )}
                {turn.feedback && (
                  <Badge tone="primary">
                    {Math.round(((turn.feedback.ratings.accuracy + turn.feedback.ratings.clarity + turn.feedback.ratings.completeness + turn.feedback.ratings.communication) / 20) * 100)}/100
                  </Badge>
                )}
              </summary>
              <div className="space-y-3 border-t border-line p-4 text-small">
                {!turn.skipped && (
                  <div>
                    <p className="text-label font-medium text-ink-2">Your answer</p>
                    <p className="mt-1 text-ink">{turn.answer}</p>
                  </div>
                )}
                {turn.feedback && turn.feedback.strengths.length > 0 && (
                  <div>
                    <p className="text-label font-medium text-green-700">What worked</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-ink">{turn.feedback.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                )}
                {turn.feedback && turn.feedback.improvements.length > 0 && (
                  <div>
                    <p className="text-label font-medium text-amber-800">To improve</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-ink">{turn.feedback.improvements.map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                )}
                {turn.feedback?.youCouldSay && (
                  <div className="rounded-lg bg-primary-light p-3">
                    <p className="text-label font-semibold text-primary">You could say it like this</p>
                    <p className="mt-1 text-ink">{turn.feedback.youCouldSay}</p>
                  </div>
                )}
              </div>
            </details>
          </li>
        ))}
      </ol>

      <p className="mt-6 text-label text-ink-2">Scores are estimates to help you practise. They do not predict a real interview’s result.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="primary" onClick={onAgain}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> Practice again
        </Button>
        <Button variant="secondary" onClick={onDone}>
          Back to setup <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
