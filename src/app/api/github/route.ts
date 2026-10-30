import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, clientKey, describeWait } from '@/lib/server/rateLimit';

// GitHub Project Import (PRD §15). Reads public repository metadata and README
// text through the official GitHub REST API. Repository code is never
// downloaded or executed.

const GITHUB_API = 'https://api.github.com';
const USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const REPO_NAME = /^[\w.-]{1,100}$/;
const MAX_README_CHARS = 8000;

export interface GithubRepoSummary {
  name: string;
  fullName: string;
  description: string;
  language: string | null;
  topics: string[];
  stars: number;
  fork: boolean;
  archived: boolean;
  updatedAt: string;
  htmlUrl: string;
  homepage: string;
}

function githubHeaders(accept = 'application/vnd.github+json'): HeadersInit {
  return {
    Accept: accept,
    'User-Agent': 'AI-Resume-Studio',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
  };
}

// Turns GitHub error responses into clear messages, including rate limits.
async function githubError(response: Response, notFound: string): Promise<NextResponse> {
  if (response.status === 404) return NextResponse.json({ error: notFound }, { status: 404 });
  if (response.status === 403 || response.status === 429) {
    const reset = Number(response.headers.get('x-ratelimit-reset'));
    const remaining = response.headers.get('x-ratelimit-remaining');
    if (remaining === '0' || response.status === 429) {
      const waitSeconds = Number.isFinite(reset) && reset > 0 ? Math.max(1, reset - Math.floor(Date.now() / 1000)) : 600;
      return NextResponse.json(
        { error: `GitHub’s request limit was reached. Please try again in about ${describeWait(waitSeconds)}.`, retryAfterSeconds: waitSeconds },
        { status: 429 }
      );
    }
  }
  return NextResponse.json({ error: 'GitHub could not be reached right now. Please try again shortly.' }, { status: 502 });
}

export async function GET(req: NextRequest) {
  const limit = checkRateLimit(clientKey(req.headers, 'github'), { perMinute: 20, perDay: 300 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many GitHub requests. Please wait ${describeWait(limit.retryAfterSeconds)}.`, retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  const params = req.nextUrl.searchParams;
  const username = params.get('username')?.trim() ?? '';
  const owner = params.get('owner')?.trim() ?? '';
  const repo = params.get('repo')?.trim() ?? '';

  try {
    // List a user's public repositories.
    if (username) {
      if (!USERNAME.test(username)) {
        return NextResponse.json({ error: 'Enter a valid GitHub username (letters, numbers, and single hyphens).' }, { status: 400 });
      }
      const response = await fetch(`${GITHUB_API}/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated&type=owner`, {
        headers: githubHeaders(),
        next: { revalidate: 300 },
      });
      if (!response.ok) return githubError(response, `No GitHub user named “${username}” was found.`);
      const raw: unknown = await response.json();
      const repos: GithubRepoSummary[] = (Array.isArray(raw) ? raw : []).flatMap((item) => {
        if (typeof item !== 'object' || item === null) return [];
        const entry = item as Record<string, unknown>;
        return [{
          name: String(entry.name ?? ''),
          fullName: String(entry.full_name ?? ''),
          description: typeof entry.description === 'string' ? entry.description : '',
          language: typeof entry.language === 'string' ? entry.language : null,
          topics: Array.isArray(entry.topics) ? entry.topics.filter((topic): topic is string => typeof topic === 'string') : [],
          stars: typeof entry.stargazers_count === 'number' ? entry.stargazers_count : 0,
          fork: entry.fork === true,
          archived: entry.archived === true,
          updatedAt: typeof entry.pushed_at === 'string' ? entry.pushed_at : String(entry.updated_at ?? ''),
          htmlUrl: String(entry.html_url ?? ''),
          homepage: typeof entry.homepage === 'string' ? entry.homepage : '',
        }];
      });
      return NextResponse.json({ result: repos });
    }

    // Details for one repository: languages and README text.
    if (owner && repo) {
      if (!USERNAME.test(owner) || !REPO_NAME.test(repo)) {
        return NextResponse.json({ error: 'That repository name is not valid.' }, { status: 400 });
      }
      const base = `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
      const [languagesResponse, readmeResponse] = await Promise.all([
        fetch(`${base}/languages`, { headers: githubHeaders(), next: { revalidate: 300 } }),
        fetch(`${base}/readme`, { headers: githubHeaders('application/vnd.github.raw+json'), next: { revalidate: 300 } }),
      ]);
      if (!languagesResponse.ok) return githubError(languagesResponse, 'That repository was not found or is private.');
      const languagesRaw: unknown = await languagesResponse.json();
      const languages =
        typeof languagesRaw === 'object' && languagesRaw !== null
          ? Object.entries(languagesRaw as Record<string, number>)
              .sort((a, b) => b[1] - a[1])
              .map(([name]) => name)
              .slice(0, 8)
          : [];
      // A missing README is normal; it is not an error.
      const readme = readmeResponse.ok ? (await readmeResponse.text()).slice(0, MAX_README_CHARS) : '';
      return NextResponse.json({ result: { languages, readme, readmeTruncated: readme.length >= MAX_README_CHARS } });
    }

    return NextResponse.json({ error: 'Provide a GitHub username, or an owner and repository.' }, { status: 400 });
  } catch (error) {
    console.error('GitHub route error:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'GitHub could not be reached right now. Please try again shortly.' }, { status: 502 });
  }
}
