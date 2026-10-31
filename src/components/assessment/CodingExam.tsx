'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Check, CircleX, Lock, Play, Send } from 'lucide-react';
import { CODE_LANGUAGES, type CodeLanguage } from '@/lib/assessment/languages';
import { callAssessment } from '@/utils/aiClient';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { Skeleton } from '@/components/ui/Primitives';
import type { CodingEntry, CodingGrade, CodingSession, PublicTestResult, TestVerdict } from '@/components/assessment/types';

const CodeEditor = dynamic(() => import('@/components/assessment/CodeEditor').then((module) => module.CodeEditor), {
  ssr: false,
  loading: () => <div className="h-full bg-[#282c34]" />,
});

export const VERDICT_TEXT: Record<TestVerdict, string> = {
  passed: 'Passed',
  wrong_answer: 'Wrong answer',
  compile_error: 'Compile error',
  runtime_error: 'Runtime error',
  time_limit: 'Time limit exceeded',
  not_run: 'Not run (compiler busy)',
};

export const starterFor = (language: CodeLanguage) => CODE_LANGUAGES.find((item) => item.id === language)?.starter ?? '';
export const codeOf = (entry: CodingEntry) => entry.code[entry.language] ?? starterFor(entry.language);

function Verdict({ verdict }: { verdict: TestVerdict }) {
  const passed = verdict === 'passed';
  return (
    <span className={`inline-flex items-center gap-1 text-label font-semibold ${passed ? 'text-emerald-400' : verdict === 'not_run' ? 'text-slate-400' : 'text-rose-400'}`}>
      {passed ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <CircleX className="h-3.5 w-3.5" aria-hidden="true" />}
      {VERDICT_TEXT[verdict]}
    </span>
  );
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-label text-slate-400">{label}</p>
      <pre className="mt-1 max-h-32 overflow-auto rounded bg-black/30 p-2 font-mono text-label text-slate-200">{value || '(empty)'}</pre>
    </div>
  );
}

