'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpDown,
  BadgeCheck,
  CheckCircle2,
  CircleHelp,
  Download,
  Eye,
  EyeOff,
  FileText,
  FileUp,
  GripVertical,
  LayoutTemplate,
  LockKeyhole,
  PenLine,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  WandSparkles,
  XCircle,
} from 'lucide-react';
import { CountUp, Reveal, ScoreRing, SectionHeading, SpotlightCard } from '@/components/home/landingPrimitives';

const STATS = [
  { value: 11, label: 'Resume templates', detail: 'Switch anytime, content stays' },
  { value: 7, label: 'Guided steps', detail: 'Small, simple, mobile friendly' },
  { value: 100, label: 'Point ATS check', detail: 'With tips for every gap' },
  { value: 10, label: 'Sample careers', detail: 'See a full resume first' },
];

export function StatsBand() {
  return (
    <section aria-label="Highlights" className="relative z-10 -mt-24 px-5 sm:px-8">
      <Reveal className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)] lg:grid-cols-4">
          {STATS.map((stat, index) => (
            <div
              key={stat.label}
              className={`p-5 sm:p-7 ${index % 2 === 0 ? 'border-r' : ''} ${index < 2 ? 'border-b lg:border-b-0' : ''} border-slate-100 lg:border-r lg:last:border-r-0`}
            >
              <p className="bg-gradient-to-br from-slate-950 to-indigo-700 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl">
                <CountUp to={stat.value} />
              </p>
              <p className="mt-2 text-sm font-extrabold text-slate-900">{stat.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">{stat.detail}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

function CardTitle({ icon, title, text, tint }: { icon: React.ReactNode; title: string; text: string; tint: string }) {
  return (
    <div>
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tint}`}>{icon}</span>
      <h3 className="mt-4 text-lg font-extrabold tracking-tight text-slate-950">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

const cardBase = 'h-full rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-indigo-950/5 sm:p-7';

export function FeatureBento() {
  return (
    <section id="features" className="relative scroll-mt-24 px-5 py-24 sm:px-8 lg:py-32">
      <SectionHeading
        eyebrow="Everything in one studio"
        icon={<Sparkles className="h-3.5 w-3.5" />}
        title={
          <>
            Everything you need.{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-600 bg-clip-text text-transparent">
              Nothing made up.
            </span>
          </>
        }
        description="Every tool is built around one rule: AI can make your words clearer, but your facts always stay yours."
      />

      <div className="mx-auto mt-14 grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* AI Summary Studio */}
        <Reveal className="md:col-span-2">
          <SpotlightCard className={cardBase}>
            <div className="grid h-full gap-6 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
              <CardTitle
                icon={<WandSparkles className="h-5 w-5" />}
                tint="bg-violet-50 text-violet-700"
                title="AI Summary Studio"
                text="Tell it if you are a fresher or experienced. It writes a 3-sentence summary from the details you entered — nothing else."
              />
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-4">
                <p className="text-[11px] font-bold text-slate-700">Where are you in your career?</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <span className="rounded-xl border border-indigo-400 bg-indigo-50 px-3 py-2 text-[11px] font-bold text-indigo-800 ring-2 ring-indigo-500/15">
                    I&apos;m a fresher
                  </span>
                  <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-500">
                    I have work experience
                  </span>
                </div>
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-[11px] leading-5 text-slate-700">
                  Computer Science graduate (Class of 2025) who builds full-stack web apps with React
                  and Node.js, shown in three deployed projects
                  <motion.span
                    aria-hidden="true"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 bg-indigo-600"
                  />
                </div>
              </div>
            </div>
          </SpotlightCard>
        </Reveal>

        {/* ATS score */}
        <Reveal delay={0.08}>
          <SpotlightCard className={cardBase} glow="rgba(16,185,129,0.14)">
            <CardTitle
              icon={<ShieldCheck className="h-5 w-5" />}
              tint="bg-emerald-50 text-emerald-700"
              title="ATS score, explained"
              text="A clear score out of 100 with a tip for every missing point."
            />
            <div className="mt-6 flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <ScoreRing value={88} size={64} stroke={6}>
                <span className="text-base font-black text-slate-900">
                  <CountUp to={88} />
                </span>
              </ScoreRing>
              <ul className="space-y-1.5 text-[11px] text-slate-600">
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Contact details</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> 8 skills listed</li>
                <li className="flex items-center gap-1.5"><CircleHelp className="h-3.5 w-3.5 text-amber-500" /> Add a profile link</li>
              </ul>
            </div>
          </SpotlightCard>
        </Reveal>

        {/* PDF import */}
        <Reveal>
          <SpotlightCard className={cardBase} glow="rgba(139,92,246,0.14)">
            <CardTitle
              icon={<FileUp className="h-5 w-5" />}
              tint="bg-indigo-50 text-indigo-700"
              title="Import your old PDF"
              text="AI reads your file and fills the right fields. Missing sections stay empty — it never guesses."
            />
            <div className="mt-6 flex items-center gap-3">
              <span className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[11px] font-bold text-slate-700 shadow-sm">
                <FileText className="h-4 w-4 text-rose-500" /> resume.pdf
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-indigo-400" />
              <span className="grid flex-1 gap-1.5">
                {['Name & contact', 'Experience', 'Education'].map((field) => (
                  <span key={field} className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-800">
                    <CheckCircle2 className="h-3 w-3" /> {field}
                  </span>
                ))}
              </span>
            </div>
          </SpotlightCard>
        </Reveal>

        {/* Job match */}
        <Reveal delay={0.06}>
          <SpotlightCard className={cardBase} glow="rgba(14,165,233,0.14)">
            <CardTitle
              icon={<Target className="h-5 w-5" />}
              tint="bg-sky-50 text-sky-700"
              title="Job match with evidence"
              text="Every requirement checked against your resume — with proof or an honest gap."
            />
            <div className="mt-6 space-y-2">
              {[
                { label: '3+ years with React', met: true },
                { label: 'REST API design', met: true },
                { label: 'Kubernetes in production', met: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <span className="text-[11px] font-semibold text-slate-700">{item.label}</span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                      item.met ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {item.met ? 'Evidence' : 'Gap'}
                  </span>
                </div>
              ))}
            </div>
          </SpotlightCard>
        </Reveal>

        {/* Reorder */}
        <Reveal delay={0.12}>
          <SpotlightCard className={cardBase}>
            <CardTitle
              icon={<ArrowUpDown className="h-5 w-5" />}
              tint="bg-amber-50 text-amber-700"
              title="Your order, your story"
              text="Freshers lead with Projects. Professionals lead with Experience. Hide what you don't need."
            />
            <div className="mt-6 space-y-1.5">
              {[
                { label: 'Key Projects', visible: true, lifted: true },
                { label: 'Education', visible: true },
                { label: 'Work Experience', visible: true },
                { label: 'Achievements', visible: false },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-[11px] font-bold transition ${
                    item.lifted
                      ? '-translate-y-0.5 translate-x-1.5 border-indigo-200 bg-white text-slate-900 shadow-lg shadow-indigo-500/10'
                      : item.visible
                        ? 'border-slate-200 bg-white text-slate-800'
                        : 'border-dashed border-slate-200 bg-slate-50 text-slate-400'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <GripVertical className="h-3.5 w-3.5 text-slate-400" /> {item.label}
                  </span>
                  {item.visible ? <Eye className="h-3.5 w-3.5 text-indigo-500" /> : <EyeOff className="h-3.5 w-3.5" />}
                </div>
              ))}
            </div>
          </SpotlightCard>
        </Reveal>

        {/* Review every change */}
        <Reveal className="md:col-span-2">
          <SpotlightCard className={cardBase}>
            <div className="grid h-full gap-6 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
              <CardTitle
                icon={<PenLine className="h-5 w-5" />}
                tint="bg-violet-50 text-violet-700"
                title="See every AI edit first"
                text="Optimize with AI shows each change side by side. Nothing is saved until you press Apply."
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Original</p>
                  <p className="mt-1.5 text-xs leading-5 text-slate-600">i builds the dashbord for loan team using react</p>
                </div>
                <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4">
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-violet-600">Suggested</p>
                  <p className="mt-1.5 text-xs leading-5 text-slate-800">Built the dashboard for the loan team using React.</p>
                </div>
              </div>
            </div>
          </SpotlightCard>
        </Reveal>

        {/* Private + PDF */}
        <Reveal delay={0.08}>
          <SpotlightCard className={`${cardBase} bg-slate-950 text-white`} glow="rgba(129,140,248,0.25)">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-indigo-200">
              <LockKeyhole className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-lg font-extrabold tracking-tight">Private by design</h3>
            <p className="mt-1.5 text-sm leading-6 text-slate-400">
              No account. No database. Your draft is saved only in this browser, and your PDF has no watermark.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['No sign-up', 'Browser-only draft', 'Clean A4 PDF'].map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold text-slate-200">
                  {item}
                </span>
              ))}
            </div>
          </SpotlightCard>
        </Reveal>
      </div>
    </section>
  );
}

const STEPS = [
  { icon: Rocket, title: 'Start your way', text: 'Begin with a blank page, import your old PDF, or explore one of 10 sample careers.' },
  { icon: WandSparkles, title: 'Write with honest AI', text: 'Generate a summary, sharpen bullets, and fix grammar. Review every change first.' },
  { icon: Target, title: 'Check the fit', text: 'Compare your resume with a real job. Tailor it only when your experience truly fits.' },
  { icon: Download, title: 'Download & apply', text: 'Pick a template and color, check your page count, and save a clean A4 PDF.' },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative scroll-mt-24 overflow-hidden bg-white px-5 py-24 sm:px-8 lg:py-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      <SectionHeading
        eyebrow="How it works"
        icon={<LayoutTemplate className="h-3.5 w-3.5" />}
        title={
          <>
            From blank page to <span className="whitespace-nowrap">ready-to-send</span> in four steps.
          </>
        }
        description="Most people finish their first version in one sitting. Your progress saves automatically as you type."
      />

      <div className="relative mx-auto mt-16 max-w-6xl">
        <div aria-hidden="true" className="absolute left-[12%] right-[12%] top-8 hidden h-px bg-gradient-to-r from-indigo-200 via-violet-300 to-sky-200 lg:block" />
        <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {STEPS.map(({ icon: Icon, title, text }, index) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="relative text-center"
            >
              <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-500 text-white shadow-xl shadow-indigo-500/25">
                <Icon className="h-6 w-6" />
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-950 text-[10px] font-black">
                  {index + 1}
                </span>
              </span>
              <h3 className="mt-5 text-base font-extrabold text-slate-950">{title}</h3>
              <p className="mx-auto mt-2 max-w-[16rem] text-sm leading-6 text-slate-600">{text}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function HonestySection() {
  return (
    <section className="relative isolate overflow-hidden px-5 py-24 sm:px-8 lg:py-32">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[36rem] w-[60rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-rose-100/60 via-violet-100/60 to-emerald-100/60 blur-3xl" />
      <SectionHeading
        eyebrow="Our promise"
        icon={<BadgeCheck className="h-3.5 w-3.5" />}
        title={
          <>
            AI that refuses to{' '}
            <span className="relative whitespace-nowrap">
              <span className="relative z-10">make things up.</span>
              <span aria-hidden="true" className="absolute inset-x-0 bottom-1 z-0 h-3 rounded bg-emerald-200/70 sm:h-4" />
            </span>
          </>
        }
        description="A fake number can win a click and lose an interview. So we only ever polish what you actually wrote."
      />

      <div className="relative mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-3xl border border-rose-200 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-rose-700">
              <XCircle className="h-3.5 w-3.5" /> Typical AI rewrite
            </span>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-wider text-slate-400">You wrote</p>
            <p className="mt-1 text-sm text-slate-700">i build portfolio website with react</p>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">It returns</p>
            <p className="mt-1 text-sm leading-7 text-slate-800">
              Built a{' '}
              <mark className="rounded bg-rose-100 px-1 text-rose-800">high-traffic</mark> portfolio used by{' '}
              <mark className="rounded bg-rose-100 px-1 text-rose-800">10,000+ visitors</mark>,{' '}
              <mark className="rounded bg-rose-100 px-1 text-rose-800">boosting engagement by 45%</mark>.
            </p>
            <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-rose-700">
              <XCircle className="h-4 w-4" /> 3 invented claims you would have to defend
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="h-full rounded-3xl border border-emerald-200 bg-white/90 p-6 shadow-xl shadow-emerald-900/5 backdrop-blur sm:p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> AI Resume Studio
            </span>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-wider text-slate-400">You wrote</p>
            <p className="mt-1 text-sm text-slate-700">i build portfolio website with react</p>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">We return</p>
            <p className="mt-1 text-sm leading-7 text-slate-800">
              <mark className="rounded bg-emerald-100 px-1 text-emerald-800">Built a</mark> portfolio website with{' '}
              <mark className="rounded bg-emerald-100 px-1 text-emerald-800">React.</mark>
            </p>
            <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Grammar fixed. Not one new claim.
            </p>
          </div>
        </Reveal>
      </div>

      <Reveal className="relative mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          'Never adds skills, numbers, employers, or dates',
          'Missing sections stay empty instead of guessed',
          'Every AI change is shown before it is applied',
        ].map((promise) => (
          <div key={promise} className="flex items-start gap-2.5 rounded-2xl border border-slate-200/80 bg-white/80 p-4 text-sm font-semibold text-slate-700 backdrop-blur">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            {promise}
          </div>
        ))}
      </Reveal>
    </section>
  );
}
