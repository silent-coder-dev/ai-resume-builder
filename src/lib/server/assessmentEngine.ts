import { randomInt } from 'node:crypto';
import type { Difficulty, Track } from '@/lib/assessment/catalog';
import { normalizeOutput, runTests, type CodeTest, type RunCode } from '@/lib/server/codeRunner';
import { runSql, type SqlResult } from '@/lib/server/sqlSandbox';

// Writes, checks, and grades tests. AI output is never trusted: MCQs are
// validated and shuffled, expected outputs come from actually running a reference
// solution, and answers stay sealed on the server side until submission.

const str = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const strList = (value: unknown) => (Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []);

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = randomInt(index + 1);
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

/* ---------- MCQ ---------- */

export interface McqQuestion {
  id: string;
  topic: string;
  question: string;
  code: string;
  options: string[];
}

export interface McqKey {
  id: string;
  answer: number;
  explanation: string;
}

export function mcqPrompt(track: Track, topics: string[], difficulty: Difficulty, count: number): string {
  return `
You write exam questions. Write ${count} multiple-choice questions.

EXAM: ${track.brief}
TOPICS (spread questions across these): ${topics.join(', ')}
DIFFICULTY: ${difficulty}

RULES:
- Exactly 4 options, exactly one correct. Options must be different from each other. Never use "All of the above" or "None of the above".
- Each question stands alone and is checkable: no opinions, and no events from the last two years, because they may be out of date.
- Work out numeric answers step by step before choosing the correct option, and make sure it is really among the options.
- explanation: at most 40 words on why the correct option is right.
- For a code question, put the code in "code" as plain text (no markdown fences); otherwise "code" is "".
- answer is the 0-based index of the correct option.
- Return JSON only: {"questions":[{"topic":"","question":"","code":"","options":["","","",""],"answer":0,"explanation":""}]}
`;
}

// Splits a test into batches of at most 10 questions, sharing out the topics so
// batches written at the same time are less likely to repeat each other.
export function planMcqBatches(count: number, topics: string[]): Array<{ count: number; topics: string[] }> {
  const batches = Math.ceil(count / 10);
  return Array.from({ length: batches }, (_, index) => {
    const size = Math.floor(count / batches) + (index < count % batches ? 1 : 0);
    const share = topics.filter((_topic, topicIndex) => topicIndex % batches === index);
    return { count: size, topics: share.length > 0 ? share : topics };
  });
}

// Drops anything malformed, and shuffles options so the answer position is random.
export function parseMcqDraft(parsed: unknown, count: number, topics: string[]): { questions: McqQuestion[]; keys: McqKey[] } {
  const source = (parsed as { questions?: unknown })?.questions;
  const questions: McqQuestion[] = [];
  const keys: McqKey[] = [];
  const seen = new Set<string>();
  for (const entry of Array.isArray(source) ? source : []) {
    if (questions.length >= count || typeof entry !== 'object' || entry === null) continue;
    const item = entry as Record<string, unknown>;
    const question = str(item.question, 1200);
    const options = strList(item.options).map((option) => option.trim().slice(0, 400));
    const answer = Number(item.answer);
    const fingerprint = question.toLowerCase();
    if (!question || seen.has(fingerprint) || options.length !== 4) continue;
    if (new Set(options.map((option) => option.toLowerCase())).size !== 4 || options.some((option) => !option)) continue;
    if (!Number.isInteger(answer) || answer < 0 || answer > 3) continue;
    seen.add(fingerprint);
    const correct = options[answer];
    const order = shuffled(options);
    const id = `q${questions.length + 1}`;
    const topic = str(item.topic, 80);
    questions.push({
      id,
      topic: topic || topics[0] || 'General',
      question,
      code: str(item.code, 3000).replace(/^```[\w+#.-]*\n?/, '').replace(/\n?```$/, ''),
      options: order,
    });
    keys.push({ id, answer: order.indexOf(correct), explanation: str(item.explanation, 600) });
  }
  return { questions, keys };
}

export interface McqResultItem {
  id: string;
  chosen: number | null;
  answer: number;
  correct: boolean;
  explanation: string;
}

export function gradeMcq(keys: McqKey[], answers: unknown, negativeMark: number) {
  const chosen = (typeof answers === 'object' && answers !== null ? answers : {}) as Record<string, unknown>;
  let correct = 0;
  let wrong = 0;
  const items: McqResultItem[] = keys.map((key) => {
    const raw = chosen[key.id];
    const pick = Number.isInteger(raw) && (raw as number) >= 0 && (raw as number) <= 3 ? (raw as number) : null;
    const isCorrect = pick === key.answer;
    if (isCorrect) correct += 1;
    else if (pick !== null) wrong += 1;
    return { id: key.id, chosen: pick, answer: key.answer, correct: isCorrect, explanation: key.explanation };
  });
  const score = Math.round((correct - wrong * negativeMark) * 100) / 100;
  return { items, correct, wrong, unanswered: keys.length - correct - wrong, score, total: keys.length, negativeMark };
}

/* ---------- Coding ---------- */

