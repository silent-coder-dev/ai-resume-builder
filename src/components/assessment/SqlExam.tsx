'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Check, CircleX, Lock, Play, Send } from 'lucide-react';
import { callAssessment } from '@/utils/aiClient';
import { Button } from '@/components/ui/Button';
import type { SqlEntry, SqlRun, SqlSession, SqlTable } from '@/components/assessment/types';

const CodeEditor = dynamic(() => import('@/components/assessment/CodeEditor').then((module) => module.CodeEditor), {
  ssr: false,
  loading: () => <div className="h-full bg-[#282c34]" />,
});

function ResultTable({ table, dark = false }: { table: SqlTable; dark?: boolean }) {
  const border = dark ? 'border-white/10' : 'border-line';
  return (
    <div className={`overflow-auto rounded-lg border ${border}`}>
      <table className="w-full text-left font-mono text-label">
        <thead className={dark ? 'bg-white/5 text-slate-300' : 'bg-surface-2 text-ink-2'}>
          <tr>{table.columns.map((column, index) => <th key={index} scope="col" className="whitespace-nowrap px-2.5 py-1.5 font-semibold">{column}</th>)}</tr>
        </thead>
        <tbody className={dark ? 'text-slate-200' : 'text-ink'}>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={`border-t ${border}`}>
              {row.map((cell, cellIndex) => <td key={cellIndex} className="whitespace-nowrap px-2.5 py-1.5">{cell === null ? 'NULL' : String(cell)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// The SQL compiler: real queries against a real database, on the server's sandbox.
export function SqlExam({
  session,
  update,
}: {
  session: SqlSession;
  update: (change: (previous: SqlSession) => SqlSession) => void;
}) {
  const [busy, setBusy] = useState<'run' | 'submit' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const entry = session.entries[session.index];

  const patchEntry = (index: number, change: (previous: SqlEntry) => SqlEntry) =>
    update((previous) => ({ ...previous, entries: previous.entries.map((item, itemIndex) => (itemIndex === index ? change(item) : item)) }));

  const act = async (kind: 'run' | 'submit') => {
    const index = session.index;
    setBusy(kind);
    setError(null);
    try {
      const result = await callAssessment<SqlRun>(kind === 'run' ? 'sql-run' : 'sql-submit', { sealed: entry.sealed, query: entry.query });
      patchEntry(index, (item) => (kind === 'run' ? { ...item, run: result, grade: null } : { ...item, run: result, grade: result }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The query could not be run.');
    } finally {
      setBusy(null);
    }
  };

  const run = entry.run;

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
        <section className="min-w-0 shrink-0 bg-surface p-4 sm:p-5 lg:w-[45%] lg:overflow-y-auto" aria-label="Problem statement">
          <h2 className="text-heading font-semibold text-ink">{entry.problem.title}</h2>
          <p className="mt-3 whitespace-pre-line text-body text-ink">{entry.problem.question}</p>
          {entry.problem.orderMatters && <p className="mt-2 text-small font-medium text-warning">Row order matters for this question.</p>}
          {entry.problem.tables.map((table) => (
            <div key={table.name} className="mt-4">
              <h3 className="mb-1.5 font-mono text-small font-semibold text-ink">{table.name}</h3>
              <ResultTable table={table} />
            </div>
          ))}
          <h3 className="mb-1.5 mt-4 text-small font-semibold text-ink">Expected result for this data</h3>
          <ResultTable table={entry.problem.expected} />
          <p className="mt-3 flex items-center gap-1.5 text-label text-ink-2">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Submit also checks your query on a hidden data set.
          </p>
        </section>

        <section className="flex min-h-[28rem] min-w-0 flex-1 flex-col bg-[#282c34] lg:min-h-0" aria-label="SQL editor">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
            <span className="text-small font-semibold text-slate-300">SQL (SQLite)</span>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => void act('run')} loading={busy === 'run'} disabled={busy !== null}>
                {busy !== 'run' && <Play className="h-3.5 w-3.5" aria-hidden="true" />} Run
              </Button>
              <Button size="sm" variant="primary" onClick={() => void act('submit')} loading={busy === 'submit'} disabled={busy !== null}>
                {busy !== 'submit' && <Send className="h-3.5 w-3.5" aria-hidden="true" />} Submit query
              </Button>
            </div>
          </div>
          <CodeEditor
            documentKey={`${session.index}`}
            language="sql"
            value={entry.query}
            label="Your SQL query"
            className="min-h-48 flex-1"
            onChange={(value) => patchEntry(session.index, (item) => ({ ...item, query: value }))}
          />
          <div className="max-h-[50%] shrink-0 overflow-y-auto border-t border-white/10 bg-slate-900 p-3 text-slate-200" aria-live="polite">
            {error && <p role="alert" className="mb-2 text-small text-rose-300">{error}</p>}
            {!busy && run?.error && <pre className="whitespace-pre-wrap font-mono text-label text-rose-300">{run.error}</pre>}
            {!busy && run && !run.error && (
              <>
                <p className={`mb-2 flex items-center gap-1.5 text-small font-semibold ${run.matches ? 'text-emerald-400' : 'text-amber-300'}`}>
                  {run.matches ? <Check className="h-4 w-4" aria-hidden="true" /> : <CircleX className="h-4 w-4" aria-hidden="true" />}
                  {run.matches ? 'Matches the expected result' : 'Doesn’t match the expected result yet'}
                </p>
                {run.columns.length > 0 ? <ResultTable table={run} dark /> : <p className="text-small text-slate-400">No rows returned.</p>}
              </>
            )}
            {!busy && entry.grade && (
              <p className={`mt-3 flex items-center gap-1.5 text-small font-semibold ${entry.grade.hiddenPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Hidden data set: {entry.grade.hiddenPassed ? 'Passed' : 'Failed'}
              </p>
            )}
            {!busy && !run && !error && <p className="text-small text-slate-400">Write one SELECT query. Run shows your result. Submit also checks it on hidden data.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
