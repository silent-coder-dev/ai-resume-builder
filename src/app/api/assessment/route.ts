import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_SECONDS_PER_QUESTION, PROBLEM_MINUTES, cleanTopics, getTrack, type Difficulty } from '@/lib/assessment/catalog';
import { isCodeLanguage } from '@/lib/assessment/languages';
import { getPlanPolicy, isFeatureEnabled } from '@/lib/entitlements';
import { aiErrorResponse, createToolGenerator, extractCleanJson, getServerSecret, readString } from '@/lib/server/aiProvider';
import {
  codingPrompt,
  gradeCoding,
  gradeMcq,
  mcqPrompt,
  parseCodingDraft,
  parseMcqDraft,
  parseSqlDraft,
  planMcqBatches,
  prepareCodingTests,
  prepareSql,
  runPublicTests,
  sqlPrompt,
  type McqKey,
  type PreparedProblem,
  type PreparedSql,
} from '@/lib/server/assessmentEngine';
import { getCodeRunner } from '@/lib/server/codeRunner';
import { checkRateLimit, clientKey, describeWait } from '@/lib/server/rateLimit';
import { seal, unseal } from '@/lib/server/seal';
import { MAX_SQL_ROWS, SqlTimeoutError, checkCandidateQuery, runSql, sameResult } from '@/lib/server/sqlSandbox';

export const maxDuration = 60;

const MAX_BODY_CHARS = 200_000;
const MAX_SOURCE_CHARS = 64_000;
// A test stays valid long enough to finish it, plus time for a reload.
const SEAL_TTL_SECONDS = 6 * 60 * 60;
const LATE_GRACE_MS = 30_000;
const RUN_LIMITS = { perMinute: 30, perDay: 1000 };

const AI_ACTIONS = new Set(['mcq-start', 'coding-start', 'sql-start']);

interface SealedMcq {
  kind: 'mcq';
  keys: McqKey[];
  negativeMark: number;
  deadline: number;
}
interface SealedCoding {
  kind: 'coding';
  tests: PreparedProblem;
  approach: string;
  reference: string;
  deadline: number;
}
interface SealedSql {
  kind: 'sql';
  prepared: PreparedSql;
  orderMatters: boolean;
  approach: string;
  reference: string;
  deadline: number;
}

const difficultyOf = (value: unknown): Difficulty => (value === 'easy' || value === 'hard' ? value : 'medium');
const problemsOf = (value: unknown) => Math.min(3, Math.max(1, Math.round(Number(value)) || 1));
const avoidList = (value: unknown) =>
  (Array.isArray(value) ? value : [])
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.replace(/[\r\n]+/g, ' ').slice(0, 100))
    .slice(0, 5);

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });
const EXPIRED = 'This test has expired or could not be verified. Please start a new one.';

// Tells the page which rounds can run, so it never offers something broken.
export async function GET() {
  return NextResponse.json({ result: { compilerAvailable: getCodeRunner() !== null } });
}