export interface CodingDraft {
  title: string;
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  publicInputs: string[];
  hiddenInputs: string[];
  referencePython: string;
  approach: string;
}

export function codingPrompt(topics: string[], difficulty: Difficulty, avoid: string[]): string {
  return `
You write coding-round problems for a placement test. Write ONE original problem.

TOPICS (choose one): ${topics.join(', ')}
DIFFICULTY: ${difficulty}
${avoid.length ? `DO NOT repeat these problems: ${avoid.join('; ')}` : ''}

RULES:
- The program reads from standard input and prints to standard output. Describe the exact input and output format.
- There must be exactly one correct output for every input. No "any valid answer", no random behaviour, no floating point unless the output format fixes the number of decimals.
- publicInputs: 2 small example inputs. hiddenInputs: 5 inputs covering edge cases (smallest size, duplicates, negatives if allowed, and one larger input of at most 200 values).
- Inputs are raw stdin text, exactly as the program would receive them, following the constraints.
- referencePython: a correct, complete Python 3 solution that reads stdin and prints only the answer. It runs on every input to produce the expected outputs, so it must be right. Standard library only.
- approach: at most 60 words on the best approach and its time and space complexity.
- Plain text only, no markdown in any field.
- Return JSON only:
{"title":"","statement":"","inputFormat":"","outputFormat":"","constraints":[""],"publicInputs":["",""],"hiddenInputs":["","","","",""],"referencePython":"","approach":""}
`;
}

export function parseCodingDraft(parsed: unknown): CodingDraft | null {
  const item = (parsed ?? {}) as Record<string, unknown>;
  const draft: CodingDraft = {
    title: str(item.title, 120),
    statement: str(item.statement, 4000),
    inputFormat: str(item.inputFormat, 1500),
    outputFormat: str(item.outputFormat, 1500),
    constraints: strList(item.constraints).map((line) => line.slice(0, 200)).slice(0, 10),
    publicInputs: strList(item.publicInputs).map((input) => input.slice(0, 20_000)).slice(0, 3),
    hiddenInputs: strList(item.hiddenInputs).map((input) => input.slice(0, 20_000)).slice(0, 6),
    referencePython: str(item.referencePython, 8000).replace(/^```[\w]*\n?/, '').replace(/\n?```$/, ''),
    approach: str(item.approach, 800),
  };
  if (!draft.title || !draft.statement || !draft.referencePython) return null;
  if (draft.publicInputs.length === 0 || draft.hiddenInputs.length === 0) return null;
  return draft;
}

export interface PreparedProblem {
  publicTests: CodeTest[];
  hiddenTests: CodeTest[];
}

// Expected outputs come from running the reference solution, so a test can never
// disagree with the solution. Inputs where it crashes or prints nothing are
// dropped. Returns null when too few tests survive to be a fair problem.
export async function prepareCodingTests(draft: CodingDraft, run: RunCode): Promise<PreparedProblem | null> {
  const inputs = [...draft.publicInputs, ...draft.hiddenInputs];
  const results = await Promise.all(
    inputs.map(async (input) => {
      try {
        return await run({ language: 'python', source: draft.referencePython, stdin: input });
      } catch {
        return null;
      }
    })
  );
  const tests = inputs.map((input, index) => {
    const result = results[index];
    const expected = result?.status === 'ok' ? normalizeOutput(result.stdout) : '';
    return expected ? { input, expected } : null;
  });
  const dedupe = (list: Array<CodeTest | null>) => {
    const seen = new Set<string>();
    return list.filter((test): test is CodeTest => {
      if (!test || seen.has(test.input)) return false;
      seen.add(test.input);
      return true;
    });
  };
  const publicTests = dedupe(tests.slice(0, draft.publicInputs.length));
  const publicInputs = new Set(publicTests.map((test) => test.input));
  const hiddenTests = dedupe(tests.slice(draft.publicInputs.length)).filter((test) => !publicInputs.has(test.input));
  if (publicTests.length === 0 || hiddenTests.length < 2) return null;
  return { publicTests, hiddenTests };
}

const firstLines = (text: string) => text.slice(0, 4000);

export async function runPublicTests(run: RunCode, language: Parameters<RunCode>[0]['language'], source: string, tests: CodeTest[]) {
  const outcomes = await runTests(run, language, source, tests);
  return outcomes.map((outcome, index) => ({
    input: tests[index].input,
    expected: tests[index].expected,
    verdict: outcome.verdict,
    stdout: firstLines(outcome.stdout),
    stderr: firstLines(outcome.stderr),
  }));
}

// Hidden tests report only a verdict. Output and error text could leak the input,
// because a program can simply print what it reads.
export async function gradeCoding(run: RunCode, language: Parameters<RunCode>[0]['language'], source: string, prepared: PreparedProblem) {
  const [publicResults, hiddenOutcomes] = await Promise.all([
    runPublicTests(run, language, source, prepared.publicTests),
    runTests(run, language, source, prepared.hiddenTests),
  ]);
  const hidden = hiddenOutcomes.map((outcome) => ({ verdict: outcome.verdict }));
  const graded = [...publicResults, ...hidden].filter((item) => item.verdict !== 'not_run');
  const passed = graded.filter((item) => item.verdict === 'passed').length;
  const total = publicResults.length + hidden.length;
  return {
    public: publicResults,
    hidden,
    passed,
    total,
    incomplete: graded.length < total,
    accepted: passed === total,
  };
}

