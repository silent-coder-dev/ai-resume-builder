'use client';

import { useState } from 'react';
import { BriefcaseBusiness, Check, ChevronDown, Copy, FileText, RotateCcw, Sparkles } from 'lucide-react';
import type { ResumeData } from '@/types/resume';
import { callAi } from '@/utils/aiClient';
import { hasResumeContent } from '@/utils/resumeContent';
import { Button } from '@/components/ui/Button';
import { Checkbox, Field, SelectField, TextField, Textarea } from '@/components/ui/Field';
import { Alert, Badge, Card, PageHeader, Skeleton } from '@/components/ui/Primitives';
import { toast } from '@/components/ui/Toast';
import { useToolResume } from '@/components/tools/useToolResume';
import { ResumeSourcePicker, type ResumeSource } from '@/components/tools/ResumeSourcePicker';
import { JobDescriptionField, MIN_JOB_DESCRIPTION_CHARS } from '@/components/tools/JobDescriptionField';

type Category = 'technical' | 'coding' | 'project' | 'behavioral' | 'role';

interface Question {
  id: string;
  category: Category;
  question: string;
  requirement: string;
  evidence: 'shown' | 'partial' | 'gap' | null;
  basedOn: string;
  whyAsked: string;
  answerPoints: string[];
  code: { language: string; snippet: string; explanation: string } | null;
}

interface QuestionSet {
  jobTitle: string;
  roleInvolvesCoding: boolean;
  questions: Question[];
}

// What the questions were prepared from, so feedback uses the same context
// even if the inputs above are changed afterwards.
interface PrepContext {
  resumeData: ResumeData;
  jobDescription: string;
  targetRole: string;
  wantedCoding: boolean;
}

interface Feedback {
  ratings: { accuracy: number; clarity: number; completeness: number; communication: number };
  strengths: string[];
  improvements: string[];
  betterAnswerOutline: string[];
}

const CATEGORIES: Array<{ value: Category; label: string; badge: string }> = [
  { value: 'technical', label: 'Technical', badge: 'Technical' },
  { value: 'coding', label: 'Coding (with sample code)', badge: 'Coding' },
  { value: 'project', label: 'Project-based', badge: 'Project-based' },
  { value: 'behavioral', label: 'Behavioral', badge: 'Behavioral' },
  { value: 'role', label: 'Role-specific', badge: 'Role-specific' },
];

const EVIDENCE = {
  shown: { label: 'On your resume', tone: 'success' },
  partial: { label: 'Partly on your resume', tone: 'warning' },
  gap: { label: 'Not on your resume', tone: 'error' },
} as const;

const RATING_LABELS = ['', 'Needs work', 'Fair', 'Good', 'Strong', 'Excellent'];

