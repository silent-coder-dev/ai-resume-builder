'use client';

import { useState } from 'react';
import { BriefcaseBusiness, CheckCircle2, CircleHelp, FileText, Target, WandSparkles } from 'lucide-react';
import type { ResumeData } from '@/types/resume';
import { suggestResumeTitle } from '@/lib/resume/record';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { callAi } from '@/utils/aiClient';
import { normalizeResumeData } from '@/utils/normalizeResumeData';
import { hasResumeContent } from '@/utils/resumeContent';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Alert, Badge, Card, EmptyState, PageHeader, Skeleton } from '@/components/ui/Primitives';
import { toast } from '@/components/ui/Toast';
import { useToolResume } from '@/components/tools/useToolResume';
import { ResumeSourcePicker, type ResumeSource } from '@/components/tools/ResumeSourcePicker';
import { JobDescriptionField, MIN_JOB_DESCRIPTION_CHARS } from '@/components/tools/JobDescriptionField';

interface MatchResult {
  matchScore: number;
  confidence: 'high' | 'medium' | 'low';
  domainMismatch: boolean;
  domainMismatchDetails: string | null;
  licenseRequired: boolean;
  licenseWarning: string | null;
  seniorityMismatch: boolean;
  seniorityWarning: string | null;
  matchingSkills: string[];
  missingSkills: string[];
  criteria: Array<{ requirement: string; category: string; importance: 'required' | 'preferred'; met: boolean; evidence: string }>;
  blockers: string[];
  fitChecks: { fieldAligned: boolean; relevantSkillsPresent: boolean; experienceLevelAligned: boolean; evidence: string };
  tailoredSummary: string;
  actionableTips: string[];
  syncEligible: boolean;
  syncReason: string;
  syncToken?: string;
  jobTitle: string;
  projectAlignment: Array<{ project: string; relevance: 'high' | 'medium' | 'low'; evidence: string }>;
  keywordGaps: string[];
}

