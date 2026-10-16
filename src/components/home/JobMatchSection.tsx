'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileCheck2,
  LoaderCircle,
  Sparkles,
  Target,
  Upload,
  WandSparkles,
} from 'lucide-react';
import { useResumeStore } from '@/store/useResumeStore';
import { useStoreHydrated } from '@/store/useStoreHydrated';
import type { ResumeData } from '@/types/resume';
import { callAi } from '@/utils/aiClient';
import { normalizeResumeData } from '@/utils/normalizeResumeData';
import { hasResumeContent } from '@/utils/resumeContent';
import { parseResumePdf } from '@/utils/resumeImport';
import { Reveal, ScoreRing, SectionHeading } from '@/components/home/landingPrimitives';

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
  criteria: Array<{
    requirement: string;
    category: string;
    importance: 'required' | 'preferred';
    met: boolean;
    evidence: string;
  }>;
  blockers: string[];
  fitChecks: {
    fieldAligned: boolean;
    relevantSkillsPresent: boolean;
    experienceLevelAligned: boolean;
    evidence: string;
  };
  tailoredSummary: string;
  actionableTips: string[];
  syncEligible: boolean;
  syncReason: string;
  syncToken?: string;
}

const scoreColor = (score: number) =>
  score >= 75 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-rose-500';