/* ---------- SQL ---------- */

export interface SqlDraft {
  title: string;
  question: string;
  schemaSql: string;
  publicSeedSql: string;
  hiddenSeedSql: string;
  referenceQuery: string;
  orderMatters: boolean;
  approach: string;
}

export interface PreparedSql {
  setupPublic: string;
  setupHidden: string;
  expectedPublic: SqlResult;
  expectedHidden: SqlResult;
  tables: Array<{ name: string; columns: string[]; rows: unknown[][] }>;
}

export function sqlPrompt(topics: string[], difficulty: Difficulty, avoid: string[], lastProblem = ''): string {
  return `
You write SQL interview problems. Write ONE original problem for SQLite.

TOPICS (choose one): ${topics.join(', ')}
DIFFICULTY: ${difficulty}
${avoid.length ? `DO NOT repeat these problems: ${avoid.join('; ')}` : ''}
${lastProblem ? `YOUR LAST ATTEMPT WAS REJECTED: ${lastProblem}. Fix this.` : ''}

RULES:
- Separate every SQL statement with a semicolon, and escape single quotes inside strings by doubling them.
- schemaSql: 1 to 3 CREATE TABLE statements with realistic names (employees, orders, …). SQLite syntax only.
- publicSeedSql: INSERT statements with 6 to 12 rows per table. The candidate can see this data.
- hiddenSeedSql: INSERT statements with different data for the same tables (also 6 to 12 rows per table), including edge cases such as NULLs and ties. It must also give a non-empty answer.
- question: say exactly what to return, which columns, and in which order if order matters. If several rows can tie, say how to break the tie.
- orderMatters: true only when the question asks for a specific order.
- referenceQuery: one correct SELECT (it may start with WITH) that answers the question.
- approach: at most 50 words on how to solve it.
- Plain text only, no markdown in any field.
- Return JSON only:
{"title":"","question":"","schemaSql":"","publicSeedSql":"","hiddenSeedSql":"","referenceQuery":"","orderMatters":false,"approach":""}
`;
}

export function parseSqlDraft(parsed: unknown): SqlDraft | null {
  const item = (parsed ?? {}) as Record<string, unknown>;
  const fence = (text: string) => text.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');
  const draft: SqlDraft = {
    title: str(item.title, 120),
    question: str(item.question, 3000),
    schemaSql: fence(str(item.schemaSql, 6000)),
    publicSeedSql: fence(str(item.publicSeedSql, 20_000)),
    hiddenSeedSql: fence(str(item.hiddenSeedSql, 20_000)),
    referenceQuery: fence(str(item.referenceQuery, 4000)),
    orderMatters: item.orderMatters === true,
    approach: str(item.approach, 800),
  };
  if (!draft.title || !draft.question || !draft.schemaSql || !draft.publicSeedSql || !draft.hiddenSeedSql || !draft.referenceQuery) return null;
  return draft;
}

// Runs the reference query on both data sets in the sandbox. Returns null when it
// fails or gives an empty answer, so a broken problem never reaches a candidate.
// onReject hears why, so the writer can correct itself on the next try.
export async function prepareSql(draft: SqlDraft, onReject?: (reason: string) => void): Promise<PreparedSql | null> {
  const setupPublic = `${draft.schemaSql}\n${draft.publicSeedSql}`;
  const setupHidden = `${draft.schemaSql}\n${draft.hiddenSeedSql}`;
  try {
    const [expectedPublic, tableList] = await runSql(setupPublic, [
      draft.referenceQuery,
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid",
    ]);
    const [expectedHidden] = await runSql(setupHidden, [draft.referenceQuery]);
    if (expectedPublic.error || expectedHidden.error) {
      onReject?.(`referenceQuery failed: ${expectedPublic.error ?? expectedHidden.error}`);
      return null;
    }
    if (expectedPublic.rows.length === 0 || expectedHidden.rows.length === 0) {
      onReject?.(`referenceQuery returned no rows on the ${expectedPublic.rows.length === 0 ? 'public' : 'hidden'} data`);
      return null;
    }
    const names = tableList.rows.map((row) => String(row[0]));
    if (names.length === 0) {
      onReject?.('schemaSql created no tables');
      return null;
    }
    const previews = await runSql(setupPublic, names.map((name) => `SELECT * FROM "${name.replace(/"/g, '""')}" LIMIT 50`));
    const tables = names.map((name, index) => ({ name, columns: previews[index].columns, rows: previews[index].rows }));
    return { setupPublic, setupHidden, expectedPublic, expectedHidden, tables };
  } catch (error) {
    onReject?.(error instanceof Error ? error.message : 'the SQL could not run');
    return null;
  }
}
