'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  ChevronRight,
  Clock3,
  FileCheck2,
  GraduationCap,
  HeartPulse,
  LoaderCircle,
  Palette,
  Plus,
  Rocket,
  Scale,
  Sparkles,
  Upload,
  Code2,
  LineChart,
  Megaphone,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { useResumeStore, DEFAULT_SECTION_ORDER } from '@/store/useResumeStore';
import { useStoreHydrated } from '@/store/useStoreHydrated';
import { hasResumeContent } from '@/utils/resumeContent';
import { parseResumePdf } from '@/utils/resumeImport';
import { ModernTemplate } from '@/components/preview/AllTemplates';
import { landingDemoResume } from '@/components/home/landingDemoResume';
import { CountUp, ScaledResume, ScoreRing } from '@/components/home/landingPrimitives';

const ROLES = [
  { label: 'Software Engineers', icon: Code2 },
  { label: 'Fresh Graduates', icon: GraduationCap },
  { label: 'Doctors & Nurses', icon: HeartPulse },
  { label: 'Lawyers', icon: Scale },
  { label: 'Designers', icon: Palette },
  { label: 'Data Scientists', icon: LineChart },
  { label: 'Sales Leaders', icon: Megaphone },
  { label: 'HR Professionals', icon: Users },
  { label: 'Finance Analysts', icon: BriefcaseBusiness },
];

const TRUST_POINTS = ['11 ATS-friendly templates', 'A4 PDF, no watermark', 'Saved only in your browser', 'No sign-up'];

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const } },
};

