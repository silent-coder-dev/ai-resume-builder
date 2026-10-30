'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, CircleAlert, FileText, Gauge, Info, Lightbulb, Save, Sparkles } from 'lucide-react';
import type { CareerStage, ResumeData } from '@/types/resume';
import { analyzeResume, type IssueSeverity } from '@/lib/resume/analyzer';
import { suggestResumeTitle } from '@/lib/resume/record';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { callAi } from '@/utils/aiClient';
import { isFilledExperience } from '@/utils/resumeContent';
import { Button, ButtonLink } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/Field';
import { Alert, Badge, Card, EmptyState, PageHeader, Skeleton } from '@/components/ui/Primitives';
import { toast } from '@/components/ui/Toast';
import { useToolResume } from '@/components/tools/useToolResume';
import { ResumeSourcePicker, type ResumeSource } from '@/components/tools/ResumeSourcePicker';

interface AiReview {
  overview: string;
  issues: Array<{
    severity: IssueSeverity;
    category: string;
    section: string;
    location: string;
    title: string;
    explanation: string;
    suggestion: string;
  }>;
}

const SEVERITY = {
  critical: { label: 'Critical', tone: 'error' as const, icon: AlertCircle },
  warning: { label: 'Should fix', tone: 'warning' as const, icon: CircleAlert },
  suggestion: { label: 'Suggestion', tone: 'info' as const, icon: Lightbulb },
};

const STAGES: Array<{ value: CareerStage; label: string }> = [
  { value: 'student', label: 'Student' },
  { value: 'fresher', label: 'Fresher' },
  { value: 'experienced', label: 'Experienced' },
];

// A first guess for an uploaded PDF; the user can change it.
const guessStage = (data: ResumeData): CareerStage => (data.experiences.some(isFilledExperience) ? 'experienced' : 'fresher');

function IssueCard({
  severity,
  category,
  title,
  explanation,
  suggestion,
  location,
  fixHref,
}: {
  severity: IssueSeverity;
  category: string;
  title: string;
  explanation: string;
  suggestion: string;
  location?: string;
  // No link for an uploaded PDF: it has no place in the editor until it is saved.
  fixHref?: string;
}) {
  const meta = SEVERITY[severity];
  const Icon = meta.icon;
  return (
    <li className="rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={meta.tone}>
              <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {meta.label}
            </Badge>
            <span className="text-label text-ink-2">{category}{location ? ` · ${location}` : ''}</span>
          </div>
          <h3 className="mt-2 text-body font-semibold text-ink">{title}</h3>
          <p className="mt-1 text-small text-ink-2">{explanation}</p>
          <p className="mt-2 text-small text-ink">
            <span className="font-medium">How to fix: </span>
            {suggestion}
          </p>
        </div>
        {fixHref && (
          <ButtonLink href={fixHref} size="sm" variant="secondary" className="shrink-0">
            Fix <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </ButtonLink>
        )}
      </div>
    </li>
  );
}

