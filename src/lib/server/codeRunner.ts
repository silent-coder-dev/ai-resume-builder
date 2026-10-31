import { CODE_LANGUAGES, type CodeLanguage } from '@/lib/assessment/languages';

// Compiles and runs candidates' code on an outside service, because a website
// host can't safely run Java, C, C++, C#, and Python. Choose a service with:
//   CODE_RUNNER_PROVIDER = piston  (self-hosted, set CODE_RUNNER_URL to your server)
//   CODE_RUNNER_PROVIDER = wandbox (public service, no key, code leaves your server)
// Unset: the coding round says it is not set up. The other rounds still work.

export type RunStatus = 'ok' | 'compile_error' | 'runtime_error' | 'time_limit' | 'unavailable';

export interface RunResult {
  status: RunStatus;
  stdout: string;
  stderr: string;
}

export type RunCode = (input: { language: CodeLanguage; source: string; stdin: string }) => Promise<RunResult>;

const REQUEST_TIMEOUT_MS = 25_000;
const MAX_OUTPUT_CHARS = 64_000;
const clip = (text: unknown) => (typeof text === 'string' ? text.slice(0, MAX_OUTPUT_CHARS) : '');

const PISTON_RUNTIMES: Record<CodeLanguage, string> = {
  python: 'python',
  java: 'java',
  c: 'c',
  cpp: 'c++',
  csharp: 'csharp',
};

function pistonRunner(baseUrl: string): RunCode {
  const url = `${baseUrl.replace(/\/+$/, '')}/api/v2/execute`;
  return async ({ language, source, stdin }) => {
    const fileName = CODE_LANGUAGES.find((item) => item.id === language)?.fileName ?? 'main';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: PISTON_RUNTIMES[language],
        version: '*',
        files: [{ name: fileName, content: source }],
        stdin,
        run_timeout: 5000,
        compile_timeout: 15000,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return { status: 'unavailable', stdout: '', stderr: '' };
    const data = (await response.json()) as {
      compile?: { code?: number | null; stderr?: string; output?: string };
      run?: { code?: number | null; signal?: string | null; stdout?: string; stderr?: string };
    };
    if (data.compile && data.compile.code !== 0 && data.compile.code !== undefined) {
      return { status: 'compile_error', stdout: '', stderr: clip(data.compile.stderr || data.compile.output) };
    }
    const run = data.run ?? {};
    const status: RunStatus = run.signal === 'SIGKILL' ? 'time_limit' : run.code === 0 ? 'ok' : 'runtime_error';
    return { status, stdout: clip(run.stdout), stderr: clip(run.stderr) };
  };
}

const WANDBOX_COMPILERS: Record<CodeLanguage, string> = {
  python: 'cpython-3.12.7',
  java: 'openjdk-jdk-21+35',
  c: 'gcc-13.2.0-c',
  cpp: 'gcc-13.2.0',
  csharp: 'dotnetcore-8.0.402',
};

function wandboxRunner(): RunCode {
  return async ({ language, source, stdin }) => {
    const response = await fetch('https://wandbox.org/api/compile.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ compiler: WANDBOX_COMPILERS[language], code: source, stdin, save: false }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return { status: 'unavailable', stdout: '', stderr: '' };
    const data = (await response.json()) as {
      status?: string;
      signal?: string;
      compiler_error?: string;
      program_output?: string;
      program_error?: string;
    };
    const stdout = clip(data.program_output);
    const stderr = clip(data.program_error);
    if (data.signal) return { status: /kill|cpu/i.test(data.signal) ? 'time_limit' : 'runtime_error', stdout, stderr };
    if (data.status !== '0' && !stdout && !stderr && data.compiler_error) {
      return { status: 'compile_error', stdout: '', stderr: clip(data.compiler_error) };
    }
    return { status: data.status === '0' ? 'ok' : 'runtime_error', stdout, stderr };
  };
}

export function getCodeRunner(env: Record<string, string | undefined> = process.env): RunCode | null {
  const provider = env.CODE_RUNNER_PROVIDER?.trim().toLowerCase();
  if (provider === 'wandbox') return wandboxRunner();
  if (provider === 'piston' && env.CODE_RUNNER_URL?.trim()) return pistonRunner(env.CODE_RUNNER_URL.trim());
  return null;
}

export interface CodeTest {
  input: string;
  expected: string;
}

// Line endings and trailing spaces never fail a candidate; anything else does.
export function normalizeOutput(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n+$/, '');
}

export type TestVerdict = 'passed' | 'wrong_answer' | 'compile_error' | 'runtime_error' | 'time_limit' | 'not_run';

export interface TestOutcome {
  verdict: TestVerdict;
  stdout: string;
  stderr: string;
}

// Runs tests a few at a time. A compile error fails everything at once, because
// the same code would fail the same way. A service failure marks a test "not_run",
// so a candidate is never marked wrong because of it.
export async function runTests(
  run: RunCode,
  language: CodeLanguage,
  source: string,
  tests: CodeTest[],
  concurrency = 3
): Promise<TestOutcome[]> {
  const outcomes: TestOutcome[] = new Array(tests.length);
  let next = 0;
  let compileFailure: TestOutcome | null = null;

  const worker = async () => {
    while (next < tests.length) {
      const index = next;
      next += 1;
      if (compileFailure) {
        outcomes[index] = compileFailure;
        continue;
      }
      const test = tests[index];
      let result: RunResult;
      try {
        result = await run({ language, source, stdin: test.input });
      } catch {
        result = { status: 'unavailable', stdout: '', stderr: '' };
      }
      if (result.status === 'compile_error') {
        compileFailure = { verdict: 'compile_error', stdout: '', stderr: result.stderr };
        outcomes[index] = compileFailure;
      } else if (result.status === 'unavailable') {
        outcomes[index] = { verdict: 'not_run', stdout: '', stderr: '' };
      } else if (result.status !== 'ok') {
        outcomes[index] = { verdict: result.status, stdout: result.stdout, stderr: result.stderr };
      } else {
        const matches = normalizeOutput(result.stdout) === normalizeOutput(test.expected);
        outcomes[index] = { verdict: matches ? 'passed' : 'wrong_answer', stdout: result.stdout, stderr: result.stderr };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, tests.length) }, worker));
  return outcomes;
}