function PublicResults({ results }: { results: PublicTestResult[] }) {
  const compileError = results.find((result) => result.verdict === 'compile_error');
  if (compileError) {
    return (
      <div>
        <Verdict verdict="compile_error" />
        <pre className="mt-2 max-h-48 overflow-auto rounded bg-black/30 p-2 font-mono text-label text-rose-200">{compileError.stderr || 'The code did not compile.'}</pre>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {results.map((result, index) => (
        <li key={index} className="rounded-lg border border-white/10 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-small font-semibold text-slate-200">Public test {index + 1}</span>
            <Verdict verdict={result.verdict} />
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <TextBlock label="Input" value={result.input} />
            <TextBlock label="Expected" value={result.expected} />
            <TextBlock label="Your output" value={result.stdout} />
          </div>
          {result.stderr && <TextBlock label="Errors" value={result.stderr} />}
        </li>
      ))}
    </ul>
  );
}

function HiddenResults({ grade }: { grade: CodingGrade }) {
  return (
    <div className="mt-4">
      <p className="flex items-center gap-1.5 text-small font-semibold text-slate-200">
        <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Hidden tests
      </p>
      <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {grade.hidden.map((result, index) => (
          <li key={index} className="flex items-center justify-between gap-2 rounded-md border border-white/10 px-2.5 py-1.5">
            <span className="text-label text-slate-300">Hidden test {index + 1}</span>
            <Verdict verdict={result.verdict} />
          </li>
        ))}
      </ul>
    </div>
  );
}

// The compiler view: the problem on one side, the editor and console on the other.
export function CodingExam({
  session,
  update,
}: {
  session: CodingSession;
  update: (change: (previous: CodingSession) => CodingSession) => void;
}) {
  const [busy, setBusy] = useState<'run' | 'submit' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const entry = session.entries[session.index];

  const patchEntry = (index: number, change: (previous: CodingEntry) => CodingEntry) =>
    update((previous) => ({ ...previous, entries: previous.entries.map((item, itemIndex) => (itemIndex === index ? change(item) : item)) }));

  const act = async (kind: 'run' | 'submit') => {
    const index = session.index;
    setBusy(kind);
    setError(null);
    try {
      const payload = { sealed: entry.sealed, language: entry.language, source: codeOf(entry) };
      if (kind === 'run') {
        const result = await callAssessment<{ public: PublicTestResult[] }>('coding-run', payload);
        patchEntry(index, (item) => ({ ...item, run: result.public, grade: null }));
      } else {
        const grade = await callAssessment<CodingGrade>('coding-submit', payload);
        patchEntry(index, (item) => ({ ...item, run: grade.public, grade }));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The code could not be run.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {session.planned > 1 && (
        <nav aria-label="Problems" className="flex shrink-0 gap-1 border-b border-line bg-surface px-3 py-1.5">
          {Array.from({ length: session.planned }, (_, index) => {
            const item = session.entries[index];
            return (
              <button
                key={index}
                type="button"
                disabled={!item}
                aria-current={index === session.index ? 'true' : undefined}
                onClick={() => update((previous) => ({ ...previous, index }))}
                className={`rounded-md px-3 py-1 text-small font-semibold ${index === session.index ? 'bg-primary-light text-primary' : 'text-ink-2 hover:bg-surface-2'} disabled:opacity-50`}
              >
                Problem {index + 1}
                {!item && ' (preparing…)'}
                {item?.grade?.accepted && ' ✓'}
              </button>
            );
          })}
        </nav>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        <section className="min-w-0 shrink-0 bg-surface p-4 sm:p-5 lg:w-[42%] lg:overflow-y-auto" aria-label="Problem statement">
          <h2 className="text-heading font-semibold text-ink">{entry.problem.title}</h2>
          <p className="mt-3 whitespace-pre-line text-body text-ink">{entry.problem.statement}</p>
          {entry.problem.inputFormat && (
            <>
              <h3 className="mt-4 text-small font-semibold text-ink">Input format</h3>
              <p className="mt-1 whitespace-pre-line text-small text-ink">{entry.problem.inputFormat}</p>
            </>
          )}
          {entry.problem.outputFormat && (
            <>
              <h3 className="mt-4 text-small font-semibold text-ink">Output format</h3>
              <p className="mt-1 whitespace-pre-line text-small text-ink">{entry.problem.outputFormat}</p>
            </>
          )}
          {entry.problem.constraints.length > 0 && (
            <>
              <h3 className="mt-4 text-small font-semibold text-ink">Constraints</h3>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-small text-ink">
                {entry.problem.constraints.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </>
          )}
          <h3 className="mt-4 text-small font-semibold text-ink">Examples</h3>
          <div className="mt-2 space-y-3">
            {entry.problem.examples.map((example, index) => (
              <div key={index} className="grid gap-2 rounded-lg border border-line p-3 sm:grid-cols-2">
                <div className="min-w-0">
                  <p className="text-label text-ink-2">Input</p>
                  <pre className="mt-1 overflow-auto rounded bg-surface-2 p-2 font-mono text-label text-ink">{example.input}</pre>
                </div>
                <div className="min-w-0">
                  <p className="text-label text-ink-2">Output</p>
                  <pre className="mt-1 overflow-auto rounded bg-surface-2 p-2 font-mono text-label text-ink">{example.expected}</pre>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-label text-ink-2">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Submit also runs {entry.problem.hiddenCount} hidden test{entry.problem.hiddenCount === 1 ? '' : 's'}.
          </p>
        </section>

        <section className="flex min-h-[32rem] min-w-0 flex-1 flex-col bg-[#282c34] lg:min-h-0" aria-label="Code editor">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
            <Select
              aria-label="Language"
              value={entry.language}
              className="!h-8 !w-36 border-white/20 !bg-slate-800 !text-small !text-white"
              onChange={(event) => patchEntry(session.index, (item) => ({ ...item, language: event.target.value as CodeLanguage }))}
            >
              {CODE_LANGUAGES.map((language) => <option key={language.id} value={language.id}>{language.label}</option>)}
            </Select>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => void act('run')} loading={busy === 'run'} disabled={busy !== null}>
                {busy !== 'run' && <Play className="h-3.5 w-3.5" aria-hidden="true" />} Run
              </Button>
              <Button size="sm" variant="primary" onClick={() => void act('submit')} loading={busy === 'submit'} disabled={busy !== null}>
                {busy !== 'submit' && <Send className="h-3.5 w-3.5" aria-hidden="true" />} Submit code
              </Button>
            </div>
          </div>
          <CodeEditor
            documentKey={`${session.index}-${entry.language}`}
            language={entry.language}
            value={codeOf(entry)}
            label={`Your ${entry.language} code`}
            className="min-h-64 flex-1"
            onChange={(value) => patchEntry(session.index, (item) => ({ ...item, code: { ...item.code, [item.language]: value } }))}
          />
          <div className="max-h-[45%] shrink-0 overflow-y-auto border-t border-white/10 bg-slate-900 p-3 text-slate-200" aria-live="polite">
            {error && <p role="alert" className="mb-2 text-small text-rose-300">{error}</p>}
            {busy && (
              <div className="space-y-2" aria-label="Running your code">
                <Skeleton className="h-4 w-1/2 !bg-white/10" />
                <Skeleton className="h-4 w-3/4 !bg-white/10" />
              </div>
            )}
            {!busy && entry.grade && (
              <p className={`mb-3 text-body font-semibold ${entry.grade.accepted ? 'text-emerald-400' : 'text-amber-300'}`}>
                {entry.grade.accepted ? 'All tests passed' : `${entry.grade.passed} of ${entry.grade.total} tests passed`}
                {entry.grade.incomplete && <span className="ml-2 text-small font-normal text-slate-400">Some tests couldn’t run. Submit again.</span>}
              </p>
            )}
            {!busy && entry.run && <PublicResults results={entry.run} />}
            {!busy && entry.grade && <HiddenResults grade={entry.grade} />}
            {!busy && !entry.run && !error && (
              <p className="text-small text-slate-400">Run checks your code on the public tests. Submit code also runs the hidden tests. Read input from stdin and print only the answer.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
