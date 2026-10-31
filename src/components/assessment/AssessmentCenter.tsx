'use client';

import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CircleHelp, Code2, Database, LoaderCircle, Maximize, ShieldCheck } from 'lucide-react';
import { TRACKS, TRACK_GROUPS, type Difficulty, type RoundKind, type Track } from '@/lib/assessment/catalog';
import { CODE_LANGUAGES, type CodeLanguage } from '@/lib/assessment/languages';
import {
  clearSnapshot,
  enterFullscreen,
  exitFullscreen,
  loadAttempts,
  loadSnapshot,
  saveAttempt,
  saveSnapshot,
  type AttemptSummary,
} from '@/lib/assessment/session';
import { callAssessment } from '@/utils/aiClient';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Checkbox, SelectField, TextField } from '@/components/ui/Field';
import { Alert, Badge, Card, PageHeader, formatRelativeTime } from '@/components/ui/Primitives';
import { CodingExam, codeOf, starterFor } from '@/components/assessment/CodingExam';
import { ExamResults } from '@/components/assessment/ExamResults';
import { ExamShell } from '@/components/assessment/ExamShell';
import { McqExam } from '@/components/assessment/McqExam';
import { SqlExam } from '@/components/assessment/SqlExam';
import { MAX_WARNINGS } from '@/components/assessment/useProctor';
import type {
  CodingEntry,
  CodingGrade,
  CodingProblem,
  CodingSession,
  ExamResult,
  ExamSession,
  McqGrade,
  McqStart,
  SqlEntry,
  SqlProblem,
  SqlRun,
  SqlSession,
} from '@/components/assessment/types';

const SNAPSHOT_KEY = 'ai-resume-studio:exam-session';

const KIND_META: Record<RoundKind, { label: string; icon: typeof Code2 }> = {
  mcq: { label: 'MCQ', icon: CircleHelp },
  coding: { label: 'Compiler', icon: Code2 },
  sql: { label: 'SQL compiler', icon: Database },
};

interface TestConfig {
  track: Track;
  topics: string[];
  customTopic: string;
  difficulty: Difficulty;
  count: number;
  problems: number;
  language: CodeLanguage;
}

const defaultConfig = (track: Track): TestConfig => ({
  track,
  topics: [],
  customTopic: '',
  difficulty: 'medium',
  count: 10,
  problems: 1,
  language: 'python',
});