export function JobMatchTool() {
  const { ready, resumes, current, select } = useToolResume();
  const createResume = useWorkspaceStore((state) => state.createResume);
  const [source, setSource] = useState<ResumeSource>({ kind: 'saved' });
  const [jobDescription, setJobDescription] = useState('');
  const [parsing, setParsing] = useState(false);
  const [readingJob, setReadingJob] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [tailoring, setTailoring] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  // The exact resume data that was analysed: the tailoring token is tied to it.
  const [analysed, setAnalysed] = useState<ResumeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tailoredId, setTailoredId] = useState<string | null>(null);

  const resumeData = source.kind === 'upload' ? source.data : current?.data ?? null;
  const jdLength = jobDescription.trim().length;
  const busy = parsing || readingJob || analyzing || tailoring;

  const reset = () => {
    setResult(null);
    setAnalysed(null);
    setTailoredId(null);
  };

  const analyze = async () => {
    if (!resumeData || !hasResumeContent(resumeData)) {
      setError('Choose a resume with some content, or upload a PDF.');
      return;
    }
    setAnalyzing(true);
    setError(null);
    reset();
    try {
      const match = await callAi<MatchResult>('match-job', { resumeData, jobDescription: jobDescription.trim() });
      setResult(match);
      setAnalysed(resumeData);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The job match could not be completed.');
    } finally {
      setAnalyzing(false);
    }
  };

  // PRD §17: a tailored version is always a NEW resume. The original is never changed.
  const createTailoredVersion = async () => {
    if (!result?.syncEligible || !analysed) return;
    setTailoring(true);
    setError(null);
    try {
      const tailored = normalizeResumeData(
        await callAi<unknown>('tailor-resume', { resumeData: analysed, jobDescription: jobDescription.trim(), syncToken: result.syncToken })
      );
      const role = result.jobTitle || 'Tailored';
      const base = source.kind === 'saved' && current ? current : null;
      const record = await createResume({
        title: `${base?.title ?? suggestResumeTitle(tailored)} — ${role}`,
        careerStage: base?.careerStage ?? null,
        data: tailored,
        templateId: base?.templateId,
        accentColor: base?.accentColor,
        sectionOrder: base?.sectionOrder,
        sourceResumeId: base?.id,
        tailoredFor: result.jobTitle || undefined,
      }, { open: false });
      setTailoredId(record.id);
      toast(`Created “${record.title}”. Your original resume was not changed.`, {
        action: { label: 'Open', href: `/builder?id=${record.id}` },
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The tailored version could not be created.');
    } finally {
      setTailoring(false);
    }
  };

  const scoreTone = (score: number) => (score >= 75 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-error');

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Job Matcher"
        description="Compare your resume with a job description. See which requirements you already show evidence for, and where the real gaps are."
      />

      {!ready ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-card font-semibold text-ink">
              <FileText className="h-4 w-4 text-primary" aria-hidden="true" /> 1. Your resume
            </h2>
            <div className="mt-4">
              <ResumeSourcePicker
                name="match-source"
                resumes={resumes}
                currentId={current?.id}
                source={source}
                onSelectResume={(id) => {
                  select(id);
                  reset();
                }}
                onSourceChange={(next) => {
                  setSource(next);
                  reset();
                }}
                onError={setError}
                onBusyChange={setParsing}
                uploadHint="Used only for this comparison unless you create a tailored version."
              />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-card font-semibold text-ink">
              <BriefcaseBusiness className="h-4 w-4 text-primary" aria-hidden="true" /> 2. The job
            </h2>
            <JobDescriptionField
              className="mt-4"
              value={jobDescription}
              onChange={(value) => {
                setJobDescription(value);
                if (result) reset();
              }}
              onError={setError}
              onBusyChange={setReadingJob}
            />
            <Button
              variant="primary"
              className="mt-4 w-full"
              onClick={() => void analyze()}
              disabled={busy || jdLength < MIN_JOB_DESCRIPTION_CHARS || !resumeData}
              loading={analyzing}
            >
              <Target className="h-4 w-4" aria-hidden="true" />
              {analyzing ? 'Reading requirements and evidence…' : 'Analyze match'}
            </Button>
          </Card>
        </div>
      )}

      {error && <Alert tone="error" className="mt-4">{error}</Alert>}

      {!result && ready && resumes.length === 0 && source.kind === 'saved' && !error && (
        <EmptyState
          className="mt-6"
          icon={Target}
          title="Start with a resume"
          description="The matcher compares a resume with a job description. Create one, or upload a PDF above."
          actions={<ButtonLink href="/builder" variant="primary">Create a resume</ButtonLink>}
        />
      )}

      {result && (
        <section aria-live="polite" className="mt-6 space-y-4">
          <Card className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-label font-medium text-ink-2">Estimated match{result.jobTitle ? ` · ${result.jobTitle}` : ''}</p>
                <p className="mt-1 flex items-baseline gap-2">
                  <span className={`text-title font-bold ${scoreTone(result.matchScore)}`}>{result.matchScore}%</span>
                  <span className="text-small text-ink-2">{result.confidence} confidence</span>
                </p>
                <p className="mt-1 text-small text-ink-2">An estimate of documented fit — not a hiring probability.</p>
              </div>
              <div className="grid gap-2 sm:min-w-80">
                {[
                  { label: 'Field / domain fit', passed: result.fitChecks.fieldAligned },
                  { label: 'Essential skills shown', passed: result.fitChecks.relevantSkillsPresent },
                  { label: 'Experience level fits', passed: result.fitChecks.experienceLevelAligned },
                ].map((check) => (
                  <p key={check.label} className={`flex items-center gap-2 text-small font-medium ${check.passed ? 'text-green-700' : 'text-amber-800'}`}>
                    {check.passed ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <CircleHelp className="h-4 w-4" aria-hidden="true" />}
                    {check.label}: {check.passed ? 'Yes' : 'Needs review'}
                  </p>
                ))}
              </div>
            </div>
            {result.fitChecks.evidence && <p className="mt-3 text-small text-ink-2">{result.fitChecks.evidence}</p>}
          </Card>

          {(result.domainMismatch || result.licenseRequired || result.seniorityMismatch || result.blockers.length > 0) && (
            <Alert tone="warning" title="Important gaps">
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {result.domainMismatch && <li>Domain: {result.domainMismatchDetails || 'Your experience appears to be from a different field.'}</li>}
                {result.licenseRequired && <li>License: {result.licenseWarning || 'The role requires a license your resume does not show.'}</li>}
                {result.seniorityMismatch && <li>Experience: {result.seniorityWarning || 'The role may need more experience than your resume shows.'}</li>}
                {result.blockers
                  .filter((blocker) => blocker !== result.domainMismatchDetails && blocker !== result.licenseWarning && blocker !== result.seniorityWarning)
                  .map((blocker) => (
                    <li key={blocker}>Required: {blocker}</li>
                  ))}
              </ul>
            </Alert>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="text-card font-semibold text-ink">Requirements</h3>
              <ul className="mt-3 max-h-[28rem] space-y-2 overflow-y-auto pr-1">
                {result.criteria.map((criterion, index) => (
                  <li key={`${criterion.requirement}-${index}`} className="rounded-lg border border-line p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-body font-medium text-ink">{criterion.requirement}</p>
                      <Badge tone={criterion.met ? 'success' : criterion.importance === 'required' ? 'error' : 'neutral'}>
                        {criterion.met ? 'Evidence found' : criterion.importance === 'required' ? 'Required gap' : 'Not shown'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-small text-ink-2">{criterion.evidence || 'No supporting evidence found in the resume.'}</p>
                  </li>
                ))}
              </ul>
            </Card>

            <div className="space-y-4">
              <Card className="p-5">
                <h3 className="text-card font-semibold text-ink">Skills</h3>
                <p className="mt-3 text-label font-medium text-ink-2">Shown in your resume</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {result.matchingSkills.length ? result.matchingSkills.map((skill) => <Badge key={skill} tone="success">{skill}</Badge>) : <span className="text-small text-ink-2">None identified.</span>}
                </div>
                <p className="mt-4 text-label font-medium text-ink-2">Asked for but not shown</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {result.missingSkills.length ? result.missingSkills.map((skill) => <Badge key={skill} tone="warning">{skill}</Badge>) : <span className="text-small text-ink-2">None.</span>}
                </div>
                {result.keywordGaps.length > 0 && (
                  <>
                    <p className="mt-4 text-label font-medium text-ink-2">Keywords from the posting not in your resume</p>
                    <p className="mt-1 text-small text-ink">{result.keywordGaps.join(', ')}</p>
                    <p className="mt-1 text-label text-ink-2">Only add a keyword where you really have that experience.</p>
                  </>
                )}
              </Card>

              {result.projectAlignment.length > 0 && (
                <Card className="p-5">
                  <h3 className="text-card font-semibold text-ink">Project alignment</h3>
                  <ul className="mt-3 space-y-2">
                    {result.projectAlignment.map((item) => (
                      <li key={item.project} className="flex items-start justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block text-body font-medium text-ink">{item.project}</span>
                          <span className="block text-small text-ink-2">{item.evidence}</span>
                        </span>
                        <Badge tone={item.relevance === 'high' ? 'success' : item.relevance === 'medium' ? 'info' : 'neutral'}>{item.relevance}</Badge>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {result.actionableTips.length > 0 && (
                <Card className="p-5">
                  <h3 className="text-card font-semibold text-ink">Suggested improvements</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-body text-ink">
                    {result.actionableTips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          </div>

          <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-card font-semibold text-ink">Tailored version</h3>
              <p className="mt-1 text-small text-ink-2">
                {result.syncEligible
                  ? 'Your field, essential skills, and experience level fit this role. AI can create a separate copy with wording focused on it — using only facts already in your resume.'
                  : result.syncReason}
              </p>
            </div>
            {tailoredId ? (
              <ButtonLink href={`/builder?id=${tailoredId}`} variant="primary">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Open tailored resume
              </ButtonLink>
            ) : (
              <Button variant="primary" onClick={() => void createTailoredVersion()} disabled={!result.syncEligible || busy} loading={tailoring}>
                <WandSparkles className="h-4 w-4" aria-hidden="true" /> Create tailored version
              </Button>
            )}
          </Card>
        </section>
      )}
    </div>
  );
}