export function AnalyzerTool() {
  const { ready, resumes, current, select } = useToolResume();
  const createResume = useWorkspaceStore((state) => state.createResume);
  const [source, setSource] = useState<ResumeSource>({ kind: 'saved' });
  const [uploadStage, setUploadStage] = useState<CareerStage>('fresher');
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  // The AI review belongs to one resume: a saved resume's ID, or the uploaded data itself.
  const [review, setReview] = useState<{ key: string | ResumeData; result: AiReview } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploaded = source.kind === 'upload' ? source : null;
  const data = uploaded ? uploaded.data : current?.data ?? null;
  const careerStage = uploaded ? uploadStage : current?.careerStage ?? null;
  const reviewKey = uploaded ? uploaded.data : current?.id;
  const shownReview = review && review.key === reviewKey ? review.result : null;

  const analysis = useMemo(() => (data ? analyzeResume({ data, careerStage }) : null), [data, careerStage]);

  const changeSource = (next: ResumeSource) => {
    setSource(next);
    setError(null);
    if (next.kind === 'upload') setUploadStage(guessStage(next.data));
  };

  const runReview = async () => {
    if (!data || !reviewKey) return;
    setLoading(true);
    setError(null);
    try {
      const result = await callAi<AiReview>('analyze-resume', {
        resumeData: data,
        targetRole: data.personalInfo.targetRole,
      });
      setReview({ key: reviewKey, result });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The AI review could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  // Saves the uploaded PDF as a new resume, so the Fix buttons can open it in the editor.
  const saveUpload = async () => {
    if (!uploaded) return;
    setSaving(true);
    setError(null);
    try {
      const record = await createResume(
        { title: suggestResumeTitle(uploaded.data), careerStage: uploadStage, data: uploaded.data },
        { open: false }
      );
      if (review?.key === uploaded.data) setReview({ key: record.id, result: review.result });
      setSource({ kind: 'saved' });
      select(record.id);
      toast(`Saved as “${record.title}”. Use the Fix buttons to edit it.`, { tone: 'success' });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The resume could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const fixHref = (section: string) =>
    uploaded ? undefined : current ? `/builder?id=${current.id}&section=${encodeURIComponent(section)}` : '/builder';
  const scoreTone = analysis ? (analysis.score >= 85 ? 'text-success' : analysis.score >= 50 ? 'text-warning' : 'text-error') : '';
  const targetRole = data?.personalInfo.targetRole.trim() ?? '';
  const waitingForSaved = !uploaded && resumes.length > 0 && !current;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Resume Analyzer"
        description="See what to improve, why it matters, and how to fix it. Analyze a saved resume or upload a PDF. Scores are estimates to guide you — they do not guarantee ATS results or interviews."
      />

      {!ready ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-[20rem_1fr]">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      ) : (
        <>
          <Card className="mt-6 p-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="min-w-0">
                <h2 className="flex items-center gap-2 text-card font-semibold text-ink">
                  <FileText className="h-4 w-4 text-primary" aria-hidden="true" /> Resume to analyze
                </h2>
                <div className="mt-4">
                  <ResumeSourcePicker
                    name="analyze-source"
                    resumes={resumes}
                    currentId={current?.id}
                    source={source}
                    onSelectResume={select}
                    onSourceChange={changeSource}
                    onError={setError}
                    onBusyChange={setParsing}
                    uploadHint="Analyzed on this page only. Save it as a resume if you want to fix it in the editor."
                  />
                </div>
              </div>
              {uploaded && (
                <div className="min-w-0 space-y-3 border-t border-line pt-5 md:border-l md:border-t-0 md:pl-5 md:pt-0">
                  <SelectField
                    label="Score it as"
                    hint="Early-career resumes are not marked down for having no work history."
                    value={uploadStage}
                    onChange={(event) => setUploadStage(event.target.value as CareerStage)}
                  >
                    {STAGES.map((stage) => (
                      <option key={stage.value} value={stage.value}>
                        {stage.label}
                      </option>
                    ))}
                  </SelectField>
                  <p className="text-small text-ink-2">
                    This PDF is not saved. To fix the issues in the editor, save it as a new resume. Your other resumes are not changed.
                  </p>
                  <Button variant="secondary" onClick={() => void saveUpload()} loading={saving} disabled={parsing}>
                    <Save className="h-4 w-4" aria-hidden="true" /> Save as a resume
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {error && <Alert tone="error" className="mt-4">{error}</Alert>}

          {parsing || waitingForSaved ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-[20rem_1fr]" aria-label={parsing ? 'Reading your PDF' : undefined}>
              <Skeleton className="h-80" />
              <Skeleton className="h-80" />
            </div>
          ) : !analysis ? (
            <EmptyState
              className="mt-6"
              icon={Gauge}
              title="No resume to analyze yet"
              description="Upload a PDF above, or create a resume in the builder and come back."
              actions={<ButtonLink href="/builder" variant="primary">Create a resume</ButtonLink>}
            />
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-[20rem_1fr]">
              <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
                <Card className="p-5">
                  <p className="text-label font-medium text-ink-2">Readiness estimate</p>
                  <p className="mt-1 flex items-baseline gap-2">
                    <span className={`text-title font-bold ${scoreTone}`}>{analysis.score}</span>
                    <span className="text-body text-ink-2">/ 100 · {analysis.label}</span>
                  </p>
                  <ul className="mt-5 space-y-3" aria-label="Score breakdown">
                    {analysis.categories.map((category) => (
                      <li key={category.category}>
                        <div className="flex justify-between text-small">
                          <span className="text-ink">{category.category}</span>
                          <span className="font-medium text-ink-2">
                            {category.score}/{category.max}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${(category.score / category.max) * 100}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 flex gap-2 text-label text-ink-2">
                    <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {careerStage === 'experienced'
                      ? 'Scored as an experienced candidate: work history counts most.'
                      : 'Scored for early career: projects and education count, and no work history is not a penalty.'}
                  </p>
                </Card>

                <Card className="p-5">
                  <h2 className="text-card font-semibold text-ink">AI review</h2>
                  <p className="mt-1 text-small text-ink-2">
                    Grammar, clarity, and relevance to {targetRole ? `“${targetRole}”` : 'your target role'}. Sends this resume to the AI service.
                  </p>
                  <Button variant="primary" className="mt-4 w-full" onClick={() => void runReview()} loading={loading}>
                    <Sparkles className="h-4 w-4" aria-hidden="true" /> {shownReview ? 'Run again' : 'Run AI review'}
                  </Button>
                </Card>
              </div>

              <div className="min-w-0 space-y-6">
                {loading && (
                  <div className="space-y-3" aria-label="Running AI review">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                  </div>
                )}
                {shownReview && !loading && (
                  <section aria-labelledby="ai-review-heading">
                    <h2 id="ai-review-heading" className="text-heading font-semibold text-ink">AI review</h2>
                    {shownReview.overview && <p className="mt-1 text-body text-ink-2">{shownReview.overview}</p>}
                    {shownReview.issues.length === 0 ? (
                      <Alert tone="success" className="mt-3">No grammar, clarity, or relevance problems were found.</Alert>
                    ) : (
                      <ul className="mt-3 space-y-3">
                        {shownReview.issues.map((issue, index) => (
                          <IssueCard key={`${issue.title}-${index}`} {...issue} fixHref={fixHref(issue.section)} />
                        ))}
                      </ul>
                    )}
                  </section>
                )}

                <section aria-labelledby="checks-heading">
                  <h2 id="checks-heading" className="text-heading font-semibold text-ink">
                    Completeness checks <span className="text-body font-normal text-ink-2">({analysis.issues.length})</span>
                  </h2>
                  {analysis.issues.length === 0 ? (
                    <Alert tone="success" className="mt-3">Every completeness check passed. Run the AI review for wording feedback.</Alert>
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {analysis.issues.map((issue) => (
                        <IssueCard key={issue.id} {...issue} fixHref={fixHref(issue.target)} />
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