function Preparing({ title, error, onRetry, onExit }: { title: string; error: string | null; onRetry: () => void; onExit: () => void }) {
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950 p-6 text-center text-white">
      <div className="max-w-md">
        {error ? (
          <>
            <h2 className="text-heading font-semibold">The test could not be prepared</h2>
            <p role="alert" className="mt-2 text-body text-slate-300">{error}</p>
            <div className="mt-5 flex justify-center gap-2">
              <Button variant="primary" onClick={onRetry}>Try again</Button>
              <button type="button" onClick={onExit} className="rounded-lg px-4 text-body font-semibold text-slate-300 hover:bg-white/10">Exit</button>
            </div>
          </>
        ) : (
          <>
            <LoaderCircle className="mx-auto h-9 w-9 animate-spin text-indigo-300 motion-reduce:animate-none" aria-hidden="true" />
            <h2 className="mt-4 text-heading font-semibold">Preparing {title}</h2>
            <p className="mt-2 text-body text-slate-400" role="status">Writing fresh questions and checking them. This can take up to a minute. The timer starts when your test appears.</p>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

function TrackCard({ track, compilerAvailable, onOpen }: { track: Track; compilerAvailable: boolean | null; onOpen: () => void }) {
  const meta = KIND_META[track.kind];
  const Icon = meta.icon;
  const unavailable = track.kind === 'coding' && compilerAvailable === false;
  return (
    <li>
      <button type="button" onClick={onOpen} className="flex h-full w-full flex-col rounded-xl border border-line bg-surface p-4 text-left transition-colors hover:border-primary">
        <span className="flex w-full items-center justify-between gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          {unavailable ? <Badge tone="warning">Not set up</Badge> : <Badge>{meta.label}</Badge>}
        </span>
        <span className="mt-3 text-card font-semibold text-ink">{track.title}</span>
        <span className="mt-1 text-small text-ink-2">{track.description}</span>
      </button>
    </li>
  );
}

// The Assessment Center: pick a test, choose topics, and take it in a protected,
// full-screen environment. Questions are written fresh by AI for every attempt.
export function AssessmentCenter() {
  const [group, setGroup] = useState(TRACK_GROUPS[0].id);
  const [config, setConfig] = useState<TestConfig | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [compilerAvailable, setCompilerAvailable] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [saved, setSaved] = useState<ExamSession | null>(null);
  const [extendedScreen, setExtendedScreen] = useState(false);

  const [preparing, setPreparing] = useState<{ error: string | null } | null>(null);
  const [session, setSession] = useState<ExamSession | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);

  const sessionRef = useRef<ExamSession | null>(null);
  const finishingRef = useRef(false);
  const startRunRef = useRef(0);

  useEffect(() => {
    sessionRef.current = session;
    if (session) saveSnapshot(SNAPSHOT_KEY, session);
  }, [session]);

  useEffect(() => {
    void (async () => {
      setAttempts(await loadAttempts());
      setSaved(loadSnapshot<ExamSession>(SNAPSHOT_KEY));
      setExtendedScreen((window.screen as Screen & { isExtended?: boolean }).isExtended === true);
      try {
        const response = await fetch('/api/assessment');
        const data = (await response.json()) as { result?: { compilerAvailable?: boolean } };
        setCompilerAvailable(data.result?.compilerAvailable === true);
      } catch {
        setCompilerAvailable(false);
      }
    })();
  }, [result]);

  const leave = useCallback(() => {
    startRunRef.current += 1;
    void exitFullscreen();
    clearSnapshot(SNAPSHOT_KEY);
    setPreparing(null);
    setSession(null);
    setSubmitting(false);
    finishingRef.current = false;
  }, []);

  /* ---------- Starting ---------- */

  const begin = useCallback(async (active: TestConfig) => {
    const run = (startRunRef.current += 1);
    setPreparing({ error: null });
    setResult(null);
    const { track } = active;
    const common = { topics: active.topics, customTopic: active.customTopic, difficulty: active.difficulty };
    const title = track.title;
    try {
      if (track.kind === 'mcq') {
        const started = await callAssessment<McqStart>('mcq-start', { ...common, trackId: track.id, count: active.count });
        if (run !== startRunRef.current) return;
        setSession({
          kind: 'mcq',
          title,
          questions: started.questions,
          negativeMark: started.negativeMark,
          sealed: started.sealed,
          answers: {},
          marked: [],
          index: 0,
          deadline: Date.now() + started.seconds * 1000,
          events: [],
        });
      } else {
        const action = track.kind === 'coding' ? 'coding-start' : 'sql-start';
        const fetchOne = <T,>(avoid: string[]) =>
          callAssessment<{ problem: T; seconds: number; sealed: string }>(action, { ...common, problems: active.problems, avoid });

        if (track.kind === 'coding') {
          const first = await fetchOne<CodingProblem>([]);
          if (run !== startRunRef.current) return;
          const toEntry = (made: { problem: CodingProblem; sealed: string }): CodingEntry => ({ problem: made.problem, sealed: made.sealed, code: {}, language: active.language, run: null, grade: null });
          setSession({
            kind: 'coding',
            title,
            entries: [toEntry(first)],
            planned: active.problems,
            index: 0,
            deadline: Date.now() + first.seconds * active.problems * 1000,
            events: [],
          });
          setPreparing(null);
          // The other problems arrive while the candidate works on the first.
          const avoid = [first.problem.title];
          for (let index = 1; index < active.problems; index += 1) {
            try {
              const next = await fetchOne<CodingProblem>(avoid);
              if (run !== startRunRef.current) return;
              avoid.push(next.problem.title);
              setSession((previous) => (previous?.kind === 'coding' ? { ...previous, entries: [...previous.entries, toEntry(next)] } : previous));
            } catch {
              setSession((previous) => (previous?.kind === 'coding' ? { ...previous, planned: previous.entries.length } : previous));
              break;
            }
          }
        } else {
          const first = await fetchOne<SqlProblem>([]);
          if (run !== startRunRef.current) return;
          const toEntry = (made: { problem: SqlProblem; sealed: string }): SqlEntry => ({ problem: made.problem, sealed: made.sealed, query: 'SELECT ', run: null, grade: null });
          setSession({
            kind: 'sql',
            title,
            entries: [toEntry(first)],
            planned: active.problems,
            index: 0,
            deadline: Date.now() + first.seconds * active.problems * 1000,
            events: [],
          });
          setPreparing(null);
          const avoid = [first.problem.title];
          for (let index = 1; index < active.problems; index += 1) {
            try {
              const next = await fetchOne<SqlProblem>(avoid);
              if (run !== startRunRef.current) return;
              avoid.push(next.problem.title);
              setSession((previous) => (previous?.kind === 'sql' ? { ...previous, entries: [...previous.entries, toEntry(next)] } : previous));
            } catch {
              setSession((previous) => (previous?.kind === 'sql' ? { ...previous, planned: previous.entries.length } : previous));
              break;
            }
          }
        }
      }
      setPreparing(null);
    } catch (caught) {
      if (run !== startRunRef.current) return;
      setPreparing({ error: caught instanceof Error ? caught.message : 'Please try again.' });
    }
  }, []);

  const startTest = async () => {
    if (!config) return;
    // Full screen has to be requested inside this click.
    await enterFullscreen();
    finishingRef.current = false;
    clearSnapshot(SNAPSHOT_KEY);
    void begin(config);
  };

  const resumeSaved = async () => {
    if (!saved) return;
    await enterFullscreen();
    finishingRef.current = false;
    // Reloading during a test is recorded.
    setSession({ ...saved, events: [...saved.events, { type: 'reloaded', at: Date.now() }] });
    setSaved(null);
  };

  /* ---------- Finishing ---------- */

  const finish = useCallback(async (endedBy: ExamResult['endedBy']) => {
    const active = sessionRef.current;
    if (!active || finishingRef.current) return;
    finishingRef.current = true;
    startRunRef.current += 1;
    setConfirmSubmit(false);
    setSubmitting(true);

    let graded: ExamSession = active;
    let mcq: McqGrade | null = null;
    let percent = 0;

    if (active.kind === 'mcq') {
      try {
        mcq = await callAssessment<McqGrade>('mcq-submit', { sealed: active.sealed, answers: active.answers });
        percent = Math.max(0, Math.round((mcq.score / mcq.total) * 100));
      } catch (caught) {
        // Keep the answers and the session so the candidate can submit again.
        finishingRef.current = false;
        setSubmitting(false);
        window.alert(caught instanceof Error ? caught.message : 'Your answers could not be submitted. Please try again.');
        return;
      }
    } else if (active.kind === 'coding') {
      // Anything written but not submitted still counts.
      const entries = await Promise.all(
        active.entries.map(async (entry) => {
          const code = codeOf(entry);
          if (entry.grade || code.trim() === starterFor(entry.language).trim()) return entry;
          try {
            const grade = await callAssessment<CodingGrade>('coding-submit', { sealed: entry.sealed, language: entry.language, source: code });
            return { ...entry, grade, run: grade.public };
          } catch {
            return entry;
          }
        })
      );
      graded = { ...active, entries } satisfies CodingSession;
      const share = entries.reduce((sum, entry) => sum + (entry.grade ? entry.grade.passed / Math.max(1, entry.grade.total) : 0), 0);
      percent = Math.round((share / Math.max(1, active.planned)) * 100);
    } else {
      const entries = await Promise.all(
        active.entries.map(async (entry) => {
          if (entry.grade || entry.query.trim().toUpperCase() === 'SELECT') return entry;
          try {
            const grade = await callAssessment<SqlRun>('sql-submit', { sealed: entry.sealed, query: entry.query });
            return { ...entry, grade, run: grade };
          } catch {
            return entry;
          }
        })
      );
      graded = { ...active, entries } satisfies SqlSession;
      const share = entries.reduce((sum, entry) => sum + (entry.grade ? ((entry.grade.matches ? 1 : 0) + (entry.grade.hiddenPassed ? 1 : 0)) / 2 : 0), 0);
      percent = Math.round((share / Math.max(1, active.planned)) * 100);
    }

    void saveAttempt({
      kind: active.kind,
      title: active.title,
      percent,
      detail: active.kind === 'mcq' ? `${mcq?.correct ?? 0} of ${mcq?.total ?? 0} correct` : `${active.planned} problem${active.planned === 1 ? '' : 's'}`,
      warnings: active.events.length,
    });
    clearSnapshot(SNAPSHOT_KEY);
    await exitFullscreen();
    setResult({ session: graded, mcq, percent, endedBy });
    setSession(null);
    setSubmitting(false);
    window.scrollTo(0, 0);
  }, []);

  const unanswered = session?.kind === 'mcq' ? session.questions.length - Object.keys(session.answers).length : 0;

  /* ---------- Screens ---------- */

  if (result) {
    return (
      <ExamResults
        result={result}
        onDone={() => {
          setResult(null);
          setConfig(null);
        }}
        onRetake={() => {
          setResult(null);
          void startTest();
        }}
      />
    );
  }

  const setupView = config && (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <button type="button" onClick={() => setConfig(null)} className="mb-4 flex items-center gap-1.5 text-small font-semibold text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All tests
      </button>
      <PageHeader title={config.track.title} description={config.track.description} />

      {config.track.kind === 'coding' && compilerAvailable === false && (
        <Alert tone="warning" className="mt-6" title="The compiler isn’t set up on this site yet.">
          The coding round needs a code-running service. The SQL round and all MCQ tests work without it.
        </Alert>
      )}

      <Card className="mt-6 space-y-5 p-5">
        <fieldset>
          <legend className="text-small font-semibold text-ink">Topics</legend>
          <p className="text-label text-ink-2">Choose any. If you choose none, the test covers all of them.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {config.track.topics.map((topic) => {
              const selected = config.topics.includes(topic);
              return (
                <button
                  key={topic}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setConfig({ ...config, topics: selected ? config.topics.filter((item) => item !== topic) : [...config.topics, topic] })}
                  className={`rounded-full border px-3 py-1.5 text-small font-medium transition-colors ${
                    selected ? 'border-primary bg-primary text-white' : 'border-line bg-surface text-ink hover:border-line-strong'
                  }`}
                >
                  {topic}
                </button>
              );
            })}
          </div>
        </fieldset>

        <TextField
          label="Another topic"
          optional
          maxLength={80}
          value={config.customTopic}
          onChange={(event) => setConfig({ ...config, customTopic: event.target.value })}
          placeholder="Type a specific topic"
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField label="Difficulty" value={config.difficulty} onChange={(event) => setConfig({ ...config, difficulty: event.target.value as Difficulty })}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </SelectField>
          {config.track.kind === 'mcq' ? (
            <SelectField label="Questions" value={String(config.count)} onChange={(event) => setConfig({ ...config, count: Number(event.target.value) })}>
              {[5, 10, 15, 20, 25].map((value) => <option key={value} value={value}>{value}</option>)}
            </SelectField>
          ) : (
            <SelectField label="Problems" value={String(config.problems)} onChange={(event) => setConfig({ ...config, problems: Number(event.target.value) })}>
              {[1, 2, 3].map((value) => <option key={value} value={value}>{value}</option>)}
            </SelectField>
          )}
          {config.track.kind === 'coding' && (
            <SelectField label="Language" value={config.language} onChange={(event) => setConfig({ ...config, language: event.target.value as CodeLanguage })}>
              {CODE_LANGUAGES.map((language) => <option key={language.id} value={language.id}>{language.label}</option>)}
            </SelectField>
          )}
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="flex items-center gap-2 text-card font-semibold text-ink">
          <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" /> Protected test rules
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-small text-ink">
          <li>The test runs full screen, and the timer can’t be paused.</li>
          <li>Leaving full screen or switching to another tab or app counts as a warning. At {MAX_WARNINGS} warnings the test submits itself.</li>
          <li>Copy, paste from outside, right-click, and browser shortcuts are blocked.</li>
          <li>Answers and hidden tests stay on the server until you submit.</li>
          {config.track.kind === 'coding' && <li>Your code runs on an outside compiler service, so don’t put private information in it.</li>}
          {config.track.negativeMark ? <li>Each wrong answer loses {config.track.negativeMark} marks, as in the real exam. Unanswered questions lose nothing.</li> : null}
        </ul>
        {extendedScreen && <Alert tone="warning" className="mt-3">A second screen is connected. For a fair test, use one screen only.</Alert>}
        <Checkbox className="mt-4" label="I understand and I’m ready to start." checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
        <div className="mt-4">
          <Button
            variant="primary"
            size="lg"
            disabled={!agreed || (config.track.kind === 'coding' && compilerAvailable !== true)}
            onClick={() => void startTest()}
          >
            <Maximize className="h-4 w-4" aria-hidden="true" /> Start test
          </Button>
        </div>
      </Card>
    </div>
  );

  const homeView = (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Assessment Center"
        description="Test yourself in a protected, full-screen environment. Coding and SQL rounds with real compilers and hidden test cases, technical MCQs, aptitude, and government exam practice. Questions are new every time."
      />

      {saved && (
        <Alert
          tone="info"
          className="mt-6"
          title={`You have a test in progress: ${saved.title}`}
          actions={
            <div className="flex gap-2">
              <Button size="sm" variant="primary" onClick={() => void resumeSaved()}>Resume</Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  clearSnapshot(SNAPSHOT_KEY);
                  setSaved(null);
                }}
              >
                Discard
              </Button>
            </div>
          }
        >
          The timer kept running, and reloading counts as a warning.
        </Alert>
      )}

      <div role="tablist" aria-label="Test categories" className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {TRACK_GROUPS.map((item) => (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={group === item.id}
            onClick={() => setGroup(item.id)}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-body font-semibold ${
              group === item.id ? 'border-primary text-primary' : 'border-transparent text-ink-2 hover:text-ink'
            }`}
          >
            {item.title}
          </button>
        ))}
      </div>
      <p className="mt-3 text-small text-ink-2">{TRACK_GROUPS.find((item) => item.id === group)?.description}</p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TRACKS.filter((track) => track.group === group).map((track) => (
          <TrackCard
            key={track.id}
            track={track}
            compilerAvailable={compilerAvailable}
            onOpen={() => {
              setAgreed(false);
              setConfig(defaultConfig(track));
              window.scrollTo(0, 0);
            }}
          />
        ))}
      </ul>

      {attempts.filter((attempt) => attempt.kind !== 'interview').length > 0 && (
        <section className="mt-8" aria-labelledby="recent-tests">
          <h2 id="recent-tests" className="text-card font-semibold text-ink">Your recent tests</h2>
          <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-surface">
            {attempts
              .filter((attempt) => attempt.kind !== 'interview')
              .slice(0, 8)
              .map((attempt) => (
                <li key={attempt.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 px-4 py-2.5 text-small">
                  <span className="min-w-0 text-ink">{attempt.title} <span className="text-ink-2">· {attempt.detail}</span></span>
                  <span className="shrink-0 text-ink-2">
                    <span className="font-semibold text-ink">{attempt.percent}%</span>
                    {attempt.warnings > 0 && ` · ${attempt.warnings} warning${attempt.warnings === 1 ? '' : 's'}`} · {formatRelativeTime(attempt.at)}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      )}

      <p className="mt-6 flex items-center gap-1.5 text-small text-ink-2">
        Ready to talk? <Link href="/interview" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">Try a full AI interview <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
      </p>
    </div>
  );

  return (
    <>
      {config ? setupView : homeView}

      {preparing && config && !session && (
        <Preparing title={config.track.title} error={preparing.error} onRetry={() => void begin(config)} onExit={leave} />
      )}

      {session && (
        <ExamShell
          title={session.title}
          deadline={session.deadline}
          initialEvents={session.events}
          submitting={submitting}
          submitLabel="Finish test"
          onSubmitClick={() => setConfirmSubmit(true)}
          onForceSubmit={(reason) => void finish(reason)}
          onEvents={(events) => setSession((previous) => (previous ? { ...previous, events } : previous))}
        >
          {session.kind === 'mcq' && <McqExam session={session} onChange={(next) => setSession(next)} />}
          {session.kind === 'coding' && (
            <CodingExam session={session} update={(change) => setSession((previous) => (previous?.kind === 'coding' ? change(previous) : previous))} />
          )}
          {session.kind === 'sql' && (
            <SqlExam session={session} update={(change) => setSession((previous) => (previous?.kind === 'sql' ? change(previous) : previous))} />
          )}
          <ConfirmDialog
            open={confirmSubmit}
            title="Finish this test?"
            description={
              session.kind === 'mcq'
                ? unanswered > 0
                  ? `${unanswered} question${unanswered === 1 ? ' is' : 's are'} not answered. You can’t change your answers after finishing.`
                  : 'You can’t change your answers after finishing.'
                : 'Any code you haven’t submitted will be checked now. You can’t change it after finishing.'
            }
            confirmLabel="Finish test"
            onCancel={() => setConfirmSubmit(false)}
            onConfirm={() => void finish('candidate')}
          />
        </ExamShell>
      )}
    </>
  );
}
