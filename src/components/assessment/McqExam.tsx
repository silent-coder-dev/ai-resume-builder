'use client';

import { ArrowLeft, ArrowRight, Bookmark, Eraser } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { McqSession } from '@/components/assessment/types';

// One question at a time, with a palette to jump around, as in real online exams.
export function McqExam({ session, onChange }: { session: McqSession; onChange: (next: McqSession) => void }) {
  const { questions, answers, marked, index } = session;
  const question = questions[index];
  const chosen = answers[question.id];

  const go = (next: number) => onChange({ ...session, index: Math.max(0, Math.min(questions.length - 1, next)) });
  const choose = (option: number) => onChange({ ...session, answers: { ...answers, [question.id]: option } });
  const clear = () => {
    const { [question.id]: _removed, ...rest } = answers;
    void _removed;
    onChange({ ...session, answers: rest });
  };
  const toggleMark = () => onChange({ ...session, marked: marked.includes(question.id) ? marked.filter((id) => id !== question.id) : [...marked, question.id] });

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="mx-auto max-w-3xl">
            <p className="text-label font-medium text-ink-2">
              Question {index + 1} of {questions.length} · {question.topic}
              {session.negativeMark > 0 && <span> · −{session.negativeMark} for a wrong answer</span>}
            </p>
            <h2 className="mt-2 whitespace-pre-line text-card font-semibold leading-7 text-ink">{question.question}</h2>
            {question.code && (
              <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-slate-900 p-3 text-small leading-5 text-slate-100">
                <code className="font-mono">{question.code}</code>
              </pre>
            )}
            <fieldset className="mt-5 space-y-2.5">
              <legend className="sr-only">Choose one answer</legend>
              {question.options.map((option, optionIndex) => {
                const selected = chosen === optionIndex;
                return (
                  <label
                    key={option}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 text-body transition-colors ${
                      selected ? 'border-primary bg-primary-light' : 'border-line bg-surface hover:border-line-strong'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`answer-${question.id}`}
                      checked={selected}
                      onChange={() => choose(optionIndex)}
                      className="mt-1 accent-primary"
                    />
                    <span className="min-w-0 whitespace-pre-line text-ink">{option}</span>
                  </label>
                );
              })}
            </fieldset>
          </div>
        </div>
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-line bg-surface px-4 py-2.5">
          <div className="flex gap-2">
            <Button size="sm" variant={marked.includes(question.id) ? 'subtle' : 'secondary'} aria-pressed={marked.includes(question.id)} onClick={toggleMark}>
              <Bookmark className="h-4 w-4" aria-hidden="true" /> Review later
            </Button>
            <Button size="sm" variant="ghost" onClick={clear} disabled={chosen === undefined}>
              <Eraser className="h-4 w-4" aria-hidden="true" /> Clear
            </Button>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => go(index - 1)} disabled={index === 0}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Previous
            </Button>
            <Button size="sm" variant="primary" onClick={() => go(index + 1)} disabled={index === questions.length - 1}>
              Next <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </footer>
      </main>

      <aside className="shrink-0 overflow-y-auto border-t border-line bg-surface p-4 lg:w-72 lg:border-l lg:border-t-0">
        <p className="text-small font-semibold text-ink">{answeredCount} of {questions.length} answered</p>
        <nav aria-label="Questions" className="mt-3 grid grid-cols-8 gap-1.5 lg:grid-cols-5">
          {questions.map((item, itemIndex) => {
            const isAnswered = answers[item.id] !== undefined;
            const isMarked = marked.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => go(itemIndex)}
                aria-current={itemIndex === index ? 'true' : undefined}
                aria-label={`Question ${itemIndex + 1}${isAnswered ? ', answered' : ''}${isMarked ? ', marked for review' : ''}`}
                className={`relative h-9 rounded-md text-small font-semibold tabular-nums ${
                  isAnswered ? 'bg-primary text-white' : 'bg-surface-2 text-ink'
                } ${itemIndex === index ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              >
                {itemIndex + 1}
                {isMarked && <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-warning" aria-hidden="true" />}
              </button>
            );
          })}
        </nav>
        <ul className="mt-4 space-y-1 text-label text-ink-2">
          <li className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-primary" aria-hidden="true" /> Answered</li>
          <li className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-surface-2" aria-hidden="true" /> Not answered</li>
          <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-warning" aria-hidden="true" /> Marked for review</li>
        </ul>
      </aside>
    </div>
  );
}
