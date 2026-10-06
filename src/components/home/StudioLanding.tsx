'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileCheck2,
  FileText,
  GraduationCap,
  LoaderCircle,
  Plus,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  WandSparkles,
} from 'lucide-react';
import { useResumeStore } from '@/store/useResumeStore';
import type { ResumeData } from '@/types/resume';
import { normalizeResumeData } from '@/utils/normalizeResumeData';
import { LandingFooter } from '@/components/home/LandingFooter';

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

const FEATURES = [
  {
    icon: WandSparkles,
    title: 'AI-guided writing',
    description: 'Turn your real experience into crisp, role-focused resume content.',
    tint: 'bg-violet-50 text-violet-700',
  },
  {
    icon: Target,
    title: 'Evidence-led job fit',
    description: 'Compare skills, requirements, and experience gaps against a job.',
    tint: 'bg-blue-50 text-blue-700',
  },
  {
    icon: ShieldCheck,
    title: 'Your draft stays yours',
    description: 'Resume progress is saved in this browser. Review AI edits before use.',
    tint: 'bg-emerald-50 text-emerald-700',
  },
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.includes(',') ? result.slice(result.indexOf(',') + 1) : '';
      if (!base64) reject(new Error('Could not read the selected PDF.'));
      else resolve(base64);
    };
    reader.onerror = () => reject(new Error('Could not read the selected PDF.'));
    reader.readAsDataURL(file);
  });
}

function hasResumeContent(data: unknown): data is ResumeData {
  if (!data || typeof data !== 'object' || !('personalInfo' in data)) return false;
  const resume = data as ResumeData;
  return Boolean(
    resume.personalInfo?.fullName?.trim() ||
      resume.personalInfo?.targetRole?.trim() ||
      resume.personalInfo?.summary?.trim() ||
      resume.skills?.some((skill) => skill.name.trim()) ||
      resume.experiences?.some((experience) => experience.rawDetails.trim()) ||
      resume.projects?.some((project) => project.description.trim()) ||
      resume.education?.some((education) => education.degree.trim() || education.institution.trim())
  );
}

async function parseResumePdf(file: File): Promise<ResumeData> {
  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
    throw new Error('Choose a PDF resume to continue.');
  }
  if (file.size > 8 * 1024 * 1024) throw new Error('Resume PDF must be smaller than 8 MB.');
  if (file.size === 0) throw new Error('The selected PDF is empty.');

  const base64Pdf = await fileToBase64(file);
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'parse-resume-pdf', payload: { base64Pdf, fileName: file.name } }),
  });
  const data: { result?: unknown; error?: string } = await response.json();
  if (!response.ok || !data.result) {
    throw new Error(data.error || 'We could not extract this resume. Try another PDF.');
  }
  return normalizeResumeData(data.result);
}