export async function POST(req: NextRequest) {
  const declared = Number(req.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BODY_CHARS) return bad('The request is too large.', 413);

  let body: { action?: unknown; payload?: unknown };
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_CHARS) return bad('The request is too large.', 413);
    body = JSON.parse(text);
  } catch {
    return bad('The request body must be valid JSON.');
  }
  const action = readString(body?.action);
  const payload = (typeof body?.payload === 'object' && body.payload !== null ? body.payload : {}) as Record<string, unknown>;

  const plan = getPlanPolicy();
  if (!isFeatureEnabled('assessment', plan)) return bad('This feature is not available right now.', 403);

  const isAi = AI_ACTIONS.has(action);
  const limit = checkRateLimit(
    clientKey(req.headers, isAi ? 'ai' : 'assessment-run'),
    isAi ? { perMinute: plan.aiRequestsPerMinute, perDay: plan.aiRequestsPerDay } : RUN_LIMITS
  );
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many requests. Please wait ${describeWait(limit.retryAfterSeconds)} and try again.`, retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  const secret = getServerSecret();
  const onTime = (deadline: number) => Date.now() <= deadline + LATE_GRACE_MS;

  try {
    if (action === 'mcq-start') {
      const track = getTrack(payload.trackId);
      if (!track || track.kind !== 'mcq') return bad('Choose a test from the list.');
      const topics = cleanTopics(track, payload.topics, payload.customTopic);
      const difficulty = difficultyOf(payload.difficulty);
      const count = Math.min(25, Math.max(5, Number(payload.count) || 10));
      const generate = createToolGenerator('assessment', action);
      // Small batches at the same time: one large request is too slow for a free
      // model, and a failed batch still leaves the others. Each asks for a couple
      // extra, because malformed questions are dropped.
      const drafts = await Promise.allSettled(
        planMcqBatches(count, topics).map(async (batch) => {
          const raw = await generate(mcqPrompt(track, batch.topics, difficulty, batch.count + 2), {
            maxTokens: 700 + (batch.count + 2) * 260,
            timeoutMs: 50_000,
            jsonMode: true,
          });
          return extractCleanJson<{ questions?: unknown }>(raw);
        })
      );
      const written = drafts.flatMap((draft) => (draft.status === 'fulfilled' && Array.isArray(draft.value?.questions) ? draft.value.questions : []));
      if (written.length === 0) {
        const failure = drafts.find((draft) => draft.status === 'rejected');
        if (failure?.status === 'rejected') throw failure.reason;
      }
      const { questions, keys } = parseMcqDraft({ questions: written }, count, topics);
      if (questions.length < Math.min(3, count)) throw new Error('The questions could not be prepared. Please try again.');
      const seconds = questions.length * (track.secondsPerQuestion ?? DEFAULT_SECONDS_PER_QUESTION);
      const sealed: SealedMcq = { kind: 'mcq', keys, negativeMark: track.negativeMark ?? 0, deadline: Date.now() + seconds * 1000 };
      return NextResponse.json({
        result: { questions, seconds, negativeMark: sealed.negativeMark, sealed: seal(sealed, secret, SEAL_TTL_SECONDS) },
      });
    }

    if (action === 'mcq-submit') {
      const sealed = unseal<SealedMcq>(payload.sealed, secret);
      if (!sealed || sealed.kind !== 'mcq') return bad(EXPIRED);
      const graded = gradeMcq(sealed.keys, payload.answers, sealed.negativeMark);
      return NextResponse.json({ result: { ...graded, onTime: onTime(sealed.deadline) } });
    }

    if (action === 'coding-start') {
      const run = getCodeRunner();
      if (!run) return bad('The compiler is not set up on this site yet.', 503);
      const track = getTrack('coding')!;
      const topics = cleanTopics(track, payload.topics, payload.customTopic);
      const difficulty = difficultyOf(payload.difficulty);
      const generate = createToolGenerator('assessment', action);
      const started = Date.now();
      // A second try only if there is time left in the 60-second limit.
      for (let attempt = 0; attempt < 2; attempt += 1) {
        if (attempt > 0 && Date.now() - started > 25_000) break;
        const raw = await generate(codingPrompt(topics, difficulty, avoidList(payload.avoid)), { maxTokens: 3500, timeoutMs: 40_000, jsonMode: true });
        const draft = parseCodingDraft(extractCleanJson(raw));
        const tests = draft ? await prepareCodingTests(draft, run) : null;
        if (!draft || !tests) {
          console.info(`[assessment] coding-start: problem rejected (${draft ? 'too few tests passed the reference solution' : 'a required field was missing'})`);
          continue;
        }
        const seconds = PROBLEM_MINUTES.coding[difficulty] * 60;
        const roundSeconds = seconds * problemsOf(payload.problems);
        const sealed: SealedCoding = {
          kind: 'coding',
          tests,
          approach: draft.approach,
          reference: draft.referencePython,
          deadline: Date.now() + roundSeconds * 1000,
        };
        return NextResponse.json({
          result: {
            problem: {
              title: draft.title,
              statement: draft.statement,
              inputFormat: draft.inputFormat,
              outputFormat: draft.outputFormat,
              constraints: draft.constraints,
              examples: tests.publicTests,
              hiddenCount: tests.hiddenTests.length,
            },
            seconds,
            sealed: seal(sealed, secret, SEAL_TTL_SECONDS),
          },
        });
      }
      throw new Error('A checked problem could not be prepared. Please try again.');
    }

    if (action === 'coding-run' || action === 'coding-submit') {
      const run = getCodeRunner();
      if (!run) return bad('The compiler is not set up on this site yet.', 503);
      const sealed = unseal<SealedCoding>(payload.sealed, secret);
      if (!sealed || sealed.kind !== 'coding') return bad(EXPIRED);
      if (!isCodeLanguage(payload.language)) return bad('Choose a language from the list.');
      const source = readString(payload.source);
      if (!source.trim()) return bad('Write some code first.');
      if (source.length > MAX_SOURCE_CHARS) return bad('The code is too long.');
      if (action === 'coding-run') {
        return NextResponse.json({ result: { public: await runPublicTests(run, payload.language, source, sealed.tests.publicTests) } });
      }
      const graded = await gradeCoding(run, payload.language, source, sealed.tests);
      return NextResponse.json({ result: { ...graded, onTime: onTime(sealed.deadline) } });
    }

    if (action === 'sql-start') {
      const track = getTrack('sql')!;
      const topics = cleanTopics(track, payload.topics, payload.customTopic);
      const difficulty = difficultyOf(payload.difficulty);
      const generate = createToolGenerator('assessment', action);
      const started = Date.now();
      let lastProblem = '';
      for (let attempt = 0; attempt < 2; attempt += 1) {
        if (attempt > 0 && Date.now() - started > 30_000) break;
        const raw = await generate(sqlPrompt(topics, difficulty, avoidList(payload.avoid), lastProblem), { maxTokens: 3500, timeoutMs: 25_000, jsonMode: true });
        const draft = parseSqlDraft(extractCleanJson(raw));
        const reject = (reason: string) => {
          lastProblem = reason.slice(0, 300);
          console.info(`[assessment] sql-start: problem rejected (${lastProblem})`);
        };
        if (!draft) reject('a required field was missing');
        const prepared = draft ? await prepareSql(draft, reject) : null;
        if (!draft || !prepared) continue;
        const seconds = PROBLEM_MINUTES.sql[difficulty] * 60;
        const roundSeconds = seconds * problemsOf(payload.problems);
        const sealed: SealedSql = {
          kind: 'sql',
          prepared,
          orderMatters: draft.orderMatters,
          approach: draft.approach,
          reference: draft.referenceQuery,
          deadline: Date.now() + roundSeconds * 1000,
        };
        return NextResponse.json({
          result: {
            problem: {
              title: draft.title,
              question: draft.question,
              schema: draft.schemaSql,
              tables: prepared.tables,
              expected: prepared.expectedPublic,
              orderMatters: draft.orderMatters,
            },
            seconds,
            sealed: seal(sealed, secret, SEAL_TTL_SECONDS),
          },
        });
      }
      throw new Error('A checked problem could not be prepared. Please try again.');
    }

    if (action === 'sql-run' || action === 'sql-submit') {
      const sealed = unseal<SealedSql>(payload.sealed, secret);
      if (!sealed || sealed.kind !== 'sql') return bad(EXPIRED);
      const query = readString(payload.query);
      const problem = checkCandidateQuery(query);
      if (problem) return bad(problem);
      let visible;
      try {
        [visible] = await runSql(sealed.prepared.setupPublic, [query]);
      } catch (error) {
        if (error instanceof SqlTimeoutError) return NextResponse.json({ result: { error: error.message, columns: [], rows: [], matches: false, hiddenPassed: false, accepted: false } });
        throw error;
      }
      const matches = sameResult(visible, sealed.prepared.expectedPublic, sealed.orderMatters);
      const shown = {
        error: visible.error ?? null,
        columns: visible.columns,
        rows: visible.rows.slice(0, MAX_SQL_ROWS),
        truncated: visible.rows.length > MAX_SQL_ROWS,
        matches,
      };
      if (action === 'sql-run') return NextResponse.json({ result: shown });

      let hiddenPassed = false;
      try {
        const [hidden] = await runSql(sealed.prepared.setupHidden, [query]);
        hiddenPassed = sameResult(hidden, sealed.prepared.expectedHidden, sealed.orderMatters);
      } catch (error) {
        if (!(error instanceof SqlTimeoutError)) throw error;
      }
      return NextResponse.json({ result: { ...shown, hiddenPassed, accepted: matches && hiddenPassed, onTime: onTime(sealed.deadline) } });
    }

    // Shown on the results page, after the test is over.
    if (action === 'review') {
      const sealed = unseal<SealedCoding | SealedSql>(payload.sealed, secret);
      if (!sealed || (sealed.kind !== 'coding' && sealed.kind !== 'sql')) return bad(EXPIRED);
      return NextResponse.json({ result: { approach: sealed.approach, reference: sealed.reference, referenceLanguage: sealed.kind === 'sql' ? 'SQL' : 'Python 3' } });
    }

    return bad(`Unknown action: "${action}"`);
  } catch (err: unknown) {
    const { body: errorBody, status } = aiErrorResponse(err);
    return NextResponse.json(errorBody, { status });
  }
}

