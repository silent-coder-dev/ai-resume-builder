'use client';

import { useState } from 'react';
import { ExternalLink, FolderGit2, Search, Star } from 'lucide-react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { callAi } from '@/utils/aiClient';
import { createId } from '@/utils/resumeContent';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Checkbox, Field, Input, TextField, TextareaField } from '@/components/ui/Field';
import { Alert, Badge, Card, EmptyState, PageHeader, Skeleton, formatRelativeTime } from '@/components/ui/Primitives';
import { toast } from '@/components/ui/Toast';
import { ResumeSelect, useToolResume } from '@/components/tools/useToolResume';

interface Repo {
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

interface Draft {
  repo: Repo;
  status: 'loading' | 'ready' | 'error';
  error?: string;
  include: boolean;
  title: string;
  techStack: string;
  description: string;
}

const MAX_SELECTED = 6;

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const data: { result?: T; error?: string } = await response.json().catch(() => ({}));
  if (!response.ok || data.result === undefined) throw new Error(data.error ?? 'GitHub could not be reached.');
  return data.result;
}

// PRD §15 — import real projects from public GitHub repositories.
export function GithubTool() {
  const { ready, resumes, current, select } = useToolResume();
  const addItem = useWorkspaceStore((state) => state.addItem);
  const checkpoint = useWorkspaceStore((state) => state.checkpoint);
  const [username, setUsername] = useState('');
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [showForks, setShowForks] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const fetchRepos = async () => {
    const name = username.trim().replace(/^@/, '').replace(/^https?:\/\/github\.com\//i, '').split('/')[0];
    if (!name) return;
    setLoadingRepos(true);
    setError(null);
    setRepos(null);
    setSelected(new Set());
    setDrafts([]);
    try {
      setRepos(await getJson<Repo[]>(`/api/github?username=${encodeURIComponent(name)}`));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Repositories could not be loaded.');
    } finally {
      setLoadingRepos(false);
    }
  };

  const updateDraft = (fullName: string, patch: Partial<Draft>) =>
    setDrafts((previous) => previous.map((draft) => (draft.repo.fullName === fullName ? { ...draft, ...patch } : draft)));

  // Reads README + languages, then asks AI for an evidence-only description.
  const describe = async () => {
    const chosen = (repos ?? []).filter((repo) => selected.has(repo.fullName));
    setDrafts(chosen.map((repo) => ({ repo, status: 'loading', include: true, title: repo.name, techStack: '', description: '' })));
    for (const repo of chosen) {
      try {
        const [owner, name] = repo.fullName.split('/');
        const details = await getJson<{ languages: string[]; readme: string }>(
          `/api/github?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(name)}`
        );
        const result = await callAi<{ title: string; description: string; techStack: string[] }>('describe-project', {
          repo: { name: repo.name, description: repo.description, languages: details.languages, topics: repo.topics, readme: details.readme },
          targetRole: current?.data.personalInfo.targetRole ?? '',
        });
        updateDraft(repo.fullName, { status: 'ready', title: result.title, description: result.description, techStack: result.techStack.join(', ') });
      } catch (caught) {
        updateDraft(repo.fullName, {
          status: 'error',
          include: false,
          error: caught instanceof Error ? caught.message : 'This repository could not be described.',
        });
      }
    }
  };

  const addToResume = async () => {
    if (!current) return;
    const toAdd = drafts.filter((draft) => draft.include && draft.status === 'ready' && draft.title.trim());
    if (toAdd.length === 0) return;
    setAdding(true);
    await checkpoint('Before adding GitHub projects');
    for (const draft of toAdd) {
      addItem('projects', {
        id: createId(),
        title: draft.title.trim(),
        techStack: draft.techStack.split(',').map((tech) => tech.trim()).filter(Boolean),
        description: draft.description.trim(),
        githubUrl: draft.repo.htmlUrl,
        liveUrl: draft.repo.homepage,
      });
    }
    setAdding(false);
    setDrafts([]);
    setSelected(new Set());
    toast(`Added ${toAdd.length} project${toAdd.length === 1 ? '' : 's'} to “${current.title}”.`, {
      action: { label: 'Review in editor', href: `/builder?id=${current.id}&section=projects` },
    });
  };

  const visibleRepos = (repos ?? []).filter((repo) => showForks || !repo.fork);
  const readyCount = drafts.filter((draft) => draft.include && draft.status === 'ready').length;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <PageHeader
        title="GitHub Projects"
        description="Turn your public repositories into resume projects. Descriptions use only your repository name, description, topics, languages, and README — never invented features or numbers."
      />

      {!ready ? (
        <Skeleton className="mt-6 h-40" />
      ) : resumes.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={FolderGit2}
          title="Create a resume first"
          description="Projects are added to one of your resumes."
          actions={<ButtonLink href="/builder" variant="primary">Create a resume</ButtonLink>}
        />
      ) : (
        <>
          <Card className="mt-6 p-5">
            <form
              className="flex flex-col gap-4 sm:flex-row sm:items-end"
              onSubmit={(event) => {
                event.preventDefault();
                void fetchRepos();
              }}
            >
              <Field label="GitHub username" className="flex-1" hint="Only public repositories are read. Code is never downloaded or run.">
                {(control) => (
                  <Input {...control} value={username} onChange={(event) => setUsername(event.target.value)} placeholder="e.g. octocat" autoComplete="off" />
                )}
              </Field>
              <ResumeSelect resumes={resumes} value={current?.id} onChange={select} label="Add projects to" />
              <Button type="submit" variant="primary" loading={loadingRepos} disabled={!username.trim()} className="sm:mb-[22px]">
                <Search className="h-4 w-4" aria-hidden="true" /> Find repositories
              </Button>
            </form>
          </Card>

          {error && <Alert tone="error" className="mt-4">{error}</Alert>}
          {loadingRepos && (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          )}

          {repos && drafts.length === 0 && (
            <section className="mt-6" aria-labelledby="repos-heading">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="repos-heading" className="text-heading font-semibold text-ink">
                  Choose up to {MAX_SELECTED} projects
                </h2>
                <Checkbox label="Show forks" checked={showForks} onChange={(event) => setShowForks(event.target.checked)} />
              </div>
              {visibleRepos.length === 0 ? (
                <p className="mt-3 text-body text-ink-2">No public repositories found.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {visibleRepos.map((repo) => {
                    const checked = selected.has(repo.fullName);
                    const disabled = !checked && selected.size >= MAX_SELECTED;
                    return (
                      <li key={repo.fullName}>
                        <label
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                            checked ? 'border-primary bg-primary-light' : 'border-line bg-surface hover:border-line-strong'
                          } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                        >
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 accent-primary"
                            checked={checked}
                            disabled={disabled}
                            onChange={() =>
                              setSelected((previous) => {
                                const next = new Set(previous);
                                if (next.has(repo.fullName)) next.delete(repo.fullName);
                                else next.add(repo.fullName);
                                return next;
                              })
                            }
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-body font-semibold text-ink">{repo.name}</span>
                              {repo.fork && <Badge>Fork</Badge>}
                              {repo.archived && <Badge>Archived</Badge>}
                            </span>
                            {repo.description && <span className="mt-0.5 block text-small text-ink-2">{repo.description}</span>}
                            <span className="mt-1.5 flex flex-wrap items-center gap-3 text-label text-ink-2">
                              {repo.language && <span>{repo.language}</span>}
                              <span className="flex items-center gap-1">
                                <Star className="h-3.5 w-3.5" aria-hidden="true" /> {repo.stars}
                              </span>
                              {repo.updatedAt && <span>Updated {formatRelativeTime(repo.updatedAt)}</span>}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="sticky bottom-4 mt-4 flex justify-end">
                <Button variant="primary" onClick={() => void describe()} disabled={selected.size === 0}>
                  Write descriptions for {selected.size || ''} selected
                </Button>
              </div>
            </section>
          )}

          {drafts.length > 0 && (
            <section className="mt-6" aria-labelledby="drafts-heading">
              <h2 id="drafts-heading" className="text-heading font-semibold text-ink">Review before adding</h2>
              <p className="mt-1 text-body text-ink-2">Edit anything that is not accurate. Only checked projects are added.</p>
              <ul className="mt-4 space-y-4">
                {drafts.map((draft) => (
                  <li key={draft.repo.fullName}>
                    <Card className="p-5">
                      <div className="flex items-center justify-between gap-3">
                        <Checkbox
                          label={<span className="font-semibold">{draft.repo.name}</span>}
                          checked={draft.include}
                          disabled={draft.status !== 'ready'}
                          onChange={(event) => updateDraft(draft.repo.fullName, { include: event.target.checked })}
                        />
                        <a href={draft.repo.htmlUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-small font-medium text-primary hover:underline">
                          View on GitHub <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      </div>
                      {draft.status === 'loading' && (
                        <div className="mt-4 space-y-2" aria-label={`Reading ${draft.repo.name}`}>
                          <Skeleton className="h-10" />
                          <Skeleton className="h-20" />
                        </div>
                      )}
                      {draft.status === 'error' && <Alert tone="error" className="mt-3">{draft.error}</Alert>}
                      {draft.status === 'ready' && (
                        <div className="mt-4 space-y-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <TextField label="Project name" value={draft.title} onChange={(event) => updateDraft(draft.repo.fullName, { title: event.target.value })} />
                            <TextField label="Tools and technologies" value={draft.techStack} onChange={(event) => updateDraft(draft.repo.fullName, { techStack: event.target.value })} />
                          </div>
                          <TextareaField label="Description" rows={4} value={draft.description} onChange={(event) => updateDraft(draft.repo.fullName, { description: event.target.value })} />
                        </div>
                      )}
                    </Card>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="secondary" onClick={() => setDrafts([])} disabled={adding}>
                  Back to repositories
                </Button>
                <Button variant="primary" onClick={() => void addToResume()} disabled={readyCount === 0} loading={adding}>
                  Add {readyCount} to “{current?.title}”
                </Button>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
