import path from 'node:path';
import { Worker } from 'node:worker_threads';

// Runs SQL in SQLite (sql.js) inside a worker thread. The database lives only in
// the worker's memory, so a query can't touch anything else, and a runaway query
// (an endless recursive CTE, a huge cross join) is killed by the time limit
// instead of freezing the server.
const WORKER_SOURCE = `
const { parentPort, workerData } = require('node:worker_threads');
const initSqlJs = require(workerData.modulePath);
initSqlJs({ locateFile: () => workerData.wasmPath }).then((SQL) => {
  const db = new SQL.Database();
  const results = [];
  try {
    if (workerData.setup) db.run(workerData.setup);
    for (const query of workerData.queries) {
      try {
        const sets = db.exec(query);
        const last = sets[sets.length - 1];
        results.push({ columns: last ? last.columns : [], rows: last ? last.values.slice(0, workerData.maxRows + 1) : [] });
      } catch (error) {
        results.push({ error: String((error && error.message) || error) });
      }
    }
    parentPort.postMessage({ results });
  } catch (error) {
    parentPort.postMessage({ setupError: String((error && error.message) || error) });
  } finally {
    db.close();
  }
}).catch((error) => parentPort.postMessage({ setupError: String((error && error.message) || error) }));
`;

export interface SqlResult {
  columns: string[];
  rows: unknown[][];
  error?: string;
}

export const MAX_SQL_ROWS = 500;

export class SqlTimeoutError extends Error {
  constructor() {
    super('Your query took too long and was stopped. Check for an endless recursive query or a very large join.');
    this.name = 'SqlTimeoutError';
  }
}

export function runSql(setup: string, queries: string[], timeoutMs = 4000): Promise<SqlResult[]> {
  const moduleDir = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist');
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_SOURCE, {
      eval: true,
      workerData: {
        setup,
        queries,
        maxRows: MAX_SQL_ROWS,
        modulePath: path.join(moduleDir, 'sql-wasm.js'),
        wasmPath: path.join(moduleDir, 'sql-wasm.wasm'),
      },
      resourceLimits: { maxOldGenerationSizeMb: 128 },
    });
    const finish = (action: () => void) => {
      clearTimeout(timer);
      void worker.terminate();
      action();
    };
    const timer = setTimeout(() => finish(() => reject(new SqlTimeoutError())), timeoutMs);
    worker.once('message', (message: { results?: SqlResult[]; setupError?: string }) => {
      finish(() => {
        if (message.setupError) reject(new Error(`The practice database could not be set up: ${message.setupError}`));
        else resolve((message.results ?? []).map((result) => ({ columns: result.columns ?? [], rows: result.rows ?? [], error: result.error })));
      });
    });
    worker.once('error', (error) => finish(() => reject(error)));
  });
}

// Candidates answer with one read-only query. Their database is thrown away
// anyway; this just gives a clear message instead of a confusing grade.
export function checkCandidateQuery(sql: string): string | null {
  const withoutComments = sql.replace(/--[^\n]*/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ').trim();
  if (!withoutComments) return 'Write a query first.';
  if (withoutComments.length > 10_000) return 'The query is too long.';
  if (!/^(select|with)\b/i.test(withoutComments)) return 'Answer with a single SELECT query (it may start with WITH).';
  const body = withoutComments.replace(/'(?:[^']|'')*'/g, 'x').replace(/;\s*$/, '');
  if (body.includes(';')) return 'Answer with one query only.';
  return null;
}

const normalizeCell = (value: unknown): string => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(Math.round(value * 100) / 100);
  return String(value).trim();
};

// Column names are ignored (candidates may alias freely). Row order only counts
// when the question asks for a specific order.
export function sameResult(actual: SqlResult, expected: SqlResult, orderMatters: boolean): boolean {
  if (actual.error) return false;
  if (actual.rows.length !== expected.rows.length) return false;
  if (expected.rows.length > 0 && actual.rows[0].length !== expected.rows[0].length) return false;
  const lines = (result: SqlResult) => result.rows.map((row) => row.map(normalizeCell).join('\u0001'));
  const a = lines(actual);
  const b = lines(expected);
  if (!orderMatters) {
    a.sort();
    b.sort();
  }
  return a.every((line, index) => line === b[index]);
}