function CodeBlock({ language, snippet }: { language: string; snippet: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('The code could not be copied. Select it and copy it instead.', { tone: 'error' });
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface-2">
      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-1">
        <span className="text-label font-medium text-ink-2">{language}</span>
        <Button size="sm" variant="ghost" onClick={() => void copy()} aria-label={`Copy the ${language} code`}>
          {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <pre className="max-h-[28rem] overflow-auto p-3 text-small leading-5">
        <code className="font-mono text-ink">{snippet}</code>
      </pre>
    </div>
  );
}

function QuestionCard({ question, context }: { question: Question; context: PrepContext }) {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isCoding = question.category === 'coding';
  const evidence = question.evidence ? EVIDENCE[question.evidence] : null;

  const getFeedback = async () => {
    setLoading(true);
    setError(null);
    try {
      setFeedback(
        await callAi<Feedback>('interview-feedback', {
          resumeData: context.resumeData,
          targetRole: context.targetRole,
          jobDescription: context.jobDescription,
          question: question.question,
          category: question.category,
          answer,
        })
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Feedback could not be generated.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="primary">{CATEGORIES.find((item) => item.value === question.category)?.badge ?? 'Question'}</Badge>
        {evidence && <Badge tone={evidence.tone}>{evidence.label}</Badge>}
        {question.requirement ? (
          <span className="text-label text-ink-2">
            Job requirement: <span className="font-medium text-ink">{question.requirement}</span>
          </span>
        ) : (
          question.basedOn && <span className="text-label text-ink-2">Based on: {question.basedOn}</span>
        )}
      </div>
      <h3 className="mt-2 whitespace-pre-line text-card font-semibold text-ink">{question.question}</h3>
      {question.whyAsked && <p className="mt-1 text-small text-ink-2">Why it is asked: {question.whyAsked}</p>}

      <Field label={isCoding ? 'Your code or approach' : 'Your answer'} className="mt-4">
        {(control) => (
          <Textarea
            {...control}
            rows={isCoding ? 10 : 5}
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            maxLength={5000}
            spellCheck={!isCoding}
            className={isCoding ? 'font-mono text-small' : ''}
            placeholder={
              isCoding
                ? 'Write your code, then explain your approach and its time and space complexity…'
                : 'Answer as you would in the interview…'
            }
          />
        )}
      </Field>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => void getFeedback()} disabled={!answer.trim()} loading={loading}>
          <Sparkles className="h-4 w-4" aria-hidden="true" /> Get feedback
        </Button>
        {(feedback || answer) && (
          <Button
            variant="secondary"
            onClick={() => {
              setAnswer('');
              setFeedback(null);
              setError(null);
            }}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Try again
          </Button>
        )}
      </div>
      {error && <Alert tone="error" className="mt-3">{error}</Alert>}

      {feedback && (
        <div className="mt-5 space-y-4 border-t border-line pt-4" aria-live="polite">
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.entries(feedback.ratings) as Array<[keyof Feedback['ratings'], number]>).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between text-small">
                  <span className="capitalize text-ink">{key}</span>
                  <span className="font-medium text-ink-2">
                    {value}/5 · {RATING_LABELS[value]}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${value * 20}%` }} />
                </div>
              </div>
            ))}
          </div>
          {feedback.strengths.length > 0 && (
            <div>
              <p className="text-label font-medium text-green-700">What worked</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-small text-ink">
                {feedback.strengths.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          )}
          {feedback.improvements.length > 0 && (
            <div>
              <p className="text-label font-medium text-amber-800">To improve</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-small text-ink">
                {feedback.improvements.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          )}
          {feedback.betterAnswerOutline.length > 0 && (
            <div>
              <p className="text-label font-medium text-ink">A stronger answer could</p>
              <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-small text-ink">
                {feedback.betterAnswerOutline.map((item) => <li key={item}>{item}</li>)}
              </ol>
            </div>
          )}
        </div>
      )}

      {(question.answerPoints.length > 0 || question.code) && (
        <details className="group mt-4 rounded-lg border border-line">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-4 py-2.5 text-small font-semibold text-primary [&::-webkit-details-marker]:hidden">
            {question.code ? 'Show a sample answer and code' : 'Show a sample answer'}
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="space-y-3 border-t border-line px-4 py-3">
            {question.answerPoints.length > 0 && (
              <div>
                <p className="text-label font-medium text-ink">A strong answer covers</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-small text-ink">
                  {question.answerPoints.map((point) => <li key={point}>{point}</li>)}
                </ul>
              </div>
            )}
            {question.code && (
              <>
                <CodeBlock language={question.code.language} snippet={question.code.snippet} />
                {question.code.explanation && (
                  <p className="text-small text-ink">
                    <span className="font-medium">Approach: </span>
                    {question.code.explanation}
                  </p>
                )}
              </>
            )}
            <p className="text-label text-ink-2">
              Try answering first, then compare.
              {question.code ? ' The sample code is written by AI: run and test it before you rely on it.' : ''}
            </p>
          </div>
        </details>
      )}
    </Card>
  );
}

// PRD §18 — practice questions from your resume and, optionally, a job
// description, with feedback. Coding questions include sample code.
export function InterviewTool() {
  const { ready, resumes, current, select } = useToolResume();
  const [source, setSource] = useState<ResumeSource>({ kind: 'saved' });
  const [jobDescription, setJobDescription] = useState('');
  const [targetRole, setTargetRole] = useState<string | null>(null);
  const [categories, setCategories] = useState<Set<Category>>(new Set(CATEGORIES.map((item) => item.value)));
  const [count, setCount] = useState('6');
  const [result, setResult] = useState<{ set: QuestionSet; context: PrepContext } | null>(null);
  const [parsing, setParsing] = useState(false);
  const [readingJob, setReadingJob] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resumeData = source.kind === 'upload' ? source.data : current?.data ?? null;
  const jdLength = jobDescription.trim().length;
  const hasJob = jdLength > 0;
  // With a job description, the role comes from it unless the user types one.
  const role = targetRole ?? (hasJob ? '' : resumeData?.personalInfo.targetRole ?? '');
  const hasContent = hasResumeContent(resumeData);
  const canGenerate =
    hasContent && (!hasJob || jdLength >= MIN_JOB_DESCRIPTION_CHARS) && categories.size > 0 && !parsing && !readingJob;

  const clearResults = () => {
    setResult(null);
    setTargetRole(null);
  };

  const generate = async () => {
    if (!resumeData || !canGenerate) return;
    const context: PrepContext = {
      resumeData,
      jobDescription: jobDescription.trim(),
      targetRole: role.trim(),
      wantedCoding: categories.has('coding'),
    };
    setLoading(true);
    setError(null);
    try {
      const set = await callAi<QuestionSet>('interview-questions', {
        resumeData,
        jobDescription: context.jobDescription,
        targetRole: context.targetRole,
        categories: [...categories],
        count: Number(count),
      });
      setResult({ set, context });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Questions could not be prepared.');
    } finally {
      setLoading(false);
    }
  };

  const questions = result?.set.questions ?? [];
  const jobQuestions = questions.filter((question) => question.requirement).length;
  const gaps = questions.filter((question) => question.evidence === 'gap').length;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Interview Preparation"
        description="Practice questions based on your resume and, if you add one, the job description’s requirements. Coding questions come with sample code. Feedback helps you prepare; it cannot guarantee interview success."
      />

      {!ready ? (
        <Skeleton className="mt-6 h-48" />
      ) : (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card className="min-w-0 p-5">
              <h2 className="flex items-center gap-2 text-card font-semibold text-ink">
                <FileText className="h-4 w-4 text-primary" aria-hidden="true" /> 1. Your resume
              </h2>
              <div className="mt-4">
                <ResumeSourcePicker
                  name="interview-source"
                  resumes={resumes}
                  currentId={current?.id}
                  source={source}
                  onSelectResume={(id) => {
                    select(id);
                    clearResults();
                  }}
                  onSourceChange={(next) => {
                    setSource(next);
                    clearResults();
                  }}
                  onError={setError}
                  onBusyChange={setParsing}
                  uploadHint="Used only for this practice session. It is not saved as a resume."
                />
              </div>
              {resumeData && !hasContent && !parsing && (
                <p className="mt-4 text-small text-ink-2">This resume is empty. Add some details first, or upload a PDF.</p>
              )}
            </Card>

            <Card className="min-w-0 p-5">
              <h2 className="flex items-center gap-2 text-card font-semibold text-ink">
                <BriefcaseBusiness className="h-4 w-4 text-primary" aria-hidden="true" /> 2. The job{' '}
                <span className="text-body font-normal text-ink-2">(optional)</span>
              </h2>
              <JobDescriptionField
                className="mt-4"
                optional
                rows={7}
                value={jobDescription}
                onChange={setJobDescription}
                onError={setError}
                onBusyChange={setReadingJob}
                hint="Add the job posting to get questions on its requirements. Paste it, or upload a PDF or .txt file."
              />
              <TextField
                className="mt-4"
                label="Target role"
                optional
                value={role}
                onChange={(event) => setTargetRole(event.target.value)}
                placeholder={hasJob ? 'Taken from the job description' : 'e.g. Backend Developer'}
              />
            </Card>
          </div>

          <Card className="mt-4 space-y-5 p-5">
            <fieldset>
              <legend className="mb-2 text-label font-medium text-ink">Question types</legend>
              <div className="flex flex-wrap gap-x-5 gap-y-3">
                {CATEGORIES.map((category) => (
                  <Checkbox
                    key={category.value}
                    label={category.label}
                    checked={categories.has(category.value)}
                    onChange={() =>
                      setCategories((previous) => {
                        const next = new Set(previous);
                        if (next.has(category.value)) next.delete(category.value);
                        else next.add(category.value);
                        return next;
                      })
                    }
                  />
                ))}
              </div>
              <p className="mt-2 text-label text-ink-2">Coding questions are only added when the role involves writing code.</p>
            </fieldset>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <SelectField label="Number of questions" value={count} onChange={(event) => setCount(event.target.value)} className="sm:w-48">
                {['4', '6', '8', '10'].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </SelectField>
              <Button variant="primary" onClick={() => void generate()} loading={loading} disabled={!canGenerate}>
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {loading ? 'Preparing questions…' : result ? 'New questions' : 'Prepare questions'}
              </Button>
            </div>
          </Card>

          {error && <Alert tone="error" className="mt-4">{error}</Alert>}

          {loading && (
            <div className="mt-6 max-w-4xl space-y-3" aria-label="Preparing questions">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
          )}

          {result && !loading && (
            <section className="mt-8 max-w-4xl" aria-labelledby="questions-heading">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 id="questions-heading" className="text-heading font-semibold text-ink">
                  {result.set.jobTitle ? `Questions for ${result.set.jobTitle}` : 'Your practice questions'}
                </h2>
                {result.context.jobDescription && (
                  <p className="text-small text-ink-2">
                    {jobQuestions} of {questions.length} test job requirements
                    {gaps > 0 ? ` · ${gaps} not shown on your resume` : ''}
                  </p>
                )}
              </div>
              {result.context.wantedCoding && !result.set.roleInvolvesCoding && (
                <Alert tone="info" className="mt-3">
                  No coding questions: this role does not involve writing code, so other question types were used instead.
                </Alert>
              )}
              {gaps > 0 && (
                <p className="mt-2 text-small text-ink-2">
                  Questions marked “Not on your resume” test requirements your resume does not show. Answer them honestly: say what you know, and how you would learn the rest.
                </p>
              )}
              <ul className="mt-4 space-y-4">
                {questions.map((question) => (
                  <li key={`${question.id}-${question.question}`}>
                    <QuestionCard question={question} context={result.context} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
