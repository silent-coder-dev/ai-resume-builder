import type { CodeLanguage } from '@/lib/assessment/languages';
import type { ProctorEvent } from '@/components/assessment/useProctor';

/* ---------- MCQ ---------- */

export interface McqQuestion {
  id: string;
  topic: string;
  question: string;
  code: string;
  options: string[];
}

export interface McqStart {
  questions: McqQuestion[];
  seconds: number;
  negativeMark: number;
  sealed: string;
}

export interface McqGrade {
  items: Array<{ id: string; chosen: number | null; answer: number; correct: boolean; explanation: string }>;
  correct: number;
  wrong: number;
  unanswered: number;
  score: number;
  total: number;
  negativeMark: number;
  onTime: boolean;
}

export interface McqSession {
  kind: 'mcq';
  title: string;
  questions: McqQuestion[];
  negativeMark: number;
  sealed: string;
  answers: Record<string, number>;
  marked: string[];
  index: number;
  deadline: number;
  events: ProctorEvent[];
}

/* ---------- Coding ---------- */

export type TestVerdict = 'passed' | 'wrong_answer' | 'compile_error' | 'runtime_error' | 'time_limit' | 'not_run';

export interface PublicTestResult {
  input: string;
  expected: string;
  verdict: TestVerdict;
  stdout: string;
  stderr: string;
}

export interface CodingGrade {
  public: PublicTestResult[];
  hidden: Array<{ verdict: TestVerdict }>;
  passed: number;
  total: number;
  incomplete: boolean;
  accepted: boolean;
  onTime: boolean;
}

export interface CodingProblem {
  title: string;
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  examples: Array<{ input: string; expected: string }>;
  hiddenCount: number;
}

export interface CodingEntry {
  problem: CodingProblem;
  sealed: string;
  // Code per language, so switching language never loses work.
  code: Partial<Record<CodeLanguage, string>>;
  language: CodeLanguage;
  run: PublicTestResult[] | null;
  grade: CodingGrade | null;
}

export interface CodingSession {
  kind: 'coding';
  title: string;
  entries: CodingEntry[];
  planned: number;
  index: number;
  deadline: number;
  events: ProctorEvent[];
}

/* ---------- SQL ---------- */

export interface SqlTable {
  columns: string[];
  rows: unknown[][];
}

export interface SqlProblem {
  title: string;
  question: string;
  schema: string;
  tables: Array<SqlTable & { name: string }>;
  expected: SqlTable;
  orderMatters: boolean;
}

export interface SqlRun extends SqlTable {
  error: string | null;
  matches: boolean;
  truncated?: boolean;
  hiddenPassed?: boolean;
  accepted?: boolean;
  onTime?: boolean;
}

export interface SqlEntry {
  problem: SqlProblem;
  sealed: string;
  query: string;
  run: SqlRun | null;
  grade: SqlRun | null;
}

export interface SqlSession {
  kind: 'sql';
  title: string;
  entries: SqlEntry[];
  planned: number;
  index: number;
  deadline: number;
  events: ProctorEvent[];
}

export type ExamSession = McqSession | CodingSession | SqlSession;

/* ---------- Results ---------- */

export interface ExamResult {
  session: ExamSession;
  mcq: McqGrade | null;
  percent: number;
  endedBy: 'candidate' | 'time' | 'warnings';
}