function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-10%,rgba(99,102,241,0.38),transparent_70%)]" />
      <motion.div
        animate={{ x: [0, 70, -30, 0], y: [0, 40, -10, 0], scale: [1, 1.12, 0.95, 1] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-48 top-0 h-[36rem] w-[36rem] rounded-full bg-indigo-600/30 blur-[120px]"
      />
      <motion.div
        animate={{ x: [0, -60, 20, 0], y: [0, 50, 20, 0], scale: [1, 0.92, 1.08, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -right-40 -top-24 h-[32rem] w-[32rem] rounded-full bg-violet-600/25 blur-[120px]"
      />
      <motion.div
        animate={{ x: [0, 40, -40, 0], y: [0, -30, 10, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-40 left-1/3 h-[30rem] w-[30rem] rounded-full bg-sky-500/20 blur-[120px]"
      />
      <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-slate-950" />
    </div>
  );
}

// The live resume on the right of the hero. It tilts in 3D toward the cursor.
function HeroPreview() {
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-16, 4]), { stiffness: 110, damping: 18 });
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [12, -2]), { stiffness: 110, damping: 18 });

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const resetTilt = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      className="relative mx-auto w-full max-w-[520px] [perspective:1600px]"
    >
      <div aria-hidden="true" className="absolute -inset-10 rounded-[3rem] bg-gradient-to-tr from-indigo-500/40 via-violet-500/30 to-sky-400/30 blur-3xl" />

      <motion.div style={{ rotateX, rotateY }} className="relative [transform-style:preserve-3d]">
        <div className="rounded-[1.6rem] border border-white/15 bg-white/[0.06] p-2 shadow-[0_40px_120px_-30px_rgba(79,70,229,0.65)] backdrop-blur-xl">
          <div className="flex items-center justify-between px-3 pb-2 pt-1">
            <div className="flex gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
            </div>
            <span className="rounded-full bg-white/10 px-2.5 py-1 font-mono text-[10px] text-slate-300">aarav-mehta-resume.pdf · A4</span>
          </div>
          <div className="relative overflow-hidden rounded-2xl">
            <ScaledResume initialScale={0.62} visibleHeight={1000}>
              <ModernTemplate data={landingDemoResume} accentColor="#4f46e5" sectionOrder={DEFAULT_SECTION_ORDER} />
            </ScaledResume>
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white via-white/80 to-transparent" />
          </div>
        </div>
      </motion.div>

      {/* Floating proof chips */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-4 top-[46%] flex items-center gap-3 rounded-2xl border border-white/15 bg-slate-900/80 px-3.5 py-3 text-white shadow-2xl shadow-black/40 backdrop-blur-xl sm:-left-12"
      >
        <ScoreRing value={96} size={46} stroke={4.5} trackClassName="text-white/10" barClassName="text-emerald-400">
          <span className="text-xs font-black">
            <CountUp to={96} />
          </span>
        </ScoreRing>
        <span>
          <span className="block text-[11px] font-extrabold">ATS score</span>
          <span className="block text-[10px] text-emerald-300">Optimized</span>
        </span>
      </motion.div>

      <motion.div
        animate={{ y: [0, 9, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        className="absolute -right-3 top-[22%] hidden max-w-[210px] rounded-2xl border border-white/15 bg-slate-900/80 p-3 text-white shadow-2xl shadow-black/40 backdrop-blur-xl sm:block sm:-right-10"
      >
        <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-300">
          <BadgeCheck className="h-3.5 w-3.5" /> Evidence found
        </span>
        <span className="mt-1.5 flex flex-wrap gap-1">
          {['React', 'Node.js', 'PostgreSQL'].map((skill) => (
            <span key={skill} className="rounded-md bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold text-slate-200">
              {skill}
            </span>
          ))}
        </span>
        <span className="mt-1.5 block text-[9px] text-slate-400">3 of 3 required skills shown</span>
      </motion.div>

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1.1 }}
        className="absolute -bottom-5 left-4 flex max-w-[250px] items-start gap-2.5 rounded-2xl border border-white/15 bg-slate-900/85 p-3 text-white shadow-2xl shadow-black/40 backdrop-blur-xl sm:-left-6"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500">
          <Sparkles className="h-4 w-4" />
        </span>
        <span>
          <span className="block text-[11px] font-extrabold">Summary written</span>
          <span className="mt-0.5 block text-[10px] leading-4 text-slate-400">From your real details only. No made-up numbers.</span>
        </span>
      </motion.div>

      <motion.div
        animate={{ y: [0, 7, 0] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        className="absolute -bottom-3 right-2 hidden items-center gap-2 rounded-full border border-white/15 bg-white px-3 py-2 text-[10px] font-extrabold text-slate-900 shadow-2xl shadow-black/30 md:flex"
      >
        <FileCheck2 className="h-3.5 w-3.5 text-indigo-600" /> 1 page · ready to send
      </motion.div>
    </motion.div>
  );
}

function RoleMarquee() {
  const loop = [...ROLES, ...ROLES];
  return (
    <div className="relative mx-auto mt-24 max-w-7xl px-5 sm:px-8">
      <p className="text-center text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
        Built for every career stage
      </p>
      <div className="relative mt-5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="flex w-max animate-marquee gap-3 motion-reduce:animate-none">
          {loop.map(({ label, icon: Icon }, index) => (
            <span
              key={`${label}-${index}`}
              aria-hidden={index >= ROLES.length}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300"
            >
              <Icon className="h-3.5 w-3.5 text-indigo-300" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LandingHero() {
  const router = useRouter();
  const hydrated = useStoreHydrated();
  const { resumeData, setResumeData, resetToBlank } = useResumeStore();
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [startChoiceOpen, setStartChoiceOpen] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // The saved draft comes from this browser's storage, which is only known after hydration.
  const hasSavedResume = hydrated && hasResumeContent(resumeData);
  const savedName = resumeData.personalInfo.fullName.trim() || 'Saved resume';
  const savedRole = resumeData.personalInfo.targetRole.trim() || 'Draft in progress';

  const confirmReplaceDraft = (action: string) =>
    !hasSavedResume ||
    window.confirm(`${action} will replace the resume saved on this device (${savedName}). Continue?`);

  const startFromScratch = () => {
    if (!confirmReplaceDraft('Starting from scratch')) return;
    resetToBlank();
    router.push('/builder');
  };

  const chooseImportFile = () => {
    if (!confirmReplaceDraft('Importing a PDF')) return;
    resumeInputRef.current?.click();
  };

  const importResumeToBuilder = async (file: File) => {
    setParsing(true);
    setImportError(null);
    try {
      const parsed = await parseResumePdf(file);
      setResumeData(parsed);
      router.push('/builder');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Resume import failed.');
    } finally {
      setParsing(false);
    }
  };

  return (
    <section id="start" className="relative isolate scroll-mt-24 overflow-hidden bg-slate-950 pb-40 pt-32 text-white sm:pt-36 lg:pb-48">
      <HeroBackdrop />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-5 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-10">
        <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.09 }}>
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] py-1 pl-1 pr-3 text-[11px] font-semibold text-slate-200 backdrop-blur"
          >
            <span className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
              Free
            </span>
            AI that improves your words — never your facts
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mt-7 text-[2.65rem] font-black leading-[0.98] tracking-[-0.05em] sm:text-6xl lg:text-[4rem] xl:text-[4.6rem]"
          >
            Your experience
            <br />
            deserves a{' '}
            <span className="animate-shine whitespace-nowrap bg-[linear-gradient(110deg,#a5b4fc,45%,#ffffff,55%,#7dd3fc)] bg-[length:200%_auto] bg-clip-text text-transparent motion-reduce:animate-none">
              better story.
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-7 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
            Build a polished, ATS-friendly resume from a blank page or your old PDF. Write with
            grounded AI, check your fit against a real job, and download a clean PDF — free, with{' '}
            <span className="whitespace-nowrap">no sign-up.</span>
          </motion.p>

          <motion.div variants={fadeUp} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setStartChoiceOpen((open) => !open)}
              aria-expanded={startChoiceOpen}
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-white px-6 py-4 text-sm font-extrabold text-slate-950 shadow-[0_0_0_1px_rgba(255,255,255,0.4),0_20px_60px_-15px_rgba(129,140,248,0.9)] transition hover:bg-indigo-50"
            >
              <Rocket className="h-4 w-4 text-indigo-600" />
              Start a new resume
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </motion.button>
            {hasSavedResume ? (
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => router.push('/builder')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-6 py-4 text-sm font-bold text-white backdrop-blur transition hover:border-white/30 hover:bg-white/10"
              >
                <Clock3 className="h-4 w-4 text-indigo-300" /> Continue saved resume
              </motion.button>
            ) : (
              <a
                href="#templates"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-6 py-4 text-sm font-bold text-white backdrop-blur transition hover:border-white/30 hover:bg-white/10"
              >
                <Palette className="h-4 w-4 text-indigo-300" /> Browse templates
              </a>
            )}
          </motion.div>

          <AnimatePresence>
            {startChoiceOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -8 }}
                className="overflow-hidden"
              >
                <div className="mt-4 grid max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={startFromScratch}
                    disabled={parsing}
                    className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-left backdrop-blur transition hover:border-indigo-300/50 hover:bg-white/10 disabled:opacity-60"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-200">
                      <Plus className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-xs font-extrabold">Start from scratch</span>
                      <span className="mt-1 block text-[11px] leading-5 text-slate-400">Open the editor with a clean, blank resume.</span>
                    </span>
                    <ChevronRight className="ml-auto h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-white" />
                  </button>
                  <button
                    type="button"
                    onClick={chooseImportFile}
                    disabled={parsing}
                    className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-left backdrop-blur transition hover:border-violet-300/50 hover:bg-white/10 disabled:opacity-60"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-violet-200">
                      {parsing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </span>
                    <span>
                      <span className="block text-xs font-extrabold">Import a PDF</span>
                      <span className="mt-1 block text-[11px] leading-5 text-slate-400">
                        {parsing ? 'Reading your resume…' : 'AI fills the right fields from your file.'}
                      </span>
                    </span>
                    <ChevronRight className="ml-auto h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-white" />
                  </button>
                </div>
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
              if (file) void importResumeToBuilder(file);
              event.target.value = '';
            }}
          />

          {importError && (
            <p role="alert" className="mt-4 max-w-xl rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs leading-5 text-rose-200">
              {importError}
            </p>
          )}

          {hasSavedResume && (
            <motion.div
              variants={fadeUp}
              className="mt-5 inline-flex max-w-full items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-[11px] text-emerald-200"
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                <strong className="text-white">{savedName}</strong> · {savedRole} · Saved on this device
              </span>
            </motion.div>
          )}

          <motion.ul variants={fadeUp} className="mt-9 flex flex-wrap gap-x-5 gap-y-2.5">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                {point}
              </li>
            ))}
          </motion.ul>

          <motion.p variants={fadeUp} className="mt-6 text-xs text-slate-500">
            Already have a job in mind?{' '}
            <Link href="#job-match" className="font-bold text-indigo-300 underline-offset-4 hover:underline">
              Check your fit first →
            </Link>
          </motion.p>
        </motion.div>

        <HeroPreview />
      </div>

      <RoleMarquee />
    </section>
  );
}
