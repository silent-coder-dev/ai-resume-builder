'use client';

import { useEffect, useState } from 'react';
import { Check, CircleX, Minus, RotateCcw, ShieldAlert, ShieldCheck } from 'lucide-react';
import { callAssessment } from '@/utils/aiClient';
import { Button } from '@/components/ui/Button';
import { Alert, Badge, Card } from '@/components/ui/Primitives';
import { PROCTOR_EVENT_TEXT } from '@/components/assessment/useProctor';
import type { ExamResult, McqGrade, McqSession } from '@/components/assessment/types';

function Integrity({ result }: { result: ExamResult }) {
  const { events } = result.session;
  const clean = events.length === 0;
  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 text-card font-semibold text-ink">
        {clean ? <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" /> : <ShieldAlert className="h-4 w-4 text-warning" aria-hidden="true" />}
        Test integrity
      </h2>
      {clean ? (
        <p className="mt-1 text-small text-ink-2">You stayed in the test the whole time.</p>
      ) : (
        <ul className="mt-2 space-y-1 text-small text-ink">
          {events.map((event, index) => (
            <li key={index} className="flex justify-between gap-3">
              <span>{PROCTOR_EVENT_TEXT[event.type]}</span>
              <span className="shrink-0 tabular-nums text-ink-2">{new Date(event.at).toLocaleTimeString()}</span>
            </li>
          ))}
        </ul>
      )}
      {result.endedBy === 'warnings' && <p className="mt-2 text-small font-medium text-error">The test ended automatically after too many warnings.</p>}
      {result.endedBy === 'time' && <p className="mt-2 text-small font-medium text-warning">Time ran out, so the test was submitted automatically.</p>}
    </Card>
  );
}