export function JobMatchSection() {
  const hydrated = useStoreHydrated();
  const { resumeData, setResumeData } = useResumeStore();
  const matchResumeInputRef = useRef<HTMLInputElement>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdFileName, setJdFileName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [matcherParsing, setMatcherParsing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [analysisResume, setAnalysisResume] = useState<ResumeData | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const hasSavedResume = hydrated && hasResumeContent(resumeData);
  const savedName = resumeData.personalInfo.fullName.trim() || 'Saved resume';
  const busy = matcherParsing || analyzing || syncing;
  const jdLength = jobDescription.trim().length;

  const resetAnalysis = () => {
    setMatchResult(null);
    setSyncMessage(null);
    setSynced(false);
  };

  const loadResumeForMatching = async (file: File) => {
    setMatcherParsing(true);
    setMatchError(null);
    resetAnalysis();
    try {
      const parsed = await parseResumePdf(file);
      setAnalysisResume(parsed);
      setResumeFile(file);
    } catch (error) {
      setMatchError(error instanceof Error ? error.message : 'Resume import failed.');
    } finally {
      setMatcherParsing(false);
    }
  };

  const pickSavedResume = () => {
    if (!hasResumeContent(resumeData)) {
      setMatchError('No saved resume is available. Upload a PDF or continue a saved draft first.');
      return;
    }
    setAnalysisResume(resumeData);
    setResumeFile(null);
    resetAnalysis();
    setMatchError(null);
  };

  const loadJdFile = async (file: File) => {
    setMatchError(null);
    resetAnalysis();
    if (file.size > 1_000_000) {
      setMatchError('Job description file must be smaller than 1 MB.');
      return;
    }
    try {
      const text = await file.text();
      if (!text.trim()) throw new Error('That job description file is empty.');
      setJobDescription(text);
      setJdFileName(file.name);
    } catch (error) {
      setMatchError(error instanceof Error ? error.message : 'Could not read the job description file.');
    }
  };

  const handleAnalyze = async () => {
    const candidate = analysisResume || (hasResumeContent(resumeData) ? resumeData : null);
    if (!candidate) {
      setMatchError('Upload a PDF resume first so we can compare evidence against the role.');
      return;
    }
    if (jdLength < 80) {
      setMatchError('Add the complete job posting (at least 80 characters) for a meaningful comparison.');
      return;
    }

    setAnalyzing(true);
    setMatchError(null);
    resetAnalysis();
    try {
      const result = await callAi<MatchResult>('match-job', {
        resumeData: candidate,
        jobDescription: jobDescription.trim(),
      });
      // Remember exactly which resume was analysed: the sync token is tied to it.
      setAnalysisResume(candidate);
      setMatchResult(result);
    } catch (error) {
      setMatchError(error instanceof Error ? error.message : 'Job match analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSync = async () => {
    if (!matchResult?.syncEligible || !analysisResume) return;
    // Tailoring an uploaded PDF writes it into the editor, replacing a different saved draft.
    const replacesOtherDraft = hasSavedResume && analysisResume !== resumeData;
    if (
      replacesOtherDraft &&
      !window.confirm(
        `Saving the tailored resume will replace the resume saved on this device (${savedName}). Continue?`
      )
    ) {
      return;
    }

    setSyncing(true);
    setMatchError(null);
    try {
      const result = await callAi<unknown>('tailor-resume', {
        resumeData: analysisResume,
        jobDescription: jobDescription.trim(),
        syncToken: matchResult.syncToken,
      });
      const tailored = normalizeResumeData(result);
      setResumeData(tailored);
      setAnalysisResume(tailored);
      setSynced(true);
      setSyncMessage('Your tailored resume is saved in the editor. Review every change before using it.');
    } catch (error) {
      setMatchError(error instanceof Error ? error.message : 'Resume tailoring failed.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <section id="job-match" className="relative scroll-mt-24 px-3 py-20 sm:px-6 lg:py-28">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-slate-950 px-5 py-16 text-white sm:px-10 lg:px-14 lg:py-20">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-indigo-600/30 blur-[110px]" />
          <div className="absolute -bottom-40 -right-24 h-[30rem] w-[30rem] rounded-full bg-sky-500/20 blur-[110px]" />
          <div className="absolute inset-0 [background-image:radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        </div>

        <div className="relative">
          <SectionHeading
            tone="dark"
            eyebrow="Job fit, with evidence"
            icon={<Target className="h-3.5 w-3.5" />}
            title={
              <>
                Know how your resume{' '}
                <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-sky-300 bg-clip-text text-transparent">
                  meets the role.
                </span>
              </>
            }
            description="Add a resume and a full job description. Get a reasoned estimate, see required versus preferred gaps, and unlock tailoring only when the evidence supports it."
          />

          <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-4 lg:grid-cols-[.85fr_1.15fr]">
            {/* Resume source */}
            <Reveal>
              <div className="h-full rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-200">
                    <FileCheck2 className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold">1. Your resume</h3>
                    <p className="mt-0.5 text-[11px] text-slate-400">PDF up to 8 MB, or your saved draft</p>
                  </div>
                </div>
                <input
                  ref={matchResumeInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void loadResumeForMatching(file);
                    event.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => matchResumeInputRef.current?.click()}
                  disabled={busy}
                  className="group mt-5 flex w-full items-center gap-3 rounded-2xl border border-dashed border-white/20 bg-white/[0.03] p-4 text-left transition hover:border-indigo-300/60 hover:bg-white/[0.07] disabled:opacity-60"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-lg">
                    {matcherParsing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold">
                      {matcherParsing ? 'Reading your PDF…' : resumeFile?.name || 'Upload resume PDF'}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                      {analysisResume?.personalInfo.fullName ||
                        (hasSavedResume ? `Saved: ${savedName}` : 'Only used for this comparison until you choose to sync')}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-white" />
                </button>

                <div className="my-4 flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
                </div>
                <button
                  type="button"
                  onClick={pickSavedResume}
                  disabled={!hasSavedResume || busy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-bold text-indigo-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-500"
                >
                  <Clock3 className="h-3.5 w-3.5" />
                  {analysisResume && !resumeFile && hasSavedResume ? 'Using saved resume' : 'Use my saved resume'}
                </button>
                {analysisResume && (
                  <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-5 text-emerald-300">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Resume details ready to compare.
                  </p>
                )}
              </div>
            </Reveal>

            {/* Job description */}
            <Reveal delay={0.08}>
              <div className="h-full rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-200">
                      <BriefcaseBusiness className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-extrabold">2. Target job</h3>
                      <p className="mt-0.5 text-[11px] text-slate-400">Paste the complete job description</p>
                    </div>
                  </div>
                  <label className="cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10">
                    <input
                      type="file"
                      accept=".txt,.md,text/plain,text/markdown"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void loadJdFile(file);
                        event.target.value = '';
                      }}
                    />
                    {jdFileName ? 'Change file' : 'Upload .txt'}
                  </label>
                </div>
                {jdFileName && <p className="mt-2 truncate text-[11px] text-emerald-300">{jdFileName}</p>}
                <textarea
                  aria-label="Job description"
                  value={jobDescription}
                  onChange={(event) => {
                    setJobDescription(event.target.value);
                    if (matchResult) resetAnalysis();
                  }}
                  rows={7}
                  maxLength={30000}
                  placeholder="Paste responsibilities, required qualifications, preferred skills, and years of experience…"
                  className="mt-4 w-full resize-y rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/25"
                />
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                  <span className={jdLength > 0 && jdLength < 80 ? 'text-amber-300' : ''}>
                    {jdLength} characters{jdLength > 0 && jdLength < 80 ? ` · ${80 - jdLength} more needed` : ' · avoid private contact details'}
                  </span>
                  <span>Max 30,000</span>
                </div>
                {matchError && (
                  <p role="alert" className="mt-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-[11px] leading-5 text-rose-200">
                    {matchError}
                  </p>
                )}
                {syncMessage && (
                  <div role="status" className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-200">
                    <span>{syncMessage}</span>
                    <Link href="/builder" className="inline-flex items-center gap-1 font-bold text-white underline underline-offset-2">
                      Open in editor <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
                <motion.button
                  whileHover={!busy && jdLength >= 80 ? { y: -2 } : undefined}
                  whileTap={!busy && jdLength >= 80 ? { scale: 0.98 } : undefined}
                  type="button"
                  onClick={() => void handleAnalyze()}
                  disabled={busy || jdLength < 80}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500 px-4 py-3.5 text-sm font-extrabold text-white shadow-[0_15px_50px_-12px_rgba(129,140,248,0.8)] transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {analyzing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {analyzing ? 'Reading requirements & evidence…' : 'Analyze resume match'}
                </motion.button>
              </div>
            </Reveal>
          </div>

          <AnimatePresence>
            {matchResult && (
              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                aria-live="polite"
                className="mx-auto mt-5 max-w-6xl rounded-3xl bg-white p-5 text-slate-900 shadow-2xl sm:p-7"
              >
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4">
                    <ScoreRing value={matchResult.matchScore} size={86} stroke={7} barClassName={scoreColor(matchResult.matchScore)}>
                      <span className="text-xl font-black tracking-tight">{matchResult.matchScore}%</span>
                    </ScoreRing>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estimated alignment · not a hiring guarantee</p>
                      <p className="mt-1 text-lg font-black tracking-tight">Your fit for this role</p>
                      <p className="text-[11px] font-semibold capitalize text-slate-500">{matchResult.confidence} confidence</p>
                    </div>
                  </div>
                  <div className={`max-w-md rounded-2xl px-4 py-3 text-[11px] font-bold leading-5 ${matchResult.syncEligible ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                    {matchResult.syncEligible ? 'Core role checks passed · tailoring available' : matchResult.syncReason}
                  </div>
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-3">
                  {[
                    { label: 'Field / domain fit', passed: matchResult.fitChecks.fieldAligned },
                    { label: 'Relevant skills', passed: matchResult.fitChecks.relevantSkillsPresent },
                    { label: 'Experience level', passed: matchResult.fitChecks.experienceLevelAligned },
                  ].map((check) => (
                    <div
                      key={check.label}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-bold ${
                        check.passed ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-amber-100 bg-amber-50 text-amber-800'
                      }`}
                    >
                      {check.passed ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <CircleHelp className="h-4 w-4 shrink-0" />}
                      {check.label}: {check.passed ? 'Pass' : 'Review'}
                    </div>
                  ))}
                </div>
                {matchResult.fitChecks.evidence && (
                  <p className="mt-2 text-[11px] leading-5 text-slate-500">Core-fit evidence: {matchResult.fitChecks.evidence}</p>
                )}

                {(matchResult.domainMismatch || matchResult.licenseRequired || matchResult.seniorityMismatch) && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {matchResult.domainMismatch && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] leading-5 text-rose-800"><strong>Domain mismatch:</strong> {matchResult.domainMismatchDetails || 'The resume evidence appears to be from a different field.'}</div>}
                    {matchResult.licenseRequired && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] leading-5 text-rose-800"><strong>Required license:</strong> {matchResult.licenseWarning || 'Verify the required license before applying.'}</div>}
                    {matchResult.seniorityMismatch && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-5 text-amber-900"><strong>Experience gap:</strong> {matchResult.seniorityWarning || 'The verified experience may not meet the role’s seniority level.'}</div>}
                  </div>
                )}

                {matchResult.blockers.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50/70 p-4">
                    <h4 className="flex items-center gap-1.5 text-[11px] font-extrabold text-rose-800"><CircleHelp className="h-3.5 w-3.5" /> Important unmet requirements</h4>
                    <ul className="mt-1.5 grid gap-1 text-[11px] leading-5 text-rose-800 sm:grid-cols-2">
                      {matchResult.blockers.map((blocker, index) => <li key={`${blocker}-${index}`}>• {blocker}</li>)}
                    </ul>
                  </div>
                )}

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800">Requirement-by-requirement evidence</h4>
                    <div className="mt-2 max-h-80 space-y-2 overflow-y-auto pr-1">
                      {matchResult.criteria.map((criterion, index) => (
                        <div key={`${criterion.requirement}-${index}`} className={`rounded-xl border p-3 ${criterion.met ? 'border-emerald-100 bg-emerald-50/50' : criterion.importance === 'required' ? 'border-rose-100 bg-rose-50/50' : 'border-slate-100 bg-slate-50/60'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[11px] font-bold leading-5 text-slate-800">{criterion.requirement}</p>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase ${criterion.met ? 'bg-emerald-100 text-emerald-800' : criterion.importance === 'required' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-600'}`}>
                              {criterion.met ? 'Evidence found' : criterion.importance === 'required' ? 'Required gap' : 'Not shown'}
                            </span>
                          </div>
                          <p className="mt-1 text-[10px] leading-4 text-slate-500">{criterion.category} · {criterion.evidence || 'No supporting evidence identified in the resume.'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800">Skills supported by the resume</h4>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {matchResult.matchingSkills.map((skill) => <span key={skill} className="rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800">{skill}</span>)}
                        {matchResult.matchingSkills.length === 0 && <p className="text-[11px] text-slate-500">No direct skill evidence identified.</p>}
                      </div>
                      {matchResult.missingSkills.length > 0 && <p className="mt-2 text-[11px] leading-5 text-rose-700"><strong>Not evidenced:</strong> {matchResult.missingSkills.join(', ')}</p>}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800">Practical next steps</h4>
                      <ul className="mt-1.5 space-y-1 text-[11px] leading-5 text-slate-600">
                        {matchResult.actionableTips.map((tip, index) => <li key={`${tip}-${index}`}>• {tip}</li>)}
                      </ul>
                    </div>
                    {matchResult.tailoredSummary && (
                      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                        <h4 className="text-[11px] font-extrabold text-indigo-900">Evidence-based summary suggestion</h4>
                        <p className="mt-1 text-[11px] leading-5 text-indigo-950/80">{matchResult.tailoredSummary}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
                  <div className="text-[11px] leading-5 text-slate-600">
                    <strong className="text-slate-800">Eligibility is based on role fit — not the match percentage.</strong>
                    <span className="block">
                      {matchResult.syncEligible
                        ? 'The core field, relevant-skill, and experience checks passed. You can tailor this resume even if the estimate is below 70%.'
                        : matchResult.syncReason}
                    </span>
                  </div>
                  {synced ? (
                    <Link
                      href="/builder"
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-[11px] font-bold text-white transition hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Synced · open in editor
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleSync()}
                      disabled={!matchResult.syncEligible || busy}
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-[11px] font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {syncing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                      {syncing ? 'Tailoring honestly…' : 'Sync resume with JD'}
                    </button>
                  )}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