export function StudioLanding() {
  const router = useRouter();
  const { resumeData, setResumeData, resetToBlank } = useResumeStore();
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const jdInputRef = useRef<HTMLInputElement>(null);
  const [hasSavedResume, setHasSavedResume] = useState(false);
  const [savedName, setSavedName] = useState('');
  const [savedRole, setSavedRole] = useState('');
  const [startChoiceOpen, setStartChoiceOpen] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdFileName, setJdFileName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [analysisResume, setAnalysisResume] = useState<ResumeData | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem('ai-resume-builder-store');
        if (!raw) return;
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null || !('state' in parsed)) return;
        const state = parsed.state;
        if (typeof state !== 'object' || state === null || !('resumeData' in state)) return;
        const saved = state.resumeData;
        if (!hasResumeContent(saved)) return;
        setHasSavedResume(true);
        setSavedName(saved.personalInfo.fullName.trim() || 'Saved resume');
        setSavedRole(saved.personalInfo.targetRole.trim() || 'Draft in progress');
      } catch (error) {
        console.error('Could not inspect the saved resume draft:', error);
      }
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const startFromScratch = () => {
    resetToBlank();
    router.push('/builder');
  };

  const continueResume = () => {
    if (hasSavedResume) router.push('/builder');
    else setMatchError('There is no saved resume on this device yet.');
  };

  const handleResumeFile = async (file: File, destination: 'builder' | 'matcher') => {
    if (destination === 'builder') setParsing(true);
    else {
      setAnalyzing(true);
      setMatchError(null);
      setMatchResult(null);
      setSyncMessage(null);
    }
    try {
      const parsed = await parseResumePdf(file);
      if (destination === 'builder') {
        setResumeData(parsed);
        router.push('/builder');
      } else {
        setAnalysisResume(parsed);
        setResumeFile(file);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Resume import failed.';
      if (destination === 'builder') setMatchError(message);
      else setMatchError(message);
    } finally {
      setParsing(false);
      setAnalyzing(false);
    }
  };

  const loadJdFile = async (file: File) => {
    setMatchError(null);
    setMatchResult(null);
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
    if (jobDescription.trim().length < 80) {
      setMatchError('Add the complete job posting (at least 80 characters) for a meaningful comparison.');
      return;
    }

    setAnalyzing(true);
    setMatchError(null);
    setMatchResult(null);
    setSyncMessage(null);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'match-job',
          payload: { resumeData: candidate, jobDescription: jobDescription.trim() },
        }),
      });
      const data: { result?: MatchResult; error?: string } = await response.json();
      if (!response.ok || !data.result) {
        throw new Error(data.error || 'Job match analysis could not be completed.');
      }
      setMatchResult(data.result);
    } catch (error) {
      setMatchError(error instanceof Error ? error.message : 'Job match analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSync = async () => {
    if (!matchResult?.syncEligible) return;
    const candidate = analysisResume || resumeData;
    setSyncing(true);
    setMatchError(null);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'tailor-resume',
          payload: {
            resumeData: candidate,
            jobDescription: jobDescription.trim(),
            syncToken: matchResult.syncToken,
          },
        }),
      });
      const data: { result?: unknown; error?: string } = await response.json();
      if (!response.ok || !data.result) {
        throw new Error(data.error || 'Resume tailoring could not be completed.');
      }
      const tailored = normalizeResumeData(data.result);
      setResumeData(tailored);
      setAnalysisResume(tailored);
      setSyncMessage('Your resume is tailored to the job description. Review every change before using it.');
    } catch (error) {
      setMatchError(error instanceof Error ? error.message : 'Resume tailoring failed.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <main id="home" className="min-h-screen overflow-hidden bg-[#f7f8fc] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-48 h-[30rem] w-[30rem] rounded-full bg-indigo-200/35 blur-3xl" />
        <div className="absolute -right-40 top-24 h-[28rem] w-[28rem] rounded-full bg-sky-200/35 blur-3xl" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
            <Sparkles className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-extrabold tracking-tight">AI Resume Studio</span>
            <span className="block text-[10px] font-medium text-slate-500">Build with clarity. Apply with confidence.</span>
          </span>
        </Link>
        <a
          href="#job-match"
          className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700 sm:inline-flex"
        >
          <Target className="h-4 w-4" /> Match a job
        </a>
      </header>

      <section id="start" className="relative z-10 mx-auto grid w-full max-w-7xl scroll-mt-6 items-center gap-12 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:gap-16 lg:pb-24 lg:pt-16">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3 py-1.5 text-[11px] font-bold text-indigo-700 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" /> A smarter, more human resume workflow
          </div>
          <h1 className="mt-6 max-w-2xl text-4xl font-black leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
            Your experience deserves a{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600 bg-clip-text text-transparent">
              better story.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
            Create a polished, ATS-aware resume from a blank page or your existing PDF. Refine your
            story with grounded AI, compare it against a real job description, and keep control of
            every edit.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setStartChoiceOpen((open) => !open)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-slate-900/15 transition hover:bg-indigo-700"
            >
              <Rocket className="h-4 w-4" /> Start a new resume <ArrowRight className="h-4 w-4" />
            </motion.button>
            {hasSavedResume && (
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={continueResume}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-5 py-3.5 text-sm font-bold text-slate-800 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
              >
                <Clock3 className="h-4 w-4 text-indigo-600" /> Continue saved resume
              </motion.button>
            )}
          </div>

          <AnimatePresence>
            {startChoiceOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -8 }}
                className="mt-4 grid overflow-hidden sm:grid-cols-2"
              >
                <button
                  type="button"
                  onClick={startFromScratch}
                  className="group flex items-start gap-3 rounded-l-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50/70"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                    <Plus className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-xs font-extrabold">Start from scratch</span>
                    <span className="mt-1 block text-[10px] leading-5 text-slate-500">Open the editor with a clean, blank resume.</span>
                  </span>
                  <ChevronRight className="ml-auto h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-600" />
                </button>
                <button
                  type="button"
                  onClick={() => resumeInputRef.current?.click()}
                  disabled={parsing}
                  className="group flex items-start gap-3 rounded-r-2xl border border-l-0 border-slate-200 bg-white p-4 text-left transition hover:border-violet-300 hover:bg-violet-50/70 disabled:opacity-60"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                    {parsing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </span>
                  <span>
                    <span className="block text-xs font-extrabold">Import a PDF</span>
                    <span className="mt-1 block text-[10px] leading-5 text-slate-500">{parsing ? 'Extracting resume sections…' : 'Extract details into the right resume fields.'}</span>
                  </span>
                  <ChevronRight className="ml-auto h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-violet-600" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <input
            ref={resumeInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleResumeFile(file, 'builder');
              event.target.value = '';
            }}
          />

          {hasSavedResume && (
            <div className="mt-5 inline-flex max-w-full items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-[10px] text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate"><strong>{savedName}</strong> · {savedRole} · Saved on this device</span>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, rotate: 1.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.65, delay: 0.12 }}
          className="relative mx-auto w-full max-w-lg"
        >
          <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-indigo-200/50 via-violet-200/35 to-sky-200/50 blur-2xl" />
          <div className="relative rounded-[1.7rem] border border-white/80 bg-white/90 p-4 shadow-2xl shadow-indigo-950/10 backdrop-blur-xl sm:p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-extrabold">A resume that works for you</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">One workspace · every career stage</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-700">ATS-READY</span>
            </div>

            <div className="space-y-3 py-5">
              <div className="rounded-xl bg-slate-50 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Professional profile</span>
                  <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <div className="mt-2 h-2 w-[86%] rounded-full bg-slate-200" />
                <div className="mt-1.5 h-2 w-[70%] rounded-full bg-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5">
                  <GraduationCap className="h-4 w-4 text-indigo-600" />
                  <p className="mt-2 text-[10px] font-bold text-indigo-950">Fresher-friendly</p>
                  <p className="mt-1 text-[9px] leading-4 text-indigo-800/70">Projects and education count as evidence.</p>
                </div>
                <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3.5">
                  <BriefcaseBusiness className="h-4 w-4 text-sky-700" />
                  <p className="mt-2 text-[10px] font-bold text-sky-950">Job-specific</p>
                  <p className="mt-1 text-[9px] leading-4 text-sky-800/70">Understand fit before you apply.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700"><Check className="h-4 w-4" /></span>
                <span className="text-[10px] font-semibold text-emerald-900">You review every AI suggestion before it is applied.</span>
              </div>
            </div>
          </div>
          <motion.div
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -right-3 top-16 hidden items-center gap-2 rounded-xl border border-white bg-white px-3 py-2 shadow-lg sm:flex"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Target className="h-4 w-4" /></span>
            <span className="text-[10px] font-bold text-slate-700">Match your next role</span>
          </motion.div>
        </motion.div>
      </section>

      <section id="features" className="relative z-10 scroll-mt-6 border-y border-slate-200/70 bg-white/65 py-8 backdrop-blur-sm">
        <div className="mx-auto grid max-w-7xl gap-3 px-5 sm:grid-cols-3 sm:px-8">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="flex gap-3 rounded-2xl p-4 transition hover:bg-white hover:shadow-sm"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${feature.tint}`}><Icon className="h-5 w-5" /></span>
                <span><span className="block text-xs font-extrabold">{feature.title}</span><span className="mt-1 block max-w-xs text-[10px] leading-5 text-slate-500">{feature.description}</span></span>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section id="job-match" className="relative z-10 mx-auto w-full max-w-7xl scroll-mt-6 px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
            <Target className="h-3.5 w-3.5" /> Job fit, with evidence
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Know how your resume meets the role.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-xs leading-6 text-slate-500 sm:text-sm">
            Add a resume and a full job description. Get a reasoned match estimate, see required versus preferred gaps, and only unlock tailored syncing when the evidence supports it.
          </p>
        </div>

        <div className="mx-auto mt-9 grid max-w-6xl gap-4 lg:grid-cols-[.88fr_1.12fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><FileCheck2 className="h-4 w-4" /></span>
              <div><h3 className="text-sm font-extrabold">Your resume</h3><p className="mt-0.5 text-[10px] text-slate-500">PDF, up to 8 MB</p></div>
            </div>
            <input
              ref={jdInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleResumeFile(file, 'matcher');
                event.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => jdInputRef.current?.click()}
              disabled={analyzing || parsing}
              className="mt-4 flex w-full items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50/40 disabled:opacity-60"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                {parsing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-bold">{resumeFile?.name || 'Upload resume PDF'}</span>
                <span className="mt-0.5 block text-[10px] text-slate-500">
                  {analysisResume?.personalInfo.fullName || (hasSavedResume ? `Saved: ${savedName}` : 'Extracted details stay in your browser draft')}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>

            <div className="my-4 flex items-center gap-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">
              <span className="h-px flex-1 bg-slate-100" /> or use saved resume <span className="h-px flex-1 bg-slate-100" />
            </div>
            <button
              type="button"
              onClick={() => {
                if (!hasResumeContent(resumeData)) {
                  setMatchError('No saved resume is available. Upload a PDF or continue a saved draft first.');
                  return;
                }
                setAnalysisResume(resumeData);
                setResumeFile(null);
                setMatchResult(null);
                setSyncMessage(null);
                setMatchError(null);
              }}
              disabled={!hasSavedResume}
              className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-bold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              <Clock3 className="h-3.5 w-3.5" />
              {analysisResume && !resumeFile ? 'Using saved resume' : 'Use existing saved resume'}
            </button>
            {analysisResume && (
              <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-5 text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Resume details ready to compare.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><BriefcaseBusiness className="h-4 w-4" /></span>
                <div><h3 className="text-sm font-extrabold">Target job</h3><p className="mt-0.5 text-[10px] text-slate-500">Paste the complete job description</p></div>
              </div>
              <label className="cursor-pointer rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50">
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
            {jdFileName && <p className="mt-2 truncate text-[10px] text-emerald-700">{jdFileName}</p>}
            <textarea
              value={jobDescription}
              onChange={(event) => {
                setJobDescription(event.target.value);
                setMatchResult(null);
                setSyncMessage(null);
              }}
              rows={6}
              maxLength={30000}
              placeholder="Paste responsibilities, required qualifications, preferred skills, and years of experience…"
              className="mt-4 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs leading-6 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
            />
            <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400">
              <span>{jobDescription.trim().length} characters · avoid including private contact details</span>
              <span>Max 30,000</span>
            </div>
            {matchError && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] text-rose-700">{matchError}</p>}
            {syncMessage && <p role="status" className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] text-emerald-800">{syncMessage}</p>}
            <button
              type="button"
              onClick={() => void handleAnalyze()}
              disabled={analyzing || parsing || jobDescription.trim().length < 80}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/15 transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {analyzing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {analyzing ? 'Reading requirements & evidence…' : 'Analyze resume match'}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {matchResult && (
            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mx-auto mt-5 max-w-6xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              aria-live="polite"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estimated alignment · not a hiring guarantee</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-4xl font-black tracking-tight text-slate-950">{matchResult.matchScore}%</span>
                    <span className="text-[10px] font-semibold text-slate-500">{matchResult.confidence} confidence</span>
                  </div>
                </div>
                <div className={`rounded-xl px-3 py-2 text-[10px] font-bold ${matchResult.syncEligible ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                  {matchResult.syncEligible
                    ? 'Core role checks passed · tailoring available'
                    : matchResult.syncReason}
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {[
                  { label: 'Field / domain fit', passed: matchResult.fitChecks.fieldAligned },
                  { label: 'Relevant skills', passed: matchResult.fitChecks.relevantSkillsPresent },
                  { label: 'Experience level', passed: matchResult.fitChecks.experienceLevelAligned },
                ].map((check) => (
                  <div
                    key={check.label}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[10px] font-bold ${
                      check.passed
                        ? 'border-emerald-100 bg-emerald-50 text-emerald-800'
                        : 'border-amber-100 bg-amber-50 text-amber-800'
                    }`}
                  >
                    {check.passed
                      ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      : <CircleHelp className="h-3.5 w-3.5 shrink-0" />}
                    {check.label}: {check.passed ? 'Pass' : 'Review'}
                  </div>
                ))}
              </div>
              {matchResult.fitChecks.evidence && (
                <p className="mt-2 text-[10px] leading-5 text-slate-500">
                  Core-fit evidence: {matchResult.fitChecks.evidence}
                </p>
              )}

              {(matchResult.domainMismatch || matchResult.licenseRequired || matchResult.seniorityMismatch) && (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {matchResult.domainMismatch && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[10px] leading-5 text-rose-800"><strong>Domain mismatch:</strong> {matchResult.domainMismatchDetails || 'The resume evidence appears to be from a different field.'}</div>}
                  {matchResult.licenseRequired && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[10px] leading-5 text-rose-800"><strong>Required license:</strong> {matchResult.licenseWarning || 'Verify the required license before applying.'}</div>}
                  {matchResult.seniorityMismatch && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[10px] leading-5 text-amber-900"><strong>Experience gap:</strong> {matchResult.seniorityWarning || 'The verified experience may not meet the role’s seniority level.'}</div>}
                </div>
              )}

              {matchResult.blockers.length > 0 && (
                <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/70 p-3">
                  <h4 className="flex items-center gap-1.5 text-[10px] font-extrabold text-rose-800"><CircleHelp className="h-3.5 w-3.5" /> Important unmet requirements</h4>
                  <ul className="mt-1.5 grid gap-1 text-[10px] leading-5 text-rose-800 sm:grid-cols-2">
                    {matchResult.blockers.map((blocker, index) => <li key={`${blocker}-${index}`}>• {blocker}</li>)}
                  </ul>
                </div>
              )}

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800">Requirement-by-requirement evidence</h4>
                  <div className="mt-2 max-h-80 space-y-2 overflow-y-auto pr-1">
                    {matchResult.criteria.map((criterion, index) => (
                      <div key={`${criterion.requirement}-${index}`} className={`rounded-xl border p-3 ${criterion.met ? 'border-emerald-100 bg-emerald-50/50' : criterion.importance === 'required' ? 'border-rose-100 bg-rose-50/50' : 'border-slate-100 bg-slate-50/60'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[10px] font-bold leading-5 text-slate-800">{criterion.requirement}</p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase ${criterion.met ? 'bg-emerald-100 text-emerald-800' : criterion.importance === 'required' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-600'}`}>
                            {criterion.met ? 'Evidence found' : criterion.importance === 'required' ? 'Required gap' : 'Not shown'}
                          </span>
                        </div>
                        <p className="mt-1 text-[9px] leading-4 text-slate-500">{criterion.category} · {criterion.evidence || 'No supporting evidence identified in the resume.'}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800">Skills supported by the resume</h4>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {matchResult.matchingSkills.map((skill) => <span key={skill} className="rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-800">{skill}</span>)}
                      {matchResult.matchingSkills.length === 0 && <p className="text-[10px] text-slate-500">No direct skill evidence identified.</p>}
                    </div>
                    {matchResult.missingSkills.length > 0 && <p className="mt-2 text-[10px] leading-5 text-rose-700"><strong>Not evidenced:</strong> {matchResult.missingSkills.join(', ')}</p>}
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800">Practical next steps</h4>
                    <ul className="mt-1.5 space-y-1 text-[10px] leading-5 text-slate-600">
                      {matchResult.actionableTips.map((tip, index) => <li key={`${tip}-${index}`}>• {tip}</li>)}
                    </ul>
                  </div>
                  {matchResult.tailoredSummary && (
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
                      <h4 className="text-[10px] font-extrabold text-indigo-900">Evidence-based summary suggestion</h4>
                      <p className="mt-1 text-[10px] leading-5 text-indigo-950/80">{matchResult.tailoredSummary}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-col items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center">
                <div className="text-[10px] leading-5 text-slate-600">
                  <strong className="text-slate-800">
                    Eligibility is based on role fit—not the match percentage.
                  </strong>
                  <span className="block">
                    {matchResult.syncEligible
                      ? 'The core field, relevant-skill, and experience checks passed. You can tailor this resume even if the estimate is below 70%.'
                      : matchResult.syncReason}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleSync()}
                  disabled={!matchResult.syncEligible || syncing}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-[10px] font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {syncing ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <WandSparkles className="h-3.5 w-3.5" />}
                  {syncing ? 'Tailoring honestly…' : 'Sync resume with JD'}
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </section>

      <LandingFooter />
    </main>
  );
}