function McqReview({ session, grade }: { session: McqSession; grade: McqGrade }) {
  const topics = new Map<string, { correct: number; total: number }>();
  session.questions.forEach((question, index) => {
    const item = topics.get(question.topic) ?? { correct: 0, total: 0 };
    item.total += 1;
    if (grade.items[index]?.correct) item.correct += 1;
    topics.set(question.topic, item);
  });

  return (
    <>
      <Card className="mt-4 p-5">
        <h2 className="text-card font-semibold text-ink">By topic</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {[...topics].map(([topic, value]) => (
            <li key={topic}>
              <div className="flex justify-between gap-2 text-small">
                <span className="min-w-0 truncate text-ink">{topic}</span>
                <span className="shrink-0 font-medium text-ink-2">{value.correct}/{value.total}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(value.correct / value.total) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <h2 className="mt-8 text-heading font-semibold text-ink">Review your answers</h2>
      <ol className="mt-3 space-y-3">
        {session.questions.map((question, index) => {
          const item = grade.items[index];
          if (!item) return null;
          return (
            <li key={question.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 whitespace-pre-line text-body font-medium text-ink">{index + 1}. {question.question}</p>
                {item.correct ? (
                  <Badge tone="success"><Check className="h-3.5 w-3.5" aria-hidden="true" /> Correct</Badge>
                ) : item.chosen === null ? (
                  <Badge><Minus className="h-3.5 w-3.5" aria-hidden="true" /> Skipped</Badge>
                ) : (
                  <Badge tone="error"><CircleX className="h-3.5 w-3.5" aria-hidden="true" /> Wrong</Badge>
                )}
              </div>
              {question.code && <pre className="mt-2 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-label text-slate-100">{question.code}</pre>}
              <ul className="mt-2 space-y-1 text-small">
                {question.options.map((option, optionIndex) => (
                  <li
                    key={option}
                    className={`whitespace-pre-line rounded px-2 py-1 ${
                      optionIndex === item.answer ? 'bg-green-50 font-medium text-green-800' : optionIndex === item.chosen ? 'bg-red-50 text-red-800' : 'text-ink-2'
                    }`}
                  >
                    {option}
                    {optionIndex === item.answer ? ' (correct answer)' : optionIndex === item.chosen ? ' (your answer)' : ''}
                  </li>
                ))}
              </ul>
              {item.explanation && <p className="mt-2 text-small text-ink"><span className="font-medium">Why: </span>{item.explanation}</p>}
            </li>
          );
        })}
      </ol>
    </>
  );
}

interface Review {
  approach: string;
  reference: string;
  referenceLanguage: string;
}

function ProblemReview({ title, sealed, summary, accepted }: { title: string; sealed: string; summary: string; accepted: boolean }) {
  const [review, setReview] = useState<Review | null>(null);

  useEffect(() => {
    void callAssessment<Review>('review', { sealed }).then(setReview).catch(() => setReview(null));
  }, [sealed]);

  return (
    <li className="rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-body font-semibold text-ink">{title}</h3>
        <Badge tone={accepted ? 'success' : 'warning'}>{summary}</Badge>
      </div>
      {review?.approach && <p className="mt-2 text-small text-ink"><span className="font-medium">Approach: </span>{review.approach}</p>}
      {review?.reference && (
        <details className="mt-2">
          <summary className="cursor-pointer text-small font-semibold text-primary">Show a sample solution ({review.referenceLanguage})</summary>
          <pre className="mt-2 max-h-96 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-label text-slate-100">{review.reference}</pre>
        </details>
      )}
    </li>
  );
}

export function ExamResults({ result, onRetake, onDone }: { result: ExamResult; onRetake: () => void; onDone: () => void }) {
  const { session, mcq, percent } = result;
  const tone = percent >= 75 ? 'text-success' : percent >= 50 ? 'text-warning' : 'text-error';

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <p className="text-label font-medium uppercase tracking-wide text-ink-2">Test results</p>
      <h1 className="mt-1 text-title font-bold tracking-tight text-ink">{session.title}</h1>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <p className="text-label font-medium text-ink-2">Your score</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className={`text-title font-bold ${tone}`}>{percent}%</span>
            {mcq && <span className="text-body text-ink-2">{mcq.score} of {mcq.total} marks</span>}
          </p>
          {mcq && (
            <p className="mt-2 text-small text-ink-2">
              {mcq.correct} correct · {mcq.wrong} wrong · {mcq.unanswered} not answered
              {mcq.negativeMark > 0 && ` · −${mcq.negativeMark} per wrong answer`}
            </p>
          )}
        </Card>
        <Integrity result={result} />
      </div>

      {session.kind === 'mcq' && mcq && (
        <>
          <Alert className="mt-4">Questions and answers are written by AI and can contain mistakes. Check anything that looks wrong against your study material.</Alert>
          <McqReview session={session} grade={mcq} />
        </>
      )}

      {session.kind === 'coding' && (
        <ul className="mt-4 space-y-3">
          {session.entries.map((entry) => (
            <ProblemReview
              key={entry.sealed}
              title={entry.problem.title}
              sealed={entry.sealed}
              accepted={Boolean(entry.grade?.accepted)}
              summary={entry.grade ? `${entry.grade.passed} of ${entry.grade.total} tests passed` : 'Not submitted'}
            />
          ))}
        </ul>
      )}

      {session.kind === 'sql' && (
        <ul className="mt-4 space-y-3">
          {session.entries.map((entry) => (
            <ProblemReview
              key={entry.sealed}
              title={entry.problem.title}
              sealed={entry.sealed}
              accepted={Boolean(entry.grade?.accepted)}
              summary={entry.grade ? (entry.grade.accepted ? 'All checks passed' : entry.grade.matches ? 'Hidden data failed' : 'Not correct yet') : 'Not submitted'}
            />
          ))}
        </ul>
      )}

      <p className="mt-6 text-label text-ink-2">This is self-assessment for practice. The protected mode discourages cheating, but no website can fully prevent it, so this score is not a certificate.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="primary" onClick={onRetake}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> New test with the same settings
        </Button>
        <Button variant="secondary" onClick={onDone}>Back to all tests</Button>
      </div>
    </div>
  );
}
